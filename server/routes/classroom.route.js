const express = require('express');
const { protect, authorize } = require('../middleware/auth.middleware');
const { backgroundImageUpload } = require('../middleware/upload.middleware');
const ctrls = require('../controllers/classroom.controller');
const ctrlsTeacher = require('../controllers/teacher.classroom.controller');
const classStatisticsCtrl = require('../controllers/class.statistics.controller');
const router = express.Router();

// Admin routes
router.get('/admin', protect, authorize('admin'), ctrls.getAllClassrooms);
router.delete('/admin/:classroomId', protect, authorize('admin'), ctrls.deleteClassroom);
router.post('/admin', protect, authorize('admin'), ctrls.createClassroom);
router.put('/admin/:classroomId', protect, authorize('admin'), ctrls.updateClassroom);

// Admin approval routes
router.put('/admin/:classroomId/approve', protect, authorize('admin'), ctrls.approveClassroom);
router.put('/admin/:classroomId/reject', protect, authorize('admin'), ctrls.rejectClassroom);
router.put('/admin/:classroomId/approve-deletion', protect, authorize('admin'), ctrls.approveDeletionRequest);
router.put('/admin/:classroomId/reject-deletion', protect, authorize('admin'), ctrls.rejectDeletionRequest);
router.put('/admin/:classroomId/approve-edit', protect, authorize('admin'), ctrls.approveEditRequest);
router.put('/admin/:classroomId/reject-edit', protect, authorize('admin'), ctrls.rejectEditRequest);

// Teacher routes
router.get('/teacher', protect, authorize('teacher'), ctrls.getTeacherClassrooms);
router.delete('/teacher/:classroomId', protect, authorize('teacher'), ctrls.deleteClassroom);
router.post('/teacher/', protect, authorize('teacher'), ctrls.createClassroom);
router.put('/teacher/:classroomId', protect, authorize('teacher'), ctrls.updateClassroom);
router.get('/teacher/:classroomId/students', protect, authorize('teacher'), ctrls.getClassroomStudents);

// Teacher classroom appearance routes
router.get('/teacher/:classroomId/appearance', protect, authorize('teacher'), ctrlsTeacher.getClassroomAppearance);
router.post('/teacher/:classroomId/appearance', protect, authorize('teacher'), ctrlsTeacher.updateClassroomAppearance);
router.post('/teacher/:classroomId/appearance/reset', protect, authorize('teacher'), ctrlsTeacher.resetClassroomAppearance);
router.get('/teacher/themes', protect, authorize('teacher'), ctrlsTeacher.getAvailableThemes);
router.post('/teacher/background/upload', protect, authorize('teacher'), backgroundImageUpload.single('background'), ctrlsTeacher.uploadBackgroundImage);

// Student routes
router.get('/student', protect, authorize('student'), ctrls.getStudentClassrooms);
router.post('/student/join', protect, authorize('student'), ctrls.joinClassroom);
router.delete('/student/:classroomId/leave', protect, authorize('student'), ctrls.leaveClassroom);

// Ban student routes
router.post('/:classroomId/ban/:studentId', protect, authorize('teacher', 'admin'), ctrls.banStudent);
router.post('/:classroomId/unban/:studentId', protect, authorize('teacher', 'admin'), ctrls.unbanStudent);
router.get('/:classroomId/banned-students', protect, authorize('teacher', 'admin'), ctrls.getBannedStudents);

// Shared routes (with role-based access control in controller)
router.get('/:classroomId/students', protect, authorize('teacher', 'admin'), ctrls.getClassroomStudents);
router.get('/:classroomId/detail', protect, authorize('student', 'teacher', 'admin'), ctrls.getClassroomDetail);
router.get('/:classroomId/materials', protect, authorize('student', 'teacher', 'admin'), ctrls.getClassroomMaterials);

// Statistics: Bảng điểm & Thống kê lớp
router.get('/:classroomId/grades-statistics', protect, authorize('teacher', 'admin'), classStatisticsCtrl.getGradesStatistics);

module.exports = router;