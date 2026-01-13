const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
    quizId: mongoose.Schema.Types.ObjectId,
    questionText: String,
    options: [String],
    correctAnswer: Number
});

module.exports = mongoose.model('Question', questionSchema);
