const express = require('express');
const axios = require('axios');
const { protect, authorize } = require('../middleware/auth.middleware');
const Assignment = require('../models/assignment.model');
const Stream = require('../models/stream.model');
const Classroom = require('../models/classroom.model');
const router = express.Router();

/**
 * Secure stream attachment download route with authorization
 * GET /api/files/stream/:streamId/attachment/:attachmentIndex
 */
router.get('/stream/:streamId/attachment/:attachmentIndex', 
  protect, 
  authorize('student', 'teacher', 'admin'), 
  async (req, res) => {
    try {
      const { streamId, attachmentIndex } = req.params;
      const { preview = false } = req.query; // Add preview query parameter
      const userId = req.user._id;
      const userRole = req.user.role;

      // Get stream item with classroom info
      const streamItem = await Stream.findById(streamId)
        .populate('classroom', 'teacher students settings')
        .populate('author', 'fullName email');

      if (!streamItem) {
        return res.status(404).json({
          success: false,
          message: 'Stream item not found'
        });
      }

      const classroom = streamItem.classroom;

      // Check authorization
      let hasAccess = false;
      
      if (userRole === 'admin') {
        hasAccess = true;
      } else if (userRole === 'teacher' && classroom.teacher.toString() === userId.toString()) {
        hasAccess = true;
      } else if (userRole === 'student') {
        const isEnrolled = classroom.students?.some(s => 
          s.student && s.student.toString() === userId.toString() && s.status === 'active'
        );
        hasAccess = isEnrolled;
      }

      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to access this file'
        });
      }

      // Check if stream item is published and active
      if (streamItem.status !== 'published' || !streamItem.isActive) {
        // Only teachers and admins can access unpublished/inactive items
        if (userRole !== 'teacher' && userRole !== 'admin') {
          return res.status(403).json({
            success: false,
            message: 'Content not available'
          });
        }
      }

      // Get attachment
      const attachmentIdx = parseInt(attachmentIndex);
      const attachment = streamItem.attachments[attachmentIdx];

      if (!attachment) {
        return res.status(404).json({
          success: false,
          message: 'Attachment not found'
        });
      }

      // Only allow download for file attachments (not videos or links)
      if (attachment.type === 'video' || attachment.type === 'video/youtube' || attachment.type === 'link') {
        return res.status(400).json({
          success: false,
          message: 'This attachment cannot be downloaded'
        });
      }

      // Log file access for security audit
      const action = preview === 'true' ? 'previewed' : 'downloaded';
      console.log(`📂 Stream attachment ${action}: ${attachment.name} by ${req.user.fullName} (${userRole}) from stream ${streamId}`);

      // Set headers based on preview vs download
      if (preview === 'true') {
        res.set({
          'Content-Disposition': `inline; filename*=UTF-8''${encodeURIComponent(attachment.name)}`,
          'Content-Type': attachment.fileType || 'application/octet-stream',
          'Cache-Control': 'private, max-age=300', // 5 minute cache for preview
        });
      } else {
        res.set({
          'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(attachment.name)}`,
          'Content-Type': attachment.fileType || 'application/octet-stream',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        });
      }

      // SECURE: Stream file through server instead of exposing Cloudinary URL
      try {
        const fileResponse = await axios({
          method: 'GET',
          url: attachment.url,
          responseType: 'stream',
          timeout: 30000 // 30 second timeout
        });

        // Pipe the file stream directly to client
        fileResponse.data.pipe(res);
        
      } catch (streamError) {
        console.error('❌ File streaming error:', streamError);
        res.status(500).json({
          success: false,
          message: 'Failed to stream file'
        });
      }

    } catch (error) {
      console.error('❌ Stream file download error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to download file'
      });
    }
  }
);

/**
 * Secure file download route with authorization
 * GET /api/files/assignment/:assignmentId/attachment/:attachmentIndex
 */
router.get('/assignment/:assignmentId/attachment/:attachmentIndex', 
  protect, 
  authorize('student', 'teacher', 'admin'), 
  async (req, res) => {
    try {
      const { assignmentId, attachmentIndex } = req.params;
      const { preview = false } = req.query; // Add preview query parameter
      const userId = req.user._id;
      const userRole = req.user.role;

      // Get assignment with classroom info
      const assignment = await Assignment.findById(assignmentId)
        .populate('classroom', 'teacher students');

      if (!assignment) {
        return res.status(404).json({
          success: false,
          message: 'Assignment not found'
        });
      }

      // Check authorization
      const isTeacher = assignment.classroom.teacher.toString() === userId.toString();
      const isStudent = assignment.classroom.students?.some(s => 
        s.student.toString() === userId.toString()
      );

      if (!isTeacher && !isStudent && userRole !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to access this file'
        });
      }

      // For students, check if assignment is published
      if (!isTeacher && userRole !== 'admin') {
        if (assignment.visibility !== 'published') {
          return res.status(403).json({
            success: false,
            message: 'Assignment not available'
          });
        }
      }

      // Get attachment
      const attachmentIdx = parseInt(attachmentIndex);
      const attachment = assignment.attachments[attachmentIdx];

      if (!attachment) {
        return res.status(404).json({
          success: false,
          message: 'File not found'
        });
      }

      // Log file access for security audit
      const action = preview === 'true' ? 'previewed' : 'downloaded';
      console.log(`📂 Assignment file ${action}: ${attachment.name} by ${req.user.fullName} (${userRole})`);

      // Set headers based on preview vs download
      if (preview === 'true') {
        res.set({
          'Content-Disposition': `inline; filename*=UTF-8''${encodeURIComponent(attachment.name)}`,
          'Content-Type': attachment.fileType || 'application/octet-stream',
          'Cache-Control': 'private, max-age=300', // 5 minute cache for preview
        });
      } else {
        res.set({
          'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(attachment.name)}`,
          'Content-Type': attachment.fileType || 'application/octet-stream',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        });
      }

      // SECURE: Stream file through server instead of exposing Cloudinary URL
      try {
        const fileResponse = await axios({
          method: 'GET',
          url: attachment.url,
          responseType: 'stream'
        });

        // Pipe the file stream directly to client
        fileResponse.data.pipe(res);
        
      } catch (streamError) {
        console.error('❌ File streaming error:', streamError);
        res.status(500).json({
          success: false,
          message: 'Failed to stream file'
        });
      }

    } catch (error) {
      console.error('❌ File download error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to download file'
      });
    }
  }
);

/**
 * Secure submission file download/preview
 * GET /api/files/submission/:assignmentId/:submissionId/:attachmentIndex
 */
router.get('/submission/:assignmentId/:submissionId/:attachmentIndex',
  protect,
  authorize('student', 'teacher', 'admin'),
  async (req, res) => {
    try {
      const { assignmentId, submissionId, attachmentIndex } = req.params;
      const { preview = false } = req.query; // Add preview query parameter
      const userId = req.user._id;
      const userRole = req.user.role;

      const assignment = await Assignment.findById(assignmentId)
        .populate('classroom', 'teacher students');

      if (!assignment) {
        return res.status(404).json({
          success: false,
          message: 'Assignment not found'
        });
      }

      const submission = assignment.submissions.id(submissionId);
      if (!submission) {
        return res.status(404).json({
          success: false,
          message: 'Submission not found'
        });
      }

      // Authorization check
      const isTeacher = assignment.classroom.teacher.toString() === userId.toString();
      const isOwner = submission.student.toString() === userId.toString();

      if (!isTeacher && !isOwner && userRole !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to access this submission file'
        });
      }

      const attachmentIdx = parseInt(attachmentIndex);
      const attachment = submission.attachments[attachmentIdx];

      if (!attachment) {
        return res.status(404).json({
          success: false,
          message: 'Submission file not found'
        });
      }

      const action = preview === 'true' ? 'previewed' : 'downloaded';
      console.log(`📂 Submission file ${action}: ${attachment.name} by ${req.user.fullName} (${userRole})`);

      // Set headers based on preview vs download
      if (preview === 'true') {
        res.set({
          'Content-Disposition': `inline; filename*=UTF-8''${encodeURIComponent(attachment.name)}`,
          'Content-Type': attachment.fileType || 'application/octet-stream',
          'Cache-Control': 'private, max-age=300', // 5 minute cache for preview
        });
      } else {
        res.set({
          'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(attachment.name)}`,
          'Content-Type': attachment.fileType || 'application/octet-stream',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        });
      }

      // SECURE: Stream file through server instead of exposing Cloudinary URL
      try {
        const fileResponse = await axios({
          method: 'GET',
          url: attachment.url,
          responseType: 'stream'
        });

        // Pipe the file stream directly to client
        fileResponse.data.pipe(res);
        
      } catch (streamError) {
        console.error('❌ File streaming error:', streamError);
        res.status(500).json({
          success: false,
          message: 'Failed to stream submission file'
        });
      }

    } catch (error) {
      console.error('❌ Submission file download error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to download submission file'
      });
    }
  }
);



module.exports = router; 