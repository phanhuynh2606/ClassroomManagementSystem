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

router.get('/download/:materialId', 
  protect,
  authorize('student', 'teacher'),
  ctrls.downloadMaterial
);

module.exports = router;