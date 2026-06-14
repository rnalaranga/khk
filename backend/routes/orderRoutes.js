const express = require('express');
const router = express.Router();
const db = require('../config/db');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');
const jwt = require('jsonwebtoken');
const { sendInvoiceEmail, sendAdminNotificationEmail } = require('../utils/emailService');

// @route   GET /api/orders/my-orders
// @desc    Get logged in user's orders
// @access  Private
router.get('/my-orders', auth, async (req, res) => {
  try {
    const [orders] = await db.query(
      'SELECT id, total_amount, status, payment_method, created_at FROM orders WHERE user_id = ? ORDER BY created_at DESC',
      [req.user.id]
    );

    // Fetch items for each order
    for (let order of orders) {
      const [items] = await db.query(
        `SELECT oi.quantity, oi.price, p.name 
         FROM order_items oi 
         JOIN products p ON oi.product_id = p.id 
         WHERE oi.order_id = ?`,
        [order.id]
      );
      order.items = items;
    }

    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   GET /api/orders/all
// @desc    Get all orders (Admin only)
// @access  Private Admin
router.get('/all', adminAuth, async (req, res) => {
  try {
    const [orders] = await db.query(`
      SELECT o.*, u.name as customer_name, u.email as customer_email 
      FROM orders o 
      LEFT JOIN users u ON o.user_id = u.id 
      ORDER BY o.created_at DESC
    `);
    res.json(orders);
  } catch (error) {
    console.error('Error fetching all orders:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/orders/:id
// @desc    Update order status or shipping (Admin only)
// @access  Private Admin
router.put('/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, tracking_number, shipping_address, shipping_city, shipping_phone } = req.body;

    await db.query(
      `UPDATE orders SET 
        status = COALESCE(?, status), 
        tracking_number = COALESCE(?, tracking_number),
        shipping_address = COALESCE(?, shipping_address),
        shipping_city = COALESCE(?, shipping_city),
        shipping_phone = COALESCE(?, shipping_phone)
       WHERE id = ?`,
      [status, tracking_number, shipping_address, shipping_city, shipping_phone, id]
    );

    res.json({ message: 'Order updated successfully' });
  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/orders/:id
// @desc    Delete order (Admin only)
// @access  Private Admin
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM order_items WHERE order_id = ?', [id]);
    await db.query('DELETE FROM orders WHERE id = ?', [id]);
    res.json({ message: 'Order deleted successfully' });
  } catch (error) {
    console.error('Error deleting order:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/orders/:id/items
// @desc    Get order items
// @access  Private Admin
router.get('/:id/items', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const [items] = await db.query(`
      SELECT oi.*, p.name, p.image_url as image 
      FROM order_items oi 
      LEFT JOIN products p ON oi.product_id = p.id 
      WHERE oi.order_id = ?
    `, [id]);
    res.json(items);
  } catch (error) {
    console.error('Error fetching order items:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/orders
// @desc    Create a new order
// @access  Private
router.post('/', auth, async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const { items, total_amount, payment_method, address, city, phone, shipping_address: sa, shipping_city: sc, shipping_phone: sp } = req.body;
    const shipping_address = address || sa;
    const shipping_city = city || sc;
    const shipping_phone = phone || sp;
    const userId = req.user.id;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'No items in cart' });
    }

    // 1. Create order
    const [orderResult] = await connection.query(
      'INSERT INTO orders (user_id, total_amount, payment_method, status, shipping_address, shipping_city, shipping_phone) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [userId, total_amount, payment_method, 'Pending', shipping_address, shipping_city, shipping_phone]
    );
    const orderId = orderResult.insertId;

    // 2. Insert order items and deduct stock
    for (const item of items) {
      await connection.query(
        'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)',
        [orderId, item.id, item.qty, item.finalPrice || item.price]
      );

      // Deduct stock
      await connection.query(
        'UPDATE products SET stock = GREATEST(stock - ?, 0) WHERE id = ?',
        [item.qty, item.id]
      );
    }

    await connection.commit();
    connection.release();

    // Send invoice email asynchronously
    (async () => {
      try {
        const [users] = await db.query('SELECT name, email FROM users WHERE id = ?', [userId]);
        if (users.length > 0) {
          const user = users[0];
          const orderData = {
            id: orderId,
            total_amount,
            shipping_address,
            shipping_city,
            created_at: new Date()
          };
          await sendInvoiceEmail(user.email, user, orderData, items);
          await sendAdminNotificationEmail('autopartskhk@gmail.com', user, orderData, items);
        }
      } catch (emailErr) {
        console.error('Failed to send invoice email:', emailErr);
      }
    })();

    res.status(201).json({ message: 'Order created successfully', orderId });

  } catch (error) {
    await connection.rollback();
    connection.release();
    console.error('Order error:', error);
    res.status(500).json({ message: 'Server error creating order' });
  }
});

module.exports = router;
