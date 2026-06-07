require('dotenv').config();
const mysql = require('mysql2/promise');

async function promote() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
  });

  await connection.query("UPDATE users SET role='admin' WHERE email='nalaranga@gmail.com'");
  console.log("Promoted nalaranga@gmail.com!");
  process.exit(0);
}
promote();
