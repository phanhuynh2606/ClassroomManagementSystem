const Request = require('../models/request.model');
const Classroom = require('../models/classroom.model');

// Get all requests
const getAllRequests = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const { status, type, search, startDate, endDate } = req.query;

    console.log('getAllRequests filters:', { status, type, search, startDate, endDate });

    // Build filter
    const filter = {};
    if (status) filter.status = status;
    if (type) filter.type = type;

    // Date range filter
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate + 'T23:59:59.999Z');
    }

    // If search is provided, use aggregation pipeline
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      const searchFilter = {
        $or: [
          { 'classroom.name': searchRegex },
          { 'requestedBy.fullName': searchRegex },
          { 'requestedBy.email': searchRegex }
        ]
      };

      const aggregateQuery = [
        {
          $lookup: {
            from: 'users',
            localField: 'requestedBy',
            foreignField: '_id',
            as: 'requestedBy'
          }
        },
        { $unwind: '$requestedBy' },
        {
          $lookup: {
            from: 'users',
            localField: 'reviewedBy',
            foreignField: '_id',
            as: 'reviewedBy'
          }
        },
        {
          $lookup: {
            from: 'classrooms',
            localField: 'classroom',
            foreignField: '_id',
            as: 'classroom'
          }
        },
        { $unwind: { path: '$classroom', preserveNullAndEmptyArrays: true } },
        { $match: { ...filter, ...searchFilter } },
        { $sort: { createdAt: -1 } }
      ];

      const [requests, total] = await Promise.all([
        Request.aggregate([
          ...aggregateQuery,
          { $skip: skip },
          { $limit: limit }
        ]),
        Request.aggregate([
          ...aggregateQuery,
          { $count: 'total' }
        ])
      ]);

      return res.status(200).json({
        success: true,
        data: requests,
        pagination: {
          page,
          limit,
          total: total[0]?.total || 0,
          pages: Math.ceil((total[0]?.total || 0) / limit)
        }
      });
    }

    // For non-search queries, use regular find with populate
    const [requests, total] = await Promise.all([
      Request.find(filter)
        .populate('requestedBy', 'fullName email')
        .populate('reviewedBy', 'fullName email')
        .populate('classroom', 'name code')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      Request.countDocuments(filter)
    ]);

    res.status(200).json({
      success: true,
      data: requests,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// Get request by teacher id
const getRequestsByTeacherId = async (req, res) => {
  try {
    const { user_id, classroom_id } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [requests, total] = await Promise.all([
      Request.find({ requestedBy: user_id, classroom: classroom_id })
        .populate('requestedBy', 'fullName email')
        .populate('reviewedBy', 'fullName email')
        .populate('classroom', 'name code')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      Request.countDocuments({ requestedBy: user_id, classroom: classroom_id })
    ]);

    res.status(200).json({
      success: true,
      data: requests,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// Get requests by teacher (all teacher's requests regardless of classroom)
const getTeacherRequests = async (req, res) => {
  try {
    const { teacherId } = req.params;
    const { status, type } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build filter
    const filter = { requestedBy: teacherId };
    if (status) filter.status = status;
    if (type) filter.type = type;

    const [requests, total] = await Promise.all([
      Request.find(filter)
        .populate('requestedBy', 'fullName email')
        .populate('reviewedBy', 'fullName email')
        .populate('classroom', 'name code')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      Request.countDocuments(filter)
    ]);

    res.status(200).json({
      success: true,
      data: requests,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// Get request by classroom id
const getRequestsByClassroomId = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [requests, total] = await Promise.all([
      Request.find({ classroom: req.params.classroomId })
        .populate('requestedBy', 'fullName email')
        .populate('reviewedBy', 'fullName email')
        .populate('classroom', 'name code')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      Request.countDocuments({ classroom: req.params.classroomId })
    ]);

    res.status(200).json({
      success: true,
      data: requests,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// Get pending requests for admin
const getPendingRequests = async (req, res) => {
  try {
    const { type, search, startDate, endDate } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build filter
    const filter = { status: 'pending' };
    if (type) filter.type = type;

    // Date range filter
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate + 'T23:59:59.999Z');
    }

    // Search filter
    let searchFilter = {};
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      searchFilter = {
        $or: [
          { 'classroom.name': searchRegex },
          { 'requestedBy.fullName': searchRegex },
          { 'requestedBy.email': searchRegex }
        ]
      };
    }

    if (search) {
      // Use aggregation for search
      const aggregateQuery = [
        {
          $lookup: {
            from: 'users',
            localField: 'requestedBy',
            foreignField: '_id',
            as: 'requestedBy'
          }
        },
        { $unwind: '$requestedBy' },
        {
          $lookup: {
            from: 'classrooms',
            localField: 'classroom',
            foreignField: '_id',
            as: 'classroom'
          }
        },
        { $unwind: { path: '$classroom', preserveNullAndEmptyArrays: true } },
        { $match: { ...filter, ...searchFilter } },
        { $sort: { createdAt: -1 } }
      ];

      const [requests, total] = await Promise.all([
        Request.aggregate([
          ...aggregateQuery,
          { $skip: skip },
          { $limit: limit }
        ]),
        Request.aggregate([
          ...aggregateQuery,
          { $count: 'total' }
        ])
      ]);

      return res.status(200).json({
        success: true,
        data: requests,
        pagination: {
          page,
          limit,
          total: total[0]?.total || 0,
          pages: Math.ceil((total[0]?.total || 0) / limit)
        }
      });
    }

    const [requests, total] = await Promise.all([
      Request.find(filter)
        .populate('requestedBy', 'fullName email')
        .populate('classroom', 'name code')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      Request.countDocuments(filter)
    ]);

    res.status(200).json({
      success: true,
      data: requests,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// Get request details
const getRequestDetails = async (req, res) => {
  try {
    const request = await Request.findById(req.params.requestId)
      .populate('requestedBy', 'fullName email')
      .populate('reviewedBy', 'fullName email')
      .populate('classroom', 'name code');
    
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Request not found'
      });
    }

    res.status(200).json({
      success: true,
      data: request
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// Create request
const createRequest = async (req, res) => {
  try {
    const { type, classroomId, data } = req.body;
    const requestedBy = req.user._id;

    // Validate request type
    const validTypes = [
      'classroom_creation',
      'classroom_deletion',
      'classroom_edit',
      'classroom_join',
      'classroom_leave',
      'classroom_teacher_change'
    ];

    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request type'
      });
    }

    // Create request
    const request = await Request.create({
      type,
      classroom: classroomId,
      requestedBy,
      data,
      status: 'pending'
    });

    // Populate request details
    await request.populate([
      { path: 'requestedBy', select: 'fullName email' },
      { path: 'classroom', select: 'name code' }
    ]);

    res.status(201).json({
      success: true,
      data: request
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Approve request
const approveRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { comment } = req.body;
    const reviewedBy = req.user._id;

    const request = await Request.findById(requestId);
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Request not found'
      });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Request is not pending'
      });
    }

    // Handle different request types
    switch (request.type) {
      case 'classroom_creation':
        // Find the existing classroom
        const creationClassroom = await Classroom.findById(request.classroom);
        if (!creationClassroom) {
          return res.status(404).json({
            success: false,
            message: 'Classroom not found'
          });
        }

        // Update classroom status to active
        creationClassroom.status = 'active';
        creationClassroom.isActive = true;
        await creationClassroom.save();
        break;

      case 'classroom_deletion':
        // Find and mark classroom as deleted
        const deletionClassroom = await Classroom.findById(request.classroom);
        if (deletionClassroom) {
          deletionClassroom.status = 'deleted';
          deletionClassroom.deleted = true;
          deletionClassroom.isActive = false;
          await deletionClassroom.save();
        }
        break;

      case 'classroom_edit':
        // Update classroom with requested changes
        const editClassroom = await Classroom.findById(request.classroom);
        if (editClassroom && request.requestData) {
          // Apply the requested changes
          Object.keys(request.requestData).forEach(key => {
            if (key !== 'currentData' && key !== 'changes') {
              editClassroom[key] = request.requestData[key];
            }
          });
          
          // If requestData has changes field, apply those
          if (request.requestData.changes) {
            Object.keys(request.requestData.changes).forEach(key => {
              editClassroom[key] = request.requestData.changes[key];
            });
          }
          
          editClassroom.status = 'active';
          await editClassroom.save();
        }
        break;

      case 'classroom_join':
        // Add student to classroom
        const joinClassroom = await Classroom.findById(request.classroom);
        if (joinClassroom) {
          joinClassroom.students = joinClassroom.students || [];
          if (!joinClassroom.students.some(s => s.student.toString() === request.requestedBy.toString())) {
            joinClassroom.students.push({
              student: request.requestedBy,
              joinedAt: new Date(),
              status: 'active'
            });
            await joinClassroom.save();
          }
        }
        break;

      case 'classroom_leave':
        // Remove student from classroom
        const leaveClassroom = await Classroom.findById(request.classroom);
        if (leaveClassroom) {
          leaveClassroom.students = leaveClassroom.students.filter(
            s => s.student.toString() !== request.requestedBy.toString()
          );
          await leaveClassroom.save();
        }
        break;

      case 'classroom_teacher_change':
        // Change classroom teacher
        const teacherChangeClassroom = await Classroom.findById(request.classroom);
        if (teacherChangeClassroom && request.requestData?.newTeacherId) {
          teacherChangeClassroom.teacher = request.requestData.newTeacherId;
          await teacherChangeClassroom.save();
        }
        break;

      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid request type'
        });
    }

    // Update request status
    request.status = 'approved';
    request.reviewedBy = reviewedBy;
    request.reviewComment = comment;
    request.reviewedAt = new Date();
    await request.save();

    // Populate request details
    await request.populate([
      { path: 'requestedBy', select: 'fullName email' },
      { path: 'reviewedBy', select: 'fullName email' },
      { path: 'classroom', select: 'name code' }
    ]);

    res.status(200).json({
      success: true,
      message: 'Request approved successfully',
      data: request
    });

  } catch (error) {
    console.error('Error approving request:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while approving request',
      error: error.message
    });
  }
};

// Reject request
const rejectRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { reason } = req.body;
    const reviewedBy = req.user._id;

    const request = await Request.findById(requestId);
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Request not found'
      });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Request is not pending'
      });
    }

    // For rejected requests, we may need to update classroom status
    if (request.type === 'classroom_creation') {
      // For rejected creation requests, mark classroom as rejected
      const classroom = await Classroom.findById(request.classroom);
      if (classroom) {
        classroom.status = 'rejected';
        classroom.isActive = false;
        await classroom.save();
      }
    } else if (request.type === 'classroom_edit' || request.type === 'classroom_deletion') {
      // For rejected edit/deletion requests, revert classroom status to active
      const classroom = await Classroom.findById(request.classroom);
      if (classroom && classroom.status !== 'deleted') {
        classroom.status = 'active';
        await classroom.save();
      }
    }

    // Update request status
    request.status = 'rejected';
    request.reviewedBy = reviewedBy;
    request.reviewComment = reason;
    request.reviewedAt = new Date();
    await request.save();

    // Populate request details
    await request.populate([
      { path: 'requestedBy', select: 'fullName email' },
      { path: 'reviewedBy', select: 'fullName email' },
      { path: 'classroom', select: 'name code' }
    ]);

    res.status(200).json({
      success: true,
      message: 'Request rejected successfully',
      data: request
    });
  } catch (error) {
    console.error('Error rejecting request:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while rejecting request',
      error: error.message
    });
  }
};

// Cancel request (by teacher)
const cancelRequest = async (req, res) => {
  try {
    const { requestId } = req.params;

    const request = await Request.findById(requestId)
      .populate('classroom', 'name code');

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Request not found'
      });
    }

    // Check if user owns the request
    if (request.requestedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this request'
      });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Can only cancel pending requests'
      });
    }

    // Delete the request
    await Request.findByIdAndDelete(requestId);

    res.status(200).json({
      success: true,
      message: 'Request cancelled successfully'
    });
  } catch (error) {
    console.error('Error cancelling request:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while cancelling request'
    });
  }
};

module.exports = {
  getAllRequests,
  getRequestsByTeacherId,
  getTeacherRequests,
  getRequestsByClassroomId,
  getPendingRequests,
  getRequestDetails,
  approveRequest,
  rejectRequest,
  cancelRequest,
  createRequest
};