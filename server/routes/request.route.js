const express = require('express');
const { protect, authorize } = require('../middleware/auth.middleware');
const ctrls = require('../controllers/request.controller');
const router = express.Router();

// Admin routes
router.get('/', protect, authorize('admin'), ctrls.getAllRequests);
router.get('/pending', protect, authorize('admin'), ctrls.getPendingRequests);
router.post('/:requestId/approve', protect, authorize('admin'), ctrls.approveRequest);
router.post('/:requestId/reject', protect, authorize('admin'), ctrls.rejectRequest);

// Create request route
router.post('/', protect, authorize('teacher', 'admin'), ctrls.createRequest);

// Teacher routes  
router.get('/teacher/:teacherId', protect, authorize('teacher', 'admin'), ctrls.getTeacherRequests);
router.get('/teacher/:teacherId/:classroomId', protect, authorize('teacher', 'admin'), ctrls.getRequestsByTeacherId);
router.delete('/:requestId/cancel', protect, authorize('teacher'), ctrls.cancelRequest);

// Shared routes
router.get('/classroom/:classroomId', protect, authorize('teacher', 'admin'), ctrls.getRequestsByClassroomId);
router.get('/:requestId', protect, authorize('teacher', 'admin'), ctrls.getRequestDetails);

module.exports = router;