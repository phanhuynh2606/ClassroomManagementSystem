const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true,
  },
  image: {
    type: String,
    default: null
  },
  options: [{
    content: String,
    isCorrect: Boolean,
    image: String
  }],
  explanation: String,
  explanationImage: String,
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium',
  },
  points: {
    type: Number,
    default: 1
  },
  isAI: {
    type: Boolean,
    default: false,
  },
  category: {
    type: String,
    enum: ['PT1', 'PT2', 'QUIZ1', 'QUIZ2', 'FE', 'ASSIGNMENT'],
    required: true,
    index: true
  },
  subjectCode: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  statistics: {
    totalAttempts: {
      type: Number,
      default: 0
    },
    correctAttempts: {
      type: Number,
      default: 0
    }
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lastUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft'
  },
  usageHistory: [{
    quiz: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Quiz'
    },
    usedAt: {
      type: Date,
      default: Date.now
    },
    classroom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Classroom'
    }
  }],
  lastUsedAt: Date,
  usageCount: {
    type: Number,
    default: 0
  },
  cooldownPeriod: {
    type: Number,
    default: 30
  },
  usedInClassrooms: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Classroom'
  }]
}, {
  timestamps: true
});

// Indexes
questionSchema.index({ difficulty: 1 });
questionSchema.index({ isAI: 1 });
questionSchema.index({ category: 1, subjectCode: 1 });
questionSchema.index({ createdBy: 1, status: 1 });
questionSchema.index({ lastUsedAt: 1 });
questionSchema.index({ usageCount: 1 });
questionSchema.index({ 'usedInClassrooms': 1 });

questionSchema.methods.canBeUsedInClassroom = function(classroomId) {
  if (this.usedInClassrooms.includes(classroomId)) {
    return false;
  }

  if (this.lastUsedAt) {
    const daysSinceLastUse = (Date.now() - this.lastUsedAt) / (1000 * 60 * 60 * 24);
    if (daysSinceLastUse < this.cooldownPeriod) {
      return false;
    }
  }

  return true;
};

questionSchema.methods.addUsage = function(quizId, classroomId) {
  this.usageHistory.push({
    quiz: quizId,
    classroom: classroomId
  });
  this.lastUsedAt = Date.now();
  this.usageCount += 1;
  this.usedInClassrooms.push(classroomId);
  return this.save();
};

questionSchema.methods.updateStatistics = function(isCorrect) {
  this.statistics.totalAttempts += 1;
  if (isCorrect) {
    this.statistics.correctAttempts += 1;
  }
  return this.save();
};

const Question = mongoose.model('Question', questionSchema);

module.exports = Question; 