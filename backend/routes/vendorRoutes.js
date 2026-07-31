const express = require('express');
const router = express.Router();
const db = require('../config/db');
const auth = require('../middleware/auth');

// Middleware to check if user is a vendor
const vendorAuth = async (req, res, next) => {
  if (req.user.role === 'admin' || req.user.is_vendor) {
    next();
  } else {
    res.status(403).json({ message: 'Vendor access required' });
  }
};

// @route   GET /api/vendor/stats
// @desc    Get dashboard stats for vendor
// @access  Private (Vendor)
router.get('/stats', auth, vendorAuth, async (req, res) => {
  try {
    const vendorId = req.user.id;
    
    // Total products by this vendor
    const [prodResult] = await db.query('SELECT COUNT(*) as count FROM products WHERE vendor_id = ?', [vendorId]);
    const totalProducts = prodResult[0].count;

    // Sales metrics (Orders containing this vendor's products)
    const [salesResult] = await db.query(`
      SELECT 
        SUM(oi.price * oi.quantity) as total_revenue,
        COUNT(DISTINCT oi.order_id) as total_orders
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      JOIN orders o ON oi.order_id = o.id
      WHERE p.vendor_id = ? AND o.status = 'delivered'
    `, [vendorId]);

    const totalRevenue = parseFloat(salesResult[0].total_revenue) || 0;
    const totalOrders = parseInt(salesResult[0].total_orders) || 0;

    res.json({
      totalProducts,
      totalRevenue,
      totalOrders
    });
  } catch (error) {
    console.error('Vendor stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/vendor/orders
// @desc    Get orders containing vendor's products
// @access  Private (Vendor)
router.get('/orders', auth, vendorAuth, async (req, res) => {
  try {
    const vendorId = req.user.id;

    const [orders] = await db.query(`
      SELECT 
        o.id as order_id, o.status, o.created_at, o.shipping_city,
        oi.quantity, oi.price,
        p.name as product_name
      FROM orders o
      JOIN order_items oi ON o.id = oi.order_id
      JOIN products p ON oi.product_id = p.id
      WHERE p.vendor_id = ?
      ORDER BY o.created_at DESC
    `, [vendorId]);

    res.json(orders);
  } catch (error) {
    console.error('Vendor orders error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
