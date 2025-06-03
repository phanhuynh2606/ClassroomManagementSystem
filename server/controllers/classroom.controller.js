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

            return {
              ...classroom.toObject(),
              approvalStatus: latestRequest?.status || 'approved', // Default approved for existing
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
      level,
    } = req.body;

    if (!name || !maxStudents || !category || !level) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
      });
    }

    // Generate unique classroom code
    const code = await generateClassroomCode();

    // Create classroom (inactive by default)
    const newClassroom = await Classroom.create({
      name,
      code,
      description,
      maxStudents,
      category,
      level,
      teacher: req.user._id,
      isActive: req.user.role === 'admin' // Admin created classrooms are active immediately
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
      subject,
      description,
      maxStudents,
      category,
      level,
      schedule,
      isActive,
      isArchived,
      settings
    } = req.body;

    const classroom = await Classroom.findById(classroomId);

    if (!classroom) {
      return res.status(404).json({
        success: false,
        message: 'Classroom not found',
      });
    }

    // Check authorization
    if (req.user.role === 'teacher' && classroom.teacher.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this classroom',
      });
    }

    // Update fields
    if (name !== undefined) classroom.name = name;
    if (code !== undefined) classroom.code = code;
    if (subject !== undefined) classroom.subject = subject;
    if (description !== undefined) classroom.description = description;
    if (maxStudents !== undefined) classroom.maxStudents = maxStudents;
    if (category !== undefined) classroom.category = category;
    if (level !== undefined) classroom.level = level;
    if (schedule !== undefined) classroom.schedule = schedule;
    if (isActive !== undefined && req.user.role === 'admin') classroom.isActive = isActive;
    if (isArchived !== undefined) classroom.isArchived = isArchived;
    if (settings) {
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
    });
  }
};

// New functions for admin approval workflow
const approveDeletionRequest = async (req, res) => {
  try {
    const { classroomId } = req.params;
    
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

    // Update request status
    request.status = 'approved';
    request.reviewedBy = req.user._id;
    request.reviewedAt = new Date();
    await request.save();

    // Delete the classroom
    classroom.deleted = true;
    classroom.deletedAt = new Date();
    classroom.deletedBy = req.user._id;
    await classroom.save();

    // Notify teacher
    await sendNotification(
      'Classroom Deletion Approved',
      `Your deletion request for classroom "${classroom.name}" (${classroom.code}) has been approved`,
      'system',
      req.user._id,
      [request.requestedBy._id],
      classroom._id
    );

    res.status(200).json({
      success: true,
      message: 'Classroom deletion approved successfully',
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
    request.status = 'approved';
    request.reviewedBy = req.user._id;
    request.reviewedAt = new Date();
    await request.save();

    // Activate classroom
    classroom.isActive = true;
    await classroom.save();

    // Notify teacher
    await sendNotification(
      'Classroom Approved',
      `Your classroom "${classroom.name}" (${classroom.code}) has been approved and is now active`,
      'system',
      req.user._id,
      [request.requestedBy._id],
      classroom._id
    );

    res.status(200).json({
      success: true,
      message: 'Classroom approved successfully',
      data: classroom,
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
    request.reason = reason || 'No reason provided';
    await request.save();

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
      data: { classroom, request },
    });
  } catch (error) {
    console.error('Error rejecting classroom:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while rejecting classroom',
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
      approvalStatus: 'approved',
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

module.exports = { 
  getTeacherClassrooms, 
  getAllClassrooms, 
  deleteClassroom, 
  createClassroom, 
  updateClassroom,
  approveClassroom,
  rejectClassroom,
  approveDeletionRequest,
  joinClassroom,
  leaveClassroom,
  getStudentClassrooms,
  getClassroomStudents
};