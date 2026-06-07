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

    await connection.query('ALTER TABLE orders ADD COLUMN shipping_address VARCHAR(255) DEFAULT NULL;');
    await connection.query('ALTER TABLE orders ADD COLUMN shipping_city VARCHAR(100) DEFAULT NULL;');
    await connection.query('ALTER TABLE orders ADD COLUMN shipping_phone VARCHAR(50) DEFAULT NULL;');
    await connection.query('ALTER TABLE orders ADD COLUMN tracking_number VARCHAR(100) DEFAULT NULL;');
    
    console.log("Added shipping and tracking columns to orders table.");
    process.exit(0);
  } catch (error) {
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log("Columns already exist.");
      process.exit(0);
    } else {
      console.error("Database setup failed:", error);
      process.exit(1);
    }
  }
}

updateDb();
