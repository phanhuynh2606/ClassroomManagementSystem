const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true
  },
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
userSchema.methods.addRefreshToken = function(tokenData) {
  this.refreshTokens.push(tokenData);
  return this.save();
};

// Method to revoke refresh token
userSchema.methods.revokeRefreshToken = function(token) {
  const tokenIndex = this.refreshTokens.findIndex(t => t.token === token);
  if (tokenIndex > -1) {
    this.refreshTokens[tokenIndex].isRevoked = true;
    this.refreshTokens[tokenIndex].revokedAt = Date.now();
    return this.save();
  }
  return null;
};

// Method to revoke all refresh tokens
userSchema.methods.revokeAllRefreshTokens = function() {
  this.refreshTokens.forEach(token => {
    token.isRevoked = true;
    token.revokedAt = Date.now();
  });
  return this.save();
};

const User = mongoose.model('User', userSchema);

module.exports = User; 