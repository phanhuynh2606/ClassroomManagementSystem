const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  chat: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chat',
    required: true,
    index: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  content: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['text', 'file', 'image', 'system'],
    default: 'text',
    index: true
  },
  // For file messages
  file: {
    url: String,
    name: String,
    size: Number,
    type: String
  },
  // For system messages (user joined, left, etc.)
  systemData: {
    type: mongoose.Schema.Types.Mixed
  },
  // Message status
  status: {
    type: String,
    enum: ['sent', 'delivered', 'read'],
    default: 'sent',
    index: true
  },
  // Users who have read this message
  readBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Reply to another message
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  // Message reactions
  reactions: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    emoji: {
      type: String,
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Edited message
  edited: {
    type: Boolean,
    default: false
  },
  editedAt: Date,
  originalContent: String,
  // Soft delete
  deleted: {
    type: Boolean,
    default: false,
    index: true
  },
  deletedAt: Date,
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes for performance
messageSchema.index({ chat: 1, createdAt: -1 });
messageSchema.index({ sender: 1, createdAt: -1 });
messageSchema.index({ 'readBy.user': 1, 'readBy.readAt': -1 });
messageSchema.index({ type: 1, deleted: 1 });

// Methods
messageSchema.methods.markAsRead = function(userId) {
  const existingRead = this.readBy.find(
    read => read.user.toString() === userId.toString()
  );
  
  if (!existingRead) {
    this.readBy.push({
      user: userId,
      readAt: new Date()
    });
  }
  
  return this.save();
};

messageSchema.methods.addReaction = function(userId, emoji) {
  const existingReaction = this.reactions.find(
    reaction => reaction.user.toString() === userId.toString()
  );
  
  if (existingReaction) {
    existingReaction.emoji = emoji;
    existingReaction.createdAt = new Date();
  } else {
    this.reactions.push({
      user: userId,
      emoji,
      createdAt: new Date()
    });
  }
  
  return this.save();
};

messageSchema.methods.removeReaction = function(userId) {
  this.reactions = this.reactions.filter(
    reaction => reaction.user.toString() !== userId.toString()
  );
  
  return this.save();
};

messageSchema.methods.editContent = function(newContent) {
  this.originalContent = this.content;
  this.content = newContent;
  this.edited = true;
  this.editedAt = new Date();
  
  return this.save();
};

messageSchema.methods.isReadBy = function(userId) {
  return this.readBy.some(
    read => read.user.toString() === userId.toString()
  );
};

messageSchema.methods.getUnreadCount = function(chatMembers) {
  const readUserIds = this.readBy.map(read => read.user.toString());
  const unreadMembers = chatMembers.filter(
    member => !readUserIds.includes(member.user.toString()) && 
              member.user.toString() !== this.sender.toString()
  );
  
  return unreadMembers.length;
};

const Message = mongoose.model('Message', messageSchema);

module.exports = Message; 