const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const {
  getUserProfile,
  updateUserProfile,
  uploadProfileImage,
} = require('../controllers/user.controller');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

router.get('/profile', protect, getUserProfile);
router.put('/profile', protect, updateUserProfile);
router.post('/profile/image', protect, upload.single('image'), uploadProfileImage);

module.exports = router; 