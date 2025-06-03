const express = require('express');
const { protect, authorize } = require('../middleware/auth.middleware');
const ctrls = require('../controllers/classroom.controller');
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

// Teacher routes
router.get('/teacher', protect, authorize('teacher'), ctrls.getTeacherClassrooms);
router.delete('/teacher/:classroomId', protect, authorize('teacher'), ctrls.deleteClassroom);
router.post('/teacher/', protect, authorize('teacher'), ctrls.createClassroom);
router.put('/teacher/:classroomId', protect, authorize('teacher'), ctrls.updateClassroom);
router.get('/teacher/:classroomId/students', protect, authorize('teacher'), ctrls.getClassroomStudents);

// Student routes
router.get('/student', protect, authorize('student'), ctrls.getStudentClassrooms);
router.post('/student/join', protect, authorize('student'), ctrls.joinClassroom);
router.delete('/student/:classroomId/leave', protect, authorize('student'), ctrls.leaveClassroom);

// Shared routes (with role-based access control in controller)
router.get('/:classroomId/students', protect, authorize(['teacher', 'admin']), ctrls.getClassroomStudents);

module.exports = router;