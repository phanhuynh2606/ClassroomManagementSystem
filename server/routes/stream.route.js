const express = require('express');
const { protect, authorize } = require('../middleware/auth.middleware');
const { attachmentUpload } = require('../middleware/upload.middleware');
const streamController = require('../controllers/stream.controller');
const router = express.Router();

// Get classroom stream (accessible by students, teachers, and admins)
router.get('/classroom/:classroomId', 
  protect, 
  authorize('student', 'teacher', 'admin'), 
  streamController.getClassroomStream
);

// Create announcement/post (teachers and students)
router.post('/classroom/:classroomId/announcements', 
  protect, 
  authorize('teacher', 'student', 'admin'), 
  streamController.createAnnouncement
);

// Update announcement (author only)
router.put('/announcements/:streamId', 
  protect, 
  authorize('teacher'), 
  streamController.updateAnnouncement
);

// Delete announcement (author or admin)
router.delete('/announcements/:streamId', 
  protect, 
  authorize('teacher', 'admin'), 
  streamController.deleteAnnouncement
);

// Pin/Unpin announcement (teachers only)
router.patch('/announcements/:streamId/pin', 
  protect, 
  authorize('teacher', 'admin'), 
  streamController.togglePinAnnouncement
);

// Upload attachment for announcements/posts
router.post('/attachments/upload', 
  protect, 
  authorize('teacher', 'student', 'admin'), 
  attachmentUpload.single('attachment'), 
  streamController.uploadAttachment
);

// Stream item management (general routes for all types)
router.put('/items/:streamId', 
  protect, 
  authorize('teacher', 'student', 'admin'), 
  streamController.updateStreamItem
);

router.delete('/items/:streamId', 
  protect, 
  authorize('teacher', 'student', 'admin'), 
  streamController.deleteStreamItem
);

router.patch('/items/:streamId/pin', 
  protect, 
  authorize('teacher', 'admin'), 
  streamController.togglePinStreamItem
);

// Comment routes
router.post('/items/:streamId/comments', 
  protect, 
  authorize('teacher', 'student', 'admin'), 
  streamController.addComment
);

router.get('/items/:streamId/comments', 
  protect, 
  authorize('teacher', 'student', 'admin'), 
  streamController.getComments
);

router.put('/items/:streamId/comments/:commentId', 
  protect, 
  authorize('teacher', 'student', 'admin'), 
  streamController.updateComment
);

router.delete('/items/:streamId/comments/:commentId', 
  protect, 
  authorize('teacher', 'student', 'admin'), 
  streamController.deleteComment
);

module.exports = router; 