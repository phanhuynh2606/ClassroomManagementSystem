const express = require('express');
const { protect, authorize } = require('../middleware/auth.middleware');
const quizCtrl = require('../controllers/quizzes.controller');
const router = express.Router();

router.post('/', protect, authorize('teacher'), quizCtrl.createQuiz);
router.get('/', protect, authorize('teacher' || 'student'), quizCtrl.getQuizzes);
router.get('/:id', protect, authorize('teacher' || 'student'), quizCtrl.getQuizById);
router.patch('/:id', protect, authorize('teacher'), quizCtrl.updateQuiz);
router.delete('/:id', protect, authorize('teacher'), quizCtrl.deleteQuiz);

module.exports = router;