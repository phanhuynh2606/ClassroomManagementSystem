const Quiz = require('../models/quiz.model');
const Question = require('../models/question.model');
const { shuffleArray } = require('../helper/shufferArray');
const { arraysEqual } = require('../helper/arraysEqual');

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
            visibility: 'draft',
            isActive: true,
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
        const { classroomId } = req.params;
        const quizzes = await Quiz.find({ classroom: classroomId })
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

const getQuizzesForStudent = async (req, res) => {
    try {
        const { classroomId } = req.params;
        const quizzes = await Quiz.find({ classroom: classroomId, isActive: true, deleted: false, visibility: { $in: ['published', 'scheduled'] } })
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
        res.status(200).json({
            success: 'Quiz fetched successfully',
            data: quiz
        });
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
        const quiz = await Quiz.findByIdAndUpdate(req.params.id, { deleted: true, isActive: false, deletedAt: new Date(), deletedBy: req.user._id }, { new: true });
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

const takeQuizById = async (req, res) => {
    try {
        const { quizId } = req.params;
        const studentId = req.user._id;

        const quiz = await Quiz.findById(quizId)
            .populate('createdBy', 'name email')
            .populate('classroom', 'name')
            .populate('questions')
            .lean();

        if (!quiz) {
            return res.status(404).json({ message: 'Quiz not found' });
        }

        if (quiz.visibility !== 'published') {
            return res.status(403).json({ message: 'Quiz is not available for taking' });
        }

        const now = new Date();
        if (quiz.startTime && now < quiz.startTime) {
            return res.status(403).json({ message: 'Quiz has not started yet' });
        }

        if (quiz.endTime && now > quiz.endTime) {
            return res.status(403).json({ message: 'Quiz has ended' });
        }

        const studentSubmissions = quiz.submissions.filter(
            sub => sub.student.toString() === studentId.toString()
        );

        const completedAttempts = studentSubmissions.filter(
            sub => sub.status === 'completed'
        ).length;

        if (completedAttempts >= quiz.maxAttempts) {
            return res.status(403).json({
                message: `You have reached the maximum number of attempts (${quiz.maxAttempts})`
            });
        }

        let currentSubmission = studentSubmissions.find(
            sub => sub.status === 'in-progress'
        );

        let shuffledQuestions = [...quiz.questions];

        if (!currentSubmission) {
            if (quiz.shuffleQuestions) {
                shuffledQuestions = shuffleArray(shuffledQuestions);
            }

            if (quiz.shuffleOptions) {
                shuffledQuestions = shuffledQuestions.map(q => ({
                    ...q,
                    options: shuffleArray([...q.options])
                }));
            }

            const newSubmission = {
                student: studentId,
                answers: [],
                startedAt: now,
                attempt: completedAttempts + 1,
                status: 'in-progress',
                questionsOrder: shuffledQuestions.map(q => q._id)
            };

            quiz.submissions.push(newSubmission);
            await Quiz.findByIdAndUpdate(quiz._id, { submissions: quiz.submissions });

            currentSubmission = newSubmission;
        }

        const sanitizedQuestions = shuffledQuestions.map(q => ({
            _id: q._id,
            content: q.content,
            options: q.options.map(opt => ({
                _id: opt._id,
                content: opt.content,
                image: opt.image
            }))
        }));

        res.status(200).json({
            success: true,
            message: currentSubmission.attempt > 1 ? 'Resuming quiz' : 'Quiz started successfully',
            data: {
                ...quiz,
                questions: sanitizedQuestions,
                currentSubmission,
                attemptNumber: currentSubmission.attempt
            }
        });
    } catch (error) {
        console.error('Error taking quiz:', error);
        res.status(500).json({
            message: 'Error starting quiz',
            error: error.message
        });
    }
};

const submitQuiz = async (req, res) => {
    try {
        const { quizId: quizId } = req.params;
        const { answers } = req.body;
        const studentId = req.user._id;

        const quiz = await Quiz.findById(quizId).populate('questions');
        if (!quiz) {
            return res.status(404).json({ message: 'Quiz not found' });
        }

        const submission = quiz.submissions.find(
            sub => sub.student.toString() === studentId.toString() && sub.status === 'in-progress'
        );

        if (!submission) {
            return res.status(404).json({ message: 'No active quiz session found' });
        }

        const now = new Date();
        const timeLimit = new Date(submission.startedAt.getTime() + (quiz.duration * 60 * 1000));

        if (now > timeLimit) {
            submission.status = 'abandoned';
            await quiz.save();
            return res.status(400).json({ message: 'Quiz time has expired' });
        }

        let totalScore = 0;
        const processedAnswers = [];
        const bulkUpdates = [];

        for (const answer of answers) {
            if (!submission.questionsOrder.includes(answer.questionId)) continue;

            const question = quiz.questions.find(q => q._id.toString() === answer.questionId);
            if (!question) continue;

            const correctOptionContent = question.options.find(opt => opt.isCorrect)?.content.trim() || '';

            const isCorrect = answer.selectedOption.trim() === correctOptionContent;

            if (isCorrect) {
                totalScore += question.points || 1;
            }

            processedAnswers.push({
                question: question._id,
                selectedOption: answer.selectedOption,
                isCorrect
            });

            bulkUpdates.push({
                updateOne: {
                    filter: { _id: question._id },
                    update: {
                        $inc: {
                            'statistics.totalAttempts': 1,
                            ...(isCorrect && { 'statistics.correctAttempts': 1 })
                        }
                    }
                }
            });
        }

        submission.answers = processedAnswers;
        submission.score = totalScore;
        submission.submittedAt = now;
        submission.status = 'completed';

        await Quiz.findByIdAndUpdate(quiz._id, { submissions: quiz.submissions });
        if (bulkUpdates.length) {
            await Question.bulkWrite(bulkUpdates);
        }

        const totalPossibleScore = quiz.questions.reduce((sum, q) => sum + (q.points || 1), 0);
        const percentage = totalPossibleScore > 0 ? (totalScore / totalPossibleScore) * 100 : 0;
        const passed = percentage >= quiz.passingScore;

        const response = {
            success: true,
            message: 'Quiz submitted successfully',
            data: {
                submissionId: submission._id,
                score: totalScore,
                totalPossibleScore,
                percentage: Math.round(percentage * 100) / 100,
                passed,
                passingScore: quiz.passingScore,
                submittedAt: submission.submittedAt,
                timeTaken: Math.round((submission.submittedAt - submission.startedAt) / 1000)
            }
        };

        if (quiz.showResults) {
            response.data.results = processedAnswers;
        }

        res.status(200).json(response);
    } catch (error) {
        console.error('Error submitting quiz:', error);
        res.status(500).json({
            message: 'Error submitting quiz',
            error: error.message
        });
    }
};


module.exports = {
    createQuiz,
    getQuizzesForStudent,
    getQuizzes,
    getQuizById,
    updateQuiz,
    deleteQuiz,
    changeQuizVisibility,
    takeQuizById,
    submitQuiz
};
