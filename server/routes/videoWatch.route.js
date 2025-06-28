const express = require('express');
const router = express.Router();
const videoWatchController = require('../controllers/videoWatch.controller');
const { protect,authorize } = require('../middleware/auth.middleware');

// All routes require authentication
router.use(protect);

// Start watching a video
router.post('/start', videoWatchController.startWatching);

// Update watch progress
router.put('/progress/:watchId', videoWatchController.updateProgress);

// End watching session
router.post('/end/:watchId', videoWatchController.endWatching);

// Get user's watch history in a classroom
router.get('/history/:classroomId', videoWatchController.getWatchHistory);

// Get video analytics (teachers only)
router.get('/analytics/:classroomId/:videoId', videoWatchController.getVideoAnalytics);

module.exports = router; 