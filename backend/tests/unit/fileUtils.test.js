const { cleanupFile, cleanupFiles, sweepTempDirectory } = require('../../src/utils/fileUtils');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');

describe('File Utility Module (backend/src/utils/fileUtils.js)', () => {
  let tempDir;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'eshop-test-'));
  });

  afterEach(async () => {
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (_) {}
  });

  describe('cleanupFile', () => {
    it('should delete existing file successfully', async () => {
      const filePath = path.join(tempDir, 'sample.txt');
      await fs.writeFile(filePath, 'hello');

      await cleanupFile(filePath);

      await expect(fs.access(filePath)).rejects.toThrow();
    });

    it('should handle non-existent files without throwing error (ENOENT suppression)', async () => {
      const nonExistentPath = path.join(tempDir, 'does-not-exist.txt');
      await expect(cleanupFile(nonExistentPath)).resolves.not.toThrow();
    });

    it('should handle null or undefined filePath gracefully', async () => {
      await expect(cleanupFile(null)).resolves.not.toThrow();
      await expect(cleanupFile(undefined)).resolves.not.toThrow();
    });
  });

  describe('cleanupFiles', () => {
    it('should delete an array of file paths', async () => {
      const file1 = path.join(tempDir, 'f1.txt');
      const file2 = path.join(tempDir, 'f2.txt');
      await fs.writeFile(file1, '1');
      await fs.writeFile(file2, '2');

      await cleanupFiles([file1, file2]);

      await expect(fs.access(file1)).rejects.toThrow();
      await expect(fs.access(file2)).rejects.toThrow();
    });

    it('should delete Multer file objects { path: "..." }', async () => {
      const file = path.join(tempDir, 'multer.jpg');
      await fs.writeFile(file, 'image-bytes');

      await cleanupFiles({ path: file });

      await expect(fs.access(file)).rejects.toThrow();
    });
  });

  describe('sweepTempDirectory', () => {
    it('should remove all files except .gitkeep', async () => {
      const gitkeep = path.join(tempDir, '.gitkeep');
      const leaked1 = path.join(tempDir, 'leaked1.tmp');
      const leaked2 = path.join(tempDir, 'leaked2.tmp');

      await fs.writeFile(gitkeep, '');
      await fs.writeFile(leaked1, 'garbage1');
      await fs.writeFile(leaked2, 'garbage2');

      const result = await sweepTempDirectory(tempDir);

      expect(result.removedCount).toBe(2);
      expect(result.reclaimedBytes).toBeGreaterThan(0);

      // .gitkeep must still exist
      await expect(fs.access(gitkeep)).resolves.not.toThrow();
      // Leaked files must be gone
      await expect(fs.access(leaked1)).rejects.toThrow();
      await expect(fs.access(leaked2)).rejects.toThrow();
    });
  });
});
