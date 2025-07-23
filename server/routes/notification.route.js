const express = require('express');
const router = express.Router();
const {
  getNotifications,
  createNotification,
  getAllNotifications,
  deleteNotification,
  getClassroomStudents
} = require('../controllers/notification.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

// Routes accessible by all authenticated users
router.use(protect); // All routes require authentication

// Get notifications for current user
router.get('/my-notifications', getNotifications);

// Create notification (Teachers and Admins)
router.post('/', authorize('teacher', 'admin'), createNotification);

// Get classroom students for notification creation (Teachers and Admins)
router.get('/classroom/:classroomId/students', authorize('teacher', 'admin'), getClassroomStudents);

// Admin only routes
router.get('/all', authorize('admin'), getAllNotifications);
router.delete('/:notificationId', authorize('admin', 'teacher'), deleteNotification);

module.exports = router; 