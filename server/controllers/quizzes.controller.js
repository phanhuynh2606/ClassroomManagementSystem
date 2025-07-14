const Quiz = require('../models/quiz.model');

const createQuiz = async (req, res) => {
    try {
        const {
            title,
            category,
            description,
            classroom,
            createdBy,
            duration,
            passingScore,
            maxAttempts,
            startTime,
            endTime,
            questions = [],
            allowReview = true,
            showResults = true,
            randomizeQuestions = false,
            visibility = 'draft',
            publishDate,
            tags = []
        } = req.body;

        const quiz = new Quiz({
            title,
            category,
            description,
            classroom,
            createdBy,
            duration,
            passingScore,
            maxAttempts,
            startTime,
            endTime,
            questions,
            allowReview,
            showResults,
            randomizeQuestions,
            visibility,
            publishDate,
            tags
        });

        await quiz.save();

        res.status(201).json({
            message: 'Quiz created successfully',
            quiz
        });
    } catch (error) {
        res.status(400).json({
            message: 'Error creating quiz',
            error: error.message
        });
    }
};

const getQuizzes = async (req, res) => {
    try {
        const quizzes = await Quiz.find({ isActive: true, deleted: false })
            .populate('createdBy', 'name email')
            .populate('classroom', 'name').populate('questions')
            .sort({ createdAt: -1 });

        res.status(200).json(quizzes);
    } catch (error) {
        res.status(500).json({
            message: 'Lỗi khi lấy danh sách quiz',
            error: error.message
        });
    }
};

const getQuizById = async (req, res) => {
    try {
        const quiz = await Quiz.findById(req.params.id).populate('createdBy', 'name email').populate('classroom', 'name').populate('questions');
        if (!quiz) {
            return res.status(404).json({ message: 'Quiz not found' });
        }
        res.status(200).json(quiz);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching quiz', error: error.message });
    }
}

const updateQuiz = async (req, res) => {
    try {
        const quiz = await Quiz.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!quiz) {
            return res.status(404).json({ message: 'Quiz not found' });
        }
        res.status(200).json({ message: 'Quiz updated successfully', quiz });
    } catch (error) {
        res.status(400).json({ message: 'Error updating quiz', error: error.message });
    }
}

const deleteQuiz = async (req, res) => {
    try {
        const quiz = await Quiz.findByIdAndUpdate(req.params.id, { deleted: true, deletedAt: new Date(), deletedBy: req.user._id }, { new: true });
        if (!quiz) {
            return res.status(404).json({ message: 'Quiz not found' });
        }
        res.status(200).json({ message: 'Quiz deleted successfully', quiz });
    } catch (error) {
        res.status(400).json({ message: 'Error deleting quiz', error: error.message });
    }
}
module.exports = {
    createQuiz,
    getQuizzes,
    getQuizById,
    updateQuiz,
    deleteQuiz
};
