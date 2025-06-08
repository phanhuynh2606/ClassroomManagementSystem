const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['classroom_creation', 'classroom_deletion', 'classroom_edit'],
      required: true,
      index: true
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      index: true
    },
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    requestedAt: {
      type: Date,
      default: Date.now
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reviewedAt: Date,
    reason: String, // For rejection reason or approval notes
    
    // Reference to the related resource
    classroom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Classroom',
      index: true
    },
    
    // Store request data for creation/edit requests
    requestData: {
      type: mongoose.Schema.Types.Mixed // Flexible data storage
    },
    
    // Metadata
    metadata: {
      type: mongoose.Schema.Types.Mixed
    }
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
requestSchema.index({ type: 1, status: 1 });
requestSchema.index({ requestedBy: 1, status: 1 });
requestSchema.index({ classroom: 1, type: 1 });

const Request = mongoose.model('Request', requestSchema);

module.exports = Request; 