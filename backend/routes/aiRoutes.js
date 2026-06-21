const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const SYSTEM_PROMPT = `You are a parts search assistant. Extract the vehicle make, vehicle model, and product categories from the user's query.
Available Categories: "Engine Oil", "Brake Pads", "Chemicals", "Combo Deals", "Filters", "Coolant", "Wiper Blades", "Brake Washers".
Respond ONLY with a valid JSON object matching this schema:
{
  "make": "string or null",
  "model": "string or null",
  "categories": ["array of matching category strings"]
}
If no vehicle or categories are found, return nulls or empty arrays. Do not add markdown blocks like \`\`\`json. Return pure JSON.`;

router.post('/search', async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) {
      return res.status(400).json({ message: 'Query is required' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ message: 'AI API Key not configured' });
    }

    // 1. Call Gemini to extract intent
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const fullPrompt = `${SYSTEM_PROMPT}\n\nUser Query: ${query}`;
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: fullPrompt }] }]
    });
    
    const responseText = result.response.text().trim();
    let parsedIntent;
    try {
      parsedIntent = JSON.parse(responseText.replace(/```json/g, '').replace(/```/g, ''));
    } catch (e) {
      console.error('Failed to parse AI JSON:', responseText);
      return res.status(500).json({ message: 'AI failed to understand the query' });
    }

    const { make, model: vehicleModel, categories } = parsedIntent;

    // 2. Base Query
    let sql = `
      SELECT DISTINCT p.* 
      FROM products p 
      LEFT JOIN product_vehicles pv ON p.id = pv.product_id 
      LEFT JOIN vehicles v ON pv.vehicle_id = v.id 
      WHERE 1=1
    `;
    const params = [];

    // 3. Apply Filters
    if (categories && categories.length > 0) {
      const placeholders = categories.map(() => '?').join(',');
      sql += ` AND p.category IN (${placeholders})`;
      params.push(...categories);
    }

    if (make || vehicleModel) {
      sql += ` AND (`;
      const conditions = [];
      if (make) {
        conditions.push(`v.make LIKE ?`);
        params.push(`%${make}%`);
      }
      if (vehicleModel) {
        conditions.push(`v.model LIKE ?`);
        params.push(`%${vehicleModel}%`);
      }
      sql += conditions.join(' AND ');
      sql += `)`;
    }

    // If no specific filters were found, return empty array to prevent dumping everything
    if (!make && !vehicleModel && (!categories || categories.length === 0)) {
       return res.json({ intent: parsedIntent, products: [] });
    }

    const [products] = await db.query(sql, params);

    // 4. Attach vehicle names and format images (same as productRoutes.js)
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
    console.error('AI Search Error:', error);
    res.status(500).json({ message: 'Server Error during AI Search' });
  }
});

module.exports = router;
