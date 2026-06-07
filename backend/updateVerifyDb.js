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
    await connection.query('ALTER TABLE users ADD COLUMN is_verified BOOLEAN DEFAULT FALSE;');
    await connection.query('ALTER TABLE users ADD COLUMN verification_token VARCHAR(255) DEFAULT NULL;');
    
    // Set existing users to verified so they aren't locked out
    await connection.query('UPDATE users SET is_verified = TRUE;');

    console.log("Added is_verified and verification_token to users table.");
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
