const express = require('express');
const crypto = require('crypto');
const nodemailer = require('nodemailer'); // Make sure this is also here
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const config = require('../config');

const router = express.Router();

// Signup
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const user = new User({
      name,
      email,
      password: hashedPassword,
      role
    });

    await user.save();

    res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user._id, role: user.role, name: user.name },
      config.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Generate token (requires 'crypto' import)
    const token = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 3600000; 
    await user.save();

    // ⚠️ Check your terminal if this part fails
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'shitalbhadre911@gmail.com', // Replace with your email
        pass: 'ulgr nvng npsg oljb'   // REPLACE WITH GOOGLE APP PASSWORD
      }
    });

    const resetUrl = `http://localhost:3000/reset-password.html?token=${token}`;

    const mailOptions = {
      to: user.email,
      subject: 'Password Reset Request',
      text: `You are receiving this because you requested a password reset. Please click: \n\n ${resetUrl}`
    };

    // Use await to catch errors properly
    await transporter.sendMail(mailOptions);
    
    res.json({ message: "Reset link sent to email!" });

  } catch (err) {
    console.error("DETAILED BACKEND ERROR:", err); // Look at your terminal for this!
    res.status(500).json({ error: "Server failed to send email", details: err.message });
  }
});

// POST: /api/auth/reset-password/:token
router.post('/reset-password/:token', async (req, res) => {
  try {
    const user = await User.findOne({
      resetPasswordToken: req.params.token,
      resetPasswordExpires: { $gt: Date.now() } // Check if not expired
    });

    if (!user) return res.status(400).json({ message: "Invalid or expired token" });

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(req.body.password, salt);
    
    // IMPORTANT: Clear the reset token fields
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    
    await user.save();

    res.json({ message: "Password updated successfully!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;