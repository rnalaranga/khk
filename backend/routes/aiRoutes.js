const express = require('express');
const router = express.Router();
const db = require('../config/db');

const CATEGORY_SYNONYMS = {
  "Engine Oil": ["engine oil", "motor oil", "lube", "oil"],
  "Brake Pads": ["brake pad", "brake pads", "brake shoe", "brakes", "brake"],
  "Chemicals": ["brake oil", "brake fluid", "chemical", "chemicals", "cleaner", "spray", "additive", "treatment"],
  "Combo Deals": ["combo", "deal", "deals", "package", "bundle"],
  "Filters": ["air filter", "oil filter", "cabin filter", "filter", "filters"],
  "Coolant": ["coolant", "coolants", "radiator fluid", "antifreeze"],
  "Wiper Blades": ["wiper blade", "wiper blades", "wiper", "wipers", "blade", "blades"],
  "Brake Washers": ["brake washer", "brake washers", "washer", "washers"]
};

router.post('/search', async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) {
      return res.status(400).json({ message: 'Query is required' });
    }

    const lowerQuery = query.toLowerCase();

    // 1. Fetch all vehicles and categories from DB to build our "knowledge base"
    const [vehicles] = await db.query('SELECT DISTINCT make, model FROM vehicles');
    const [categoriesDB] = await db.query('SELECT DISTINCT name FROM categories');
    
    let matchedMake = null;
    let matchedModel = null;
    let matchedCategories = [];

    let remainingQuery = lowerQuery;
    
    // 2. Extract Make and Model
    // Sort makes and models by length descending to match longest phrases first (e.g. "Land Rover" before "Rover")
    const makes = [...new Set(vehicles.map(v => v.make))].sort((a, b) => b.length - a.length);
    
    for (const make of makes) {
      if (remainingQuery.includes(make.toLowerCase())) {
        matchedMake = make;
        remainingQuery = remainingQuery.replace(make.toLowerCase(), ' ');
        break;
      }
    }

    // Filter models by the matched make if found, otherwise search all models
    let availableModels = matchedMake 
      ? vehicles.filter(v => v.make === matchedMake).map(v => v.model)
      : vehicles.map(v => v.model);
    
    availableModels = [...new Set(availableModels)].sort((a, b) => b.length - a.length);
    
    for (const model of availableModels) {
      if (remainingQuery.includes(model.toLowerCase())) {
        matchedModel = model;
        // If we found a model but haven't found a make yet, automatically assign the make
        if (!matchedMake) {
          const v = vehicles.find(v => v.model === model);
          if (v) matchedMake = v.make;
        }
        remainingQuery = remainingQuery.replace(model.toLowerCase(), ' ');
        break;
      }
    }

    // 3. Extract Categories using exact DB matches and synonyms
    const dbCategories = categoriesDB.map(c => c.name);
    
    // Build a flat list of all synonyms with their target category, sorted by length descending
    let allSynonyms = [];
    for (const cat of dbCategories) {
       allSynonyms.push({ phrase: cat.toLowerCase(), category: cat });
       if (CATEGORY_SYNONYMS[cat]) {
         for (const syn of CATEGORY_SYNONYMS[cat]) {
           allSynonyms.push({ phrase: syn.toLowerCase(), category: cat });
         }
       }
    }
    
    // Sort by length descending to match longest phrases first (e.g. "brake oil" before "brake" or "oil")
    allSynonyms.sort((a, b) => b.phrase.length - a.phrase.length);

    
    for (const item of allSynonyms) {
      // Use word boundaries to avoid partial word matches
      const escapedPhrase = item.phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`\\b${escapedPhrase}\\b`, 'i');
      
      if (regex.test(remainingQuery)) {
        if (!matchedCategories.includes(item.category)) {
          matchedCategories.push(item.category);
        }
        // Remove the matched phrase from the remaining query so its individual words aren't matched again
        remainingQuery = remainingQuery.replace(regex, ' ');
      }
    }

    // 4. Extract free-text keywords from leftover words
    const stopWords = ['i', 'need', 'want', 'looking', 'for', 'give', 'me', 'some', 'the', 'a', 'an', 'is', 'my', 'car', 'can', 'you', 'find', 'show', 'buy', 'have', 'do', 'any', 'get', 'parts', 'part', 'please'];
    const keywords = remainingQuery
      .split(/\s+/) // Split by spaces instead of all non-alphanumeric
      .map(w => w.replace(/[^a-z0-9\-]/gi, '')) // Keep alphanumeric and hyphens
      .filter(w => w.length > 0 && !stopWords.includes(w));

    const parsedIntent = {
      make: matchedMake,
      model: matchedModel,
      categories: matchedCategories,
      keywords: keywords
    };

    // 5. Build Relevance Score & Base Query
    let relevanceExpr = '0';
    let relevanceParams = [];

    if (parsedIntent.keywords && parsedIntent.keywords.length > 0) {
      for (const kw of parsedIntent.keywords) {
        const kwNoHyphen = kw.replace(/-/g, '');
        relevanceExpr += ` + 
          (CASE WHEN p.name LIKE ? THEN 10 ELSE 0 END) +
          (CASE WHEN REPLACE(p.name, '-', '') LIKE ? THEN 10 ELSE 0 END) +
          (CASE WHEN p.description LIKE ? THEN 2 ELSE 0 END) +
          (CASE WHEN REPLACE(p.description, '-', '') LIKE ? THEN 2 ELSE 0 END) +
          (CASE WHEN p.compatible_vehicles LIKE ? THEN 5 ELSE 0 END) +
          (CASE WHEN REPLACE(p.compatible_vehicles, '-', '') LIKE ? THEN 5 ELSE 0 END)
        `;
        relevanceParams.push(
          `%${kw}%`, `%${kwNoHyphen}%`,
          `%${kw}%`, `%${kwNoHyphen}%`,
          `%${kw}%`, `%${kwNoHyphen}%`
        );
      }
    }

    if (parsedIntent.make) {
        relevanceExpr += ` + (CASE WHEN p.name LIKE ? THEN 20 ELSE 0 END)`;
        relevanceParams.push(`%${parsedIntent.make}%`);
    }
    if (parsedIntent.model) {
        relevanceExpr += ` + (CASE WHEN p.name LIKE ? THEN 20 ELSE 0 END)`;
        relevanceParams.push(`%${parsedIntent.model}%`);
    }

    let sql = `
      SELECT p.id, p.name, p.price, p.stock, p.category, p.description, p.compatible_vehicles, p.image_url, p.image_url_2, p.image_url_3,
      MAX(${relevanceExpr}) as relevance
      FROM products p 
      LEFT JOIN product_vehicles pv ON p.id = pv.product_id 
      LEFT JOIN vehicles v ON pv.vehicle_id = v.id 
      WHERE 1=1
    `;
    const params = [...relevanceParams];

    // 6. Apply Hard Filters
    if (parsedIntent.categories && parsedIntent.categories.length > 0) {
      const placeholders = parsedIntent.categories.map(() => '?').join(',');
      sql += ` AND p.category IN (${placeholders})`;
      params.push(...parsedIntent.categories);
    }

    if (parsedIntent.make || parsedIntent.model) {
      sql += ` AND (`;
      const conditions = [];
      if (parsedIntent.make) {
        conditions.push(`(v.make LIKE ? OR p.name LIKE ? OR p.description LIKE ? OR p.compatible_vehicles LIKE ?)`);
        params.push(`%${parsedIntent.make}%`, `%${parsedIntent.make}%`, `%${parsedIntent.make}%`, `%${parsedIntent.make}%`);
      }
      if (parsedIntent.model) {
        conditions.push(`(v.model LIKE ? OR p.name LIKE ? OR p.description LIKE ? OR p.compatible_vehicles LIKE ?)`);
        params.push(`%${parsedIntent.model}%`, `%${parsedIntent.model}%`, `%${parsedIntent.model}%`, `%${parsedIntent.model}%`);
      }
      sql += conditions.join(' AND ');
      sql += `)`;
    }

    // Group By
    sql += ` GROUP BY p.id`;

    // Having Clause for keywords
    // If user provided keywords, enforce that the product must match at least one keyword (relevance > 0)
    // This prevents returning all items in a category if the user asked for a specific item (e.g. "Green coolant 1 L")
    const hasHardFilters = (parsedIntent.categories.length > 0 || parsedIntent.make || parsedIntent.model);
    if (parsedIntent.keywords.length > 0) {
      sql += ` HAVING relevance > 0`;
    }

    // Order by Relevance
    sql += ` ORDER BY relevance DESC, p.name ASC`;
    sql += ` LIMIT 15`; // Don't overwhelm the chat with too many products

    // If no specific filters were found at all, return empty array
    if (!hasHardFilters && (!parsedIntent.keywords || parsedIntent.keywords.length === 0)) {
       return res.json({ intent: parsedIntent, products: [] });
    }

    const [products] = await db.query(sql, params);

    // 6. Attach vehicle names and format images (same as productRoutes.js)
    const productIds = products.map(p => p.id);
    if (productIds.length > 0) {
      const [mappings] = await db.query(`
        SELECT pv.product_id, pv.vehicle_id, v.make, v.model, v.year_start, v.year_end
        FROM product_vehicles pv
        JOIN vehicles v ON pv.vehicle_id = v.id
        WHERE pv.product_id IN (?)
      `, [productIds]);

      products.forEach(p => {
        const productMappings = mappings.filter(m => m.product_id === p.id);
        p.vehicle_ids = productMappings.map(m => m.vehicle_id);
        p.vehicle_names = productMappings.map(m => {
          let vname = `${m.make} ${m.model}`;
          if (m.year_start && m.year_end) vname += ` (${m.year_start}-${m.year_end})`;
          else if (m.year_start) vname += ` (${m.year_start}+)`;
          return vname;
        });
        p.images = [p.image_url, p.image_url_2, p.image_url_3].filter(Boolean);
      });
    }

    res.json({ intent: parsedIntent, products });

  } catch (error) {
    console.error('Local AI Search Error:', error);
    res.status(500).json({ message: 'Server Error during AI Search' });
  }
});

module.exports = router;
