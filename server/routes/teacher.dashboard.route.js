const express = require('express');
const router = express.Router();
const ctrls = require('../controllers/teacher.dashboard.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

router.get('/', protect, authorize('teacher'), ctrls.getTeacherDashboard);


module.exports = router;