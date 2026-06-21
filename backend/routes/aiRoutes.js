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

    // 2. Extract Make and Model
    // Sort makes and models by length descending to match longest phrases first (e.g. "Land Rover" before "Rover")
    const makes = [...new Set(vehicles.map(v => v.make))].sort((a, b) => b.length - a.length);
    
    let remainingQueryForVehicles = lowerQuery;
    
    for (const make of makes) {
      if (remainingQueryForVehicles.includes(make.toLowerCase())) {
        matchedMake = make;
        remainingQueryForVehicles = remainingQueryForVehicles.replace(make.toLowerCase(), ' ');
        break;
      }
    }

    // Filter models by the matched make if found, otherwise search all models
    let availableModels = matchedMake 
      ? vehicles.filter(v => v.make === matchedMake).map(v => v.model)
      : vehicles.map(v => v.model);
    
    availableModels = [...new Set(availableModels)].sort((a, b) => b.length - a.length);
    
    for (const model of availableModels) {
      if (remainingQueryForVehicles.includes(model.toLowerCase())) {
        matchedModel = model;
        // If we found a model but haven't found a make yet, automatically assign the make
        if (!matchedMake) {
          const v = vehicles.find(v => v.model === model);
          if (v) matchedMake = v.make;
        }
        remainingQueryForVehicles = remainingQueryForVehicles.replace(model.toLowerCase(), ' ');
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

    let remainingQuery = lowerQuery;
    
    for (const item of allSynonyms) {
      // Use word boundaries to avoid partial word matches
      const escapedPhrase = item.phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`\\b${escapedPhrase}\\b`, 'i');
      
      if (regex.test(remainingQuery)) {
        if (!matchedCategories.includes(item.category)) {
          matchedCategories.push(item.category);
        }
        // Remove the matched phrase from the remaining query so its individual words aren't matched again
        // Example: if "brake oil" is matched, we remove it, so "brake" and "oil" don't trigger Brake Pads or Engine Oil.
        remainingQuery = remainingQuery.replace(regex, ' ');
      }
    }

    const parsedIntent = {
      make: matchedMake,
      model: matchedModel,
      categories: matchedCategories
    };

    // 4. Base Query
    let sql = `
      SELECT DISTINCT p.* 
      FROM products p 
      LEFT JOIN product_vehicles pv ON p.id = pv.product_id 
      LEFT JOIN vehicles v ON pv.vehicle_id = v.id 
      WHERE 1=1
    `;
    const params = [];

    // 5. Apply Filters
    if (parsedIntent.categories && parsedIntent.categories.length > 0) {
      const placeholders = parsedIntent.categories.map(() => '?').join(',');
      sql += ` AND p.category IN (${placeholders})`;
      params.push(...parsedIntent.categories);
    }

    if (parsedIntent.make || parsedIntent.model) {
      sql += ` AND (`;
      const conditions = [];
      if (parsedIntent.make) {
        conditions.push(`v.make LIKE ?`);
        params.push(`%${parsedIntent.make}%`);
      }
      if (parsedIntent.model) {
        conditions.push(`v.model LIKE ?`);
        params.push(`%${parsedIntent.model}%`);
      }
      sql += conditions.join(' AND ');
      sql += `)`;
    }

    // If no specific filters were found, return empty array to prevent dumping everything
    if (!parsedIntent.make && !parsedIntent.model && (!parsedIntent.categories || parsedIntent.categories.length === 0)) {
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
