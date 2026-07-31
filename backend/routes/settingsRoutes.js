const express = require('express');
const router = express.Router();
const db = require('../config/db');
const auth = require('../middleware/auth');

// GET all settings
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT key_name, value FROM settings');
    const settings = {};
    rows.forEach(r => { settings[r.key_name] = r.value; });
    res.json(settings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// POST (Update) settings - Admin Only
router.post('/', auth, async (req, res) => {
  try {
    const { settings } = req.body; 
    if (!settings || typeof settings !== 'object') {
      return res.status(400).json({ msg: 'Invalid settings data' });
    }
    
    const [users] = await db.query('SELECT role FROM users WHERE id = ?', [req.user.id]);
    if (users[0].role !== 'admin') {
      return res.status(403).json({ msg: 'Access denied' });
    }

    for (const [key, value] of Object.entries(settings)) {
      await db.query(
        'INSERT INTO settings (key_name, value) VALUES (?, ?) ON DUPLICATE KEY UPDATE value = ?',
        [key, value, value]
      );
    }
    
    res.json({ msg: 'Settings updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;
