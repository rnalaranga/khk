const jwt = require('jsonwebtoken');
const db = require('../config/db');

module.exports = async function (req, res, next) {
  // Get token from header
  const token = req.header('x-auth-token') || req.headers.authorization?.split(' ')[1];

  if (!token) return res.status(401).json({ message: 'No token, authorization denied' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if user is admin in DB
    const [users] = await db.query('SELECT role FROM users WHERE id = ?', [decoded.id]);
    if (users.length === 0 || users[0].role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    req.user = decoded; // { id: ... }
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};
