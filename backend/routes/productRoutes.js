const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const db = require('../config/db');
const adminAuth = require('../middleware/adminAuth');

// Configure Multer for Image Uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

// @route   GET /api/products
// @desc    Get all products or filter by category
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { category } = req.query;
    let query = 'SELECT * FROM products';
    const params = [];

    if (category) {
      query += ' WHERE category = ?';
      params.push(category);
    }

    const [products] = await db.query(query, params);
    
    // Fetch all product_vehicles mappings
    const [mappings] = await db.query('SELECT product_id, vehicle_id FROM product_vehicles');
    
    // Attach vehicle_ids to each product
    products.forEach(p => {
      p.vehicle_ids = mappings.filter(m => m.product_id === p.id).map(m => m.vehicle_id);
    });

    res.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   GET /api/products/:id
// @desc    Get product by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const [product] = await db.query('SELECT * FROM products WHERE id = ?', [req.params.id]);
    
    if (product.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json(product[0]);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   POST /api/products
// @desc    Create a product (Admin only)
// @access  Private Admin
router.post('/', adminAuth, upload.single('image'), async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const { name, category, price, discount_percent, stock, description } = req.body;
    let { vehicle_ids } = req.body;
    const imageUrl = req.file ? req.file.filename : null;

    if (!name || !price) {
      return res.status(400).json({ message: 'Name and price are required' });
    }

    // vehicle_ids comes as stringified JSON if sent via FormData
    if (vehicle_ids && typeof vehicle_ids === 'string') {
      try {
        vehicle_ids = JSON.parse(vehicle_ids);
      } catch (e) {
        vehicle_ids = [];
      }
    }

    const [productRes] = await conn.query(
      'INSERT INTO products (name, category, price, discount_percent, stock, image_url, description) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name, category || null, price, discount_percent || 0, stock || 0, imageUrl, description || null]
    );

    const productId = productRes.insertId;

    if (vehicle_ids && Array.isArray(vehicle_ids) && vehicle_ids.length > 0) {
      const mappings = vehicle_ids.map(vid => [productId, vid]);
      await conn.query('INSERT INTO product_vehicles (product_id, vehicle_id) VALUES ?', [mappings]);
    }

    await conn.commit();
    res.status(201).json({ message: 'Product created successfully', id: productId });
  } catch (error) {
    await conn.rollback();
    console.error('Error creating product:', error);
    res.status(500).json({ message: 'Server error' });
  } finally {
    conn.release();
  }
});

// @route   PUT /api/products/:id
// @desc    Update a product (Admin only)
// @access  Private Admin
router.put('/:id', adminAuth, upload.single('image'), async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const { id } = req.params;
    const { name, category, price, discount_percent, stock, description } = req.body;
    let { vehicle_ids } = req.body;
    const imageUrl = req.file ? req.file.filename : null;

    if (vehicle_ids && typeof vehicle_ids === 'string') {
      try {
        vehicle_ids = JSON.parse(vehicle_ids);
      } catch (e) {
        vehicle_ids = [];
      }
    }

    let query = 'UPDATE products SET name=?, category=?, price=?, discount_percent=?, stock=?, description=?';
    let params = [name, category || null, price, discount_percent || 0, stock || 0, description || null];

    if (imageUrl) {
      query += ', image_url=?';
      params.push(imageUrl);
    }
    
    query += ' WHERE id=?';
    params.push(id);

    await conn.query(query, params);

    if (vehicle_ids && Array.isArray(vehicle_ids)) {
      await conn.query('DELETE FROM product_vehicles WHERE product_id = ?', [id]);
      if (vehicle_ids.length > 0) {
        const mappings = vehicle_ids.map(vid => [id, vid]);
        await conn.query('INSERT INTO product_vehicles (product_id, vehicle_id) VALUES ?', [mappings]);
      }
    }

    await conn.commit();
    res.json({ message: 'Product updated successfully' });
  } catch (error) {
    await conn.rollback();
    console.error('Error updating product:', error);
    res.status(500).json({ message: 'Server error' });
  } finally {
    conn.release();
  }
});

// @route   DELETE /api/products/:id
// @desc    Delete a product (Admin only)
// @access  Private Admin
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM products WHERE id = ?', [id]);
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
