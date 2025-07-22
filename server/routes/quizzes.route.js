const express = require('express');
const { protect, authorize } = require('../middleware/auth.middleware');
const quizCtrl = require('../controllers/quizzes.controller');
const router = express.Router();

router.post('/', protect, authorize('teacher'), quizCtrl.createQuiz);
router.get('/by-student', protect, authorize('student'), quizCtrl.getQuizzesByStudent);
router.get('/:classroomId', protect, authorize('teacher'), quizCtrl.getQuizzes);
router.get('/details/:_id', protect, authorize('teacher'), quizCtrl.getQuizById);
router.patch('/:id', protect, authorize('teacher'), quizCtrl.updateQuiz);
router.delete('/:id', protect, authorize('teacher'), quizCtrl.deleteQuiz);
router.patch('/:id/visibility', protect, authorize('teacher'), quizCtrl.changeQuizVisibility);
router.get('/classroom/:classroomId', protect, authorize('student'), quizCtrl.getQuizzesForStudent);
router.post('/:quizId/submit', protect, authorize('student'), quizCtrl.submitQuiz);
router.get('/:quizId/take', protect, authorize('student'), quizCtrl.takeQuizById);
router.get('/:quizId/results', protect, authorize('student'), quizCtrl.viewResults);

module.exports = router;