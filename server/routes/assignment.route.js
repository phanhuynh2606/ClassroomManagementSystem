const express = require('express');
const { protect, authorize } = require('../middleware/auth.middleware');
const { assignmentUpload, submissionUpload } = require('../middleware/upload.middleware');
const { resolveClassroomId, checkScheduledAssignments, checkSingleAssignment } = require('../middleware/assignment.middleware');
const ctrls = require('../controllers/assignment.controller');
const router = express.Router();
router.get('/by-student', protect, 
  authorize('student'), 
  ctrls.getAssignmentsByStudent);
// Assignment CRUD operations
router.post('/classroom/:classroomId', 
  protect, 
  authorize('teacher', 'admin'), 
  assignmentUpload.array('attachments', 5), 
  ctrls.createAssignment
);

router.get('/classroom/:classroomId', 
  protect, 
  authorize('student', 'teacher', 'admin'), 
  checkScheduledAssignments, // Check and auto-publish scheduled assignments
  ctrls.getClassroomAssignments
);

router.get('/:assignmentId', 
  protect, 
  authorize('student', 'teacher', 'admin'), 
  checkSingleAssignment, // Check this specific assignment
  ctrls.getAssignmentDetail
);

router.put('/:assignmentId', 
  protect, 
  authorize('teacher', 'admin'), 
  assignmentUpload.array('attachments', 5), 
  ctrls.updateAssignment
);

router.delete('/:assignmentId', 
  protect, 
  authorize('teacher', 'admin'), 
  ctrls.deleteAssignment
);

// Submission operations
router.post('/:assignmentId/submit', 
  protect, 
  authorize('student'), 
  resolveClassroomId,  // Resolve classroomId from assignmentId first
  submissionUpload.array('attachments', 10), 
  ctrls.submitAssignment
);

router.get('/:assignmentId/submissions', 
  protect, 
  authorize('teacher', 'admin'), 
  ctrls.getAssignmentSubmissions
);

// Grade submission
router.put('/:assignmentId/submissions/:submissionId/grade', 
  protect, 
  authorize('teacher', 'admin'), 
  resolveClassroomId,  // For future file upload needs in grading
  ctrls.gradeSubmission
);

// Auto-grade missing submissions when overdue
router.post('/:assignmentId/auto-grade-missing', 
  protect, 
  authorize('teacher', 'admin'), 
  ctrls.autoGradeMissingSubmissions
);

// Bulk grade missing submissions
router.post('/:assignmentId/bulk-grade-missing', 
  protect, 
  authorize('teacher', 'admin'), 
  ctrls.bulkGradeMissingSubmissions
);

// Send reminder emails to students who haven't submitted
router.post('/:assignmentId/send-reminder', 
  protect, 
  authorize('teacher', 'admin'), 
  ctrls.sendReminderEmails
);

module.exports = router; 