const Assignment = require('../models/assignment.model');
const Classroom = require('../models/classroom.model');
const User = require('../models/user.model');
const Stream = require('../models/stream.model');
const cloudinary = require('../config/cloudinary.config');
const fs = require('fs');

// Create assignment
const createAssignment = async (req, res) => {
  try {
    const { classroomId } = req.params;
    const {
      title,
      description,
      instructions,
      dueDate,
      totalPoints,
      allowLateSubmission,
      latePenalty,
      visibility,
      publishDate,
      tags,
      submissionSettings
    } = req.body;

    // Parse submissionSettings if it's a string (from FormData)
    let parsedSubmissionSettings = submissionSettings;
    if (typeof submissionSettings === 'string') {
      try {
        parsedSubmissionSettings = JSON.parse(submissionSettings);
      } catch (error) {
        console.error('Error parsing submissionSettings:', error);
        parsedSubmissionSettings = {
          type: 'both',
          maxFileSize: 10,
          allowedFileTypes: [],
          textSubmissionRequired: false,
          fileSubmissionRequired: false
        };
      }
    }
    // Verify classroom exists and user is teacher
    const classroom = await Classroom.findById(classroomId);
    if (!classroom) {
      return res.status(404).json({ 
        success: false, 
        message: 'Classroom not found' 
      });
    }

    if (classroom.teacher.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized to create assignments in this classroom' 
      });
    }

    // Handle file attachments (using CloudinaryStorage middleware)
    let attachments = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        // File is already uploaded to Cloudinary by middleware
        // Just extract the data from multer result
        attachments.push({
          name: file.originalname,
          url: file.path, // CloudinaryStorage sets this to secure_url
          fileType: file.mimetype,
          fileSize: file.size
        });
      }
    }

    // Create assignment
    const assignment = new Assignment({
      title,
      description,
      instructions: instructions || '',
      classroom: classroomId,
      createdBy: req.user._id,
      dueDate: new Date(dueDate),
      attachments,
      totalPoints: totalPoints || 100,
      allowLateSubmission: allowLateSubmission || false,
      latePenalty: latePenalty || 0,
      visibility: visibility || 'draft',
      publishDate: publishDate ? new Date(publishDate) : null,
      tags: tags || [],
      submissionSettings: parsedSubmissionSettings || {
        type: 'both',
        maxFileSize: 10,
        allowedFileTypes: [],
        textSubmissionRequired: false,
        fileSubmissionRequired: false
      },
      missingSubmissionPolicy: req.body.missingSubmissionPolicy || {
        autoGradeWhenOverdue: false,
        autoGradeValue: 0,
        daysAfterDueForAutoGrade: 1,
        allowBulkGrading: true,
        notifyStudentsOfMissingSubmission: true,
        reminderDaysBeforeDue: [3, 1]
      }
    });

    await assignment.save();

    // If published, create stream entry
    if (visibility === 'published') {
      await Stream.create({
        title: title,
        content: description,
        type: 'assignment',
        classroom: classroomId,
        author: req.user._id,
        resourceId: assignment._id,
        resourceModel: 'Assignment',
        dueDate: new Date(dueDate),
        totalPoints: totalPoints || 100,
        attachments: attachments.map(att => ({
          name: att.name,
          url: att.url,
          type: 'file',
          fileType: att.fileType,
          fileSize: att.fileSize
        }))
      });
    }

    await assignment.populate('createdBy', 'fullName email image');
    
    return res.status(201).json({
      success: true,
      message: 'Assignment created successfully',
      data: assignment
    });
  } catch (error) {
    console.error('Error creating assignment:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get assignments by classroom
const getClassroomAssignments = async (req, res) => {
  try {
    const { classroomId } = req.params;
    const { page = 1, limit = 20, status, search } = req.query;

    // Verify user has access to classroom
    const classroom = await Classroom.findById(classroomId);
    if (!classroom) {
      return res.status(404).json({
        success: false,
        message: 'Classroom not found'
      });
    }

    // Check if user is teacher or enrolled student
    const isTeacher = classroom.teacher.toString() === req.user._id.toString();
    const isStudent = classroom.students.some(s => s.student.toString() === req.user._id.toString());
    
    if (!isTeacher && !isStudent && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view assignments in this classroom'
      });
    }

    // Build query
    let query = {
      classroom: classroomId,
      deleted: false
    };

    // For students, only show published assignments
    if (!isTeacher && req.user.role !== 'admin') {
      query.visibility = 'published';
      query.isActive = true;
    }

    if (status) {
      query.visibility = status;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const assignments = await Assignment.find(query)
      .populate('createdBy', 'fullName email image')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Assignment.countDocuments(query);

    // Add submission statistics
    const assignmentsWithStats = assignments.map(assignment => {
      const assignmentObj = assignment.toObject();
      assignmentObj.submissionsCount = assignment.submissions.length;
      assignmentObj.gradedCount = assignment.submissions.filter(sub => sub.grade !== null).length;
      
      // For students, add their submission status
      if (!isTeacher && req.user.role !== 'admin') {
        const userSubmission = assignment.submissions.find(
          sub => sub.student.toString() === req.user._id.toString()
        );
        assignmentObj.userSubmission = userSubmission || null;
      }
      
      return assignmentObj;
    });

    const result = {
      docs: assignmentsWithStats,
      totalDocs: total,
      limit: parseInt(limit),
      page: parseInt(page),
      totalPages: Math.ceil(total / limit),
      hasNextPage: page * limit < total,
      hasPrevPage: page > 1
    };

    return res.status(200).json({
      success: true,
      message: 'Assignments retrieved successfully',
      data: result
    });
  } catch (error) {
    console.error('Error getting assignments:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get assignment detail
const getAssignmentDetail = async (req, res) => {
  try {
    const { assignmentId } = req.params;

    const assignment = await Assignment.findById(assignmentId)
      .populate('createdBy', 'fullName email image')
      .populate('classroom', 'name code teacher students')
      .populate('submissions.student', 'fullName email image');

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    // Check access permissions
    const isTeacher = assignment.classroom.teacher.toString() === req.user._id.toString();
    const isStudent = assignment.classroom.students?.some(s => s.student.toString() === req.user._id.toString());

    if (!isTeacher && !isStudent && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this assignment'
      });
    }

    // For students, only show published assignments and hide other students' submissions
    if (!isTeacher && req.user.role !== 'admin') {
      if (assignment.visibility !== 'published') {
        return res.status(403).json({
          success: false,
          message: 'Assignment not available'
        });
      }
      
      // Only show student's own submission
      assignment.submissions = assignment.submissions.filter(
        sub => sub.student._id.toString() === req.user._id.toString()
      );

      // Hide grade and feedback if hideGradeFromStudent is true
      assignment.submissions = assignment.submissions.map(submission => {
        if (submission.hideGradeFromStudent) {
          const submissionObj = submission.toObject();
          // Hide grade and feedback information
          submissionObj.grade = null;
          submissionObj.feedback = null;
          submissionObj.gradedAt = null;
          submissionObj.gradedBy = null;
          submissionObj.status = submissionObj.status === 'graded' ? 'submitted' : submissionObj.status;
          // Keep allowResubmit flag for frontend logic
          return submissionObj;
        }
        return submission;
      });
    }

    // Add statistics
    const gradedSubmissions = assignment.submissions.filter(sub => sub.grade !== null && sub.grade !== undefined);
    const totalGrades = gradedSubmissions.reduce((sum, sub) => sum + (sub.grade || 0), 0);
    const avgGrade = gradedSubmissions.length > 0 ? Math.round(totalGrades / gradedSubmissions.length) : 0;

    const stats = {
      totalStudents: assignment.classroom.students?.length || 0,
      submissionsCount: assignment.submissions.length,
      gradedCount: gradedSubmissions.length,
      pendingCount: assignment.submissions.filter(sub => sub.status === 'submitted' && sub.grade === null).length,
      lateCount: assignment.submissions.filter(sub => sub.status === 'late').length,
      avgGrade: avgGrade
    };

    // Prepare assignment data with secure attachment handling
    const assignmentData = assignment.toObject();
    
    // Replace attachment URLs with secure download links (token will be sent via Authorization header)
    const serverUrl = process.env.SERVER_URL || `http://localhost:${process.env.PORT || 5000}`;
    if (assignmentData.attachments && assignmentData.attachments.length > 0) {
      assignmentData.attachments = assignmentData.attachments.map((attachment, index) => ({
        name: attachment.name,
        fileType: attachment.fileType,
        fileSize: attachment.fileSize,
        // Secure download endpoints (authentication via header)
        downloadUrl: `${serverUrl}/api/files/assignment/${assignmentId}/attachment/${index}`,
        previewUrl: `${serverUrl}/api/files/preview/${assignmentId}/${index}`,
        index: index
      }));
    }

    // Secure submission attachments too
    if (assignmentData.submissions && assignmentData.submissions.length > 0) {
      assignmentData.submissions = assignmentData.submissions.map(submission => {
        if (submission.attachments && submission.attachments.length > 0) {
          submission.attachments = submission.attachments.map((attachment, index) => ({
            name: attachment.name,
            fileType: attachment.fileType,
            fileSize: attachment.fileSize,
            downloadUrl: `${serverUrl}/api/files/submission/${assignmentId}/${submission._id}/${index}`,
            index: index
          }));
        }
        return submission;
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Assignment retrieved successfully',
      data: {
        ...assignmentData,
        stats
      }
    });
  } catch (error) {
    console.error('Error getting assignment detail:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Update assignment
const updateAssignment = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const updateData = { ...req.body };

    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    // Check if user is the creator
    if (assignment.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this assignment'
      });
    }

    // Restrict certain fields if assignment is published and has submissions
    const hasSubmissions = assignment.submissions && assignment.submissions.length > 0;
    const isPublished = assignment.visibility === 'published';
    
    if (isPublished && hasSubmissions) {
      // Fields that cannot be changed after students have submitted
      const restrictedFields = [];
      
      // Check submission type change
      if (updateData.submissionSettings && 
          updateData.submissionSettings.type && 
          updateData.submissionSettings.type !== assignment.submissionSettings?.type) {
        restrictedFields.push('submission type');
      }
      
      // Check due date change (only allow extending, not shortening)
      if (updateData.dueDate) {
        const newDueDate = new Date(updateData.dueDate);
        const currentDueDate = new Date(assignment.dueDate);
        if (newDueDate < currentDueDate) {
          restrictedFields.push('due date (cannot be moved earlier)');
        }
      }
      
      // Check total points change (only allow increasing for fairness)
      if (updateData.totalPoints && updateData.totalPoints < assignment.totalPoints) {
        const hasGradedSubmissions = assignment.submissions.some(sub => sub.grade !== null && sub.grade !== undefined);
        if (hasGradedSubmissions) {
          restrictedFields.push('total points (cannot be decreased when submissions are graded)');
        }
      }
      
      if (restrictedFields.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Cannot modify ${restrictedFields.join(', ')} after assignment is published and has submissions`,
          details: {
            restrictedFields,
            hasSubmissions,
            isPublished,
            submissionCount: assignment.submissions.length
          }
        });
      }
    }

    // Parse submissionSettings if it's a string (from FormData)
    if (updateData.submissionSettings && typeof updateData.submissionSettings === 'string') {
      try {
        updateData.submissionSettings = JSON.parse(updateData.submissionSettings);
      } catch (error) {
        console.error('Error parsing submissionSettings in update:', error);
        // Keep existing submissionSettings if parsing fails
        delete updateData.submissionSettings;
      }
    }

    // Parse missingSubmissionPolicy if it's a string (from FormData)
    if (updateData.missingSubmissionPolicy && typeof updateData.missingSubmissionPolicy === 'string') {
      try {
        updateData.missingSubmissionPolicy = JSON.parse(updateData.missingSubmissionPolicy);
      } catch (error) {
        console.error('Error parsing missingSubmissionPolicy in update:', error);
        // Keep existing missingSubmissionPolicy if parsing fails
        delete updateData.missingSubmissionPolicy;
      }
    }

    // Handle file attachments if any (using CloudinaryStorage middleware)
    if (req.files && req.files.length > 0) {
      const newAttachments = [];
      for (const file of req.files) {
        // File is already uploaded to Cloudinary by middleware
        newAttachments.push({
          name: file.originalname,
          url: file.path, // CloudinaryStorage sets this to secure_url
          fileType: file.mimetype,
          fileSize: file.size
        });
      }
      updateData.attachments = [...(assignment.attachments || []), ...newAttachments];
    }

    // Update assignment
    const updatedAssignment = await Assignment.findByIdAndUpdate(
      assignmentId,
      updateData,
      { new: true, runValidators: true }
    ).populate('createdBy', 'fullName email image');

    // Update stream entry if exists
    if (updatedAssignment.visibility === 'published') {
      await Stream.findOneAndUpdate(
        { resourceId: assignmentId, resourceModel: 'Assignment' },
        {
          title: updatedAssignment.title,
          content: updatedAssignment.description,
          dueDate: updatedAssignment.dueDate,
          totalPoints: updatedAssignment.totalPoints
        }
      );
    }

    return res.status(200).json({
      success: true,
      message: 'Assignment updated successfully',
      data: updatedAssignment
    });
  } catch (error) {
    console.error('Error updating assignment:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Delete assignment
const deleteAssignment = async (req, res) => {
  try {
    const { assignmentId } = req.params;

    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    // Check if user is the creator
    if (assignment.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this assignment'
      });
    }

    // Soft delete
    assignment.deleted = true;
    assignment.deletedAt = new Date();
    assignment.deletedBy = req.user._id;
    await assignment.save();

    // Remove from stream
    await Stream.findOneAndDelete({
      resourceId: assignmentId,
      resourceModel: 'Assignment'
    });

    return res.status(200).json({
      success: true,
      message: 'Assignment deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting assignment:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Submit assignment (for students)
const submitAssignment = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const { content } = req.body;

    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    // Check if assignment is published and active
    if (assignment.visibility !== 'published' || !assignment.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Assignment is not available for submission'
      });
    }

    // Check if student already submitted
    const existingSubmission = assignment.submissions.find(
      sub => sub.student.toString() === req.user._id.toString()
    );

    if (existingSubmission) {
      // Check if resubmission is allowed
      if (!existingSubmission.allowResubmit) {
        return res.status(400).json({
          success: false,
          message: 'You have already submitted this assignment and resubmission is not allowed'
        });
      }
      
      // If resubmission is allowed, increment resubmission count
      existingSubmission.resubmissionCount = (existingSubmission.resubmissionCount || 0) + 1;
      existingSubmission.submittedAt = new Date();
      existingSubmission.content = content || '';
      existingSubmission.attachments = [];
      
      // Handle file attachments for resubmission
      if (req.files && req.files.length > 0) {
        for (const file of req.files) {
          existingSubmission.attachments.push({
            name: file.originalname,
            url: file.path,
            fileType: file.mimetype,
            fileSize: file.size
          });
        }
      }
      
      // Update status
      const now = new Date();
      const dueDate = new Date(assignment.dueDate);
      const isLate = now > dueDate;
      existingSubmission.status = isLate ? 'late' : 'submitted';
      
      // Clear previous grading if resubmitted
      existingSubmission.grade = null;
      existingSubmission.feedback = null;
      existingSubmission.gradedAt = null;
      existingSubmission.gradedBy = null;
      existingSubmission.allowResubmit = false; // Reset allow resubmit flag
      
      await assignment.save();
      
      return res.status(200).json({
        success: true,
        message: `Assignment resubmitted successfully (Resubmission #${existingSubmission.resubmissionCount})`,
        data: existingSubmission
      });
    }

    // Validate submission based on assignment settings
    const submissionSettings = assignment.submissionSettings || { type: 'both' };
    
    // Check content requirements
    if (submissionSettings.textSubmissionRequired && (!content || content.trim() === '')) {
      return res.status(400).json({
        success: false,
        message: 'Text submission is required for this assignment'
      });
    }

    // Handle file attachments (using CloudinaryStorage middleware)
    let attachments = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        // File is already uploaded to Cloudinary by middleware
        attachments.push({
          name: file.originalname,
          url: file.path, // CloudinaryStorage sets this to secure_url
          fileType: file.mimetype,
          fileSize: file.size
        });
      }
    }

    // Check file requirements
    if (submissionSettings.fileSubmissionRequired && attachments.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'File submission is required for this assignment'
      });
    }

    // Validate submission type
    if (submissionSettings.type === 'text' && attachments.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'This assignment only accepts text submissions'
      });
    }

    if (submissionSettings.type === 'file' && content && content.trim() !== '') {
      return res.status(400).json({
        success: false,
        message: 'This assignment only accepts file submissions'
      });
    }

    // Ensure required submission content based on type
    if (submissionSettings.type === 'file' && attachments.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'File submission is required for this assignment'
      });
    }

    if (submissionSettings.type === 'text' && (!content || content.trim() === '')) {
      return res.status(400).json({
        success: false,
        message: 'Text submission is required for this assignment'
      });
    }

    if (submissionSettings.type === 'both' && (!content || content.trim() === '') && attachments.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide either text content or file attachments'
      });
    }

    // Determine submission status
    const now = new Date();
    const dueDate = new Date(assignment.dueDate);
    const isLate = now > dueDate;

    const submission = {
      student: req.user._id,
      submittedAt: now,
      content: content || '',
      attachments,
      submissionType: submissionSettings.type,
      status: isLate ? 'late' : 'submitted'
    };

    assignment.submissions.push(submission);
    await assignment.save();

    return res.status(200).json({
      success: true,
      message: 'Assignment submitted successfully',
      data: submission
    });
  } catch (error) {
    console.error('Error submitting assignment:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Grade submission (for teachers) - Enhanced with grading history
const gradeSubmission = async (req, res) => {
  try {
    const { assignmentId, submissionId } = req.params;
    const { 
      grade, 
      feedback, 
      rubricGrades = {}, 
      annotations = [],
      allowResubmit = false,
      hideGradeFromStudent = false,
      gradeReason = '',
      changeType = 'initial'
    } = req.body;

    // Validate input data
    if (grade === null || grade === undefined || isNaN(Number(grade))) {
      return res.status(400).json({
        success: false,
        message: 'Grade must be a valid number'
      });
    }

    if (!feedback || typeof feedback !== 'string' || feedback.trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Feedback is required and must be at least 10 characters'
      });
    }

    const numericGrade = Number(grade);
    if (numericGrade < 0) {
      return res.status(400).json({
        success: false,
        message: 'Grade cannot be negative'
      });
    }

    // Get assignment with teacher info
    const assignment = await Assignment.findById(assignmentId)
      .populate('classroom', 'teacher')
      .populate('createdBy', 'fullName');

    if (!assignment) {
      return res.status(400).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    // Validate grade against assignment max points
    const maxPoints = assignment.totalPoints || 100;
    if (numericGrade > maxPoints) {
      return res.status(400).json({
        success: false,
        message: `Grade cannot exceed assignment max points (${maxPoints})`
      });
    }

    // Calculate late penalty if applicable
    const calculateLatePenalty = (submission, assignment, originalGrade) => {
      if (!submission.submittedAt || !assignment.allowLateSubmission || !assignment.latePenalty) {
        return {
          originalGrade: originalGrade,
          finalGrade: originalGrade,
          penalty: 0,
          daysLate: 0,
          isLate: false
        };
      }

      const dueDate = new Date(assignment.dueDate);
      const submittedDate = new Date(submission.submittedAt);
      
      if (submittedDate <= dueDate) {
        return {
          originalGrade: originalGrade,
          finalGrade: originalGrade,
          penalty: 0,
          daysLate: 0,
          isLate: false
        };
      }

      // Calculate days late (minimum 1 day)
      const timeDiff = submittedDate - dueDate;
      const daysLate = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
      
      // Calculate penalty percentage
      const penaltyPercentage = Math.min(assignment.latePenalty * daysLate, 100);
      
      // Apply penalty to grade
      const penaltyAmount = (originalGrade * penaltyPercentage) / 100;
      const finalGrade = Math.max(0, Math.round((originalGrade - penaltyAmount) * 10) / 10);

      return {
        originalGrade: originalGrade,
        finalGrade: finalGrade,
        penalty: penaltyPercentage,
        penaltyAmount: penaltyAmount,
        daysLate: daysLate,
        isLate: true
      };
    };

    // Check if user is teacher of the classroom
    if (assignment.classroom.teacher.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to grade this assignment'
      });
    }

    // Find submission
    const submission = assignment.submissions.id(submissionId);
    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Submission not found'
      });
    }

    // Get teacher info for grading history
    const teacher = await User.findById(req.user._id).select('fullName');
    
    // Store previous grade for history
    const previousGrade = submission.grade;
    const previousGradedAt = submission.gradedAt;

    // Calculate late penalty automatically
    const penaltyInfo = calculateLatePenalty(submission, assignment, numericGrade);
    
    console.log('📊 Penalty calculation:', {
      originalGrade: penaltyInfo.originalGrade,
      finalGrade: penaltyInfo.finalGrade,
      penalty: penaltyInfo.penalty,
      daysLate: penaltyInfo.daysLate,
      isLate: penaltyInfo.isLate
    });

    // Determine change type automatically if not provided
    let actualChangeType = changeType;
    if (submission.gradingHistory && submission.gradingHistory.length > 0) {
      actualChangeType = 'revision';
    } else if (previousGrade !== null && previousGrade !== undefined) {
      actualChangeType = 'revision';
    } else {
      actualChangeType = 'initial';
    }

    // Create new grading history entry with penalty info
    const newGradingEntry = {
      grade: penaltyInfo.finalGrade, // Use final grade (after penalty)
      originalGrade: penaltyInfo.originalGrade, // Store original grade before penalty
      feedback: feedback.trim(),
      rubricGrades: new Map(Object.entries(rubricGrades || {})),
      annotations: (annotations || []).map(ann => ({
        type: ann.type || 'comment',
        content: ann.content || '',
        position: ann.position || { x: 0, y: 0, page: 1 },
        timestamp: new Date()
      })),
      gradedAt: new Date(),
      gradedBy: req.user._id,
      gradedByName: teacher?.fullName || 'Teacher',
      isLatest: true,
      gradeReason: gradeReason || `Grade ${actualChangeType} via grading modal`,
      previousGrade: previousGrade,
      changeType: actualChangeType,
      // Late penalty information
      latePenalty: {
        applied: penaltyInfo.isLate,
        percentage: penaltyInfo.penalty,
        daysLate: penaltyInfo.daysLate,
        penaltyAmount: penaltyInfo.penaltyAmount || 0
      }
    };

    // Initialize grading history if it doesn't exist
    if (!submission.gradingHistory) {
      submission.gradingHistory = [];
    }

    // Mark all previous grading entries as not latest
    submission.gradingHistory.forEach(entry => {
      entry.isLatest = false;
    });

    // Add new grading entry to history
    submission.gradingHistory.push(newGradingEntry);

    // Update main submission fields (for backward compatibility)
    submission.grade = penaltyInfo.finalGrade; // Use final grade (after penalty)
    submission.originalGrade = penaltyInfo.originalGrade; // Store original grade
    submission.feedback = feedback.trim();
    submission.status = 'graded';
    submission.gradedAt = new Date();
    submission.gradedBy = req.user._id;
    
    // Add penalty info to submission
    submission.latePenaltyInfo = {
      applied: penaltyInfo.isLate,
      percentage: penaltyInfo.penalty,
      daysLate: penaltyInfo.daysLate,
      penaltyAmount: penaltyInfo.penaltyAmount || 0,
      calculatedAt: new Date()
    };

    // Update additional submission options
    submission.allowResubmit = allowResubmit;
    submission.hideGradeFromStudent = hideGradeFromStudent;
    submission.lastModified = new Date();

    // Save assignment
    await assignment.save();

    // Populate the submission for response
    await assignment.populate('submissions.student', 'fullName email image');
    await assignment.populate('submissions.gradedBy', 'fullName email');

    // Get updated submission
    const updatedSubmission = assignment.submissions.id(submissionId);

    // Create response object with grading history and penalty info
    const responseData = {
      ...updatedSubmission.toObject(),
      gradingStats: {
        totalGradingAttempts: updatedSubmission.gradingHistory?.length || 0,
        firstGradedAt: updatedSubmission.gradingHistory?.find(entry => entry.changeType === 'initial')?.gradedAt,
        lastGradedAt: updatedSubmission.gradedAt,
        gradeChange: previousGrade !== null ? penaltyInfo.finalGrade - previousGrade : null,
        hasBeenRevised: (updatedSubmission.gradingHistory?.length || 0) > 1
      },
      penaltyInfo: penaltyInfo // Include penalty calculation details
    };

    // Create success message with penalty info
    let successMessage = actualChangeType === 'initial' 
      ? 'Submission graded successfully' 
      : `Grade updated successfully (${actualChangeType})`;
    
    if (penaltyInfo.isLate && penaltyInfo.penalty > 0) {
      successMessage += ` | Late penalty applied: -${penaltyInfo.penalty}% (${penaltyInfo.daysLate} days late)`;
    }

    return res.status(200).json({
      success: true,
      message: successMessage,
      data: responseData
    });
  } catch (error) {
    console.error('Error grading submission:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get assignment submissions (for teachers) - Enhanced with grading history
const getAssignmentSubmissions = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const { page = 1, limit = 20, status, search, includeHistory = true } = req.query;

    const assignment = await Assignment.findById(assignmentId)
      .populate('submissions.student', 'fullName email image')
      .populate('submissions.gradedBy', 'fullName email')
      .populate('submissions.gradingHistory.gradedBy', 'fullName email')
      .populate('classroom', 'name students');

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    // Check if user is teacher
    const classroom = await Classroom.findById(assignment.classroom._id).populate('students.student', 'fullName email image');
    if (classroom.teacher.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view submissions'
      });
    }

    let submissions = assignment.submissions.map(submission => {
      const submissionObj = submission.toObject();
      
      // Add grading statistics
      if (submissionObj.gradingHistory && submissionObj.gradingHistory.length > 0) {
        submissionObj.gradingStats = {
          totalGradingAttempts: submissionObj.gradingHistory.length,
          firstGradedAt: submissionObj.gradingHistory.find(entry => entry.changeType === 'initial')?.gradedAt,
          lastGradedAt: submissionObj.gradedAt,
          hasBeenRevised: submissionObj.gradingHistory.length > 1,
          latestChangeType: submissionObj.gradingHistory[submissionObj.gradingHistory.length - 1]?.changeType
        };

        // Sort grading history by date (newest first)
        submissionObj.gradingHistory.sort((a, b) => new Date(b.gradedAt) - new Date(a.gradedAt));
        
        // If not including full history, only send latest entry
        if (includeHistory === 'false' || includeHistory === false) {
          submissionObj.gradingHistory = [submissionObj.gradingHistory[0]];
        }
      } else {
        submissionObj.gradingStats = {
          totalGradingAttempts: 0,
          firstGradedAt: null,
          lastGradedAt: submissionObj.gradedAt,
          hasBeenRevised: false,
          latestChangeType: null
        };
      }
      
      return submissionObj;
    });

    // Filter by status
    if (status) {
      submissions = submissions.filter(sub => sub.status === status);
    }

    // Search by student name
    if (search) {
      submissions = submissions.filter(sub => 
        sub.student.fullName.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Add missing students (who haven't submitted)
    const submittedStudentIds = submissions.map(sub => sub.student._id.toString());
    const allStudents = classroom.students || [];
    
    const missingSubmissions = allStudents
      .filter(student => !submittedStudentIds.includes(student.student._id.toString()))
      .map(student => ({
        _id: `missing_${student.student._id}`,
        student: student.student,
        status: 'missing',
        submittedAt: null,
        content: null,
        attachments: [],
        grade: null,
        feedback: null,
        gradingHistory: [],
        gradingStats: {
          totalGradingAttempts: 0,
          firstGradedAt: null,
          lastGradedAt: null,
          hasBeenRevised: false,
          latestChangeType: null
        }
      }));

    const allSubmissions = [...submissions, ...missingSubmissions];

    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedSubmissions = allSubmissions.slice(startIndex, endIndex);

    // Calculate overall grading statistics
    const gradingOverview = {
      totalSubmissions: submissions.length,
      gradedSubmissions: submissions.filter(sub => sub.grade !== null && sub.grade !== undefined).length,
      pendingSubmissions: submissions.filter(sub => sub.status === 'submitted' && (sub.grade === null || sub.grade === undefined)).length,
      revisedSubmissions: submissions.filter(sub => sub.gradingStats?.hasBeenRevised).length,
      averageGrade: submissions.length > 0 ? 
        submissions
          .filter(sub => sub.grade !== null && sub.grade !== undefined)
          .reduce((sum, sub, _, arr) => sum + sub.grade / arr.length, 0) : 0,
      gradingDistribution: {
        initial: submissions.filter(sub => sub.gradingStats?.latestChangeType === 'initial').length,
        revision: submissions.filter(sub => sub.gradingStats?.latestChangeType === 'revision').length,
        appeal: submissions.filter(sub => sub.gradingStats?.latestChangeType === 'appeal').length,
        correction: submissions.filter(sub => sub.gradingStats?.latestChangeType === 'correction').length
      }
    };

    const result = {
      docs: paginatedSubmissions,
      totalDocs: allSubmissions.length,
      limit: parseInt(limit),
      page: parseInt(page),
      totalPages: Math.ceil(allSubmissions.length / limit),
      hasNextPage: endIndex < allSubmissions.length,
      hasPrevPage: page > 1,
      gradingOverview
    };

    return res.status(200).json({
      success: true,
      message: 'Submissions retrieved successfully',
      data: result
    });
  } catch (error) {
    console.error('Error getting submissions:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Auto-grade missing submissions when assignment is overdue
const autoGradeMissingSubmissions = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    
    const assignment = await Assignment.findById(assignmentId)
      .populate('classroom', 'teacher students')
      .populate('createdBy', 'fullName');

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    // Check if user is teacher
    if (assignment.classroom.teacher.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to grade this assignment'
      });
    }

    // Check if assignment is overdue
    const now = new Date();
    const dueDate = new Date(assignment.dueDate);
    const isOverdue = now > dueDate;

    if (!isOverdue) {
      return res.status(400).json({
        success: false,
        message: 'Assignment is not yet overdue. Auto-grading only available for overdue assignments.'
      });
    }

    // Find students who haven't submitted
    const submittedStudentIds = assignment.submissions.map(sub => sub.student.toString());
    const allStudents = assignment.classroom.students || [];
    
    const missingStudents = allStudents.filter(student => 
      !submittedStudentIds.includes(student.student.toString())
    );

    if (missingStudents.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No missing submissions found. All students have submitted.',
        data: {
          gradedCount: 0,
          message: 'All students have already submitted'
        }
      });
    }

    // Get teacher info
    const teacher = await User.findById(req.user._id).select('fullName');
    const daysOverdue = Math.ceil((now - dueDate) / (1000 * 60 * 60 * 24));

    // Create submissions with grade 0 for missing students
    const newSubmissions = [];
    
    for (const student of missingStudents) {
      const gradingEntry = {
        grade: 0,
        originalGrade: 0,
        feedback: `No submission received. Assignment was due ${daysOverdue} day(s) ago. Automatically graded as 0.`,
        rubricGrades: new Map(),
        annotations: [],
        gradedAt: now,
        gradedBy: req.user._id,
        gradedByName: teacher?.fullName || 'Teacher',
        isLatest: true,
        gradeReason: `Auto-graded for missing submission (${daysOverdue} days overdue)`,
        previousGrade: null,
        changeType: 'initial',
        latePenalty: {
          applied: false,
          percentage: 0,
          daysLate: 0,
          penaltyAmount: 0
        }
      };

      const newSubmission = {
        student: student.student._id || student.student,
        submittedAt: null, // No submission
        content: null,
        attachments: [],
        submissionType: 'both',
        grade: 0,
        originalGrade: 0,
        feedback: gradingEntry.feedback,
        status: 'graded',
        gradedAt: now,
        gradedBy: req.user._id,
        latePenaltyInfo: {
          applied: false,
          percentage: 0,
          daysLate: 0,
          penaltyAmount: 0,
          calculatedAt: now
        },
        gradingHistory: [gradingEntry],
        allowResubmit: false,
        hideGradeFromStudent: false,
        resubmissionCount: 0,
        lastModified: now
      };

      assignment.submissions.push(newSubmission);
      newSubmissions.push(newSubmission);
    }

    // Save assignment
    await assignment.save();

    // Populate for response
    await assignment.populate('submissions.student', 'fullName email image');
    await assignment.populate('submissions.gradedBy', 'fullName email');

    return res.status(200).json({
      success: true,
      message: `Successfully auto-graded ${missingStudents.length} missing submission(s) with grade 0`,
      data: {
        gradedCount: missingStudents.length,
        gradedStudents: newSubmissions.map(sub => ({
          studentId: sub.student,
          studentName: missingStudents.find(s => s.student._id.toString() === sub.student.toString())?.student?.fullName || 'Unknown',
          grade: sub.grade,
          feedback: sub.feedback
        })),
        daysOverdue: daysOverdue,
        autoGradedAt: now
      }
    });

  } catch (error) {
    console.error('Error auto-grading missing submissions:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Bulk grade missing submissions (manual teacher action)
const bulkGradeMissingSubmissions = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const { 
      grade = 0, 
      feedback = 'No submission received.', 
      studentIds = [], // Specific students to grade, empty means all missing
      allowResubmit = false,
      hideGradeFromStudent = false 
    } = req.body;

    // Validate grade
    const numericGrade = Number(grade);
    if (isNaN(numericGrade) || numericGrade < 0) {
      return res.status(400).json({
        success: false,
        message: 'Grade must be a valid non-negative number'
      });
    }

    const assignment = await Assignment.findById(assignmentId)
      .populate('classroom', 'teacher students')
      .populate('createdBy', 'fullName');

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    // Check if user is teacher
    if (assignment.classroom.teacher.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to grade this assignment'
      });
    }

    // Validate grade against assignment max points
    const maxPoints = assignment.totalPoints || 100;
    if (numericGrade > maxPoints) {
      return res.status(400).json({
        success: false,
        message: `Grade cannot exceed assignment max points (${maxPoints})`
      });
    }

    // Find students who haven't submitted
    const submittedStudentIds = assignment.submissions.map(sub => sub.student.toString());
    const allStudents = assignment.classroom.students || [];
    
    let targetStudents;
    if (studentIds.length > 0) {
      // Grade specific students
      targetStudents = allStudents.filter(student => 
        studentIds.includes(student.student._id.toString()) &&
        !submittedStudentIds.includes(student.student._id.toString())
      );
    } else {
      // Grade all missing students
      targetStudents = allStudents.filter(student => 
        !submittedStudentIds.includes(student.student.toString())
      );
    }

    if (targetStudents.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No eligible students found for bulk grading.',
        data: {
          gradedCount: 0,
          message: 'All specified students have already submitted or are not found'
        }
      });
    }

    // Get teacher info
    const teacher = await User.findById(req.user._id).select('fullName');
    const now = new Date();
    const dueDate = new Date(assignment.dueDate);
    const isOverdue = now > dueDate;
    const daysOverdue = isOverdue ? Math.ceil((now - dueDate) / (1000 * 60 * 60 * 24)) : 0;

    // Create submissions for missing students
    const newSubmissions = [];
    
    for (const student of targetStudents) {
      const gradingEntry = {
        grade: numericGrade,
        originalGrade: numericGrade,
        feedback: feedback || (isOverdue ? 
          `No submission received. Assignment was due ${daysOverdue} day(s) ago. Graded by teacher.` :
          'No submission received. Graded by teacher.'
        ),
        rubricGrades: new Map(),
        annotations: [],
        gradedAt: now,
        gradedBy: req.user._id,
        gradedByName: teacher?.fullName || 'Teacher',
        isLatest: true,
        gradeReason: `Bulk graded for missing submission${isOverdue ? ` (${daysOverdue} days overdue)` : ''}`,
        previousGrade: null,
        changeType: 'initial',
        latePenalty: {
          applied: false,
          percentage: 0,
          daysLate: 0,
          penaltyAmount: 0
        }
      };

      const newSubmission = {
        student: student.student._id || student.student,
        submittedAt: null, // No submission
        content: null,
        attachments: [],
        submissionType: 'both',
        grade: numericGrade,
        originalGrade: numericGrade,
        feedback: gradingEntry.feedback,
        status: 'graded',
        gradedAt: now,
        gradedBy: req.user._id,
        latePenaltyInfo: {
          applied: false,
          percentage: 0,
          daysLate: 0,
          penaltyAmount: 0,
          calculatedAt: now
        },
        gradingHistory: [gradingEntry],
        allowResubmit: allowResubmit,
        hideGradeFromStudent: hideGradeFromStudent,
        resubmissionCount: 0,
        lastModified: now
      };

      assignment.submissions.push(newSubmission);
      newSubmissions.push(newSubmission);
    }

    // Save assignment
    await assignment.save();

    // Populate for response
    await assignment.populate('submissions.student', 'fullName email image');
    await assignment.populate('submissions.gradedBy', 'fullName email');

    return res.status(200).json({
      success: true,
      message: `Successfully bulk graded ${targetStudents.length} missing submission(s)`,
      data: {
        gradedCount: targetStudents.length,
        gradedStudents: newSubmissions.map(sub => ({
          studentId: sub.student,
          studentName: targetStudents.find(s => s.student._id.toString() === sub.student.toString())?.student?.fullName || 'Unknown',
          grade: sub.grade,
          feedback: sub.feedback
        })),
        grade: numericGrade,
        maxPoints: maxPoints,
        isOverdue: isOverdue,
        daysOverdue: daysOverdue,
        bulkGradedAt: now
      }
    });

  } catch (error) {
    console.error('Error bulk grading missing submissions:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  createAssignment,
  getClassroomAssignments,
  getAssignmentDetail,
  updateAssignment,
  deleteAssignment,
  submitAssignment,
  gradeSubmission,
  getAssignmentSubmissions,
  autoGradeMissingSubmissions,
  bulkGradeMissingSubmissions
}; 