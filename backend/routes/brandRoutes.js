const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const db = require('../config/db');
const adminAuth = require('../middleware/adminAuth');
const sharp = require('sharp');

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

async function processImage(buffer) {
  const filename = `${Date.now()}_${Math.random().toString(36).substr(2, 6)}.webp`;
  await sharp(buffer)
    .webp({ quality: 80 })
    .toFile(path.join(__dirname, '../uploads', filename));
  return filename;
}

// @route   GET /api/brands
// @desc    Get all brands
// @access  Public
router.get('/', async (req, res) => {
  try {
    const [brands] = await db.query('SELECT * FROM brands ORDER BY name ASC');
    res.json(brands);
  } catch (error) {
    console.error('Error fetching brands:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/brands
// @desc    Create a new brand
// @access  Private Admin
router.post('/', adminAuth, upload.single('image'), async (req, res) => {
  try {
    const { name, discount_percent } = req.body;
    let logoUrl = null;

    if (!name) {
      return res.status(400).json({ message: 'Brand name is required' });
    }

    if (req.file) {
      logoUrl = await processImage(req.file.buffer);
    }

    const [result] = await db.query(
      'INSERT INTO brands (name, logo_url, discount_percent) VALUES (?, ?, ?)',
      [name, logoUrl, discount_percent || 0]
    );

    res.status(201).json({ message: 'Brand created successfully', id: result.insertId });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'Brand already exists' });
    }
    console.error('Error creating brand:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/brands/:id
// @desc    Update a brand
// @access  Private Admin
router.put('/:id', adminAuth, upload.single('image'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, discount_percent } = req.body;
    
    let query = 'UPDATE brands SET name=?, discount_percent=?';
    let params = [name, discount_percent || 0];

    if (req.file) {
      const logoUrl = await processImage(req.file.buffer);
      query += ', logo_url=?';
      params.push(logoUrl);
    }
    
    query += ' WHERE id=?';
    params.push(id);

    await db.query(query, params);
    res.json({ message: 'Brand updated successfully' });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'Brand name already exists' });
    }
    console.error('Error updating brand:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/brands/:id
// @desc    Delete a brand
// @access  Private Admin
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    // Set brand_id to NULL for products with this brand
    await db.query('UPDATE products SET brand_id = NULL WHERE brand_id = ?', [id]);
    await db.query('DELETE FROM brands WHERE id = ?', [id]);
    res.json({ message: 'Brand deleted successfully' });
  } catch (error) {
    console.error('Error deleting brand:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
