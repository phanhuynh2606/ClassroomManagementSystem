const Chat = require('../models/chat.model');
const Message = require('../models/message.model');
const User = require('../models/user.model');
const Classroom = require('../models/classroom.model');

// Helper function to calculate unread chats count for a user
const calculateUnreadChatsCount = async (userId) => {
  try {
    const userChats = await Chat.find({
      'members.user': userId,
      'members.isActive': true,
      deleted: false
    });

    let unreadChatsCount = 0;
    for (const chat of userChats) {
      const unreadCount = await Message.countDocuments({
        chat: chat._id,
        sender: { $ne: userId },
        'readBy.user': { $ne: userId },
        deleted: false
      });
      if (unreadCount > 0) {
        unreadChatsCount++;
      }
    }

    return unreadChatsCount;
  } catch (error) {
    console.error('Error calculating unread chats count:', error);
    return 0;
  }
};

// Debug function to check user data
const debugUserData = async (req, res) => {
  try {
    const userId = req.user._id;
    console.log('=== DEBUG USER DATA ===');
    console.log('User ID:', userId);
    console.log('User Role:', req.user.role);
    console.log('User Name:', req.user.fullName);
    
    // Check all classrooms this user is involved in
    const classroomsAsTeacher = await Classroom.find({
      teacher: userId,
      deleted: false
    });
    console.log('Classrooms as teacher:', classroomsAsTeacher.length);
    
    const classroomsAsStudent = await Classroom.find({
      'students.student': userId,
      deleted: false
    });
    console.log('Classrooms as student:', classroomsAsStudent.length);
    
    // Check all chats this user is member of
    const allChats = await Chat.find({
      'members.user': userId,
      deleted: false
    });
    console.log('All chats user is member of:', allChats.length);
    
    const activeChats = await Chat.find({
      'members.user': userId,
      'members.isActive': true,
      deleted: false
    });
    console.log('Active chats user is member of:', activeChats.length);
    
    res.json({
      success: true,
      data: {
        user: {
          id: userId,
          role: req.user.role,
          name: req.user.fullName
        },
        classrooms: {
          asTeacher: classroomsAsTeacher.length,
          asStudent: classroomsAsStudent.length
        },
        chats: {
          total: allChats.length,
          active: activeChats.length
        }
      }
    });
  } catch (error) {
    console.error('Debug error:', error);
    res.status(500).json({
      success: false,
      message: 'Debug error'
    });
  }
};

// Get all chats for a user
const getUserChats = async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 20 } = req.query;

    const chats = await Chat.find({
      'members.user': userId,
      'members.isActive': true,
      deleted: false
    })
    .populate({
      path: 'lastMessage',
      populate: {
        path: 'sender',
        select: 'fullName email image'
      }
    })
    .populate('classroom', 'name code')
    .populate('participants', 'fullName email image')
    .populate('members.user', 'fullName email image')
    .sort({ lastMessageAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

    // Calculate unread count for each chat
    const chatsWithUnreadCount = await Promise.all(
      chats.map(async (chat) => {
        const unreadCount = await Message.countDocuments({
          chat: chat._id,
          sender: { $ne: userId },
          'readBy.user': { $ne: userId },
          deleted: false
        });

        return {
          ...chat.toObject(),
          unreadCount
        };
      })
    );

    const totalChats = await Chat.countDocuments({
      'members.user': userId,
      'members.isActive': true,
      deleted: false
    });

    res.json({
      success: true,
      data: {
        chats: chatsWithUnreadCount,
        totalPages: Math.ceil(totalChats / limit),
        currentPage: page,
        totalChats
      }
    });
  } catch (error) {
    console.error('Error getting user chats:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Get chat by ID
const getChatById = async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user._id;

    const chat = await Chat.findOne({
      _id: chatId,
      'members.user': userId,
      'members.isActive': true,
      deleted: false
    })
    .populate('classroom', 'name code')
    .populate('participants', 'fullName email image')
    .populate('members.user', 'fullName email image role');

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found'
      });
    }

    res.json({
      success: true,
      data: chat
    });
  } catch (error) {
    console.error('Error getting chat:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Get messages for a chat
const getChatMessages = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const userId = req.user._id;

    // Check if user is member of the chat
    const chat = await Chat.findOne({
      _id: chatId,
      'members.user': userId,
      'members.isActive': true,
      deleted: false
    });

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found'
      });
    }

    const messages = await Message.find({
      chat: chatId,
      deleted: false
    })
    .populate('sender', 'fullName email image')
    .populate('replyTo', 'content sender')
    .populate('reactions.user', 'fullName')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

    const totalMessages = await Message.countDocuments({
      chat: chatId,
      deleted: false
    });

    res.json({
      success: true,
      data: {
        messages: messages.reverse(), // Reverse to show oldest first
        totalPages: Math.ceil(totalMessages / limit),
        currentPage: page,
        totalMessages
      }
    });
  } catch (error) {
    console.error('Error getting chat messages:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Send message
const sendMessage = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { content, type = 'text', replyTo } = req.body;
    const userId = req.user._id;

    // Check if user is member of the chat
    const chat = await Chat.findOne({
      _id: chatId,
      'members.user': userId,
      'members.isActive': true,
      deleted: false
    });

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found'
      });
    }

    // Check if user can send messages (for classroom chats)
    if (chat.type === 'classroom' && !chat.settings.allowStudentPost && req.user.role === 'student') {
      return res.status(403).json({
        success: false,
        message: 'Students are not allowed to post in this chat'
      });
    }

    // Create new message
    const message = new Message({
      chat: chatId,
      sender: userId,
      content,
      type,
      replyTo: replyTo || null
    });

    await message.save();
    await message.populate('sender', 'fullName email image');
    
    if (replyTo) {
      await message.populate('replyTo', 'content sender');
    }

    // Update chat's last message
    chat.lastMessage = message._id;
    chat.lastMessageAt = new Date();
    await chat.save();

    // Emit real-time message via socket.io
    const io = req.app.get('io');
    console.log(`📡 Emitting new message to chat_${chatId}:`, {
      messageId: message._id,
      sender: message.sender.fullName,
      content: message.content?.substring(0, 50) + '...',
      roomName: `chat_${chatId}`,
      chatType: chat.type
    });
    
    // Always emit to the main chat room
    io.to(`chat_${chatId}`).emit('new-message', message);
    
    // For classroom chats, also emit to the classroom room to ensure all participants receive the message
    if (chat.type === 'classroom' && chat.classroom) {
      const classroomRoomId = `classroom_${chat.classroom}`;
      console.log(`📡 Also emitting to classroom room: ${classroomRoomId}`);
      io.to(classroomRoomId).emit('new-message', message);
    }

    // Update unread chats count for all other participants
    const chatMembers = await Chat.findById(chatId).populate('members.user', '_id');
    if (chatMembers) {
      // Use Promise.all to calculate unread chats count for all members in parallel
      const memberUpdates = chatMembers.members
        .filter(member => member.isActive && member.user._id.toString() !== userId.toString())
        .map(async (member) => {
          const unreadChatsCount = await calculateUnreadChatsCount(member.user._id);
          
          // Emit unread chats count update to the member
          io.to(`user_${member.user._id}`).emit('unread-count-update', {
            userId: member.user._id,
            unreadChatsCount
          });
          
          return { userId: member.user._id, unreadChatsCount };
        });

      await Promise.all(memberUpdates);
    }

    res.status(201).json({
      success: true,
      data: message
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Mark message as read
const markMessageAsRead = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Check if user is member of the chat
    const chat = await Chat.findOne({
      _id: message.chat,
      'members.user': userId,
      'members.isActive': true,
      deleted: false
    });

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found'
      });
    }

    await message.markAsRead(userId);

    res.json({
      success: true,
      message: 'Message marked as read'
    });
  } catch (error) {
    console.error('Error marking message as read:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Add reaction to message
const addReaction = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { emoji } = req.body;
    const userId = req.user._id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Check if user is member of the chat
    const chat = await Chat.findOne({
      _id: message.chat,
      'members.user': userId,
      'members.isActive': true,
      deleted: false
    });

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found'
      });
    }

    await message.addReaction(userId, emoji);

    // Emit real-time reaction via socket.io
    const io = req.app.get('io');
    io.to(`chat_${message.chat}`).emit('message-reaction', {
      messageId,
      userId,
      emoji
    });

    res.json({
      success: true,
      message: 'Reaction added'
    });
  } catch (error) {
    console.error('Error adding reaction:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Mark all messages in a chat as read for current user
const markChatAsRead = async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user._id;

    // Check if user has access to this chat
    const chat = await Chat.findOne({
      _id: chatId,
      'members.user': userId,
      'members.isActive': true,
      deleted: false
    });

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found'
      });
    }

    // Find all unread messages in this chat from other users
    const unreadMessages = await Message.find({
      chat: chatId,
      sender: { $ne: userId },
      'readBy.user': { $ne: userId },
      deleted: false
    });

    // Mark all unread messages as read
    for (const message of unreadMessages) {
      await message.markAsRead(userId);
    }

    // Emit socket event to update unread count
    const io = req.app.get('io');
    if (io) {
      // Calculate new unread chats count for this user
      const unreadChatsCount = await calculateUnreadChatsCount(userId);

      // Emit to the specific user who marked as read
      io.to(`user_${userId}`).emit('chat-marked-as-read', {
        chatId,
        markedCount: unreadMessages.length,
        unreadChatsCount
      });
      
      // Emit general message read update to all participants
      io.to(`chat_${chatId}`).emit('message-read-update', {
        chatId,
        userId,
        markedCount: unreadMessages.length
      });

      // Emit unread chats count update to the user
      io.to(`user_${userId}`).emit('unread-count-update', {
        userId,
        unreadChatsCount
      });
    }

    res.json({
      success: true,
      message: 'Chat marked as read',
      data: {
        markedCount: unreadMessages.length
      }
    });
  } catch (error) {
    console.error('Error marking chat as read:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

module.exports = {
  debugUserData,
  getUserChats,
  getChatById,
  getChatMessages,
  sendMessage,
  markMessageAsRead,
  markChatAsRead,
  addReaction,
  calculateUnreadChatsCount
}; 