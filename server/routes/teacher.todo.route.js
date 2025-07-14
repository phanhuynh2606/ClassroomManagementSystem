const express = require('express');
const { protect, authorize } = require('../middleware/auth.middleware');
const ctrls = require('../controllers/teacher.todo.controller');

const router = express.Router();

// Teacher todos routes
router.get('/todos', 
  protect, 
  authorize('teacher', 'admin'),
  ctrls.getTeacherTodos
);

router.get('/assignments-needing-grading', 
  protect, 
  authorize('teacher', 'admin'),
  ctrls.getAssignmentsNeedingGrading
);

router.get('/unanswered-questions', 
  protect, 
  authorize('teacher', 'admin'),
  ctrls.getUnansweredQuestionsEndpoint
);

module.exports = router; 