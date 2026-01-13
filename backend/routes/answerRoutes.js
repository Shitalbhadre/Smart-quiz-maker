const express = require('express');
const router = express.Router();
const Answer = require('../models/Answer');
const Quiz = require('../models/Quiz');
const authMiddleware = require('../middleware/authMiddleware');

// Submit Answer
router.post('/submit', authMiddleware, async (req, res) => {
  try {
    const { quizId, answers } = req.body;
    const quiz = await Quiz.findById(quizId);
    if (!quiz) return res.status(404).json({ error: 'Quiz not found' });

    // Calculate score
    let score = 0;
    answers.forEach((answer, index) => {
      if (quiz.questions[index] && answer.selectedOption === quiz.questions[index].correctAnswer) {
        score++;
      }
    });

    // 1. SAVE TO ANSWER COLLECTION (For Student History)
    const newAnswer = new Answer({
      quizId,
      studentId: req.userId,
      answers,
      score,
      totalQuestions: quiz.questions.length
    });
    await newAnswer.save();

    // 2. SAVE TO QUIZ SUBMISSIONS ARRAY (For Quiz Maker Dashboard)
    // This is the part you were missing!
    const submissionData = {
      studentId: req.userId,
      answers: answers.map(a => ({
        questionId: quiz.questions[a.questionIndex]._id,
        selectedAnswer: a.selectedOption
      })),
      score: score,
      submittedAt: new Date()
    };

    // Update if exists, otherwise push new
    const existingIndex = quiz.submissions.findIndex(s => s.studentId.toString() === req.userId);
    if (existingIndex > -1) {
      quiz.submissions[existingIndex] = submissionData;
    } else {
      quiz.submissions.push(submissionData);
    }
    
    await quiz.save();

    res.json({ message: 'Quiz submitted successfully', score });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get Leaderboard - This is what your dashboard calls
router.get('/leaderboard/:quizId', authMiddleware, async (req, res) => {
  try {
    console.log('GET /leaderboard/:quizId - Quiz ID:', req.params.quizId);
    
    // Get quiz to access submissions
    const quiz = await Quiz.findById(req.params.quizId)
      .populate('submissions.studentId', 'name email');

    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    // Return leaderboard from quiz submissions
    const leaderboard = quiz.submissions.map(sub => ({
      studentName: sub.studentId.name,
      userName: sub.studentId.name,
      score: sub.score,
      submittedAt: sub.submittedAt
    })).sort((a, b) => b.score - a.score);

    console.log('Leaderboard entries:', leaderboard.length);
    res.json(leaderboard);
  } catch (err) {
    console.error('Leaderboard error:', err);
    res.status(500).json({ error: 'Server error', message: err.message });
  }
});

// Get Student's Results
router.get('/my-results', authMiddleware, async (req, res) => {
  try {
    if (req.userRole !== 'Student') {
      return res.status(403).json({ error: 'Only students can view results' });
    }

    const answers = await Answer.find({ studentId: req.userId })
      .populate('quizId', 'subject description')
      .sort({ submittedAt: -1 });

    res.json(answers);
  } catch (err) {
    console.error('Get results error:', err);
    res.status(500).json({ error: 'Server error', message: err.message });
  }
});

module.exports = router;