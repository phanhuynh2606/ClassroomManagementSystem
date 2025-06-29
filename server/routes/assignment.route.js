const express = require('express');
const { protect, authorize } = require('../middleware/auth.middleware');
const { assignmentUpload, submissionUpload } = require('../middleware/upload.middleware');
const { resolveClassroomId, checkScheduledAssignments, checkSingleAssignment } = require('../middleware/assignment.middleware');
const ctrls = require('../controllers/assignment.controller');
const router = express.Router();

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

router.put('/:assignmentId/submissions/:submissionId/grade', 
  protect, 
  authorize('teacher', 'admin'), 
  resolveClassroomId,  // For future file upload needs in grading
  ctrls.gradeSubmission
);

module.exports = router; 