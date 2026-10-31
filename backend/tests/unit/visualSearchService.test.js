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
                      detectedItem: 'Nike Running Shoes',
                      category: 'clothing',
                      colors: ['black', 'red'],
                      brand: 'Nike',
                      keywords: ['running', 'shoes', 'sneakers'],
                      features: ['cushioned sole']
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
      expect(result.detectedItem).toBe('Nike Running Shoes');
      expect(result.category).toBe('clothing');
      expect(result.brand).toBe('Nike');
      expect(result.colors).toContain('black');
    });

    it('should strip markdown codeblocks returned by Gemini', async () => {
      const markdownJson = '```json\n{"detectedItem": "Wireless Earbuds", "category": "electronics"}\n```';
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
          name: 'Casual Cotton Shirt',
          description: 'Blue casual shirt',
          category: 'clothing',
          brand: 'Zara',
          price: 999,
          stock: 5,
          images: []
        }
      ];

      Product.find.mockReturnValue({
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockDbProducts)
      });

      const results = await visualSearchService.findMatchingProducts({
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
  });
});
