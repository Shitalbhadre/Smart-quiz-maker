const express = require('express');
const router = express.Router();
const Quiz = require('../models/Quiz');
const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware');

// Create Quiz
router.post('/', authMiddleware, async (req, res) => {
  try {
    console.log('POST / - Create quiz');
    console.log('User ID:', req.userId);
    console.log('User Role:', req.userRole);
    
    if (req.userRole !== 'Quiz Maker') {
      return res.status(403).json({ error: 'Only Quiz Makers can create quizzes' });
    }

    const { subject, description, questions, startTime, endTime } = req.body;

    if (!subject || !description || !questions || !startTime || !endTime) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (questions.length === 0) {
      return res.status(400).json({ error: 'At least one question is required' });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const quiz = new Quiz({
      subject,
      description,
      questions,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      creatorId: req.userId,
      creatorName: user.name,
      submissions: []
    });

    await quiz.save();
    console.log('Quiz created successfully:', quiz._id);
    res.status(201).json({ message: 'Quiz created successfully', quiz });
  } catch (err) {
    console.error('Create quiz error:', err);
    res.status(500).json({ error: 'Server error', message: err.message });
  }
});

// Get Quiz Maker's Quizzes
router.get('/my-quizzes', authMiddleware, async (req, res) => {
  try {
    console.log('GET /my-quizzes');
    console.log('User ID:', req.userId);
    console.log('User Role:', req.userRole);
    
    if (req.userRole !== 'Quiz Maker') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const quizzes = await Quiz.find({ creatorId: req.userId })
      .populate('submissions.studentId', 'name email')
      .sort({ createdAt: -1 });

    console.log('Found quizzes:', quizzes.length);
    res.json(quizzes);
  } catch (err) {
    console.error('Get quizzes error:', err);
    res.status(500).json({ error: 'Server error', message: err.message });
  }
});

// ✅ FIXED: Get Available Quizzes for Students
router.get('/available', authMiddleware, async (req, res) => {
  try {
    console.log('GET /available - Student ID:', req.userId);
    
    if (req.userRole !== 'Student') {
      return res.status(403).json({ error: 'Only students can view available quizzes' });
    }

    const now = new Date();
    console.log('Current time:', now);
    
    // Find all quizzes that have started and not ended
    const quizzes = await Quiz.find({
      startTime: { $lte: now },
      endTime: { $gte: now }
    });

    console.log('Found quizzes:', quizzes.length);

    // Check submission status for each quiz
    const quizzesWithStatus = quizzes.map(quiz => {
      const hasSubmitted = quiz.submissions.some(
        sub => sub.studentId.toString() === req.userId
      );
      
      // Don't send correct answers to students
      const quizObj = quiz.toObject();
      quizObj.questions = quizObj.questions.map(q => ({
        _id: q._id,
        question: q.question,
        options: q.options
        // correctAnswer is excluded
      }));
      
      return { 
        ...quizObj, 
        hasSubmitted,
        canEdit: hasSubmitted // Students can edit if they've already submitted
      };
    });

    console.log('Returning quizzes with status:', quizzesWithStatus.length);
    res.json(quizzesWithStatus);
  } catch (err) {
    console.error('Get available quizzes error:', err);
    res.status(500).json({ error: 'Server error', message: err.message });
  }
});

// ✅ NEW: Get Student Statistics
router.get('/student-stats', authMiddleware, async (req, res) => {
  try {
    if (req.userRole !== 'Student') {
      return res.status(403).json({ error: 'Only students can view stats' });
    }

    const now = new Date();
    
    // Count available quizzes
    const availableCount = await Quiz.countDocuments({
      startTime: { $lte: now },
      endTime: { $gte: now }
    });

    // Count completed quizzes (quizzes where student has submitted)
    const completedQuizzes = await Quiz.find({
      'submissions.studentId': req.userId
    });

    res.json({
      availableQuizzes: availableCount,
      completedQuizzes: completedQuizzes.length
    });
  } catch (err) {
    console.error('Get student stats error:', err);
    res.status(500).json({ error: 'Server error', message: err.message });
  }
});

// Get Single Quiz
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    console.log('GET /:id - Quiz ID:', req.params.id);
    console.log('User Role:', req.userRole);
    
    const quiz = await Quiz.findById(req.params.id);

    if (!quiz) {
      console.log('Quiz not found');
      return res.status(404).json({ error: 'Quiz not found' });
    }

    // If Quiz Maker is requesting
    if (req.userRole === 'Quiz Maker') {
      if (quiz.creatorId.toString() !== req.userId) {
        return res.status(403).json({ error: 'Not authorized to view this quiz' });
      }
      console.log('Returning full quiz for Quiz Maker');
      return res.json(quiz);
    }

    // For students
    if (req.userRole !== 'Student') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const now = new Date();
    if (now < quiz.startTime) {
      return res.status(400).json({ error: 'Quiz has not started yet' });
    }
    if (now > quiz.endTime) {
      return res.status(400).json({ error: 'Quiz has ended' });
    }

    // Check if student has submitted
    const submission = quiz.submissions.find(
      sub => sub.studentId.toString() === req.userId
    );

    // Prepare quiz without correct answers
    const quizForStudent = quiz.toObject();
    quizForStudent.questions = quizForStudent.questions.map(q => ({
      _id: q._id,
      question: q.question,
      options: q.options
    }));

    // If student has submitted, include their previous answers
    if (submission) {
      quizForStudent.previousSubmission = {
        answers: submission.answers,
        score: submission.score,
        submittedAt: submission.submittedAt
      };
      quizForStudent.canEdit = true;
    }

    res.json(quizForStudent);
  } catch (err) {
    console.error('Get quiz error:', err);
    res.status(500).json({ error: 'Server error', message: err.message });
  }
});

// UPDATE Quiz (for Quiz Makers)
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { subject, description, questions, startTime, endTime } = req.body;
    
    console.log('PUT /:id - Quiz ID:', id);
    
    if (req.userRole !== 'Quiz Maker') {
      return res.status(403).json({ message: 'Only Quiz Makers can update quizzes' });
    }

    const quiz = await Quiz.findById(id);
    
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    if (quiz.creatorId.toString() !== req.userId) {
      return res.status(403).json({ message: 'Not authorized to edit this quiz' });
    }
    

    quiz.subject = subject;
    quiz.description = description;
    quiz.questions = questions;
    quiz.startTime = new Date(startTime);
    quiz.endTime = new Date(endTime);

    await quiz.save();

    console.log('Quiz updated successfully');
    res.json({ message: 'Quiz updated successfully', quiz });
  } catch (error) {
    console.error('Update quiz error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// DELETE Quiz
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    if (req.userRole !== 'Quiz Maker') {
      return res.status(403).json({ message: 'Only Quiz Makers can delete quizzes' });
    }

    const quiz = await Quiz.findById(id);
    
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    if (quiz.creatorId.toString() !== req.userId) {
      return res.status(403).json({ message: 'Not authorized to delete this quiz' });
    }

    await Quiz.findByIdAndDelete(id);

    console.log('Quiz deleted successfully');
    res.json({ message: 'Quiz deleted successfully' });
  } catch (error) {
    console.error('Delete quiz error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ✅ FIXED: Submit/Update Quiz (allows editing)
router.post('/:id/submit', authMiddleware, async (req, res) => {
  try {
    if (req.userRole !== 'Student') {
      return res.status(403).json({ error: 'Only students can submit quizzes' });
    }

    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    // Check if quiz has ended
    const now = new Date();
    if (now > quiz.endTime) {
      return res.status(400).json({ error: 'Quiz has ended, cannot submit' });
    }

    const { answers } = req.body;
    
    // Calculate score
    let score = 0;
    quiz.questions.forEach(q => {
      const ans = answers.find(a => a.questionId === q._id.toString());
      if (ans && ans.selectedAnswer === q.correctAnswer) {
        score++;
      }
    });

    // Check if student has already submitted
    const existingSubmissionIndex = quiz.submissions.findIndex(
      sub => sub.studentId.toString() === req.userId
    );

    if (existingSubmissionIndex !== -1) {
      // Update existing submission
      quiz.submissions[existingSubmissionIndex] = {
        studentId: req.userId,
        answers,
        score,
        submittedAt: new Date()
      };
      await quiz.save();
      return res.json({ 
        message: 'Quiz updated successfully', 
        score,
        isUpdate: true 
      });
    } else {
      // New submission
      quiz.submissions.push({
        studentId: req.userId,
        answers,
        score,
        submittedAt: new Date()
      });
      await quiz.save();
      return res.json({ 
        message: 'Quiz submitted successfully', 
        score,
        isUpdate: false 
      });
    }
  } catch (err) {
    console.error('Submit quiz error:', err);
    res.status(500).json({ error: 'Server error', message: err.message });
  }
});

// ✅ FIXED: Leaderboard (Top 10 only)
router.get('/:id/leaderboard', authMiddleware, async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id)
      .populate('submissions.studentId', 'name email');

    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    // Get top 10 students sorted by score
    const leaderboard = quiz.submissions
      .map(sub => ({
        studentName: sub.studentId.name,
        userName: sub.studentId.name,
        email: sub.studentId.email,
        score: sub.score,
        totalQuestions: quiz.questions.length,
        percentage: ((sub.score / quiz.questions.length) * 100).toFixed(2),
        submittedAt: sub.submittedAt
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 10); // ✅ Top 10 only

    res.json(leaderboard);
  } catch (err) {
    console.error('Leaderboard error:', err);
    res.status(500).json({ error: 'Server error', message: err.message });
  }
});

// ✅ NEW: Get All Student Marks (for Quiz Maker)
router.get('/:id/all-students', authMiddleware, async (req, res) => {
  try {
    if (req.userRole !== 'Quiz Maker') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const quiz = await Quiz.findById(req.params.id)
      .populate('submissions.studentId', 'name email');

    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    if (quiz.creatorId.toString() !== req.userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Return all student submissions (not limited to top 10)
    const allStudents = quiz.submissions
      .map(sub => ({
        studentId: sub.studentId._id,
        studentName: sub.studentId.name,
        email: sub.studentId.email,
        score: sub.score,
        totalQuestions: quiz.questions.length,
        percentage: ((sub.score / quiz.questions.length) * 100).toFixed(2),
        submittedAt: sub.submittedAt,
        answers: sub.answers
      }))
      .sort((a, b) => b.score - a.score);

    res.json({
      quizTitle: quiz.subject,
      totalSubmissions: allStudents.length,
      students: allStudents
    });
  } catch (err) {
    console.error('Get all students error:', err);
    res.status(500).json({ error: 'Server error', message: err.message });
  }
});

// Send Results (email functionality placeholder)
router.post('/:id/send-results', authMiddleware, async (req, res) => {
  try {
    if (req.userRole !== 'Quiz Maker') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const quiz = await Quiz.findById(req.params.id)
      .populate('submissions.studentId', 'name email');
    
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    if (quiz.creatorId.toString() !== req.userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    // TODO: Implement email sending logic here
    console.log('Sending results to students...');
    
    res.json({ message: 'Results sent successfully to all students' });
  } catch (error) {
    console.error('Send results error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;