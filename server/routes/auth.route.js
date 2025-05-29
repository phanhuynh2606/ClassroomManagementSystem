const express = require('express');
const {
  registerUser,
  loginUser,
  googleLogin,
  facebookLogin,
  logoutUser,
  logoutAllDevices,
  getProfile,
  refreshAccessToken,
  logoutDevice,
  getUserDevices,
  forgotPassword,
  resetPassword,
  verifyResetToken,
  updatePassword
} = require('../controllers/auth.controller.js');
const { protect } = require('../middleware/auth.middleware.js');

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/google', googleLogin);
router.post('/facebook', facebookLogin);
router.post('/logout', logoutUser);
router.post('/logout-all', protect, logoutAllDevices);
router.get('/me', protect, getProfile);
router.post('/refresh-token', refreshAccessToken);
router.post('/logout-device', protect, logoutDevice);
router.get('/devices', protect, getUserDevices);

// Password management routes
router.put('/password', protect, updatePassword);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);
router.get('/verify-reset-token/:token', verifyResetToken);

module.exports = router; 