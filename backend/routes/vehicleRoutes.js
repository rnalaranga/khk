const express = require('express');
const router = express.Router();
const db = require('../config/db');
const adminAuth = require('../middleware/adminAuth');

// @route   GET /api/vehicles
// @desc    Get all vehicles
// @access  Public (or Admin depending on use case. Let's make it public so users can filter by vehicle later)
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM vehicles ORDER BY make, model');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching vehicles:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/vehicles
// @desc    Add a new vehicle
// @access  Admin Private
router.post('/', adminAuth, async (req, res) => {
  try {
    const { make, model, year_start, year_end } = req.body;
    if (!make || !model) return res.status(400).json({ message: 'Make and model required' });

    const [result] = await db.query(
      'INSERT INTO vehicles (make, model, year_start, year_end) VALUES (?, ?, ?, ?)',
      [make, model, year_start || null, year_end || null]
    );

    res.status(201).json({ id: result.insertId, make, model, year_start, year_end });
  } catch (error) {
    console.error('Error adding vehicle:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
