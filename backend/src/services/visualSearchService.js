const axios = require('axios');
const Product = require('../models/Product');
const logger = require('../utils/logger');

/**
 * Supported Gemini Vision Models in Priority Order
 * Uses fast, multimodal Flash-Lite models with generous free-tier quotas.
 */
const VISION_MODELS = [
  'gemini-3.5-flash-lite',
  'gemini-flash-lite-latest',
  'gemini-3.1-flash-lite',
  'gemini-3.5-flash'
];

/**
 * Common English stopwords to ignore during token-based title matching
 */
const STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from',
  'has', 'he', 'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the',
  'to', 'was', 'were', 'will', 'with', 'the', 'this', 'or', 'item',
  'product', 'edition', 'vol', 'volume', 'part'
]);

/**
 * Tokenize string into normalized keyword tokens
 */
const tokenize = (text) => {
  if (!text || typeof text !== 'string') return [];
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));
};

/**
 * Analyze Product Image using Google Gemini Vision API
 * Extracts optical character recognition (OCR) visible text, product identity,
 * and classifies whether the image actually depicts a retail consumer good.
 *
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

  const prompt = `You are an expert AI product catalog vision engine for an e-commerce platform.
Analyze this image and extract shopping catalog attributes with extreme precision.

CRITICAL INSTRUCTIONS:
1. Product Verification ("isRetailProduct"):
   - Set true if the image is a consumer product or retail good (e.g., book, footwear, clothing, electronics, gadget, kitchenware, cosmetics, etc.).
   - Set false if it is a random non-product image (e.g., human selfie/face, landscape, animal/pet, blank wall, whiteboard, street, abstract wallpaper).
2. Optical Character Recognition ("visibleText"):
   - Extract any EXACT text, book title, author, brand logo name, or product model printed directly on the item, cover, or packaging.
   - For books: extract the exact book title and author name visible on the cover.
   - For electronics/gear: extract brand and model numbers.
   - If no text is visible, return null.
3. "detectedItem": A concise 2-4 word specific product name (e.g., "Clean Code Book", "Nike Air Zoom Pegasus", "Sony Noise Cancelling Headphones").
4. "category": Must be strictly ONE of: "electronics", "clothing", "books", "home", "beauty", "sports", "other".
5. "brand": Brand or publisher if identifiable, or null.
6. "colors": 1-3 dominant visible product colors.
7. "keywords": 4-8 specific search keywords that describe the item.

Respond ONLY with a valid JSON object (without markdown or backticks):
{
  "isRetailProduct": true,
  "visibleText": "Clean Code A Handbook of Agile Software Craftsmanship",
  "detectedItem": "Clean Code Book",
  "category": "books",
  "brand": "Prentice Hall",
  "colors": ["white", "blue"],
  "keywords": ["clean code", "robert c martin", "agile", "software engineering", "programming", "craftsmanship"],
  "features": ["paperback book", "technical guide"]
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

      // Normalize default fields
      analysis.isRetailProduct = analysis.isRetailProduct !== false;
      analysis.visibleText = analysis.visibleText || null;
      analysis.detectedItem = analysis.detectedItem || 'Product';
      analysis.category = (analysis.category || 'other').toLowerCase();
      analysis.colors = Array.isArray(analysis.colors) ? analysis.colors : [];
      analysis.keywords = Array.isArray(analysis.keywords) ? analysis.keywords : [];

      logger.info(`Gemini Vision analyzed image using ${model}: "${analysis.detectedItem}" (Retail: ${analysis.isRetailProduct})`);
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
 * Precision Product Match Scorer
 * Compares visual search analysis with a database product.
 * Returns match percentage (0 - 98%).
 */
const calculateProductMatch = (product, analysis) => {
  let score = 0;
  const productName = (product.name || '').toLowerCase();
  const productDesc = (product.description || '').toLowerCase();
  const productCat = (product.category || '').toLowerCase();
  const productBrand = (product.brand || '').toLowerCase();

  const queryVisible = (analysis.visibleText || '').toLowerCase().trim();
  const queryItem = (analysis.detectedItem || '').toLowerCase().trim();

  const queryTokens = [
    ...new Set([
      ...tokenize(analysis.visibleText),
      ...tokenize(analysis.detectedItem)
    ])
  ];
  const prodNameTokens = tokenize(productName);

  // 1. Title / OCR Exact Phrase & Token Matching (Max 65 points)
  let titleScore = 0;

  // Exact phrase match bonus
  if (queryVisible.length > 3 && (productName.includes(queryVisible) || queryVisible.includes(productName))) {
    titleScore += 45;
  } else if (queryItem.length > 3 && (productName.includes(queryItem) || queryItem.includes(productName))) {
    titleScore += 35;
  }

  // Jaccard similarity and token overlap
  if (queryTokens.length > 0 && prodNameTokens.length > 0) {
    const intersection = queryTokens.filter((t) => prodNameTokens.includes(t));
    const union = new Set([...queryTokens, ...prodNameTokens]);
    const jaccard = union.size > 0 ? intersection.length / union.size : 0;
    const overlapRatio = queryTokens.length > 0 ? intersection.length / queryTokens.length : 0;

    titleScore += Math.round(jaccard * 35);
    titleScore += Math.round(overlapRatio * 20);
  }
  score += Math.min(titleScore, 65);

  // 2. Category Relevance Matching (15 points)
  if (analysis.category && productCat) {
    if (productCat === analysis.category) {
      score += 15;
    } else {
      // Category mismatch penalty
      score -= 20;
    }
  }

  // 3. Brand Relevance Matching (10 points)
  if (analysis.brand && productBrand) {
    const cleanBrand = analysis.brand.toLowerCase().trim();
    if (productBrand.includes(cleanBrand) || cleanBrand.includes(productBrand)) {
      score += 10;
    }
  }

  // 4. Color Matching (Max 5 points)
  if (Array.isArray(analysis.colors)) {
    let colorHits = 0;
    analysis.colors.forEach((color) => {
      const c = color.toLowerCase();
      if (productName.includes(c) || productDesc.includes(c)) {
        colorHits++;
      }
    });
    score += Math.min(colorHits * 3, 5);
  }

  // 5. Keyword Overlap in Description (Max 5 points)
  if (Array.isArray(analysis.keywords) && analysis.keywords.length > 0) {
    const kwTokens = tokenize(analysis.keywords.join(' '));
    const descHits = kwTokens.filter((k) => productDesc.includes(k)).length;
    score += Math.min(descHits * 2, 5);
  }

  // Stock bonus (2 points)
  if (product.stock > 0) {
    score += 2;
  }

  // Bound between 0 and 98
  return Math.max(0, Math.min(score, 98));
};

/**
 * Find Matching Catalog Products based on Visual Analysis
 * @param {Object} analysis - Extracted visual metadata from Gemini
 * @param {number} limit - Maximum products to return
 * @param {number} minThreshold - Minimum similarity score required to be included (default: 38%)
 * @returns {Promise<Array>} List of matched products with visual match scores
 */
const findMatchingProducts = async (analysis, limit = 8, minThreshold = 38) => {
  // If the image is not a retail product, immediately return empty results
  if (analysis.isRetailProduct === false) {
    return [];
  }

  const { visibleText, detectedItem, category, brand, keywords = [] } = analysis;

  // Extract all significant search tokens
  const queryTokens = [
    ...new Set([
      ...tokenize(visibleText),
      ...tokenize(detectedItem),
      ...tokenize(Array.isArray(keywords) ? keywords.join(' ') : '')
    ])
  ];

  const orConditions = [];

  // Match visible text phrase if available
  if (visibleText && visibleText.trim().length > 2) {
    const cleanVisible = visibleText.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&').slice(0, 50);
    orConditions.push({ name: new RegExp(cleanVisible, 'i') });
  }

  // Match individual keyword tokens against product name and description
  queryTokens.slice(0, 6).forEach((term) => {
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    orConditions.push({ name: new RegExp(escaped, 'i') });
    orConditions.push({ description: new RegExp(escaped, 'i') });
  });

  // Match brand if detected
  if (brand && brand.trim()) {
    const escapedBrand = brand.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    orConditions.push({ brand: new RegExp(escapedBrand, 'i') });
  }

  // If no searchable terms extracted at all, return empty
  if (orConditions.length === 0 && !category) {
    return [];
  }

  // 1. Query category-filtered candidates first for maximum precision
  let candidates = [];
  if (category) {
    const categoryQuery = {
      isActive: true,
      category: new RegExp(`^${category.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'),
      ...(orConditions.length > 0 ? { $or: orConditions } : {})
    };
    candidates = await Product.find(categoryQuery).limit(30).lean();
  }

  // 2. If no candidates found in specific category, search across entire store with terms
  if (candidates.length === 0 && orConditions.length > 0) {
    candidates = await Product.find({
      isActive: true,
      $or: orConditions
    }).limit(30).lean();
  }

  // If still zero candidates, return empty array. NEVER fall back to arbitrary random products!
  if (!candidates || candidates.length === 0) {
    return [];
  }

  // Calculate precision match scores for candidate pool
  const scoredProducts = candidates
    .map((p) => {
      const matchPercentage = calculateProductMatch(p, analysis);
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
    })
    // Filter out products below the relevance threshold
    .filter((p) => p.matchPercentage >= minThreshold);

  // Sort descending by match percentage, then stock
  scoredProducts.sort((a, b) => b.matchPercentage - a.matchPercentage || b.stock - a.stock);

  return scoredProducts.slice(0, limit);
};

module.exports = {
  analyzeImageWithGemini,
  findMatchingProducts,
  calculateProductMatch,
  tokenize
};
