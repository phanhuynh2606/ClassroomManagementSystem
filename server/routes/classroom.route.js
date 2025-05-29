const express = require('express');
const { protect, authorize } = require('../middleware/auth.middleware');
const ctrls = require('../controllers/classroom.controller');
const router = express.Router();

router.get('/admin', protect,authorize('admin'), ctrls.getAllClassrooms);
router.delete('/admin/:classroomId',protect,authorize('admin'), ctrls.deleteClassroom);
router.post('/admin',protect,authorize('admin'), ctrls.createClassroom);
router.put('/admin/:classroomId',protect,authorize('admin'), ctrls.updateClassroom);


router.get('/teacher', protect,authorize('teacher'), ctrls.getTeacherClassrooms);
router.delete('/teacher/:classroomId',protect,authorize('teacher'), ctrls.deleteClassroom);
router.post('/teacher/',protect,authorize('teacher'), ctrls.createClassroom);
router.put('/teacher/:classroomId',protect,authorize('teacher'), ctrls.updateClassroom);
module.exports = router;