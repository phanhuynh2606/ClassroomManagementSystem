const mongoose = require('mongoose');

const materialSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    description: {
      type: String,
      trim: true,
    },
    type: {
      type: String,
      enum: ['pdf', 'slide', 'video', 'other'],
      required: true,
      index: true
    },
    fileUrl: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number, // in bytes
    },
    fileType: {
      type: String,
    },
    thumbnail: {
      type: String,
    },
    classroom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Classroom',
      required: true,
      index: true
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    isPublic: {
      type: Boolean,
      default: false,
      index: true
    },
    tags: [{
      type: String,
      trim: true
    }],
    downloadCount: {
      type: Number,
      default: 0
    },
    viewCount: {
      type: Number,
      default: 0
    },
    isArchived: {
      type: Boolean,
      default: false
    },
    version: {
      type: Number,
      default: 1
    },
    previousVersions: [{
      fileUrl: String,
      version: Number,
      updatedAt: Date,
      updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    }],
    isActive: {
      type: Boolean,
      default: true,
      index: true
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
    }
  },
  {
    timestamps: true,
  }
);

// Indexes
materialSchema.index({ classroom: 1, type: 1, isActive: 1 });
materialSchema.index({ uploadedBy: 1, createdAt: -1 });
materialSchema.index({ tags: 1 });

const Material = mongoose.model('Material', materialSchema);

module.exports = Material; 