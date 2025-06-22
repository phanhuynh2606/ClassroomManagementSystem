const Classroom = require("../models/classroom.model");
const User = require("../models/user.model");
const Notification = require("../models/notification.model");
const Request = require("../models/request.model");

// Helper function to generate unique classroom code
const generateClassroomCode = async () => {
  let code;
  let exists = true;
  
  while (exists) {
    code = Math.random().toString(36).substring(2, 8).toUpperCase();
    const existingClassroom = await Classroom.findOne({ code });
    exists = !!existingClassroom;
  }
  
  return code;
};

// Helper function to send notification
const sendNotification = async (title, content, type, sender, recipients, classroom = null) => {
  try {
    const notification = new Notification({
      title,
      content,
      type,
      sender,
      recipients: recipients.map(recipient => ({ user: recipient })),
      classroom,
      action: 'announcement'
    });
    await notification.save();
  } catch (error) {
    console.error('Error sending notification:', error);
  }
};

const getTeacherClassrooms = async (req, res) => {
    try {
        const classrooms = await Classroom.find({ 
          teacher: req.user._id,
          deleted: false 
        })
        .populate('students.student', 'fullName email')
        .populate('teacher', 'fullName email')
        .sort({ createdAt: -1 });
        
        // Get approval status for each classroom from Request table
        const classroomsWithApproval = await Promise.all(
          classrooms.map(async (classroom) => {
            const latestRequest = await Request.findOne({
              classroom: classroom._id,
              type: 'classroom_creation'
            })
            .populate('reviewedBy', 'fullName')
            .sort({ createdAt: -1 });

            // Set classroom status based on approval status
            let status = 'inactive';
            if (latestRequest) {
              if (latestRequest.status === 'approved') {
                status = 'active';
              } else if (latestRequest.status === 'pending') {
                status = 'pending_creation';
              } else if (latestRequest.status === 'rejected') {
                status = 'inactive';
              }
            } else if (classroom.isActive) {
              status = 'active';
            }

            // Check for pending edit or delete requests
            const pendingEditRequest = await Request.findOne({
              classroom: classroom._id,
              type: 'classroom_edit',
              status: 'pending'
            });

            const pendingDeleteRequest = await Request.findOne({
              classroom: classroom._id,
              type: 'classroom_deletion',
              status: 'pending'
            });

            if (pendingDeleteRequest) {
              status = 'pending_delete';
            } else if (pendingEditRequest) {
              status = 'pending_edit';
            }

            // Update classroom status in database
            if (classroom.status !== status) {
              classroom.status = status;
              await classroom.save();
            }

            return {
              ...classroom.toObject(),
              status: status,
              approvalStatus: latestRequest?.status || 'approved',
              approvedBy: latestRequest?.reviewedBy,
              approvedAt: latestRequest?.reviewedAt,
              rejectedBy: latestRequest?.reviewedBy,
              rejectedAt: latestRequest?.reviewedAt,
              rejectionReason: latestRequest?.reason
            };
          })
        );
        
        res.status(200).json({
          success: true,
          data: classroomsWithApproval,
          message: 'Teacher classrooms fetched successfully'
        });
    } catch (error) {
        console.error('Error fetching teacher classrooms:', error);
        res.status(500).json({ 
          success: false,
          message: error.message 
        });
    }
};

const getAllClassrooms = async (req, res) => {
  try {
    const classrooms = await Classroom.find({ deleted: false })
      .populate('teacher', 'fullName email')
      .sort({ createdAt: -1 });

    // Get approval status for each classroom from Request table
    const classroomsWithApproval = await Promise.all(
      classrooms.map(async (classroom) => {
        const latestRequest = await Request.findOne({
          classroom: classroom._id,
          type: 'classroom_creation'
        })
        .populate('reviewedBy', 'fullName')
        .sort({ createdAt: -1 });

        const deletionRequest = await Request.findOne({
          classroom: classroom._id,
          type: 'classroom_deletion',
          status: 'pending'
        })
        .populate('requestedBy', 'fullName');

        return {
          ...classroom.toObject(),
          approvalStatus: latestRequest?.status || 'approved', // Default approved for existing
          approvedBy: latestRequest?.reviewedBy,
          approvedAt: latestRequest?.reviewedAt,
          rejectedBy: latestRequest?.reviewedBy,
          rejectedAt: latestRequest?.reviewedAt,
          rejectionReason: latestRequest?.reason,
          deletionRequested: !!deletionRequest,
          deletionRequestedBy: deletionRequest?.requestedBy,
          deletionRequestedAt: deletionRequest?.requestedAt
        };
      })
    );

    res.status(200).json({
      success: true,
      data: classroomsWithApproval,
    });
  } catch (error) {
    console.error('Error getting classrooms:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching classrooms',
    });
  }
};

const deleteClassroom = async (req, res) => {
  try {
    const { classroomId } = req.params;
    const classroom = await Classroom.findById(classroomId);

    if (!classroom) {
      return res.status(404).json({
        success: false,
        message: 'Classroom not found',
      });
    }

    // Check if classroom can be deleted
    if (classroom.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete classroom while it is not active',
      });
    }

    // If teacher is requesting deletion, request admin approval
    if (req.user.role === 'teacher') {
      if (classroom.teacher.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to delete this classroom',
        });
      }

      // Check if deletion request already exists
      const existingRequest = await Request.findOne({
        classroom: classroomId,
        type: 'classroom_deletion',
        status: 'pending'
      });

      if (existingRequest) {
        return res.status(400).json({
          success: false,
          message: 'Deletion request already pending',
        });
      }

      // Update classroom status to pending_delete
      classroom.status = 'pending_delete';
      await classroom.save();

      // Create deletion request
      await Request.create({
        type: 'classroom_deletion',
        requestedBy: req.user._id,
        classroom: classroomId
      });

      // Send notification to all admins
      const admins = await User.find({ role: 'admin', isActive: true });
      await sendNotification(
        'Classroom Deletion Request',
        `Teacher ${req.user.fullName} has requested to delete classroom "${classroom.name}" (${classroom.code})`,
        'system',
        req.user._id,
        admins.map(admin => admin._id),
        classroom._id
      );

      return res.status(200).json({
        success: true,
        message: 'Deletion request sent to admin for approval',
      });
    }

    // Admin can delete directly
    if (req.user.role === 'admin') {
      classroom.deleted = true;
      classroom.deletedAt = new Date();
      classroom.deletedBy = req.user._id;
      classroom.status = 'deleted';
      await classroom.save();

      // Notify teacher
      await sendNotification(
        'Classroom Deleted',
        `Your classroom "${classroom.name}" (${classroom.code}) has been deleted by admin`,
        'system',
        req.user._id,
        [classroom.teacher],
        classroom._id
      );

      return res.status(200).json({
        success: true,
        message: 'Classroom deleted successfully',
      });
    }

    return res.status(403).json({
      success: false,
      message: 'Not authorized to perform this action',
    });
  } catch (error) {
    console.error('Error deleting classroom:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting classroom',
    });
  }
};

const createClassroom = async (req, res) => {
  try {
    const {
      name,
      description,
      maxStudents,
      category,
      level
    } = req.body;

    if (!name || !maxStudents || !category || !level) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
      });
    }

    // Generate unique classroom code
    const code = await generateClassroomCode();

    // Create classroom with appropriate status
    const newClassroom = await Classroom.create({
      name,
      code,
      description,
      maxStudents,
      category,
      level,
      teacher: req.user._id,
      isActive: req.user.role === 'admin', // Admin created classrooms are active immediately
      status: req.user.role === 'admin' ? 'active' : 'pending_creation' // Set initial status based on model
    });

    // If teacher created, create approval request
    if (req.user.role === 'teacher') {
      await Request.create({
        type: 'classroom_creation',
        requestedBy: req.user._id,
        classroom: newClassroom._id,
        requestData: {
          name,
          description,
          maxStudents,
          category,
          level
        }
      });

      // Send notification to all admins
      const admins = await User.find({ role: 'admin', isActive: true });
      await sendNotification(
        'New Classroom Approval Request',
        `Teacher ${req.user.fullName} has created a new classroom "${name}" (${code}) that requires approval`,
        'system',
        req.user._id,
        admins.map(admin => admin._id),
        newClassroom._id
      );
    }

    res.status(201).json({
      success: true,
      message: req.user.role === 'admin' 
        ? 'Classroom created successfully' 
        : 'Classroom created and sent for admin approval',
      data: newClassroom,
    });
  } catch (error) {
    console.error('Error creating classroom:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating classroom',
    });
  }
};

const updateClassroom = async (req, res) => {
  try {
    const { classroomId } = req.params;
    const {
      name,
      code,
      description,
      maxStudents,
      category,
      level,
      isActive,
      isArchived,
      settings,
      requireApproval = false
    } = req.body;

    const classroom = await Classroom.findById(classroomId);

    if (!classroom) {
      return res.status(404).json({
        success: false,
        message: 'Classroom not found',
      });
    }

    // Check if classroom can be edited
    if (classroom.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Cannot edit classroom while it is not active',
      });
    }

    // Check authorization
    if (req.user.role === 'teacher' && classroom.teacher.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this classroom',
      });
    }

    // If teacher requests approval for significant changes
    if (req.user.role === 'teacher' && requireApproval) {
      // Check if pending edit request already exists
      const existingRequest = await Request.findOne({
        classroom: classroomId,
        type: 'classroom_edit',
        status: 'pending'
      });

      if (existingRequest) {
        return res.status(400).json({
          success: false,
          message: 'Edit request already pending approval',
        });
      }

      // Update classroom status to pending_edit
      classroom.status = 'pending_edit';
      await classroom.save();

      // Create edit request for admin approval
      const editRequest = await Request.create({
        type: 'classroom_edit',
        requestedBy: req.user._id,
        classroom: classroomId,
        requestData: {
          name,
          code,
          description,
          maxStudents,
          category,
          level,
          settings,
          originalData: {
            name: classroom.name,
            code: classroom.code,
            description: classroom.description,
            maxStudents: classroom.maxStudents,
            category: classroom.category,
            level: classroom.level,
            settings: classroom.settings
          }
        }
      });

      // Send notification to all admins
      const admins = await User.find({ role: 'admin', isActive: true });
      await sendNotification(
        'Classroom Edit Request',
        `Teacher ${req.user.fullName} has requested to edit classroom "${classroom.name}" (${classroom.code})`,
        'system',
        req.user._id,
        admins.map(admin => admin._id),
        classroom._id
      );

      return res.status(200).json({
        success: true,
        message: 'Edit request sent to admin for approval',
        data: editRequest
      });
    }

    // For admin or direct teacher updates (without approval requirement)
    // Update fields
    if (name !== undefined) classroom.name = name;
    if (code !== undefined) classroom.code = code;
    if (description !== undefined) classroom.description = description;
    if (maxStudents !== undefined) classroom.maxStudents = maxStudents;
    if (category !== undefined) classroom.category = category;
    if (level !== undefined) classroom.level = level;
    if (isActive !== undefined && req.user.role === 'admin') {
      classroom.isActive = isActive;
      classroom.status = isActive ? 'active' : 'inactive';
    }
    if (isArchived !== undefined) classroom.isArchived = isArchived;
    if (settings && typeof settings === 'object') {
      // Ensure settings object exists
      if (!classroom.settings) {
        classroom.settings = {};
      }
      
      if (settings.allowStudentInvite !== undefined)
        classroom.settings.allowStudentInvite = settings.allowStudentInvite;
      if (settings.allowStudentPost !== undefined)
        classroom.settings.allowStudentPost = settings.allowStudentPost;
      if (settings.allowStudentComment !== undefined)
        classroom.settings.allowStudentComment = settings.allowStudentComment;
    }

    await classroom.save();

    res.status(200).json({
      success: true,
      message: 'Classroom updated successfully',
      data: classroom,
    });
  } catch (error) {
    console.error('Error updating classroom:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating classroom',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// New functions for admin approval workflow
const approveDeletionRequest = async (req, res) => {
  try {
    const { classroomId } = req.params;
    const { reason } = req.body; // Optional approval reason
    
    // Validate admin role (additional safety check)
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only administrators can approve deletion requests',
      });
    }
    
    // Find pending deletion request
    const request = await Request.findOne({
      classroom: classroomId,
      type: 'classroom_deletion',
      status: 'pending'
    }).populate('requestedBy', 'fullName email');

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'No pending deletion request found for this classroom',
      });
    }

    const classroom = await Classroom.findById(classroomId);
    if (!classroom) {
      return res.status(404).json({
        success: false,
        message: 'Classroom not found',
      });
    }

    // Check if classroom is already deleted
    if (classroom.deleted) {
      return res.status(400).json({
        success: false,
        message: 'Classroom is already deleted',
      });
    }

    // Update request status
    request.status = 'approved';
    request.reviewedBy = req.user._id;
    request.reviewedAt = new Date();
    if (reason) request.reason = reason;
    await request.save();

    // Delete the classroom
    classroom.deleted = true;
    classroom.deletedAt = new Date();
    classroom.deletedBy = req.user._id;
    await classroom.save();

    // Notify teacher
    await sendNotification(
      'Classroom Deletion Approved',
      `Your deletion request for classroom "${classroom.name}" (${classroom.code}) has been approved${reason ? `. Note: ${reason}` : ''}`,
      'system',
      req.user._id,
      [request.requestedBy._id],
      classroom._id
    );

    res.status(200).json({
      success: true,
      message: 'Classroom deletion approved successfully',
      data: {
        request: {
          _id: request._id,
          type: request.type,
          status: request.status,
          reviewedBy: req.user.fullName,
          reviewedAt: request.reviewedAt,
          reason: request.reason
        },
        classroom: {
          _id: classroom._id,
          name: classroom.name,
          code: classroom.code,
          deleted: classroom.deleted,
          deletedAt: classroom.deletedAt
        }
      }
    });
  } catch (error) {
    console.error('Error approving deletion:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while approving deletion',
    });
  }
};

const approveClassroom = async (req, res) => {
  try {
    const { classroomId } = req.params;
    const { reason } = req.body;
    
    // Validate admin role (additional safety check)
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only administrators can approve classrooms',
      });
    }
    
    // Find pending creation request
    const request = await Request.findOne({
      classroom: classroomId,
      type: 'classroom_creation',
      status: 'pending'
    }).populate('requestedBy', 'fullName email');

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'No pending approval request found for this classroom',
      });
    }

    const classroom = await Classroom.findById(classroomId);
    if (!classroom) {
      return res.status(404).json({
        success: false,
        message: 'Classroom not found',
      });
    }

    // Check if classroom is already active
    if (classroom.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Classroom is already active',
      });
    }

    // Update request status
    request.status = 'approved';
    request.reviewedBy = req.user._id;
    request.reviewedAt = new Date();
    if (reason) request.reason = reason;
    await request.save();

    // Activate classroom and update status
    classroom.isActive = true;
    classroom.status = 'active';
    await classroom.save();

    // Notify teacher
    await sendNotification(
      'Classroom Approved',
      `Your classroom "${classroom.name}" (${classroom.code}) has been approved and is now active${reason ? `. Note: ${reason}` : ''}`,
      'system',
      req.user._id,
      [request.requestedBy._id],
      classroom._id
    );

    res.status(200).json({
      success: true,
      message: 'Classroom approved successfully',
      data: {
        request: {
          _id: request._id,
          type: request.type,
          status: request.status,
          reviewedBy: req.user.fullName,
          reviewedAt: request.reviewedAt,
          reason: request.reason
        },
        classroom: {
          _id: classroom._id,
          name: classroom.name,
          code: classroom.code,
          isActive: classroom.isActive,
          status: classroom.status,
          teacher: classroom.teacher
        }
      }
    });
  } catch (error) {
    console.error('Error approving classroom:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while approving classroom',
    });
  }
};

const rejectClassroom = async (req, res) => {
  try {
    const { classroomId } = req.params;
    const { reason } = req.body;
    
    // Validate admin role (additional safety check)
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only administrators can reject classrooms',
      });
    }

    // Validate required reason
    if (!reason || reason.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required',
      });
    }
    
    // Find pending creation request
    const request = await Request.findOne({
      classroom: classroomId,
      type: 'classroom_creation',
      status: 'pending'
    }).populate('requestedBy', 'fullName email');

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'No pending approval request found for this classroom',
      });
    }

    const classroom = await Classroom.findById(classroomId);
    if (!classroom) {
      return res.status(404).json({
        success: false,
        message: 'Classroom not found',
      });
    }

    // Update request status
    request.status = 'rejected';
    request.reviewedBy = req.user._id;
    request.reviewedAt = new Date();
    request.reason = reason.trim();
    await request.save();

    // Update classroom status
    classroom.status = 'inactive';
    await classroom.save();

    // Notify teacher
    await sendNotification(
      'Classroom Rejected',
      `Your classroom "${classroom.name}" (${classroom.code}) has been rejected. Reason: ${request.reason}`,
      'system',
      req.user._id,
      [request.requestedBy._id],
      classroom._id
    );

    res.status(200).json({
      success: true,
      message: 'Classroom rejected successfully',
      data: {
        request: {
          _id: request._id,
          type: request.type,
          status: request.status,
          reviewedBy: req.user.fullName,
          reviewedAt: request.reviewedAt,
          reason: request.reason
        },
        classroom: {
          _id: classroom._id,
          name: classroom.name,
          code: classroom.code,
          isActive: classroom.isActive,
          status: classroom.status
        }
      }
    });
  } catch (error) {
    console.error('Error rejecting classroom:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while rejecting classroom',
    });
  }
};

const rejectDeletionRequest = async (req, res) => {
  try {
    const { classroomId } = req.params;
    const { reason } = req.body;
    
    // Validate admin role (additional safety check)
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only administrators can reject deletion requests',
      });
    }

    // Validate required reason
    if (!reason || reason.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required',
      });
    }
    
    // Find pending deletion request
    const request = await Request.findOne({
      classroom: classroomId,
      type: 'classroom_deletion',
      status: 'pending'
    }).populate('requestedBy', 'fullName email');

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'No pending deletion request found for this classroom',
      });
    }

    const classroom = await Classroom.findById(classroomId);
    if (!classroom) {
      return res.status(404).json({
        success: false,
        message: 'Classroom not found',
      });
    }

    // Reset status to active after deletion rejection
    classroom.status = 'active';
    await classroom.save();

    // Update request status
    request.status = 'rejected';
    request.reviewedBy = req.user._id;
    request.reviewedAt = new Date();
    request.reason = reason.trim();
    await request.save();

    // Notify teacher
    await sendNotification(
      'Classroom Deletion Rejected',
      `Your deletion request for classroom "${classroom.name}" (${classroom.code}) has been rejected. Reason: ${request.reason}`,
      'system',
      req.user._id,
      [request.requestedBy._id],
      classroom._id
    );

    res.status(200).json({
      success: true,
      message: 'Classroom deletion rejected successfully',
      data: {
        request: {
          _id: request._id,
          type: request.type,
          status: request.status,
          reviewedBy: req.user.fullName,
          reviewedAt: request.reviewedAt,
          reason: request.reason
        },
        classroom: {
          _id: classroom._id,
          name: classroom.name,
          code: classroom.code,
          status: classroom.status,
          isActive: classroom.isActive
        }
      }
    });
  } catch (error) {
    console.error('Error rejecting deletion:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while rejecting deletion',
    });
  }
};

// Test endpoint - simple approve edit request
const testApproveEditRequest = async (req, res) => {
  try {
    const { classroomId } = req.params;
    const { reason } = req.body;
    
    // Simple validation
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    // Find request
    const request = await Request.findOne({
      classroom: classroomId,
      type: 'classroom_edit',
      status: 'pending'
    }).populate('requestedBy', 'fullName email');

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Request not found'
      });
    }

    // Find classroom
    const classroom = await Classroom.findById(classroomId);
    if (!classroom) {
      return res.status(404).json({
        success: false,
        message: 'Classroom not found'
      });
    }

    // Apply changes if requestData exists
    if (request.requestData) {
      const { requestData } = request;
      Object.keys(requestData).forEach(key => {
        if (key !== 'originalData' && key !== 'settings') {
          classroom[key] = requestData[key];
        }
      });
      
      if (requestData.settings) {
        classroom.settings = { ...classroom.settings, ...requestData.settings };
      }
    }

    classroom.status = 'active';
    await classroom.save();

    // Update request
    request.status = 'approved';
    request.reviewedBy = req.user._id;
    request.reviewedAt = new Date();
    if (reason) request.reason = reason;
    await request.save();

    res.json({
      success: true,
      message: 'Edit request approved successfully',
      data: { classroom, request }
    });

  } catch (error) {
    console.error('Test approve error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Reject classroom edit request
const rejectEditRequest = async (req, res) => {
  try {
    const { classroomId } = req.params;
    const { reason } = req.body;
    
    // Validate admin role
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only administrators can reject edit requests',
      });
    }

    // Validate required reason
    if (!reason || reason.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required',
      });
    }
    
    // Find pending edit request
    const request = await Request.findOne({
      classroom: classroomId,
      type: 'classroom_edit',
      status: 'pending'
    }).populate('requestedBy', 'fullName email');

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'No pending edit request found for this classroom',
      });
    }

    const classroom = await Classroom.findById(classroomId);
    if (!classroom) {
      return res.status(404).json({
        success: false,
        message: 'Classroom not found',
      });
    }

    // Reset status to active after edit rejection
    classroom.status = 'active';
    await classroom.save();

    // Update request status
    request.status = 'rejected';
    request.reviewedBy = req.user._id;
    request.reviewedAt = new Date();
    request.reason = reason.trim();
    await request.save();

    // Notify teacher
    await sendNotification(
      'Classroom Edit Rejected',
      `Your edit request for classroom "${classroom.name}" (${classroom.code}) has been rejected. Reason: ${request.reason}`,
      'system',
      req.user._id,
      [request.requestedBy._id],
      classroom._id
    );

    res.status(200).json({
      success: true,
      message: 'Classroom edit rejected successfully',
      data: {
        request: {
          _id: request._id,
          type: request.type,
          status: request.status,
          reviewedBy: req.user.fullName,
          reviewedAt: request.reviewedAt,
          reason: request.reason
        },
        classroom: {
          _id: classroom._id,
          name: classroom.name,
          code: classroom.code,
          status: classroom.status,
          isActive: classroom.isActive
        }
      }
    });
  } catch (error) {
    console.error('Error rejecting edit request:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while rejecting edit request',
    });
  }
};

// Student functions
const joinClassroom = async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'Class code is required',
      });
    }

    const classroom = await Classroom.findOne({ 
      code: code.toUpperCase(), 
      deleted: false,
      isActive: true 
    }).populate('teacher', 'fullName email');

    if (!classroom) {
      return res.status(404).json({
        success: false,
        message: 'Classroom not found or not active',
      });
    }

    // Check if student is already in the classroom
    const existingStudent = classroom.students.find(
      student => student.student.toString() === req.user._id.toString()
    );

    if (existingStudent) {
      return res.status(400).json({
        success: false,
        message: 'You are already enrolled in this classroom',
      });
    }

    // Check if classroom is full
    if (classroom.students.length >= classroom.maxStudents) {
      return res.status(400).json({
        success: false,
        message: 'Classroom is full',
      });
    }

    // Add student to classroom
    classroom.students.push({
      student: req.user._id,
      joinedAt: new Date(),
      status: 'active'
    });

    await classroom.save();

    // Notify teacher
    await sendNotification(
      'New Student Joined',
      `${req.user.fullName} has joined your classroom "${classroom.name}" (${classroom.code})`,
      'classroom',
      req.user._id,
      [classroom.teacher._id],
      classroom._id
    );

    res.status(200).json({
      success: true,
      message: 'Successfully joined classroom',
      data: {
        classroomId: classroom._id,
        classroomName: classroom.name,
        classroomCode: classroom.code,
        teacher: classroom.teacher.fullName
      }
    });
  } catch (error) {
    console.error('Error joining classroom:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while joining classroom',
    });
  }
};

const leaveClassroom = async (req, res) => {
  try {
    const { classroomId } = req.params;

    const classroom = await Classroom.findById(classroomId).populate('teacher', 'fullName email');

    if (!classroom) {
      return res.status(404).json({
        success: false,
        message: 'Classroom not found',
      });
    }

    // Find and remove student from classroom
    const studentIndex = classroom.students.findIndex(
      student => student.student.toString() === req.user._id.toString()
    );

    if (studentIndex === -1) {
      return res.status(400).json({
        success: false,
        message: 'You are not enrolled in this classroom',
      });
    }

    classroom.students.splice(studentIndex, 1);
    await classroom.save();

    // Notify teacher
    await sendNotification(
      'Student Left Classroom',
      `${req.user.fullName} has left your classroom "${classroom.name}" (${classroom.code})`,
      'classroom',
      req.user._id,
      [classroom.teacher._id],
      classroom._id
    );

    res.status(200).json({
      success: true,
      message: 'Successfully left classroom',
    });
  } catch (error) {
    console.error('Error leaving classroom:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while leaving classroom',
    });
  }
};

const getStudentClassrooms = async (req, res) => {
  try {
    const classrooms = await Classroom.find({
      'students.student': req.user._id,
      'students.status': 'active',
      deleted: false,
      isActive: true
    }).populate('teacher', 'fullName email')
      .populate('students.student', 'fullName email');

    res.status(200).json({
      success: true,
      data: classrooms,
    });
  } catch (error) {
    console.error('Error getting student classrooms:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching classrooms',
    });
  }
};

const getClassroomStudents = async (req, res) => {
  try {
    const { classroomId } = req.params;
    
    const classroom = await Classroom.findById(classroomId)
      .populate('students.student', 'fullName email dateOfBirth phone')
      .populate('teacher', 'fullName email');

    if (!classroom) {
      return res.status(404).json({
        success: false,
        message: 'Classroom not found',
      });
    }

    // Check authorization - only teacher of the class or admin can view
    if (req.user.role !== 'admin' && classroom.teacher._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this classroom\'s students',
      });
    }

    // TODO: Get student scores and submission counts from assignments/quizzes
    const studentsWithStats = classroom.students.map(studentEntry => ({
      ...studentEntry.toObject(),
      // Placeholder for actual stats - to be implemented with assignment/quiz system
      averageScore: Math.floor(Math.random() * 30) + 70, // Random score for demo
      submissionCount: Math.floor(Math.random() * 10) + 5 // Random count for demo
    }));

    res.status(200).json({
      success: true,
      data: {
        classroom: {
          _id: classroom._id,
          name: classroom.name,
          code: classroom.code,
          subject: classroom.subject,
          teacher: classroom.teacher
        },
        students: studentsWithStats
      }
    });
  } catch (error) {
    console.error('Error getting classroom students:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching classroom students',
    });
  }
};

// Get detailed classroom information for students
const getClassroomDetail = async (req, res) => {
  try {
    const { classroomId } = req.params;
    
    const classroom = await Classroom.findById(classroomId)
      .populate('teacher', 'fullName email')
      .populate('students.student', 'fullName email');

    if (!classroom) {
      return res.status(404).json({
        success: false,
        message: 'Classroom not found',
      });
    }

    // Check if classroom is deleted
    if (classroom.deleted) {
      return res.status(404).json({
        success: false,
        message: 'Classroom has been deleted',
      });
    }

    // For students, check if they are enrolled in the classroom
    if (req.user.role === 'student') {
      const isEnrolled = classroom.students.some(
        student => student.student._id.toString() === req.user._id.toString() && student.status === 'active'
      );

      if (!isEnrolled) {
        return res.status(403).json({
          success: false,
          message: 'You are not enrolled in this classroom',
        });
      }

      // Students can view classroom details regardless of status as long as they're enrolled
      // but some features may be limited for non-active classrooms
    }

    // For teachers, check if they own the classroom OR if they are admin
    if (req.user.role === 'teacher' && classroom.teacher._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to view this classroom',
      });
    }

    // Admin can view any classroom (no additional check needed)

    // Prepare response data
    const responseData = {
      _id: classroom._id,
      name: classroom.name,
      code: classroom.code,
      description: classroom.description,
      category: classroom.category,
      level: classroom.level,
      maxStudents: classroom.maxStudents,
      status: classroom.status,
      isActive: classroom.isActive,
      isArchived: classroom.isArchived,
      teacher: classroom.teacher,
      totalStudents: classroom.students.filter(s => s.status === 'active').length,
      settings: classroom.settings || {},
      createdAt: classroom.createdAt,
      updatedAt: classroom.updatedAt
    };

    // Include student list for teacher and admin roles
    if (req.user.role === 'teacher' || req.user.role === 'admin') {
      responseData.students = classroom.students.filter(s => s.status === 'active');
    }

    // For students, add their enrollment info
    if (req.user.role === 'student') {
      const studentInfo = classroom.students.find(
        s => s.student._id.toString() === req.user._id.toString()
      );
      if (studentInfo) {
        responseData.myEnrollment = {
          joinedAt: studentInfo.joinedAt,
          status: studentInfo.status
        };
      }
    }

    // Show recent activities for all users
    responseData.recentActivities = [
      {
        id: 1,
        type: 'announcement',
        title: 'Welcome to the class!',
        content: 'Please check the course materials regularly.',
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
        author: classroom.teacher.fullName
      },
      {
        id: 2,
        type: 'assignment',
        title: 'Assignment 1 posted',
        content: 'Please complete Assignment 1 by next week.',
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        author: classroom.teacher.fullName
      }
    ];

    // Show upcoming events for active classrooms, limited events for inactive ones
    if (classroom.status === 'active') {
      responseData.upcomingEvents = [
        {
          id: 1,
          type: 'quiz',
          title: 'Chapter 1 Quiz',
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
          description: 'Quiz covering Chapter 1 materials'
        },
        {
          id: 2,
          type: 'assignment',
          title: 'Project Proposal',
          dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 2 weeks from now
          description: 'Submit your project proposal'
        }
      ];
    } else {
      // For inactive classrooms, show limited or no upcoming events
      responseData.upcomingEvents = [];
      // Add a note about classroom status for students
      if (req.user.role === 'student') {
        responseData.statusNote = 'This classroom is currently not active. New assignments and activities may be limited.';
      }
    }

    res.status(200).json({
      success: true,
      data: responseData
    });
  } catch (error) {
    console.error('Error getting classroom detail:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching classroom details',
    });
  }
};

// Get classroom materials (files, links, etc.)
const getClassroomMaterials = async (req, res) => {
  try {
    const { classroomId } = req.params;
    
    const classroom = await Classroom.findById(classroomId)
      .populate('teacher', 'fullName email')
      .populate('students.student', 'fullName email');

    if (!classroom) {
      return res.status(404).json({
        success: false,
        message: 'Classroom not found',
      });
    }

    // Check if classroom is deleted
    if (classroom.deleted) {
      return res.status(404).json({
        success: false,
        message: 'Classroom has been deleted',
      });
    }

    // Check authorization
    const isStudent = req.user.role === 'student' && classroom.students.some(
      s => s.student._id.toString() === req.user._id.toString() && s.status === 'active'
    );
    const isTeacher = req.user.role === 'teacher' && classroom.teacher._id.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isStudent && !isTeacher && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view classroom materials',
      });
    }

    // Students can only access materials of active classrooms
    if (req.user.role === 'student' && classroom.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'Classroom materials are not available',
      });
    }

    // Mock materials data (to be replaced with actual materials system)
    const materials = [
      {
        id: 1,
        title: 'Course Syllabus',
        type: 'document',
        fileUrl: '/files/syllabus.pdf',
        fileSize: '2.3 MB',
        uploadedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        uploadedBy: classroom.teacher
      },
      {
        id: 2,
        title: 'Lecture 1: Introduction',
        type: 'presentation',
        fileUrl: '/files/lecture1.pptx',
        fileSize: '15.7 MB',
        uploadedAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
        uploadedBy: classroom.teacher
      },
      {
        id: 3,
        title: 'Reference Links',
        type: 'link',
        links: [
          { title: 'Official Documentation', url: 'https://example.com/docs' },
          { title: 'Tutorial Videos', url: 'https://example.com/videos' }
        ],
        uploadedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
        uploadedBy: classroom.teacher
      }
    ];

    res.status(200).json({
      success: true,
      data: materials
    });
  } catch (error) {
    console.error('Error getting classroom materials:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching classroom materials',
    });
  }
};

module.exports = { 
  getTeacherClassrooms, 
  getAllClassrooms, 
  deleteClassroom, 
  createClassroom, 
  updateClassroom,
  approveClassroom,
  rejectClassroom,
  approveDeletionRequest,
  rejectDeletionRequest,
  testApproveEditRequest,
  rejectEditRequest,
  joinClassroom,
  leaveClassroom,
  getStudentClassrooms,
  getClassroomStudents,
  getClassroomDetail,
  getClassroomMaterials
};