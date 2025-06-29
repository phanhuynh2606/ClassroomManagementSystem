const express = require('express');
const axios = require('axios');
const { protect, authorize } = require('../middleware/auth.middleware');
const Assignment = require('../models/assignment.model');
const router = express.Router();

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
      console.log(`📂 File accessed: ${attachment.name} by ${req.user.fullName} (${userRole})`);

      // Set headers for download
      res.set({
        'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(attachment.name)}`,
        'Content-Type': attachment.fileType || 'application/octet-stream',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      });

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
 * Secure submission file download
 * GET /api/files/submission/:assignmentId/:submissionId/:attachmentIndex
 */
router.get('/submission/:assignmentId/:submissionId/:attachmentIndex',
  protect,
  authorize('student', 'teacher', 'admin'),
  async (req, res) => {
    try {
      const { assignmentId, submissionId, attachmentIndex } = req.params;
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

      console.log(`📂 Submission file accessed: ${attachment.name} by ${req.user.fullName} (${userRole})`);

      res.set({
        'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(attachment.name)}`,
        'Content-Type': attachment.fileType || 'application/octet-stream',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      });

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

/**
 * Get secure file preview URL (for viewing without downloading)
 * GET /api/files/preview/:assignmentId/:attachmentIndex
 */
router.get('/preview/:assignmentId/:attachmentIndex',
  protect,
  authorize('student', 'teacher', 'admin'),
  async (req, res) => {
    try {
      const { assignmentId, attachmentIndex } = req.params;
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

      // Same authorization logic
      const isTeacher = assignment.classroom.teacher.toString() === userId.toString();
      const isStudent = assignment.classroom.students?.some(s => 
        s.student.toString() === userId.toString()
      );

      if (!isTeacher && !isStudent && userRole !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to preview this file'
        });
      }

      if (!isTeacher && userRole !== 'admin' && assignment.visibility !== 'published') {
        return res.status(403).json({
          success: false,
          message: 'Assignment not available'
        });
      }

      const attachmentIdx = parseInt(attachmentIndex);
      const attachment = assignment.attachments[attachmentIdx];

      if (!attachment) {
        return res.status(404).json({
          success: false,
          message: 'File not found'
        });
      }

      // Return preview URL (authorization already handled by middleware)
      res.json({
        success: true,
        data: {
          previewUrl: attachment.url,
          fileName: attachment.name,
          fileType: attachment.fileType,
          fileSize: attachment.fileSize
        }
      });

    } catch (error) {
      console.error('❌ File preview error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate preview URL'
      });
    }
  }
);

module.exports = router; 