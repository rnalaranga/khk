const db = require('./config/db');

async function migrate() {
  try {
    console.log('Running migration...');
    await db.query('ALTER TABLE products ADD COLUMN image_url_2 VARCHAR(255) NULL, ADD COLUMN image_url_3 VARCHAR(255) NULL;');
    console.log('Migration successful: Added image_url_2 and image_url_3 to products table.');
  } catch (error) {
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log('Columns already exist.');
    } else {
      console.error('Migration failed:', error);
    }
  } finally {
    process.exit();
  }
}

migrate();
