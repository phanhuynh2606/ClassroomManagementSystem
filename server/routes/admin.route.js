
const express = require('express');
const { protect, authorize } = require('../middleware/auth.middleware');
const ctrls = require('../controllers/admin.controller');

const router = express.Router();
router.get('/users', protect,authorize('admin'), ctrls.getUsersByRole);
router.put('/users/verified/:userId', protect,authorize('admin'), ctrls.verifyTeacher);
router.put('/users/:userId', protect,authorize('admin'), ctrls.updateUser);
module.exports = router; 