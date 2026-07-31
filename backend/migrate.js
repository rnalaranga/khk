const mysql = require('mysql2/promise');
require('dotenv').config();

async function runMigration() {
  try {
    const c = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME
    });

    console.log('Creating brands table...');
    await c.query(`
      CREATE TABLE IF NOT EXISTS brands (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) UNIQUE NOT NULL,
        logo_url VARCHAR(255),
        discount_percent DECIMAL(5,2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    console.log('Checking if brand_id exists on products...');
    const [cols] = await c.query("SHOW COLUMNS FROM products LIKE 'brand_id'");
    if (cols.length === 0) {
      console.log('Adding brand_id to products...');
      await c.query('ALTER TABLE products ADD COLUMN brand_id INT NULL');
      console.log('Adding foreign key constraint...');
      await c.query('ALTER TABLE products ADD CONSTRAINT fk_brand FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE SET NULL');
    } else {
      console.log('brand_id already exists.');
    }

    console.log('Creating settings table...');
    await c.query(`
      CREATE TABLE IF NOT EXISTS settings (
        key_name VARCHAR(100) PRIMARY KEY,
        value TEXT
      )
    `);

    console.log('Inserting default SEO settings if not exist...');
    const defaultSettings = [
      { k: 'seo_title', v: 'KHK Auto Parts | Car Spare Parts & Accessories | Sri Lanka' },
      { k: 'seo_description', v: "KHK Auto Parts — Sri Lanka's trusted online store for genuine OEM and premium aftermarket car spare parts. Fast island-wide delivery." },
      { k: 'seo_keywords', v: 'car spare parts, auto parts, engine oil, brake pads, filters, Sri Lanka, Colombo' }
    ];
    for (const s of defaultSettings) {
      await c.query('INSERT IGNORE INTO settings (key_name, value) VALUES (?, ?)', [s.k, s.v]);
    }

    console.log('Migration Done!');
    await c.end();
  } catch(e) {
    console.error('Migration error:', e);
  }
}

module.exports = { runMigration };
