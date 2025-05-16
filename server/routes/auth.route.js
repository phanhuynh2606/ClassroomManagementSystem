const express = require('express');
const {
  registerUser,
  loginUser,
  logoutUser,
  logoutAllDevices,
  getProfile,
  refreshAccessToken
} = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/logout', logoutUser);
router.post('/logout-all', protect, logoutAllDevices);
router.get('/me', protect, getProfile);
router.post('/refresh-token', refreshAccessToken);
module.exports = router; 