const Quiz = require('../models/quiz.model');
const Question = require('../models/question.model');
const { shuffleArray } = require('../helper/shufferArray');
const { arraysEqual } = require('../helper/arraysEqual');
const cron = require('node-cron');
const Stream = require('../models/stream.model');

const Classroom = require('../models/classroom.model');
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

        let visibility = 'draft';
        const now = new Date();

        if (now < new Date(startTime)) {
            visibility = 'scheduled';
        } else if (now >= new Date(startTime) && now <= new Date(endTime)) {
            visibility = 'published';
        } else {
            visibility = 'draft';
        }

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
            visibility: visibility,
            isActive: true,
            submissions: [],
            createdAt: new Date(),
        });

        const existingQuiz = await Quiz.findOne({ title, classroom });
        if (existingQuiz) {
            return res.status(400).json({
                message: 'Quiz with this title already exists in the selected classroom'
            });
        }
        await quiz.save();
        if (visibility === 'published') {
            await Stream.create({
                title: quiz.title,
                content: quiz.description,
                type: 'quiz',
                classroom: quiz.classroom,
                author: createdBy,
                resourceId: quiz._id,
                resourceModel: 'Quiz',
                dueDate: quiz.endTime,
                totalPoints: quiz.questions.reduce((sum, q) => sum + (q.points || 1), 0),
            })
        }
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
        const studentId = req.user._id;
        const quizzes = await Quiz.find({ classroom: classroomId, isActive: true, deleted: false, visibility: { $in: ['published', 'scheduled'] } })
            .populate('createdBy', 'name email')
            .populate('classroom', 'name').populate('questions').
            populate('submissions.student')
            .populate('submissions.answers.question')
            .sort({ createdAt: -1 });

        const data = quizzes.map(quiz => {
            quiz = quiz.toObject();
            quiz.submissions = quiz.submissions.filter(
                sub => sub.student && sub.student._id.toString() === studentId.toString()
            );
            return quiz;
        });

        res.status(200).json({
            success: 'Quizzes fetched successfully',
            data: data
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
        const quiz = await Quiz.findById(req.params._id)
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
        const usagePromises = [];

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

            usagePromises.push(
                Question.findById(question._id).then(q =>
                    q.addUsage(quiz._id, quiz.classroom)
                )
            );
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
const autoPublishQuizzes = () => {
    cron.schedule('* * * * *', async () => {
        try {
            const now = new Date();

            const quizzesToPublish = await Quiz.find({
                visibility: 'scheduled',
                startTime: { $lte: now },
                isActive: true,
                deleted: false
            });

            if (quizzesToPublish.length > 0) {
                console.log(`[${now.toISOString()}] Found ${quizzesToPublish.length} quiz(es) to auto-publish`);

                const bulkOps = quizzesToPublish.map(quiz => ({
                    updateOne: {
                        filter: { _id: quiz._id },
                        update: {
                            visibility: 'published',
                            publishedAt: now
                        }
                    }
                }));

                const result = await Quiz.bulkWrite(bulkOps);

                console.log(`[${now.toISOString()}] Auto-published ${result.modifiedCount} quiz(es):`,
                    quizzesToPublish.map(q => `"${q.title}" (ID: ${q._id})`));

                await Promise.all(
                    quizzesToPublish.map(async quiz => {
                        try {
                            await Stream.create({
                                title: quiz.title,
                                content: quiz.description,
                                type: 'quiz',
                                classroom: quiz.classroom,
                                author: quiz.createdBy,
                                resourceId: quiz._id,
                                resourceModel: 'Quiz',
                                dueDate: quiz.endTime,
                                totalPoints: quiz.questions.reduce((sum, q) => sum + (q.points || 1), 0),
                            });
                            console.log(`Created stream for quiz "${quiz.title}"`);
                        } catch (err) {
                            console.error(`Failed to create stream for quiz "${quiz.title}":`, err.message);
                        }
                    })
                );
            }

            const expiredQuizzes = await Quiz.find({
                visibility: 'published',
                endTime: { $lt: now },
                isActive: true,
                deleted: false
            });

            if (expiredQuizzes.length > 0) {
                console.log(`[${now.toISOString()}] Found ${expiredQuizzes.length} expired quiz(es) to archive`);

                const archiveBulkOps = expiredQuizzes.map(quiz => ({
                    updateOne: {
                        filter: { _id: quiz._id },
                        update: {
                            isArchived: true,
                            archivedAt: now
                        }
                    }
                }));

                const archiveResult = await Quiz.bulkWrite(archiveBulkOps);
                console.log(`[${now.toISOString()}] Archived ${archiveResult.modifiedCount} expired quiz(es)`);
            }

        } catch (error) {
            console.error('[Auto-publish Quiz Error]:', error.message);
        }
    });

    console.log('🤖 Quiz auto-publish cron job started - running every minute');
};

const viewResults = async (req, res) => {
    try {
        const { quizId } = req.params;
        const studentId = req.user._id;

        const quiz = await Quiz.findById(quizId)
            .populate('submissions.student', ' name email')
            .populate('submissions.answers.question');
        if (!quiz) {
            return res.status(404).json({ message: 'Quiz not found' });
        }

        const submissions = quiz.submissions
            .filter(sub => sub.student._id.toString() === studentId.toString() && sub.status === 'completed')
            .map(submission => {
                const totalPossibleScore = quiz.questions.reduce((sum, q) => sum + (q.points || 1), 0);
                const percentage = totalPossibleScore > 0 ? (submission.score / totalPossibleScore) * 100 : 0;

                return {
                    submissionId: submission._id,
                    score: submission.score,
                    totalPossibleScore,
                    percentage: Math.round(percentage * 100) / 100,
                    passed: percentage >= quiz.passingScore,
                    passingScore: quiz.passingScore,
                    submittedAt: submission.submittedAt,
                    timeTaken: Math.round((submission.submittedAt - submission.startedAt) / 1000),
                    answers: submission.answers.map(ans => ({
                        questionId: ans.question._id.toString(),
                        questionContent: ans.question.content,
                        questionOptions: ans.question.options,
                        selectedOption: ans.selectedOption,
                        isCorrect: ans.isCorrect
                    }))

                };
            });

        if (!submissions.length) {
            return res.status(200).json({
                success: true,
                message: 'No completed submissions found for this quiz',
                data: []
            });
        }

        res.status(200).json({
            success: true,
            message: 'Quiz results fetched successfully',
            data: submissions
        });
    }
    catch (error) {
        console.error('Error viewing quiz results:', error);
        res.status(500).json({
            message: 'Error fetching quiz results',
            error: error.message
        });
    }
}
const getQuizzesByStudent = async (req, res) => {
  try {
    const studentId = req.user._id;

    const classrooms = await Classroom.find({ 'students.student': studentId }).select('_id');
    const classroomIds = classrooms.map(c => c._id);

    if (classroomIds.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'Student is not in any classrooms',
        data: [],
        total: 0,
        completedCount: 0,
        notCompletedCount: 0,
        passedCount: 0
      });
    }

    const quizzes = await Quiz.find({
      classroom: { $in: classroomIds },
      deleted: false,
      visibility: 'published',
      isActive: true
    }).populate('classroom', 'name').sort({ startTime: -1 });

    let completedCount = 0;
    let notCompletedCount = 0;
    let passedCount = 0;

    const result = quizzes.map((quiz) => {
      const submission = quiz.submissions.find(
        (s) => s.student.toString() === studentId.toString()
      );

      if (submission) {
        completedCount++;
        if (submission.score >= quiz.passingScore) passedCount++;
      } else {
        notCompletedCount++;
      }

      return {
        _id: quiz._id,
        title: quiz.title,
        description: quiz.description,
        category: quiz.category,
        classroom: quiz.classroom,
        startTime: quiz.startTime,
        endTime: quiz.endTime,
        duration: quiz.duration,
        maxAttempts: quiz.maxAttempts,
        totalQuestions: quiz.questions?.length || 0,
        passingScore: quiz.passingScore,
        submission: submission ? {
          status: submission.status,
          score: submission.score,
          attempt: submission.attempt,
          startedAt: submission.startedAt,
          submittedAt: submission.submittedAt
        } : null
      };
    });

    res.status(200).json({
      success: true,
      message: 'Quizzes for current student retrieved successfully',
      data: result,
      total: result.length,
      completedCount,
      notCompletedCount,
      passedCount
    });

  } catch (error) {
    console.error('getQuizzesByStudent error:', error); 
    res.status(500).json({
      success: false,
      message: 'Server error while getting quizzes',
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
    submitQuiz,
    autoPublishQuizzes,
    viewResults,
    getQuizzesByStudent
};
