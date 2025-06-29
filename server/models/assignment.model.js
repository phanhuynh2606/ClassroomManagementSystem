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
    instructions: {
      type: String,
      default: ''
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
      submittedAt: Date,
      content: String,
      attachments: [{
        name: String,
        url: String,
        fileType: String,
        fileSize: Number
      }],
      submissionType: {
        type: String,
        enum: ['text', 'file', 'both'],
        default: 'both'
      },
      grade: Number, // Final grade (after penalty if applicable)
      originalGrade: Number, // Original grade before penalty
      feedback: String,
      status: {
        type: String,
        enum: ['pending', 'submitted', 'graded', 'late'],
        default: 'pending'
      },
      gradedAt: Date,
      gradedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      // Late penalty information
      latePenaltyInfo: {
        applied: {
          type: Boolean,
          default: false
        },
        percentage: {
          type: Number,
          default: 0
        },
        daysLate: {
          type: Number,
          default: 0
        },
        penaltyAmount: {
          type: Number,
          default: 0
        },
        calculatedAt: Date
      },
      // Enhanced grading system
      gradingHistory: [{
        grade: Number, // Final grade (after penalty)
        originalGrade: Number, // Original grade before penalty
        feedback: String,
        rubricGrades: {
          type: Map,
          of: mongoose.Schema.Types.Mixed,
          default: {}
        },
        annotations: [{
          type: String,
          content: String,
          position: {
            x: Number,
            y: Number,
            page: Number
          },
          timestamp: {
            type: Date,
            default: Date.now
          }
        }],
        gradedAt: {
          type: Date,
          default: Date.now
        },
        gradedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User'
        },
        gradedByName: String, // Cache teacher name
        isLatest: {
          type: Boolean,
          default: false
        },
        gradeReason: String, // Why this grade was given
        previousGrade: Number, // Previous grade for comparison
        changeType: {
          type: String,
          enum: ['initial', 'revision', 'appeal', 'correction'],
          default: 'initial'
        },
        // Late penalty information for this grading
        latePenalty: {
          applied: {
            type: Boolean,
            default: false
          },
          percentage: {
            type: Number,
            default: 0
          },
          daysLate: {
            type: Number,
            default: 0
          },
          penaltyAmount: {
            type: Number,
            default: 0
          }
        }
      }],
      // Additional submission options
      allowResubmit: {
        type: Boolean,
        default: false
      },
      hideGradeFromStudent: {
        type: Boolean,
        default: false
      },
      resubmissionCount: {
        type: Number,
        default: 0
      },
      lastModified: {
        type: Date,
        default: Date.now
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
    submissionSettings: {
      type: {
        type: String,
        enum: ['text', 'file', 'both'],
        default: 'both'
      },
      maxFileSize: {
        type: Number,
        default: 10 // MB
      },
      allowedFileTypes: [{
        type: String,
        enum: ['pdf', 'docx', 'xls', 'ppt', 'txt', 'zip', 'image', 'video', 'audio', 'csv', 'json', 'xml', 'html', 'css', 'js', 'ts']
      }],
      textSubmissionRequired: {
        type: Boolean,
        default: false
      },
      fileSubmissionRequired: {
        type: Boolean,
        default: false
      }
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
    deleted: {
      type: Boolean,
      default: false,
      index: true
    },
    deletedAt: Date,
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
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
assignmentSchema.index({ classroom: 1, dueDate: 1, isActive: 1 });
assignmentSchema.index({ createdBy: 1, createdAt: -1 });
assignmentSchema.index({ 'submissions.student': 1, 'submissions.status': 1 });
// Index for scheduled assignment auto-publishing
assignmentSchema.index({ visibility: 1, publishDate: 1, deleted: 1, isActive: 1 });

const Assignment = mongoose.model('Assignment', assignmentSchema);

module.exports = Assignment; 