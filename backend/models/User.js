const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },

  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },

  password: {
    type: String,
    required: true
  },

  role: {
    type: String,
    enum: ['Student', 'Quiz Maker'],
    required: true
  },

  // 🔐 FORGOT PASSWORD FIELDS
  // Stores the hashed or random string sent to the user's email
  resetPasswordToken: {
    type: String,
    default: null
  },

  // Stores the timestamp when the token will become invalid (e.g., 1 hour from generation)
  resetPasswordExpires: {
    type: Date,
    default: null
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Helper index to speed up lookups during password reset
userSchema.index({ resetPasswordToken: 1 });

module.exports = mongoose.model('User', userSchema);