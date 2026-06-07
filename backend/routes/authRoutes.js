const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const db = require('../config/db');
const auth = require('../middleware/auth');

// @route   POST /api/auth/register
// @desc    Register a user
// @access  Public
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please enter all required fields' });
    }

    // Check for existing user
    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    // Generate 6-digit Verification Code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Insert user
    const [result] = await db.query(
      'INSERT INTO users (name, email, password_hash, verification_token, is_verified) VALUES (?, ?, ?, ?, ?)',
      [name, email, hash, verificationCode, false]
    );

    // Send Verification Email via Gmail
    let transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    let message = {
      from: `"KHK Auto Parts" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Your Verification Code - KHK Auto Parts',
      text: `Your verification code is: ${verificationCode}`,
      html: `<p>Welcome to KHK Auto Parts!</p>
             <p>Your 6-digit verification code is:</p>
             <h2 style="background:#f4f4f4;padding:10px;display:inline-block;letter-spacing:4px;">${verificationCode}</h2>
             <p>Please enter this code on the website to complete your registration.</p>`
    };

    transporter.sendMail(message, (err, info) => {
      if (err) {
        console.log('Error sending email: ' + err.message);
        // Not returning error to client so they aren't blocked if email fails temporarily
      } else {
        console.log('Verification Email sent to: %s', info.accepted);
      }
    });

    res.status(201).json({ message: 'Registration successful! Please check your email to verify your account.' });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please enter all fields' });
    }

    const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const user = users[0];
    
    if (!user.is_verified) {
      return res.status(403).json({ message: 'Please verify your email before logging in.' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1d' });

    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/auth/me
// @desc    Get user data
// @access  Private
router.get('/me', auth, async (req, res) => {
  try {
    const [users] = await db.query(
      'SELECT id, name, email, role, phone, address, city FROM users WHERE id = ?',
      [req.user.id]
    );
    if (users.length === 0) return res.status(404).json({ message: 'User not found' });
    res.json(users[0]);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/auth/profile
// @desc    Update user profile details
// @access  Private
router.put('/profile', auth, async (req, res) => {
  try {
    const { phone, address, city } = req.body;
    await db.query(
      'UPDATE users SET phone = ?, address = ?, city = ? WHERE id = ?',
      [phone || null, address || null, city || null, req.user.id]
    );
    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/auth/verify-code
// @desc    Verify user email with OTP and login
// @access  Public
router.post('/verify-code', async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) return res.status(400).json({ message: 'Email and code are required' });

    const [users] = await db.query('SELECT id, name, email FROM users WHERE email = ? AND verification_token = ?', [email, code]);
    if (users.length === 0) {
      return res.status(400).json({ message: 'Invalid verification code' });
    }

    const user = users[0];

    await db.query(
      'UPDATE users SET is_verified = TRUE, verification_token = NULL WHERE id = ?',
      [user.id]
    );

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1d' });

    res.json({ 
      message: 'Email successfully verified',
      token,
      user
    });
  } catch (error) {
    console.error('Error verifying code:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
