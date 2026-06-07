require('dotenv').config();
const mysql = require('mysql2/promise');

async function updateDb() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME
    });

    console.log("Connected to MySQL server.");

    await connection.query('ALTER TABLE products ADD COLUMN image_url VARCHAR(255) DEFAULT NULL;');
    
    console.log("Added image_url column to products table.");
    process.exit(0);
  } catch (error) {
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log("Column image_url already exists.");
      process.exit(0);
    } else {
      console.error("Database setup failed:", error);
      process.exit(1);
    }
  }
}

updateDb();
