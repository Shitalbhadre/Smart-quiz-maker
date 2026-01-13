const jwt = require('jsonwebtoken');
const config = require('../config');

// Authenticate user with JWT
const authenticate = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, config.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(400).json({ error: 'Invalid token.' });
  }
};

// Check if user is a Quiz Maker
const isQuizMaker = (req, res, next) => {
  if (req.user.role !== 'Quiz Maker') {
    return res.status(403).json({ error: 'Access denied. Quiz Maker role required.' });
  }
  next();
};

module.exports = { authenticate, isQuizMaker };