const express = require('express');
const {
  registerUser,
  loginUser,
  googleLogin,
  logoutUser,
  logoutAllDevices,
  getProfile,
  refreshAccessToken,
  logoutDevice,
  getUserDevices,
  forgotPassword,
  resetPassword,
  verifyResetToken
} = require('../controllers/auth.controller.js');
const { protect } = require('../middleware/auth.middleware.js');

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/google', googleLogin);
router.post('/logout', logoutUser);
router.post('/logout-all', protect, logoutAllDevices);
router.get('/me', protect, getProfile);
router.post('/refresh-token', refreshAccessToken);
router.post('/logout-device', protect, logoutDevice);
router.get('/devices', protect, getUserDevices);

// Password reset routes
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);
router.get('/verify-reset-token/:token', verifyResetToken);

module.exports = router; 