const Question = require('../models/question.model');
const User = require('../models/user.model');
const Classroom = require('../models/classroom.model');
const Quiz = require('../models/quiz.model');

const getQuestions = async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '', difficulty, category, status } = req.query;

        const query = {};

        if (search) {
            query.$or = [
                { content: { $regex: search, $options: 'i' } },
                { subjectCode: { $regex: search, $options: 'i' } }
            ];
        }

        if (difficulty) {
            query.difficulty = difficulty;
        }

        if (category) {
            query.category = category;
        }

        if (status) {
            query.status = status;
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [questions, total] = await Promise.all([
            Question.find(query)
                .skip(skip)
                .limit(parseInt(limit))
                .populate('createdBy', '_id email password role image fullName isActive')
                .populate('lastUpdatedBy', '_id email password role image fullName isActive')
                .populate('usageHistory.quiz')
                .populate('usageHistory.classroom')
                .populate('usedInClassrooms')
                .populate('deletedBy')
                .sort({ createdAt: -1 }),

            Question.countDocuments(query)
        ]);

        res.status(200).json({
            success: true,
            data: questions,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};


module.exports = {
    getQuestions
}