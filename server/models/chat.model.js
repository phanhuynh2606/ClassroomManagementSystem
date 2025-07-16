const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['classroom', 'private'],
    required: true,
    index: true
  },
  // For classroom chats
  classroom: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Classroom',
    index: true
  },
  // For private chats
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  lastMessageAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  // Settings
  settings: {
    allowStudentPost: {
      type: Boolean,
      default: true
    },
    allowFileUpload: {
      type: Boolean,
      default: true
    },
    muteNotifications: {
      type: Boolean,
      default: false
    }
  },
  // Members who have access to this chat
  members: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    leftAt: Date,
    role: {
      type: String,
      enum: ['admin', 'teacher', 'student'],
      required: true
    },
    isActive: {
      type: Boolean,
      default: true
    }
  }],
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
chatSchema.index({ type: 1, isActive: 1 });
chatSchema.index({ classroom: 1, isActive: 1 });
chatSchema.index({ 'participants': 1, type: 1 });
chatSchema.index({ 'members.user': 1, 'members.isActive': 1 });
chatSchema.index({ lastMessageAt: -1 });

// Methods
chatSchema.methods.addMember = function(userId, role) {
  const existingMember = this.members.find(
    member => member.user.toString() === userId.toString()
  );
  
  if (existingMember) {
    existingMember.isActive = true;
    existingMember.leftAt = null;
    existingMember.joinedAt = new Date();
  } else {
    this.members.push({
      user: userId,
      role,
      isActive: true,
      joinedAt: new Date()
    });
  }
  
  return this.save();
};

chatSchema.methods.removeMember = function(userId) {
  const member = this.members.find(
    member => member.user.toString() === userId.toString()
  );
  
  if (member) {
    member.isActive = false;
    member.leftAt = new Date();
  }
  
  return this.save();
};

chatSchema.methods.getActiveMembers = function() {
  return this.members.filter(member => member.isActive);
};

chatSchema.methods.isMember = function(userId) {
  return this.members.some(
    member => member.user.toString() === userId.toString() && member.isActive
  );
};

const Chat = mongoose.model('Chat', chatSchema);

module.exports = Chat; 