require('dotenv').config();
const mysql = require('mysql2/promise');

async function update() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME
    });

    console.log("Connected to MySQL server.");

    await connection.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        image_url VARCHAR(255)
      )
    `);
    console.log("Categories table created.");

    // Seed defaults
    const defaults = [
      ['Engine Oil', null],
      ['Brake Pads', null],
      ['Filters', null],
      ['Coolant', null],
      ['Chemicals', null],
      ['Combo Deals', null]
    ];
    
    await connection.query('INSERT IGNORE INTO categories (name, image_url) VALUES ?', [defaults]);
    console.log("Default categories seeded.");

    process.exit(0);
  } catch (error) {
    console.error("Database update failed:", error);
    process.exit(1);
  }
}

update();
