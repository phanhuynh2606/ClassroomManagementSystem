const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    description: {
      type: String,
      required: true,
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
    dueDate: {
      type: Date,
      required: true,
      index: true
    },
    attachments: [{
      name: String,
      url: String,
      fileType: String,
      fileSize: Number
    }],
    submissions: [{
      student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        index: true
      },
      content: String,
      files: [{
        name: String,
        url: String,
        fileType: String,
        fileSize: Number
      }],
      grade: Number,
      feedback: String,
      submittedAt: Date,
      gradedAt: Date,
      gradedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      status: {
        type: String,
        enum: ['submitted', 'graded', 'returned'],
        default: 'submitted'
      }
    }],
    totalPoints: {
      type: Number,
      default: 100
    },
    allowLateSubmission: {
      type: Boolean,
      default: false
    },
    latePenalty: {
      type: Number,
      default: 0
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    },
    isArchived: {
      type: Boolean,
      default: false
    },
    tags: [{
      type: String,
      trim: true
    }],
    visibility: {
      type: String,
      enum: ['draft', 'published', 'scheduled'],
      default: 'draft'
    },
    publishDate: Date
  },
  {
    timestamps: true,
  }
);

// Indexes
assignmentSchema.index({ classroom: 1, dueDate: 1 });
assignmentSchema.index({ createdBy: 1, isActive: 1 });
assignmentSchema.index({ 'submissions.student': 1, 'submissions.status': 1 });

const Assignment = mongoose.model('Assignment', assignmentSchema);

module.exports = Assignment; 