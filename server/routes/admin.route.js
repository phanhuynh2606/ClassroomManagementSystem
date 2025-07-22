
const express = require('express');
const { protect, authorize } = require('../middleware/auth.middleware');
const ctrls = require('../controllers/admin.controller');
const questionCtrl = require('../controllers/question.cotroller');
const { uploadErrorHandler } = require('../middleware/errorr');
const { questionImageUpload } = require('../middleware/upload.middleware');

const router = express.Router();
router.get('/users', protect, authorize('admin'), ctrls.getUsersByRole);
router.put('/users/verified/:userId', protect, authorize('admin'), ctrls.verifyTeacher);
router.put('/users/:userId', protect, authorize('admin'), ctrls.updateUser);

// questions routes
router.get('/questions', protect, authorize('admin', 'teacher'), questionCtrl.getQuestions);
router.delete('/questions/:id', protect, authorize('admin', 'teacher'), questionCtrl.deleteQuestion);
router.get('/questions/:id', protect, authorize('admin', 'teacher'), questionCtrl.getQuestionById);
router.patch('/questions/:id', protect, authorize('admin', 'teacher'), questionCtrl.updateQuestion);
router.post('/questions/image', protect, authorize('admin', 'teacher'), uploadErrorHandler, questionImageUpload.single('image'), questionCtrl.uploadQuestionImage);
router.post('/questions-manual', protect, authorize('admin', 'teacher'), questionCtrl.createQuestionManual);
router.post('/questions-excel', protect, authorize('admin', 'teacher'), questionCtrl.createQuestionFromExcel);
router.post('/questions-ai', protect, authorize('admin', 'teacher'), questionCtrl.createQuestionFromAI);
router.get('/download-excel', protect, authorize('admin', 'teacher'), questionCtrl.downLoadTemplateExcel);
router.get('/random-questions', protect, authorize('admin', 'teacher'), questionCtrl.randomQuestion);


module.exports = router; 