const fs = require('fs').promises;
const path = require('path');
const logger = require('./logger');

/**
 * Safely delete a single file by path.
 * Suppresses ENOENT (file already deleted).
 * @param {string} filePath 
 */
const cleanupFile = async (filePath) => {
  if (!filePath) return;
  try {
    await fs.unlink(filePath);
  } catch (err) {
    if (err.code !== 'ENOENT') {
      logger.warn(`Failed to unlink temporary file: ${filePath}`, { error: err.message });
    }
  }
};

/**
 * Safely delete an array of files or Multer file objects.
 * Handles both string paths and Multer file objects ({ path: '...' }).
 * @param {Array|Object|string} files 
 */
const cleanupFiles = async (files) => {
  if (!files) return;
  const list = Array.isArray(files) ? files : [files];
  await Promise.all(
    list.map(async (item) => {
      if (!item) return;
      const targetPath = typeof item === 'string' ? item : item.path;
      if (targetPath) {
        await cleanupFile(targetPath);
      }
    })
  );
};

/**
 * Sweeps an entire directory of temporary files.
 * Useful for startup cleanup to reclaim leaked disk space.
 * Preserves '.gitkeep' and subdirectories.
 * @param {string} dirPath 
 */
const sweepTempDirectory = async (dirPath) => {
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    let removedCount = 0;
    let reclaimedBytes = 0;

    for (const entry of entries) {
      if (entry.isFile() && entry.name !== '.gitkeep') {
        const fullPath = path.join(dirPath, entry.name);
        try {
          const stats = await fs.stat(fullPath);
          reclaimedBytes += stats.size;
          await fs.unlink(fullPath);
          removedCount++;
        } catch (_) {
          // Skip if locked or in use
        }
      }
    }

    if (removedCount > 0) {
      const mbReclaimed = (reclaimedBytes / (1024 * 1024)).toFixed(2);
      logger.info(`Cleaned ${removedCount} leaked temp files from ${dirPath} (Reclaimed ${mbReclaimed} MB)`);
    }
    return { removedCount, reclaimedBytes };
  } catch (err) {
    if (err.code !== 'ENOENT') {
      logger.warn(`Temp directory sweep failed for ${dirPath}`, { error: err.message });
    }
    return { removedCount: 0, reclaimedBytes: 0 };
  }
};

module.exports = {
  cleanupFile,
  cleanupFiles,
  sweepTempDirectory,
};
