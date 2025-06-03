const mongoose = require('mongoose');

const classroomSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    code: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    description: {
      type: String,
      trim: true,
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    students: [{
      student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        index: true
      },
      joinedAt: {
        type: Date,
        default: Date.now
      },
      status: {
        type: String,
        enum: ['active', 'inactive', 'pending'],
        default: 'active'
      }
    }],
    maxStudents: {
      type: Number,
      default: 50
    },
    category: {
      type: String,
      enum: ['academic', 'professional', 'other'],
      default: 'academic'
    },
    level: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'beginner'
    },
    isActive: {
      type: Boolean,
      default: false, // Default false, will be activated after approval
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
    settings: {
      allowStudentInvite: {
        type: Boolean,
        default: false
      },
      allowStudentPost: {
        type: Boolean,
        default: true
      },
      allowStudentComment: {
        type: Boolean,
        default: true
      }
    }
  },
  {
    timestamps: true,
  }
);

// Indexes
classroomSchema.index({ teacher: 1, isActive: 1 });
classroomSchema.index({ 'students.student': 1, 'students.status': 1 });
classroomSchema.index({ code: 1, isActive: 1 });
classroomSchema.index({ category: 1, level: 1 });

const Classroom = mongoose.model('Classroom', classroomSchema);

module.exports = Classroom; 