const mongoose = require('mongoose');
const bcrypt = require("bcryptjs")
const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    index: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['admin', 'teacher', 'student'],
    default: 'student',
    index: true
  },
  image: {
    type: String,
    default: ''
  },
  fullName: {
    type: String,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  dateOfBirth: Date,
  gender: {
    type: String,
    enum: ['male', 'female', 'other']
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  lastLogin: Date,
  refreshTokens: [{
    token: {
      type: String,
      required: true
    },
    device: {
      type: String,
      trim: true
    },
    ipAddress: String,
    userAgent: String,
    createdAt: {
      type: Date,
      default: Date.now
    },
    expiresAt: {
      type: Date,
      required: true
    },
    isRevoked: {
      type: Boolean,
      default: false
    },
    revokedAt: Date
  }],
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  emailVerified: {
    type: Boolean,
    default: false
  },
  verificationToken: String,
  verificationTokenExpire: Date
}, {
  timestamps: true
});

// Indexes
userSchema.index({ email: 1, role: 1 });
userSchema.index({ username: 1, isActive: 1 });
userSchema.index({ 'refreshTokens.token': 1 });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Method to compare password
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Method to add refresh token
userSchema.methods.addRefreshToken = async function(tokenData) {
  // Giới hạn số lượng token tối đa là 3
  const MAX_TOKENS = 3;
  
  // Xóa các token đã hết hạn hoặc đã revoke
  this.refreshTokens = this.refreshTokens.filter(token => 
    token.expiresAt > Date.now() && !token.isRevoked
  );

  // Nếu đã đạt giới hạn, xóa token cũ nhất
  if (this.refreshTokens.length >= MAX_TOKENS) {
    this.refreshTokens.sort((a, b) => a.createdAt - b.createdAt);
    this.refreshTokens.shift();
  }

  // Thêm token mới
  this.refreshTokens.push(tokenData);
  return this.save();
};

// Method to revoke refresh token
userSchema.methods.revokeRefreshToken = async function(token) {
  const tokenIndex = this.refreshTokens.findIndex(t => t.token === token);
  if (tokenIndex > -1) {
    // Thay vì đánh dấu là revoked, xóa luôn token
    this.refreshTokens.splice(tokenIndex, 1);
    return this.save();
  }
  return null;
};

// Method to revoke all refresh tokens
userSchema.methods.revokeAllRefreshTokens = async function() {
  // Xóa tất cả token thay vì đánh dấu là revoked
  this.refreshTokens = [];
  return this.save();
};

// Method to clean expired tokens
userSchema.methods.cleanExpiredTokens = async function() {
  this.refreshTokens = this.refreshTokens.filter(token => 
    token.expiresAt > Date.now()
  );
  return this.save();
};

// Tự động dọn dẹp token hết hạn mỗi ngày
setInterval(async () => {
  try {
    const users = await User.find({});
    for (const user of users) {
      await user.cleanExpiredTokens();
    }
  } catch (error) {
    console.error('Error cleaning expired tokens:', error);
  }
}, 24 * 60 * 60 * 1000);

const User = mongoose.model('User', userSchema);

module.exports = User;  