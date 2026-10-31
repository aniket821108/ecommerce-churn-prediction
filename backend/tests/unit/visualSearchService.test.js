const visualSearchService = require('../../src/services/visualSearchService');
const Product = require('../../src/models/Product');
const axios = require('axios');

jest.mock('axios');
jest.mock('../../src/models/Product');

describe('Visual Search Service Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.GEMINI_API_KEY = 'test_gemini_key_123';
  });

  describe('analyzeImageWithGemini', () => {
    it('should throw error if GEMINI_API_KEY is not set', async () => {
      delete process.env.GEMINI_API_KEY;
      await expect(
        visualSearchService.analyzeImageWithGemini(Buffer.from('fake-image'))
      ).rejects.toThrow('GEMINI_API_KEY is not configured');
    });

    it('should extract structured visual metadata from image buffer', async () => {
      const mockGeminiResponse = {
        data: {
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: JSON.stringify({
                      isRetailProduct: true,
                      visibleText: 'Clean Code',
                      detectedItem: 'Clean Code Book',
                      category: 'books',
                      colors: ['white', 'blue'],
                      brand: 'Prentice Hall',
                      keywords: ['clean code', 'programming', 'agile'],
                      features: ['paperback book']
                    })
                  }
                ]
              }
            }
          ]
        }
      };

      axios.post.mockResolvedValueOnce(mockGeminiResponse);

      const result = await visualSearchService.analyzeImageWithGemini(
        Buffer.from('fake-image-bytes'),
        'image/jpeg'
      );

      expect(result).toBeDefined();
      expect(result.isRetailProduct).toBe(true);
      expect(result.visibleText).toBe('Clean Code');
      expect(result.detectedItem).toBe('Clean Code Book');
      expect(result.category).toBe('books');
      expect(result.brand).toBe('Prentice Hall');
      expect(result.colors).toContain('white');
    });

    it('should strip markdown codeblocks returned by Gemini', async () => {
      const markdownJson = '```json\n{"isRetailProduct": true, "detectedItem": "Wireless Earbuds", "category": "electronics"}\n```';
      axios.post.mockResolvedValueOnce({
        data: {
          candidates: [{ content: { parts: [{ text: markdownJson }] } }]
        }
      });

      const result = await visualSearchService.analyzeImageWithGemini(Buffer.from('fake-image'));
      expect(result.detectedItem).toBe('Wireless Earbuds');
      expect(result.category).toBe('electronics');
    });
  });

  describe('findMatchingProducts', () => {
    it('should immediately return empty array if isRetailProduct is false', async () => {
      const results = await visualSearchService.findMatchingProducts({
        isRetailProduct: false,
        detectedItem: 'Random Scenery'
      });

      expect(results).toEqual([]);
      expect(Product.find).not.toHaveBeenCalled();
    });

    it('should score and rank matching products based on category, keywords, and brand', async () => {
      const mockDbProducts = [
        {
          _id: '64f1a2b3c4d5e6f7a8b9c001',
          name: 'Nike Air Running Shoes',
          description: 'Comfortable black athletic running shoes',
          category: 'clothing',
          brand: 'Nike',
          price: 2499,
          stock: 10,
          images: []
        },
        {
          _id: '64f1a2b3c4d5e6f7a8b9c002',
          name: 'Nike Revolution Training Shoes',
          description: 'Black sports and training footwear',
          category: 'clothing',
          brand: 'Nike',
          price: 1999,
          stock: 5,
          images: []
        }
      ];

      Product.find.mockReturnValue({
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockDbProducts)
      });

      const results = await visualSearchService.findMatchingProducts({
        isRetailProduct: true,
        detectedItem: 'Nike Running Shoes',
        category: 'clothing',
        colors: ['black'],
        brand: 'Nike',
        keywords: ['running', 'shoes']
      });

      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBe(2);
      expect(results[0].name).toBe('Nike Air Running Shoes');
      expect(results[0].matchPercentage).toBeGreaterThanOrEqual(results[1].matchPercentage);
    });

    it('should accurately prioritize exact OCR book title over a completely different book', () => {
      const exactBook = {
        name: 'Clean Code: A Handbook of Agile Software Craftsmanship',
        category: 'books',
        brand: 'Prentice Hall',
        description: 'A handbook of agile software craftsmanship for programmers.',
        stock: 5
      };

      const differentBook = {
        name: 'The Great Gatsby',
        category: 'books',
        brand: 'Scribner',
        description: 'Classic American novel.',
        stock: 12
      };

      const analysis = {
        isRetailProduct: true,
        visibleText: 'Clean Code',
        detectedItem: 'Clean Code Book',
        category: 'books',
        brand: 'Prentice Hall',
        colors: ['white'],
        keywords: ['clean code', 'programming']
      };

      const exactScore = visualSearchService.calculateProductMatch(exactBook, analysis);
      const diffScore = visualSearchService.calculateProductMatch(differentBook, analysis);

      expect(exactScore).toBeGreaterThanOrEqual(85);
      expect(diffScore).toBeLessThan(40);
      expect(exactScore).toBeGreaterThan(diffScore + 40);
    });
  });
});
