const mongoose = require('mongoose');
const Question = require('./question.model');

const quizSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    category: {
      type: String,
      enum: ['PROGRESS_TEST', 'FINAL_EXAM', 'ASSIGNMENT', 'MID_TERM_EXAM'],
      required: true,
      index: true
    },
    description: {
      type: String,
      trim: true,
    },
    classroom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Classroom',
      required: true,
      index: true
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    questions: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question',
      index: true
    }],
    duration: {
      type: Number,
      required: true,
    },
    startTime: {
      type: Date,
      required: true,
      index: true
    },
    endTime: {
      type: Date,
      required: true,
      index: true
    },
    allowReview: {
      type: Boolean,
      default: true,
    },
    showResults: {
      type: Boolean,
      default: true,
    },
    shuffleQuestions: {
      type: Boolean,
      default: false,
    },
    shuffleOptions: {
      type: Boolean,
      default: false,
    },
    randomizeQuestions: {
      type: Boolean,
      default: false,
    },
    fullScreen: {
      type: Boolean,
      default: false,
    },
    copyAllowed: {
      type: Boolean,
      default: false,
    },
    checkTab: {
      type: Boolean,
      default: false,
    },
    passingScore: {
      type: Number,
      default: 60,
    },
    maxAttempts: {
      type: Number,
      default: 1,
    },
    submissions: [{
      student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        index: true
      },
      answers: [{
        question: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Question'
        },
        selectedOptions: [Number],
        isCorrect: Boolean,
      }],
      score: Number,
      startedAt: Date,
      submittedAt: Date,
      attempt: {
        type: Number,
        default: 1
      },
      status: {
        type: String,
        enum: ['in-progress', 'completed', 'abandoned'],
        default: 'in-progress'
      }
    }],
    isActive: {
      type: Boolean,
      default: true,
      index: true
    },
    isArchived: {
      type: Boolean,
      default: false
    },
    visibility: {
      type: String,
      enum: ['draft', 'published', 'scheduled'],
      default: 'draft'
    },
    // publishDate: Date,
    // tags: [{
    //   type: String,
    //   trim: true
    // }],
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
  },
  {
    timestamps: true,
  }
);

// Indexes
quizSchema.index({ classroom: 1, startTime: 1 });
quizSchema.index({ createdBy: 1, isActive: 1 });
quizSchema.index({ 'submissions.student': 1, 'submissions.status': 1 });
quizSchema.index({ tags: 1 });

const Quiz = mongoose.model('Quiz', quizSchema);

module.exports = Quiz; 