import axiosClient from '../axiosClient';

const chatAPI = {
  // Debug user data
  debugUserData: () => {
    return axiosClient.get('/chats/debug');
  },

  // Get all chats for user
  getUserChats: (page = 1, limit = 20) => {
    return axiosClient.get(`/chats?page=${page}&limit=${limit}`);
  },

  // Get chat by ID
  getChatById: (chatId) => {
    return axiosClient.get(`/chats/${chatId}`);
  },

  // Get messages for a chat
  getChatMessages: (chatId, page = 1, limit = 50) => {
    return axiosClient.get(`/chats/${chatId}/messages?page=${page}&limit=${limit}`);
  },

  // Send message
  sendMessage: (chatId, messageData) => {
    return axiosClient.post(`/chats/${chatId}/messages`, messageData);
  },

  // Mark message as read
  markMessageAsRead: (messageId) => {
    return axiosClient.patch(`/chats/messages/${messageId}/read`);
  },

  // Add reaction to message
  addReaction: (messageId, emoji) => {
    return axiosClient.post(`/chats/messages/${messageId}/reactions`, { emoji });
  },

  // Mark all messages in a chat as read
  markChatAsRead: (chatId) => {
    return axiosClient.patch(`/chats/${chatId}/mark-read`);
  }
};

export default chatAPI; 