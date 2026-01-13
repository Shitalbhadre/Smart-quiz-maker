const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
    quizId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    answers: [{
        questionIndex: Number,
        selectedOption: String
    }],
    score: { type: Number, default: 0 },
    totalQuestions: { type: Number, default: 0 }, // Added this field
    submittedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Answer', answerSchema);