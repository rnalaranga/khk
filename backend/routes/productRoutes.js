const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const db = require('../config/db');
const adminAuth = require('../middleware/adminAuth');
const auth = require('../middleware/auth');
const sharp = require('sharp');

// Configure Multer for Image Uploads using memory storage for processing
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Helper to process and save an image buffer
async function processImage(buffer) {
  const filename = `${Date.now()}_${Math.random().toString(36).substr(2, 6)}.webp`;
  await sharp(buffer)
    .webp({ quality: 80 })
    .toFile(path.join(__dirname, '../uploads', filename));
  return filename;
}

// @route   GET /api/products
// @desc    Get all products or filter by category
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { category } = req.query;
    let query = 'SELECT p.*, b.name as brand_name, b.logo_url as brand_logo, b.discount_percent as brand_discount, u.name as vendor_name FROM products p LEFT JOIN brands b ON p.brand_id = b.id LEFT JOIN users u ON p.vendor_id = u.id';
    const params = [];

    if (category) {
      query += ' WHERE p.category = ?';
      params.push(category);
    }

    const [products] = await db.query(query, params);
    
    // Fetch all product_vehicles mappings WITH vehicle details
    const [mappings] = await db.query(`
      SELECT pv.product_id, pv.vehicle_id, v.make, v.model, v.year_start, v.year_end
      FROM product_vehicles pv
      JOIN vehicles v ON pv.vehicle_id = v.id
    `);
    
    // Attach vehicle_ids and vehicle_names to each product
    products.forEach(p => {
      const productMappings = mappings.filter(m => m.product_id === p.id);
      p.vehicle_ids = productMappings.map(m => m.vehicle_id);
      p.vehicle_names = productMappings.map(m => {
        let name = `${m.make} ${m.model}`;
        if (m.year_start && m.year_end) name += ` (${m.year_start}-${m.year_end})`;
        else if (m.year_start) name += ` (${m.year_start}+)`;
        return name;
      });
      // Build images array from image_url, image_url_2, image_url_3
      p.images = [p.image_url, p.image_url_2, p.image_url_3].filter(Boolean);
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
    const [product] = await db.query('SELECT p.*, b.name as brand_name, b.logo_url as brand_logo, b.discount_percent as brand_discount, u.name as vendor_name FROM products p LEFT JOIN brands b ON p.brand_id = b.id LEFT JOIN users u ON p.vendor_id = u.id WHERE p.id = ?', [req.params.id]);
    
    if (product.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const p = product[0];
    p.images = [p.image_url, p.image_url_2, p.image_url_3].filter(Boolean);

    res.json(p);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   POST /api/products
// @desc    Create a product (Admin or Vendor)
// @access  Private
router.post('/', auth, upload.fields([{ name: 'image', maxCount: 1 }, { name: 'image_2', maxCount: 1 }, { name: 'image_3', maxCount: 1 }]), async (req, res) => {
  // Check if admin or vendor
  const [users] = await db.query('SELECT role, is_vendor FROM users WHERE id = ?', [req.user.id]);
  if (users.length === 0 || (users[0].role !== 'admin' && !users[0].is_vendor)) {
    return res.status(403).json({ message: 'Access denied' });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const { name, category, price, discount_percent, stock, description, brand_id, item_condition } = req.body;
    let { vehicle_ids } = req.body;
    
    // Process up to 3 images
    let imageUrl = null, imageUrl2 = null, imageUrl3 = null;
    if (req.files) {
      if (req.files['image']) imageUrl = await processImage(req.files['image'][0].buffer);
      if (req.files['image_2']) imageUrl2 = await processImage(req.files['image_2'][0].buffer);
      if (req.files['image_3']) imageUrl3 = await processImage(req.files['image_3'][0].buffer);
    }

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

    const vendor_id = req.user.role === 'admin' ? null : req.user.id;
    const finalCondition = item_condition || 'new';

    const [productRes] = await conn.query(
      'INSERT INTO products (name, category, price, discount_percent, stock, image_url, image_url_2, image_url_3, description, brand_id, vendor_id, item_condition) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [name, category || null, price, discount_percent || 0, stock || 0, imageUrl, imageUrl2, imageUrl3, description || null, brand_id || null, vendor_id, finalCondition]
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
// @desc    Update a product (Admin or Owner Vendor)
// @access  Private
router.put('/:id', auth, upload.fields([{ name: 'image', maxCount: 1 }, { name: 'image_2', maxCount: 1 }, { name: 'image_3', maxCount: 1 }]), async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const { id } = req.params;

    // Check ownership
    const [existing] = await conn.query('SELECT vendor_id FROM products WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    const [users] = await conn.query('SELECT role FROM users WHERE id = ?', [req.user.id]);
    const userRole = users.length > 0 ? users[0].role : 'customer';

    if (userRole !== 'admin' && existing[0].vendor_id !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { name, category, price, discount_percent, stock, description, brand_id, item_condition } = req.body;
    let { vehicle_ids, remove_image, remove_image_2, remove_image_3 } = req.body;
    
    // Process new images if uploaded
    let imageUrl = null, imageUrl2 = null, imageUrl3 = null;
    if (req.files) {
      if (req.files['image']) imageUrl = await processImage(req.files['image'][0].buffer);
      if (req.files['image_2']) imageUrl2 = await processImage(req.files['image_2'][0].buffer);
      if (req.files['image_3']) imageUrl3 = await processImage(req.files['image_3'][0].buffer);
    }

    if (vehicle_ids && typeof vehicle_ids === 'string') {
      try {
        vehicle_ids = JSON.parse(vehicle_ids);
      } catch (e) {
        vehicle_ids = [];
      }
    }

    const finalCondition = item_condition || 'new';

    let query = 'UPDATE products SET name=?, category=?, price=?, discount_percent=?, stock=?, description=?, brand_id=?, item_condition=?';
    let params = [name, category || null, price, discount_percent || 0, stock || 0, description || null, brand_id || null, finalCondition];

    // Handle image 1
    if (imageUrl) {
      query += ', image_url=?';
      params.push(imageUrl);
    } else if (remove_image === 'true') {
      query += ', image_url=NULL';
    }

    // Handle image 2
    if (imageUrl2) {
      query += ', image_url_2=?';
      params.push(imageUrl2);
    } else if (remove_image_2 === 'true') {
      query += ', image_url_2=NULL';
    }

    // Handle image 3
    if (imageUrl3) {
      query += ', image_url_3=?';
      params.push(imageUrl3);
    } else if (remove_image_3 === 'true') {
      query += ', image_url_3=NULL';
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
// @desc    Delete a product (Admin or Owner Vendor)
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const [existing] = await db.query('SELECT vendor_id FROM products WHERE id = ?', [id]);
    if (existing.length === 0) return res.status(404).json({ message: 'Product not found' });
    
    const [users] = await db.query('SELECT role FROM users WHERE id = ?', [req.user.id]);
    const userRole = users.length > 0 ? users[0].role : 'customer';

    if (userRole !== 'admin' && existing[0].vendor_id !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await db.query('DELETE FROM products WHERE id = ?', [id]);
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
