require('dotenv').config();
const mysql = require('mysql2/promise');

async function setup() {
  try {
    // Connect without DB selected
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASS
    });

    console.log("Connected to MySQL server.");

    // Create DB
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME}\`;`);
    console.log(`Database ${process.env.DB_NAME} created or already exists.`);
    
    await connection.query(`USE \`${process.env.DB_NAME}\`;`);

    // Create Products Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        category VARCHAR(100),
        price DECIMAL(10,2) NOT NULL,
        discount_percent INT DEFAULT 0,
        stock INT DEFAULT 0,
        compatible_vehicles VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("Products table created.");

    // Create Users Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'customer',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("Users table created.");

    // Create Orders Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT,
        total_amount DECIMAL(10,2) NOT NULL,
        status VARCHAR(50) DEFAULT 'Pending',
        payment_method VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
      )
    `);
    console.log("Orders table created.");

    // Create Order Items Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS order_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_id INT NOT NULL,
        product_id INT NOT NULL,
        quantity INT NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
      )
    `);
    console.log("Order items table created.");

    // Insert Mock Data if products table is empty
    const [rows] = await connection.query("SELECT COUNT(*) as count FROM products");
    if (rows[0].count === 0) {
      const mockProducts = [
        ['Castrol GTX 5W-30 Synthetic Oil (4L)', 'Engine Oil', 4500, 15, 24, 'Toyota Corolla, Honda Civic, Suzuki Swift'],
        ['Mobil1 Hybrid 0W-16 (4L)', 'Engine Oil', 5800, 10, 12, 'Toyota Prius, Honda Fit, Toyota Aqua'],
        ['Liqui Moly Molygen 5W-40 (4L)', 'Engine Oil', 14500, 5, 20, 'High-performance European vehicles'],
        ['Premium OEM Oil Filter', 'Filters', 850, 0, 50, 'Toyota Corolla, Honda Civic'],
        ['High-Flow Air Filter', 'Filters', 1200, 10, 35, 'Toyota Prius, Toyota Corolla'],
        ['All-Season Coolant (Pre-Mixed 2L)', 'Coolant', 1800, 5, 30, 'All Vehicles'],
        ['Brembo Ceramic Brake Pads — Front', 'Brake Pads', 5500, 15, 14, 'Toyota Corolla, Honda Civic, Suzuki Swift'],
        ['Liqui Moly Engine Degreaser (500ml)', 'Chemicals', 1200, 10, 60, 'All Vehicles'],
        ['STP Complete Fuel System Cleaner', 'Chemicals', 2500, 25, 45, 'All Vehicles'],
        ['Liqui Moly Ceratec Additive', 'Chemicals', 4200, 0, 30, 'All Vehicles'],
        ['Full Service Combo — Oil + Filter', 'Combo Deals', 5000, 20, 15, 'Toyota Corolla, Honda Civic']
      ];
      
      const insertQuery = "INSERT INTO products (name, category, price, discount_percent, stock, compatible_vehicles) VALUES ?";
      await connection.query(insertQuery, [mockProducts]);
      console.log("Inserted mock products.");
    }

    console.log("Setup complete!");
    process.exit(0);
  } catch (error) {
    console.error("Database setup failed:", error);
    process.exit(1);
  }
}

setup();
