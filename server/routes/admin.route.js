
const express = require('express');
const { protect, authorize } = require('../middleware/auth.middleware');
const ctrls = require('../controllers/admin.controller');
const questionCtrl = require('../controllers/question.cotroller');

const router = express.Router();
router.get('/users', protect, authorize('admin'), ctrls.getUsersByRole);
router.put('/users/verified/:userId', protect, authorize('admin'), ctrls.verifyTeacher);
router.put('/users/:userId', protect, authorize('admin'), ctrls.updateUser);

// questions routes
router.get('/questions', protect, authorize('admin'), questionCtrl.getQuestions);
router.delete('/questions/:id', protect, authorize('admin'), questionCtrl.deleteQuestion);
router.get('/questions/:id', protect, authorize('admin'), questionCtrl.getQuestionById);
module.exports = router; 