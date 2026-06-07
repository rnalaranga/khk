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

    // Create Vehicles Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS vehicles (
        id INT AUTO_INCREMENT PRIMARY KEY,
        make VARCHAR(100) NOT NULL,
        model VARCHAR(100) NOT NULL,
        year_start INT,
        year_end INT
      )
    `);
    console.log("Vehicles table created.");

    // Create Product_Vehicles Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS product_vehicles (
        product_id INT NOT NULL,
        vehicle_id INT NOT NULL,
        PRIMARY KEY (product_id, vehicle_id),
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
        FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
      )
    `);
    console.log("Product_Vehicles table created.");

    // Seed Vehicles if empty
    const [rows] = await connection.query("SELECT COUNT(*) as count FROM vehicles");
    if (rows[0].count === 0) {
      const vehicles = [
        ['Toyota', 'Corolla', 2013, 2018],
        ['Toyota', 'Prius', 2010, 2015],
        ['Toyota', 'Aqua', 2012, 2020],
        ['Toyota', 'Vitz', 2010, 2018],
        ['Honda', 'Civic', 2016, 2021],
        ['Honda', 'Fit', 2014, 2020],
        ['Honda', 'Vezel', 2014, 2021],
        ['Suzuki', 'Swift', 2010, 2017],
        ['Suzuki', 'Wagon R', 2014, 2021],
        ['Nissan', 'Leaf', 2012, 2017],
        ['Mitsubishi', 'Outlander', 2015, 2022],
        ['Mazda', 'Axela', 2014, 2019]
      ];
      await connection.query("INSERT INTO vehicles (make, model, year_start, year_end) VALUES ?", [vehicles]);
      console.log("Inserted seed vehicles.");
    }

    // Promote User to Admin
    const [updateRes] = await connection.query(
      "UPDATE users SET role = 'admin' WHERE email = 'rnalaranga99@gmail.com'"
    );
    if (updateRes.affectedRows > 0) {
      console.log("Promoted rnalaranga99@gmail.com to admin!");
    } else {
      console.log("User rnalaranga99@gmail.com not found yet (maybe not registered).");
    }

    process.exit(0);
  } catch (error) {
    console.error("Database setup failed:", error);
    process.exit(1);
  }
}

updateDb();
