const axios = require('axios');
const Product = require('../models/Product');
const logger = require('../utils/logger');

/**
 * Supported Gemini Vision Models in Priority Order
 * Uses fast, multimodal Flash-Lite models with high free-tier limits.
 */
const VISION_MODELS = [
  'gemini-3.5-flash-lite',
  'gemini-flash-lite-latest',
  'gemini-3.1-flash-lite',
  'gemini-3.5-flash'
];

/**
 * Analyze Product Image using Google Gemini Vision API
 * @param {Buffer} imageBuffer - In-memory image buffer
 * @param {string} mimeType - Image MIME type (image/jpeg, image/png, etc.)
 * @returns {Promise<Object>} Extracted product visual attributes
 */
const analyzeImageWithGemini = async (imageBuffer, mimeType = 'image/jpeg') => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in backend environment.');
  }

  const base64Data = imageBuffer.toString('base64');

  const prompt = `You are an expert AI product catalog specialist for an e-commerce platform.
Analyze this product image and extract key shopping attributes for catalog search.

Respond ONLY with a valid JSON object (without markdown or backticks):
{
  "detectedItem": "Concise 2-4 word product title (e.g., 'Running Shoes', 'Wireless Bluetooth Earbuds', 'Denim Jacket')",
  "category": "One of: 'electronics', 'clothing', 'home', 'books', 'accessories', 'footwear', 'beauty', 'sports'",
  "colors": ["List of 1-3 dominant visible colors"],
  "brand": "Brand name if visibly identifiable or null",
  "keywords": ["4-6 specific search terms for database lookup"],
  "features": ["2-3 key visual characteristics"]
}`;

  let lastError = null;

  for (const model of VISION_MODELS) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

      const response = await axios.post(
        url,
        {
          contents: [
            {
              role: 'user',
              parts: [
                { text: prompt },
                {
                  inlineData: {
                    mimeType,
                    data: base64Data
                  }
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 600
          }
        },
        { timeout: 15000 }
      );

      const rawText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) {
        throw new Error(`Empty response from Gemini Vision (${model})`);
      }

      // Clean markdown code blocks if returned
      const cleanJson = rawText
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/```\s*$/i, '')
        .trim();

      const analysis = JSON.parse(cleanJson);
      logger.info(`Gemini Vision successfully analyzed image using ${model}: "${analysis.detectedItem}"`);
      return analysis;
    } catch (err) {
      lastError = err;
      const errMsg = err.response?.data?.error?.message || err.message;
      logger.warn(`Gemini Vision model ${model} failed: ${errMsg}. Trying fallback...`);
    }
  }

  throw new Error(`Visual analysis failed across all available Gemini models: ${lastError?.message}`);
};

/**
 * Find Matching Catalog Products based on Visual Analysis
 * @param {Object} analysis - Extracted visual metadata from Gemini
 * @param {number} limit - Maximum products to return
 * @returns {Promise<Array>} List of matched products with visual match scores
 */
const findMatchingProducts = async (analysis, limit = 8) => {
  const { detectedItem, category, colors = [], brand, keywords = [] } = analysis;

  // Build search term candidates
  const searchTerms = [
    ...(detectedItem ? detectedItem.toLowerCase().split(/\s+/) : []),
    ...(Array.isArray(keywords) ? keywords.map((k) => k.toLowerCase()) : [])
  ].filter((term) => term.length > 2);

  const uniqueTerms = [...new Set(searchTerms)];

  // Construct MongoDB Query
  const filter = { isActive: true };

  const termRegexes = uniqueTerms.map((term) => {
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(escaped, 'i');
  });

  const categoryRegex = category
    ? new RegExp(category.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
    : null;

  // Query database for candidate products
  const candidates = await Product.find({
    ...filter,
    $or: [
      ...(categoryRegex ? [{ category: categoryRegex }] : []),
      ...(brand ? [{ brand: new RegExp(brand.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') }] : []),
      { name: { $in: termRegexes } },
      { description: { $in: termRegexes } }
    ]
  })
    .limit(30)
    .lean();

  // If no candidates found with category/brand, fallback to search across all products with terms
  let candidatePool = candidates;
  if (candidatePool.length === 0 && termRegexes.length > 0) {
    candidatePool = await Product.find({
      isActive: true,
      $or: [{ name: { $in: termRegexes } }, { description: { $in: termRegexes } }]
    })
      .limit(20)
      .lean();
  }

  // If still empty, return top featured or trending products
  if (candidatePool.length === 0) {
    candidatePool = await Product.find({ isActive: true }).sort({ rating: -1 }).limit(limit).lean();
  }

  // Calculate Match Scores
  const scoredProducts = candidatePool.map((p) => {
    let score = 50; // base score

    const productName = (p.name || '').toLowerCase();
    const productDesc = (p.description || '').toLowerCase();
    const productCat = (p.category || '').toLowerCase();
    const productBrand = (p.brand || '').toLowerCase();

    // Category match
    if (category && (productCat.includes(category.toLowerCase()) || category.toLowerCase().includes(productCat))) {
      score += 25;
    }

    // Brand match
    if (brand && productBrand.includes(brand.toLowerCase())) {
      score += 15;
    }

    // Name keyword match
    let nameMatches = 0;
    uniqueTerms.forEach((term) => {
      if (productName.includes(term)) {
        nameMatches++;
      }
    });
    score += Math.min(nameMatches * 8, 20);

    // Color match in name or description
    if (Array.isArray(colors)) {
      colors.forEach((color) => {
        if (productName.includes(color.toLowerCase()) || productDesc.includes(color.toLowerCase())) {
          score += 5;
        }
      });
    }

    // Stock availability bonus
    if (p.stock > 0) {
      score += 5;
    }

    // Cap score at 98% (realistic similarity)
    const matchPercentage = Math.min(Math.max(score, 62), 98);

    return {
      _id: p._id.toString(),
      name: p.name,
      description: p.description,
      price: p.price,
      discountPrice: p.discountPrice || null,
      category: p.category,
      brand: p.brand,
      stock: p.stock,
      rating: p.rating || 4.5,
      numReviews: p.numReviews || 0,
      images: p.images || [],
      matchPercentage
    };
  });

  // Sort descending by match percentage, then by stock
  scoredProducts.sort((a, b) => b.matchPercentage - a.matchPercentage || b.stock - a.stock);

  return scoredProducts.slice(0, limit);
};

module.exports = {
  analyzeImageWithGemini,
  findMatchingProducts
};
