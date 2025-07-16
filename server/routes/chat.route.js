const express = require('express');
const router = express.Router();
const {
  debugUserData,
  getUserChats,
  getChatById,
  getChatMessages,
  sendMessage,
  markMessageAsRead,
  markChatAsRead,
  addReaction
} = require('../controllers/chat.controller');
const { protect } = require('../middleware/auth.middleware');

// All routes are protected
router.use(protect);

// Debug route
router.get('/debug', debugUserData);

// Get user's chats
router.get('/', getUserChats);

// Get chat by ID
router.get('/:chatId', getChatById);

// Get messages for a chat
router.get('/:chatId/messages', getChatMessages);

// Send message
router.post('/:chatId/messages', sendMessage);

// Mark message as read
router.patch('/messages/:messageId/read', markMessageAsRead);

// Mark all messages in a chat as read
router.patch('/:chatId/mark-read', markChatAsRead);

// Add reaction to message
router.post('/messages/:messageId/reactions', addReaction);

module.exports = router; 