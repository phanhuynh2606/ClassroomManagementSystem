
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
router.get('/questions', protect, authorize('admin'), questionCtrl.getQuestions);
router.delete('/questions/:id', protect, authorize('admin'), questionCtrl.deleteQuestion);
router.get('/questions/:id', protect, authorize('admin'), questionCtrl.getQuestionById);
router.patch('/questions/:id', protect, authorize('admin'), questionCtrl.updateQuestion);
router.post('/questions/image', protect, authorize('admin'), uploadErrorHandler, questionImageUpload.single('image'), questionCtrl.uploadQuestionImage);
router.post('/questions-manual', protect, authorize('admin'), questionCtrl.createQuestionManual);
router.post('/questions-excel', protect, authorize('admin'), questionCtrl.createQuestionFromExcel);
router.post('/questions-ai', protect, authorize('admin'), questionCtrl.createQuestionFromAI);
router.get('/download-excel', protect, authorize('admin'), questionCtrl.downLoadTemplateExcel);

module.exports = router; 