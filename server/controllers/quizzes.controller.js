const Quiz = require('../models/quiz.model');

const createQuiz = async (req, res) => {
    try {
        const {
            title,
            category,
            description,
            classroom,
            duration,
            passingScore,
            maxAttempts,
            startTime,
            endTime,
            questions = [],
            allowReview,
            showResults,
            shuffleQuestions,
            shuffleOptions,
            fullScreen,
            copyAllowed,
            checkTab,
            randomizeQuestions,
            visibility = 'draft',
            isActive = true,
        } = req.body;

        const createdBy = req.user._id;

        const quiz = new Quiz({
            title,
            category,
            description,
            classroom,
            createdBy: createdBy,
            duration,
            passingScore,
            maxAttempts,
            startTime,
            endTime,
            questions,
            allowReview,
            showResults,
            shuffleQuestions,
            shuffleOptions,
            fullScreen,
            copyAllowed,
            checkTab,
            randomizeQuestions,
            visibility,
            isActive,
            submissions: [],
            createdAt: new Date(),
        });

        await quiz.save();

        res.status(201).json({
            success: 'Quiz created successfully',
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
            .populate('classroom', 'name').populate('questions').
            populate('submissions.student')
            .populate('submissions.answers.question')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: 'Quizzes fetched successfully',
            data: quizzes
        });
    } catch (error) {
        res.status(500).json({
            message: 'Lỗi khi lấy danh sách quiz',
            error: error.message
        });
    }
};

const getQuizById = async (req, res) => {
    try {
        const quiz = await Quiz.findById(req.params.id)
            .populate('createdBy', 'name email')
            .populate('classroom', 'name')
            .populate('questions')
            .populate('submissions.student')
            .populate('submissions.answers.question');
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
        res.status(200).json({ success: 'Quiz deleted successfully', quiz });
    } catch (error) {
        res.status(400).json({ message: 'Error deleting quiz', error: error.message });
    }
}

const changeQuizVisibility = async (req, res) => {
    try {
        const { visibility } = req.body;

        const validVisibilities = ['draft', 'published', 'scheduled'];
        if (!validVisibilities.includes(visibility)) {
            return res.status(400).json({ message: `Invalid visibility value. Must be one of: ${validVisibilities.join(', ')}` });
        }

        const quiz = await Quiz.findByIdAndUpdate(
            req.params.id,
            { visibility },
            { new: true, runValidators: true }
        );

        if (!quiz) {
            return res.status(404).json({ message: 'Quiz not found' });
        }

        res.status(200).json({ success: true, message: 'Quiz visibility updated successfully', quiz });
    } catch (error) {
        console.error('Error updating quiz visibility:', error);
        res.status(400).json({ message: 'Error updating quiz visibility', error: error.message });
    }
};

module.exports = {
    createQuiz,
    getQuizzes,
    getQuizById,
    updateQuiz,
    deleteQuiz,
    changeQuizVisibility
};
