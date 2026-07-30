const mysql = require('mysql2/promise');
require('dotenv').config();

async function migrate() {
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
    console.log('Done!');
    process.exit(0);
  } catch(e) {
    console.error(e);
    process.exit(1);
  }
}
migrate();
