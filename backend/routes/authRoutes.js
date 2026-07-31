const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const db = require('../config/db');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');
const multer = require('multer');
const path = require('path');
const sharp = require('sharp');

// Multer setup for memory storage
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
    if (user.is_blocked) {
      return res.status(403).json({ message: 'Your account has been suspended. Please contact support.' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1d' });

    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, phone: user.phone, address: user.address, city: user.city, is_vendor: user.is_vendor }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/auth/become-vendor
// @desc    Upgrade user to vendor
// @access  Private
router.post('/become-vendor', auth, async (req, res) => {
  try {
    await db.query('UPDATE users SET is_vendor = true WHERE id = ?', [req.user.id]);
    res.json({ message: 'Successfully upgraded to Vendor' });
  } catch (error) {
    console.error('Become vendor error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/auth/me
// @desc    Get user data
// @access  Private
router.get('/me', auth, async (req, res) => {
  try {
    const [users] = await db.query(
      'SELECT id, name, email, role, phone, address, city, is_vendor FROM users WHERE id = ?',
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
// @route   POST /api/auth/forgot-password
// @desc    Send password reset link
// @access  Public
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const [users] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (users.length === 0) return res.status(400).json({ message: 'No account with that email found' });

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = await bcrypt.hash(resetToken, 10);
    const expiry = new Date(Date.now() + 3600000); // 1 hour

    await db.query(
      'UPDATE users SET reset_token = ?, reset_token_expiry = ? WHERE id = ?',
      [resetTokenHash, expiry, users[0].id]
    );

    let transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
    });

    const resetLink = `${req.headers.origin || 'http://localhost:5173'}/reset-password?token=${resetToken}&id=${users[0].id}`;

    await transporter.sendMail({
      from: `"KHK Auto Parts" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Password Reset - KHK Auto Parts',
      html: `
        <h2>Password Reset Request</h2>
        <p>You requested a password reset. Click the button below to set a new password. This link is valid for 1 hour.</p>
        <a href="${resetLink}" style="padding:10px 20px;background:#E4000F;color:white;text-decoration:none;border-radius:5px;display:inline-block;margin-top:10px;">Reset Password</a>
        <p style="margin-top:20px;">If you did not request this, please ignore this email.</p>
      `
    });

    res.json({ message: 'Password reset link sent to your email' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/auth/reset-password
// @desc    Reset password using token
// @access  Public
router.post('/reset-password', async (req, res) => {
  try {
    const { id, token, newPassword } = req.body;
    if (!id || !token || !newPassword) return res.status(400).json({ message: 'Missing fields' });

    const [users] = await db.query('SELECT reset_token, reset_token_expiry FROM users WHERE id = ?', [id]);
    if (users.length === 0 || !users[0].reset_token) return res.status(400).json({ message: 'Invalid or expired reset token' });

    if (new Date() > new Date(users[0].reset_token_expiry)) {
      return res.status(400).json({ message: 'Reset token has expired' });
    }

    const isValid = await bcrypt.compare(token, users[0].reset_token);
    if (!isValid) return res.status(400).json({ message: 'Invalid reset token' });

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(newPassword, salt);

    await db.query(
      'UPDATE users SET password_hash = ?, reset_token = NULL, reset_token_expiry = NULL WHERE id = ?',
      [hash, id]
    );

    res.json({ message: 'Password has been successfully reset' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});
// @route   GET /api/auth/users
// @desc    Get all users except self
// @access  Private Admin
router.get('/users', adminAuth, async (req, res) => {
  try {
    const [users] = await db.query(
      'SELECT id, name, email, phone, address, city, created_at, is_verified, is_blocked, role FROM users WHERE id != ? ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/auth/users/:id/block
// @desc    Toggle block status
// @access  Private Admin
router.put('/users/:id/block', adminAuth, async (req, res) => {
  try {
    const { is_blocked } = req.body;
    await db.query('UPDATE users SET is_blocked = ? WHERE id = ?', [is_blocked ? 1 : 0, req.params.id]);
    res.json({ message: 'User block status updated' });
  } catch (error) {
    console.error('Error blocking user:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/auth/users/:id
// @desc    Delete a user
// @access  Private Admin
router.delete('/users/:id', adminAuth, async (req, res) => {
  try {
    await db.query('DELETE FROM users WHERE id = ?', [req.params.id]);
    res.json({ message: 'User deleted' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/auth/users/:id/role
// @desc    Change user role
// @access  Private Admin
router.put('/users/:id/role', adminAuth, async (req, res) => {
  try {
    const { role } = req.body;
    if (role !== 'admin' && role !== 'customer') return res.status(400).json({ message: 'Invalid role' });
    await db.query('UPDATE users SET role = ? WHERE id = ?', [role, req.params.id]);
    res.json({ message: `User role updated to ${role}` });
  } catch (error) {
    console.error('Error changing role:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

// ==========================================
// VENDOR REQUESTS
// ==========================================

// @route   POST /api/auth/vendor-request
// @desc    Submit a vendor request
// @access  Private
router.post('/vendor-request', auth, upload.single('seller_photo'), async (req, res) => {
  try {
    const { address, google_location, contact_number_1, contact_number_2 } = req.body;
    
    // Check if user already has a pending or approved request
    const [existing] = await db.query('SELECT * FROM vendor_requests WHERE user_id = ? AND status != "rejected"', [req.user.id]);
    if (existing.length > 0) {
      return res.status(400).json({ message: 'You already have a pending or approved request.' });
    }

    let seller_photo_url = '';
    if (req.file) {
      seller_photo_url = await processImage(req.file.buffer);
    }

    await db.query(
      'INSERT INTO vendor_requests (user_id, address, google_location, contact_number_1, contact_number_2, seller_photo_url) VALUES (?, ?, ?, ?, ?, ?)',
      [req.user.id, address, google_location, contact_number_1, contact_number_2, seller_photo_url]
    );

    res.status(201).json({ message: 'Vendor request submitted successfully' });
  } catch (error) {
    console.error('Error submitting vendor request:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/auth/vendor-request/status
// @desc    Get the status of the current user's vendor request
// @access  Private
router.get('/vendor-request/status', auth, async (req, res) => {
  try {
    const [requests] = await db.query('SELECT status FROM vendor_requests WHERE user_id = ? ORDER BY created_at DESC LIMIT 1', [req.user.id]);
    if (requests.length === 0) {
      return res.json({ status: null });
    }
    res.json({ status: requests[0].status });
  } catch (error) {
    console.error('Error fetching vendor request status:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/auth/admin/vendor-requests
// @desc    Get all vendor requests
// @access  Private Admin
router.get('/admin/vendor-requests', adminAuth, async (req, res) => {
  try {
    const [requests] = await db.query(`
      SELECT vr.*, u.name as user_name, u.email as user_email
      FROM vendor_requests vr
      JOIN users u ON vr.user_id = u.id
      ORDER BY vr.created_at DESC
    `);
    res.json(requests);
  } catch (error) {
    console.error('Error fetching vendor requests:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/auth/admin/vendor-requests/:id/status
// @desc    Update vendor request status (Approve/Reject)
// @access  Private Admin
router.put('/admin/vendor-requests/:id/status', adminAuth, async (req, res) => {
  const connection = await db.getConnection();
  try {
    const { status } = req.body;
    if (status !== 'approved' && status !== 'rejected') {
      return res.status(400).json({ message: 'Invalid status' });
    }

    await connection.beginTransaction();

    // Update request status
    await connection.query('UPDATE vendor_requests SET status = ? WHERE id = ?', [status, req.params.id]);

    // If approved, update user's is_vendor flag
    if (status === 'approved') {
      const [reqs] = await connection.query('SELECT user_id FROM vendor_requests WHERE id = ?', [req.params.id]);
      if (reqs.length > 0) {
        await connection.query('UPDATE users SET is_vendor = 1 WHERE id = ?', [reqs[0].user_id]);
      }
    }

    await connection.commit();
    res.json({ message: `Vendor request ${status}` });
  } catch (error) {
    await connection.rollback();
    console.error('Error updating vendor request status:', error);
    res.status(500).json({ message: 'Server error' });
  } finally {
    connection.release();
  }
});
