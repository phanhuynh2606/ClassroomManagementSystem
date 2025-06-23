const router = require('express').Router();
const { protect, authorize } = require('../middleware/auth.middleware');
const ctrls = require('../controllers/material.controller');
const { uploadMaterial } = require('../middleware/upload.middleware');

router.post('/teacher/:classroomId', protect, authorize('teacher'), uploadMaterial.single('material'), ctrls.uploadMaterial);
router.delete('/teacher/:classroomId/:materialId', protect, authorize('teacher'), ctrls.deleteMaterial);

module.exports = router;