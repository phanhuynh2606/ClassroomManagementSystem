const Notification = require('../models/notification.model');
const User = require('../models/user.model');
const Classroom = require('../models/classroom.model');
const httpStatus = require('http-status');

// Get notifications for current user
const getNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 20, type, priority } = req.query;
    const userId = req.user._id;

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      type: type || null,
      priority: priority || null
    };

    const notifications = await Notification.getForUser(userId, options);

    res.json({
      success: true,
      data: {
        notifications,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(notifications.length / limit)
      }
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Error getting notifications',
      error: error.message
    });
  }
};



// Create notification (Admin/Teacher only)
const createNotification = async (req, res) => {
  try {
    const {
      title,
      content,
      type,
      priority = 'normal',
      recipientIds = [],
      classroomId,
      targetRole,
      metadata = {}
    } = req.body;

    const senderId = req.user._id;
    const senderRole = req.user.role;

    // Validate permissions
    if (type === 'system' && senderRole !== 'admin') {
      return res.status(httpStatus.FORBIDDEN).json({
        success: false,
        message: 'Only admins can send system notifications'
      });
    }

    if (['class_general', 'class_specific'].includes(type) && senderRole !== 'teacher' && senderRole !== 'admin') {
      return res.status(httpStatus.FORBIDDEN).json({
        success: false,
        message: 'Only teachers can send class notifications'
      });
    }

    // Get recipients
    let recipients = [];

    if (type === 'system') {
      // System notification to all users or specific role
      const query = { isActive: true };
      if (targetRole && targetRole !== 'all') {
        query.role = targetRole;
      }
      const users = await User.find(query).select('_id');
      recipients = users.map(user => user._id);
    } else if (type === 'class_general' && classroomId) {
      // Notification to entire class
      const classroom = await Classroom.findById(classroomId).populate('students.student', '_id');
      if (!classroom) {
        return res.status(httpStatus.NOT_FOUND).json({
          success: false,
          message: 'Classroom not found'
        });
      }

      // Check if user is teacher of this class
      if (senderRole === 'teacher' && classroom.teacher.toString() !== senderId.toString()) {
        return res.status(httpStatus.FORBIDDEN).json({
          success: false,
          message: 'Not authorized to send notifications to this class'
        });
      }

      recipients = classroom.students
        .filter(s => s.status === 'active')
        .map(s => s.student._id);
    } else if (type === 'class_specific' && recipientIds.length > 0) {
      // Notification to specific students in class
      if (classroomId) {
        const classroom = await Classroom.findById(classroomId);
        if (senderRole === 'teacher' && classroom.teacher.toString() !== senderId.toString()) {
          return res.status(httpStatus.FORBIDDEN).json({
            success: false,
            message: 'Not authorized to send notifications to this class'
          });
        }
      }

      recipients = recipientIds;
    } else if (type === 'personal' && recipientIds.length > 0) {
      recipients = recipientIds;
    } else {
      return res.status(httpStatus.BAD_REQUEST).json({
        success: false,
        message: 'Invalid notification configuration'
      });
    }

    if (recipients.length === 0) {
      return res.status(httpStatus.BAD_REQUEST).json({
        success: false,
        message: 'No recipients found'
      });
    }

    const notification = new Notification({
      title,
      content,
      type,
      priority,
      sender: senderId,
      recipients,
      classroom: classroomId || null,
      targetRole,
      metadata
    });

    await notification.save();
    await notification.populate('sender', 'fullName email role image');

    // Emit real-time notification via Socket.IO
    const io = req.app.get('io');
    if (io) {
      recipients.forEach(recipientId => {
        io.to(`user_${recipientId}`).emit('newNotification', {
          notification: {
            _id: notification._id,
            title: notification.title,
            content: notification.content,
            type: notification.type,
            priority: notification.priority,
            sender: notification.sender,
            createdAt: notification.createdAt,
            metadata: notification.metadata
          }
        });
      });
    }

    res.status(201).json({
      success: true,
      data: notification,
      message: `Notification sent to ${recipients.length} recipients`
    });
  } catch (error) {
    console.error('Create notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating notification',
      error: error.message
    });
  }
};

// Get all notifications (Admin only)
const getAllNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 20, type, priority, sender } = req.query;

    const query = { isDeleted: false };

    if (type) query.type = type;
    if (priority) query.priority = priority;
    if (sender) query.sender = sender;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [notifications, total] = await Promise.all([
      Notification.find(query)
        .populate('sender', 'fullName email role image')
        .populate('classroom', 'name code')
        .populate('recipients.user', 'fullName email role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Notification.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: {
        notifications,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Get all notifications error:', error);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Error getting notifications',
      error: error.message
    });
  }
};

// Delete notification (Admin/Sender only)
const deleteNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user._id;
    const userRole = req.user.role;

    const notification = await Notification.findById(notificationId);
    if (!notification) {
      return res.status(httpStatus.NOT_FOUND).json({
        success: false,
        message: 'Notification not found'
      });
    }

    // Check permissions
    const canDelete = userRole === 'admin' || 
                     notification.sender.toString() === userId.toString();

    if (!canDelete) {
      return res.status(httpStatus.FORBIDDEN).json({
        success: false,
        message: 'Not authorized to delete this notification'
      });
    }

    await Notification.findByIdAndUpdate(notificationId, {
      isDeleted: true,
      isActive: false
    });

    res.json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Error deleting notification',
      error: error.message
    });
  }
};

// Get classroom students for notification creation (Teacher only)
const getClassroomStudents = async (req, res) => {
  try {
    const { classroomId } = req.params;
    const userId = req.user._id;
    const userRole = req.user.role;

    const classroom = await Classroom.findById(classroomId)
      .populate('students.student', 'fullName email image');

    if (!classroom) {
      return res.status(httpStatus.NOT_FOUND).json({
        success: false,
        message: 'Classroom not found'
      });
    }

    // Check if user is teacher of this class or admin
    if (userRole === 'teacher' && classroom.teacher.toString() !== userId.toString()) {
      return res.status(httpStatus.FORBIDDEN).json({
        success: false,
        message: 'Not authorized to access this classroom'
      });
    }

    const activeStudents = classroom.students
      .filter(s => s.status === 'active')
      .map(s => ({
        _id: s.student._id,
        fullName: s.student.fullName,
        email: s.student.email,
        image: s.student.image,
        joinedAt: s.joinedAt
      }));

    res.json({
      success: true,
      data: {
        classroom: {
          _id: classroom._id,
          name: classroom.name,
          code: classroom.code
        },
        students: activeStudents
      }
    });
  } catch (error) {
    console.error('Get classroom students error:', error);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Error getting classroom students',
      error: error.message
    });
  }
};

module.exports = {
  getNotifications,
  createNotification,
  getAllNotifications,
  deleteNotification,
  getClassroomStudents
}; 