const Question = require('../models/question.model');
const User = require('../models/user.model');
const Classroom = require('../models/classroom.model');
const Quiz = require('../models/quiz.model');
const XLSX = require('xlsx');
const path = require('path');
const { log } = require('console');

const getQuestions = async (req, res) => {
    try {
        const { page, limit, search = '', difficulty, category, status } = req.query;

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

const getQuestionById = async (req, res) => {
    try {
        const { id } = req.params;
        const question = await Question.findById(id)
            .populate('createdBy', '_id email password role image fullName isActive')
            .populate('lastUpdatedBy', '_id email password role image fullName isActive')
            .populate('usageHistory.quiz')
            .populate('usageHistory.classroom')
            .populate('usedInClassrooms')
            .populate('deletedBy');

        if (!question) {
            return res.status(404).json({
                success: false,
                message: 'Question not found'
            });
        }

        res.status(200).json({
            success: true,
            data: question
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
}

const deleteQuestion = async (req, res) => {
    try {
        const { id } = req.params;
        const question = await Question.findByIdAndDelete(id);
        if (!question) {
            return res.status(404).json({
                success: false,
                message: 'Question not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Question deleted successfully'
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

const updateQuestion = async (req, res) => {
    try {
        const { id } = req.params;
        const { content, image, options, subjectCode, difficulty, category, status, explanation } = req.body;

        const question = await Question.findByIdAndUpdate(id, {
            content,
            subjectCode,
            difficulty,
            category,
            status,
            options,
            explanation,
            image: image || null,
            lastUpdatedAt: new Date(),
            lastUpdatedBy: req.user._id
        }, { new: true });

        if (!question) {
            return res.status(404).json({
                success: false,
                message: 'Question not found'
            });
        }

        res.status(200).json({
            success: true,
            data: question
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

const uploadQuestionImage = async (req, res, next) => {
    try {
        console.log('req.file', req.file);

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }
        const imageUrl = req.file?.path;

        res.json({
            success: true,
            imageUrl,
            message: 'Question image updated successfully'
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Server error' });
    }
};

const createQuestionManual = async (req, res) => {
    try {
        const {
            content,
            image,
            options,
            subjectCode,
            difficulty,
            category,
            status,
            explanation,
        } = req.body;

        const newQuestion = new Question({
            content,
            image: image || null,
            options,
            subjectCode,
            difficulty,
            category,
            status,
            explanation,
            explanationImage: '',
            cooldownPeriod: null,
            points: 1,
            statistics: {
                totalAttempts: 0,
                correctAttempts: 0
            },
            usageHistory: [],
            usedInClassrooms: [],
            deletedBy: null,
            lastUpdatedAt: new Date(),
            lastUsedAt: null,
            usageCount: 0,
            lastUpdatedBy: req.user?._id || null,
            createdAt: new Date(),
            createdBy: req.user?._id || null,
            isAI: false,
            isActive: true,
            isArchived: false,
            deletedAt: null,
            deleted: false
        });

        await newQuestion.save();

        res.status(201).json({
            success: true,
            data: newQuestion
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
}

const downLoadTemplateExcel = (req, res) => {
    try {
        const templateData = [{
            'Content': 'What is the capital of France?',
            'Option A': 'Paris',
            'Option B': 'London',
            'Option C': 'Berlin',
            'Option D': 'Madrid',
            'Correct Answer': 'Paris',
            'Explanation': 'Paris is the capital city of France, known for its art, fashion, and culture.',
            'Subject Code': 'HISTORY',
            'Difficulty': 'easy',
            'Category': 'PT1',
        }];

        const worksheet = XLSX.utils.json_to_sheet(templateData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Template');

        const buffer = XLSX.write(workbook, {
            bookType: 'xlsx',
            type: 'buffer'
        });

        res.setHeader('Content-Disposition', 'attachment; filename="templateQuestion.xlsx"');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.end(buffer);
    } catch (error) {
        console.error('Lỗi tạo file template:', error);
        res.status(500).send('Lỗi server');
    }
};

const createQuestionFromExcel = async (req, res) => {
    try {
        const data = req.body;

        console.log('Received data:', data);

        if (!Array.isArray(data)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or missing data. Expected an array.'
            });
        }
        const questions = data.map((index) => ({
            content: index.content || '',
            options: index.options || [],
            explanation: index.explanation || '',
            subjectCode: index.subjectCode || '',
            difficulty: index.difficulty || 'Easy',
            category: index.category || '',
            status: 'published',
            image: null,
            explanationImage: '',
            cooldownPeriod: null,
            points: index.points || 1,
            statistics: {
                totalAttempts: 0,
                correctAttempts: 0
            },
            usageHistory: [],
            usedInClassrooms: [],
            deletedBy: null,
            lastUpdatedAt: new Date(),
            lastUsedAt: null,
            usageCount: 0,
            lastUpdatedBy: req.user?._id || null,
            createdAt: new Date(),
            createdBy: req.user?._id || null,
            isAI: false,
            isActive: true,
            isArchived: false,
            deletedAt: null,
            deleted: false
        }));

        await Question.insertMany(questions);

        res.status(201).json({
            success: true,
            message: `${questions.length} questions created successfully`
        });
    } catch (error) {
        console.error('Error creating questions from Excel:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

const createQuestionFromAI = async (req, res) => {
    try {
        const data = req.body;

        if (!Array.isArray(data)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or missing data. Expected an array.'
            });
        }
        const questions = data.map((index) => ({
            content: index.content || '',
            options: index.options || [],
            explanation: index.explanation || '',
            subjectCode: index.subjectCode || '',
            difficulty: index.difficulty || 'Easy',
            category: index.category || '',
            status: 'published',
            image: null,
            explanationImage: '',
            cooldownPeriod: null,
            points: index.points || 1,
            statistics: {
                totalAttempts: 0,
                correctAttempts: 0
            },
            usageHistory: [],
            usedInClassrooms: [],
            deletedBy: null,
            lastUpdatedAt: new Date(),
            lastUsedAt: null,
            usageCount: 0,
            lastUpdatedBy: req.user?._id || null,
            createdAt: new Date(),
            createdBy: req.user?._id || null,
            isAI: true,
            isActive: true,
            isArchived: false,
            deletedAt: null,
            deleted: false
        }));

        await Question.insertMany(questions);

        res.status(201).json({
            success: true,
            message: `${questions.length} questions created successfully`
        });
    } catch (error) {
        console.error('Error creating questions from Excel:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
}



module.exports = {
    getQuestions,
    getQuestionById,
    deleteQuestion,
    updateQuestion,
    uploadQuestionImage,
    createQuestionManual,
    downLoadTemplateExcel,
    createQuestionFromExcel,
    createQuestionFromAI
}