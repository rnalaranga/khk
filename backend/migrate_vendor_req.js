require('dotenv').config();
const db = require('./config/db');

async function run() {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS vendor_requests (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        address TEXT NOT NULL,
        google_location VARCHAR(255) NOT NULL,
        contact_number_1 VARCHAR(50) NOT NULL,
        contact_number_2 VARCHAR(50) NOT NULL,
        seller_photo_url VARCHAR(255) NOT NULL,
        status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);
    console.log("Migration successful");
  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    process.exit(0);
  }
}

run();
