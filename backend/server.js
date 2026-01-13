const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const config = require('./config');

const app = express();

const answerRoutes = require('./routes/answerRoutes');
// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// Connect to MongoDB
mongoose.connect(config.MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB Atlas'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/quiz', require('./routes/quizRoutes'));
app.use('/api/answer', require('./routes/answerRoutes'));
app.use('/api/ai', require('./routes/aiRoutes'));
// Serve all HTML pages
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.get('/login.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/login.html'));
});

app.get('/signup.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/signup.html'));
});

app.get('/dashboard_maker.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dashboard_maker.html'));
});

app.get('/dashboard_student.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dashboard_student.html'));
});

app.get('/quiz.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/quiz.html'));
});

app.get('/leaderboard.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/leaderboard.html'));
});

// Start server
app.listen(config.PORT, () => {
  console.log(`🚀 Server running on http://localhost:${config.PORT}`);
});