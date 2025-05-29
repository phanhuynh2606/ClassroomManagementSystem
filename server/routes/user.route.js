const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth.middleware');
const {
  getUserProfile,
  updateUserProfile,
  uploadProfileImage,
} = require('../controllers/user.controller');
const multer = require('multer');
const { uploadErrorHandler } = require('../middleware/errorr');
const { profileUpload } = require('../middleware/upload.middleware');
const upload = multer({ dest: 'uploads/' });


router.get('/profile', protect, getUserProfile);
router.put('/profile', protect, updateUserProfile);
router.post('/profile/image', protect,uploadErrorHandler, profileUpload.single('image'), uploadProfileImage);


module.exports = router; 