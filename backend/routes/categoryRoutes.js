const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const db = require('../config/db');
const adminAuth = require('../middleware/adminAuth');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

// @route   GET /api/categories
// @desc    Get all categories
// @access  Public
router.get('/', async (req, res) => {
  try {
    const [categories] = await db.query('SELECT * FROM categories ORDER BY name ASC');
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   POST /api/categories
// @desc    Create a category (Admin only)
// @access  Private Admin
router.post('/', adminAuth, upload.single('image'), async (req, res) => {
  try {
    const { name } = req.body;
    const imageUrl = req.file ? req.file.filename : null;

    if (!name) {
      return res.status(400).json({ message: 'Category name is required' });
    }

    const [result] = await db.query(
      'INSERT INTO categories (name, image_url) VALUES (?, ?)',
      [name, imageUrl]
    );

    res.status(201).json({ message: 'Category created', id: result.insertId });
  } catch (error) {
    console.error('Error creating category:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'Category already exists' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/categories/:id
// @desc    Delete a category (Admin only)
// @access  Private Admin
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM categories WHERE id = ?', [id]);
    res.json({ message: 'Category deleted' });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
