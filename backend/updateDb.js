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

    // Add columns to users table
    await connection.query('ALTER TABLE users ADD COLUMN phone VARCHAR(50) DEFAULT NULL;');
    await connection.query('ALTER TABLE users ADD COLUMN address VARCHAR(255) DEFAULT NULL;');
    await connection.query('ALTER TABLE users ADD COLUMN city VARCHAR(100) DEFAULT NULL;');
    
    console.log("Added phone, address, and city to users table.");
    process.exit(0);
  } catch (error) {
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log("Columns already exist.");
      process.exit(0);
    } else {
      console.error("Failed:", error);
      process.exit(1);
    }
  }
}

updateDb();
