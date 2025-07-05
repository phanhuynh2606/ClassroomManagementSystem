const router = require('express').Router();
const { protect, authorize } = require('../middleware/auth.middleware');
const { materialUpload } = require('../middleware/upload.middleware');
const ctrls = require('../controllers/material.controller'); 
 
router.post('/teacher/:classroomId', 
  protect, 
  authorize('teacher'),
  materialUpload.single('file'),  
  ctrls.uploadMaterial
);
router.get('/classroom/:classroomId', 
  protect, 
  authorize('student', 'teacher'), 
  ctrls.getMaterials
);

router.delete('/teacher/:classroomId/:materialId', 
  protect, 
  authorize('teacher'), 
  ctrls.deleteMaterial
);

module.exports = router;