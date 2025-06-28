const Stream = require('../models/stream.model');
const Classroom = require('../models/classroom.model');
const User = require('../models/user.model');
const { uploadToCloudinary } = require('../utils/Helper');
const Comment = require('../models/comment.model');
const { CloudinaryAPI } = require('../config/cloudinary.config');

// Create announcement
const createAnnouncement = async (req, res) => {
  try {
    const { classroomId } = req.params;
    const { title, content, attachments, targetAudience, targetStudents } = req.body;
    const authorId = req.user._id;
    if (!classroomId) {
      return res.status(400).json({
        success: false,
        message: 'Classroom ID is required'
      });
    }
    if (!title) {
      return res.status(400).json({
        success: false,
        message: 'Title is required'
      });
    }
    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'Content is required'
      });
    }

    // Verify classroom exists and user has permission
    const classroom = await Classroom.findById(classroomId);
    if (!classroom) {
      return res.status(404).json({
        success: false,
        message: 'Classroom not found'
      });
    }

    // Check permissions based on user role
    const userRole = req.user.role;
    
    if (userRole === 'teacher') {
      // Teachers can only post in their own classrooms
      if (classroom.teacher.toString() !== authorId.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to post in this classroom'
        });
      }
    } else if (userRole === 'student') {
      // Check if student is enrolled in the classroom
      const isEnrolled = classroom.students.some(s => 
        s.student.toString() === authorId.toString() && s.status === 'active'
      );
      
      if (!isEnrolled) {
        return res.status(403).json({
          success: false,
          message: 'You are not enrolled in this classroom'
        });
      }
      
      // Check classroom settings for student posting
      if (!classroom.settings?.allowStudentPost) {
        return res.status(403).json({
          success: false,
          message: 'Students are not allowed to post in this classroom'
        });
      }
    } else if (userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to post in this classroom'
      });
    }

    // Process attachments if any
    let processedAttachments = [];
    if (attachments && attachments.length > 0) {
      processedAttachments = attachments.map(attachment => ({
        name: attachment.name,
        url: attachment.url || attachment.file, // Handle both URL and file
        fileType: attachment.fileType || attachment.type,
        fileSize: attachment.fileSize, // Use fileSize field for bytes number
        size: attachment.size, // Keep size field for human-readable string
        thumbnail: attachment.thumbnail,
        duration: attachment.duration,
        viewCount: attachment.viewCount,
        channel: attachment.channel,
        channelThumbnail: attachment.channelThumbnail,
        videoId: attachment.videoId,
        metadata: attachment.metadata,
        description: attachment.description,
        title: attachment.title,
        type: attachment.type
      }));
    }

    // Determine post type based on user role
    const postType = userRole === 'student' ? 'student_post' : 'announcement';
    const postTitle = title || (userRole === 'student' ? 'Student Post' : 'Class Announcement');
    
    // Create announcement/post
    const postData = {
      title: postTitle,
      content: content,
      type: postType,
      classroom: classroomId,
      author: authorId,
      attachments: processedAttachments,
      targetAudience: targetAudience || 'all_students',
      targetStudents: targetStudents || [],
      status: 'published',
      publishAt: new Date()
    };

    const post = await Stream.create(postData);
    
    // Populate author info
    await post.populate('author', 'fullName email image role');

    res.status(201).json({
      success: true,
      message: `${userRole === 'student' ? 'Post' : 'Announcement'} created successfully`,
      data: post
    });

  } catch (error) {
    console.error('Error creating announcement:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error while creating announcement'
    });
  }
};

// Get classroom stream
const getClassroomStream = async (req, res) => {
  try {
    const { classroomId } = req.params;
    const { page = 1, limit = 20, type } = req.query;

    // Verify classroom exists and user has access
    const classroom = await Classroom.findById(classroomId);
    if (!classroom) {
      return res.status(404).json({
        success: false,
        message: 'Classroom not found'
      });
    }

    // Check user access to classroom
    const userId = req.user._id;
    const userRole = req.user.role;
    
    let hasAccess = false;
    if (userRole === 'admin') {
      hasAccess = true;
    } else if (userRole === 'teacher' && classroom.teacher.toString() === userId.toString()) {
      hasAccess = true;
    } else if (userRole === 'student' && classroom.students.some(s => s.student.toString() === userId.toString())) {
      hasAccess = true;
    }

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this classroom stream'
      });
    }

    // Get stream data
    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      type: type
    };

    const streamItems = await Stream.getClassroomStream(classroomId, options);
    
    // Get total count for pagination
    const totalCount = await Stream.countDocuments({
      classroom: classroomId,
      status: 'published',
      isActive: true,
      publishAt: { $lte: new Date() }
    });

    res.status(200).json({
      success: true,
      data: {
        items: streamItems,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalCount / parseInt(limit)),
          totalItems: totalCount,
          itemsPerPage: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Error fetching classroom stream:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching stream'
    });
  }
};

// Update announcement
const updateAnnouncement = async (req, res) => {
  try {
    const { streamId } = req.params;
    const { title, content, attachments } = req.body;
    const userId = req.user._id;

    // Find announcement
    const announcement = await Stream.findById(streamId);
    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found'
      });
    }

    // Check if user is author
    if (announcement.author.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this announcement'
      });
    }

    // Update fields
    if (title !== undefined) announcement.title = title;
    if (content !== undefined) announcement.content = content;
    if (attachments !== undefined) {
      announcement.attachments = attachments.map(attachment => ({
        name: attachment.name,
        url: attachment.url,
        fileType: attachment.fileType || attachment.type,
        fileSize: attachment.fileSize, // Use fileSize field for bytes number
        size: attachment.size, // Keep size field for human-readable string
        thumbnail: attachment.thumbnail,
        duration: attachment.duration,
        viewCount: attachment.viewCount,
        channel: attachment.channel,
        channelThumbnail: attachment.channelThumbnail,
        videoId: attachment.videoId,
        metadata: attachment.metadata,
        description: attachment.description,
        title: attachment.title,
        type: attachment.type
      }));
    }

    await announcement.save();
    await announcement.populate('author', 'fullName email avatar role');

    res.status(200).json({
      success: true,
      message: 'Announcement updated successfully',
      data: announcement
    });

  } catch (error) {
    console.error('Error updating announcement:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating announcement'
    });
  }
};

// Delete announcement
const deleteAnnouncement = async (req, res) => {
  try {
    const { streamId } = req.params;
    const userId = req.user._id;

    // Find announcement
    const announcement = await Stream.findById(streamId);
    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found'
      });
    }

    // Check if user is author or admin
    const isAuthor = announcement.author.toString() === userId.toString();
    const isAdmin = req.user.role === 'admin';
    
    if (!isAuthor && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this announcement'
      });
    }

    // Soft delete
    announcement.status = 'deleted';
    announcement.isActive = false;
    announcement.deletedAt = new Date();
    announcement.deletedBy = userId;
    
    await announcement.save();

    res.status(200).json({
      success: true,
      message: 'Announcement deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting announcement:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting announcement'
    });
  }
};

// Pin/Unpin announcement
const togglePinAnnouncement = async (req, res) => {
  try {
    const { streamId } = req.params;
    const userId = req.user._id;

    // Find announcement
    const announcement = await Stream.findById(streamId);
    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found'
      });
    }

    // Verify classroom access
    const classroom = await Classroom.findById(announcement.classroom);
    if (classroom.teacher.toString() !== userId.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to pin/unpin announcements in this classroom'
      });
    }

    // Toggle pin status
    if (announcement.pinned) {
      await announcement.unpin();
    } else {
      await announcement.pin(userId);
    }

    await announcement.populate('author', 'fullName email avatar role');

    res.status(200).json({
      success: true,
      message: `Announcement ${announcement.pinned ? 'pinned' : 'unpinned'} successfully`,
      data: announcement
    });

  } catch (error) {
    console.error('Error toggling pin status:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating pin status'
    });
  }
};

// Upload attachment
const uploadAttachment = async (req, res) => {
  try {
    // Check if file was uploaded through middleware
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    // File has already been uploaded to Cloudinary by middleware
    const { path: fileUrl, filename, originalname, size, mimetype } = req.file;

    res.status(200).json({
      success: true,
      message: 'File uploaded successfully',
      data: {
        url: fileUrl,
        filename: filename,
        originalName: originalname,
        size: size,
        mimetype: mimetype
      }
    });

  } catch (error) {
    console.error('Error uploading attachment:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while uploading file'
    });
  }
};

// Add comment to stream item
const addComment = async (req, res) => {
  try {
    const { streamId } = req.params;
    const { content } = req.body;
    const userId = req.user._id;

    // Verify stream item exists
    const streamItem = await Stream.findById(streamId);
    if (!streamItem) {
      return res.status(404).json({
        success: false,
        message: 'Stream item not found'
      });
    }

    // Verify user has access to classroom
    const classroom = await Classroom.findById(streamItem.classroom);
    if (!classroom) {
      return res.status(404).json({
        success: false,
        message: 'Classroom not found'
      });
    }

    // Check access permissions
    const userRole = req.user.role;
    let hasAccess = false;
    
    if (userRole === 'admin') {
      hasAccess = true;
    } else if (userRole === 'teacher' && classroom.teacher.toString() === userId.toString()) {
      hasAccess = true;
    } else if (userRole === 'student') {
      const isStudentInClass = classroom.students.some(s => 
        s.student && s.student.toString() === userId.toString()
      );
      hasAccess = isStudentInClass && classroom.settings.allowStudentComment;
    }

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to comment in this classroom'
      });
    }

    // Create comment
    const comment = await Comment.createComment({
      content: content.trim(),
      author: userId,
      streamItem: streamId
    });

    // Populate author info
    await comment.populate('author', 'fullName email image role');

    // Update commentsCount in stream item
    await Stream.findByIdAndUpdate(
      streamId,
      { $inc: { commentsCount: 1 } },
      { new: true }
    );

    res.status(201).json({
      success: true,
      data: comment,
      message: 'Comment added successfully'
    });

  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while adding comment'
    });
  }
};

// Get comments for stream item
const getComments = async (req, res) => {
  try {
    const { streamId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    // Verify stream item exists
    const streamItem = await Stream.findById(streamId);
    if (!streamItem) {
      return res.status(404).json({
        success: false,
        message: 'Stream item not found'
      });
    }

    // Get comments
    const comments = await Comment.getStreamComments(streamId, {
      page: parseInt(page),
      limit: parseInt(limit),
      includeReplies: false // Get top-level comments only
    });

    // Get total count
    const totalCount = await Comment.countDocuments({
      streamItem: streamId,
      status: 'active',
      isActive: true,
      parentComment: { $exists: false }
    });

    res.status(200).json({
      success: true,
      data: {
        comments,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalCount / parseInt(limit)),
          totalItems: totalCount,
          itemsPerPage: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching comments'
    });
  }
};

// Update comment
const updateComment = async (req, res) => {
  try {
    const { streamId, commentId } = req.params;
    const { content } = req.body;
    const userId = req.user._id;

    // Find comment
    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    // Check if user can edit this comment
    const canEdit = req.user.role === 'admin' || 
                    comment.author.toString() === userId.toString();

    if (!canEdit) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to edit this comment'
      });
    }

    // Update comment
    await comment.editContent(content.trim());
    await comment.populate('author', 'fullName email image role');

    res.status(200).json({
      success: true,
      data: comment,
      message: 'Comment updated successfully'
    });

  } catch (error) {
    console.error('Error updating comment:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating comment'
    });
  }
};

// Delete comment
const deleteComment = async (req, res) => {
  try {
    const { streamId, commentId } = req.params;
    const userId = req.user._id;

    // Find comment
    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    // Check if user can delete this comment
    const canDelete = req.user.role === 'admin' || 
                      comment.author.toString() === userId.toString();

    if (!canDelete) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this comment'
      });
    }

    // Soft delete comment
    await comment.softDelete(userId, 'User requested deletion');

    // Update commentsCount in stream item
    await Stream.findByIdAndUpdate(
      streamId,
      { $inc: { commentsCount: -1 } },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: 'Comment deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting comment'
    });
  }
};

// Update stream item
const updateStreamItem = async (req, res) => {
  try {
    const { streamId } = req.params;
    const { title, content } = req.body;
    const userId = req.user._id;

    // Find stream item
    const streamItem = await Stream.findById(streamId);
    if (!streamItem) {
      return res.status(404).json({
        success: false,
        message: 'Stream item not found'
      });
    }

    // Check if user can edit this stream item
    const canEdit = req.user.role === 'admin' || 
                    streamItem.author.toString() === userId.toString();

    if (!canEdit) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to edit this post'
      });
    }

    // Update stream item
    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;

    const updatedItem = await Stream.findByIdAndUpdate(
      streamId,
      updateData,
      { new: true }
    ).populate('author', 'fullName email image role');

    res.status(200).json({
      success: true,
      data: updatedItem,
      message: 'Post updated successfully'
    });

  } catch (error) {
    console.error('Error updating stream item:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating post'
    });
  }
};

// Delete stream item
const deleteStreamItem = async (req, res) => {
  try {
    const { streamId } = req.params;
    const userId = req.user._id;

    // Find stream item
    const streamItem = await Stream.findById(streamId);
    if (!streamItem) {
      return res.status(404).json({
        success: false,
        message: 'Stream item not found'
      });
    }

    // Check if user can delete this stream item
    const canDelete = req.user.role === 'admin' || 
                      streamItem.author.toString() === userId.toString();

    if (!canDelete) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this post'
      });
    }

    // Soft delete stream item
    await Stream.findByIdAndUpdate(streamId, {
      status: 'deleted',
      isActive: false,
      deletedAt: new Date(),
      deletedBy: userId
    });

    res.status(200).json({
      success: true,
      message: 'Post deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting stream item:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting post'
    });
  }
};

// Toggle pin stream item
const togglePinStreamItem = async (req, res) => {
  try {
    const { streamId } = req.params;
    const userId = req.user._id;

    // Find stream item
    const streamItem = await Stream.findById(streamId);
    if (!streamItem) {
      return res.status(404).json({
        success: false,
        message: 'Stream item not found'
      });
    }

    // Check if user can pin (teachers and admins only)
    if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to pin posts'
      });
    }

    // Toggle pin status
    const updatedItem = await Stream.findByIdAndUpdate(
      streamId,
      {
        pinned: !streamItem.pinned,
        pinnedAt: !streamItem.pinned ? new Date() : null,
        pinnedBy: !streamItem.pinned ? userId : null
      },
      { new: true }
    ).populate('author', 'fullName email image role');

    res.status(200).json({
      success: true,
      data: updatedItem,
      message: `Post ${updatedItem.pinned ? 'pinned' : 'unpinned'} successfully`
    });

  } catch (error) {
    console.error('Error toggling pin:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while toggling pin'
    });
  }
};

// Save YouTube video info after upload
const saveYouTubeVideo = async (req, res) => {
  try {
    const { classroomId, videoInfo } = req.body;
    const userId = req.user._id;

    // Validate required fields
    if (!classroomId || !videoInfo) {
      return res.status(400).json({
        success: false,
        message: 'Classroom ID and video info are required'
      });
    }

    // Verify classroom exists and user has permission
    const classroom = await Classroom.findById(classroomId);
    if (!classroom) {
      return res.status(404).json({
        success: false,
        message: 'Classroom not found'
      });
    }

    // Check permissions
    const userRole = req.user.role;
    let hasPermission = false;
    
    if (userRole === 'admin') {
      hasPermission = true;
    } else if (userRole === 'teacher' && classroom.teacher.toString() === userId.toString()) {
      hasPermission = true;
    } else if (userRole === 'student') {
      const isEnrolled = classroom.students.some(s => 
        s.student && s.student.toString() === userId.toString() && s.status === 'active'
      );
      hasPermission = isEnrolled && classroom.settings?.allowStudentPost;
    }

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to upload videos in this classroom'
      });
    }

    // Create stream item for uploaded video
    const postData = {
      title: `Video: ${videoInfo.title}`,
      content: `<p>Uploaded a new video to the classroom.</p>`,
      type: userRole === 'student' ? 'student_post' : 'announcement',
      classroom: classroomId,
      author: userId,
      attachments: [{
        name: videoInfo.title,
        url: videoInfo.url,
        type: 'video/youtube',
        videoId: videoInfo.id,
        thumbnail: videoInfo.thumbnail,
        duration: videoInfo.duration,
        channel: videoInfo.channel,
        viewCount: videoInfo.viewCount,
        description: videoInfo.description,
        metadata: {
          uploadedByUser: true,
          publishedAt: videoInfo.publishedAt,
          embedUrl: videoInfo.embedUrl,
          status: videoInfo.status,
          uploadDate: new Date().toISOString()
        }
      }],
      status: 'published',
      publishAt: new Date()
    };

    const post = await Stream.create(postData);
    await post.populate('author', 'fullName email image role');

    res.status(201).json({
      success: true,
      message: 'YouTube video saved successfully',
      data: {
        post: post,
        videoInfo: videoInfo
      }
    });

  } catch (error) {
    console.error('Error saving YouTube video:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while saving video info'
    });
  }
};

module.exports = {
  createAnnouncement,
  getClassroomStream,
  updateAnnouncement,
  deleteAnnouncement,
  togglePinAnnouncement,
  uploadAttachment,
  addComment,
  getComments,
  updateComment,
  deleteComment,
  updateStreamItem,
  deleteStreamItem,
  togglePinStreamItem,
  saveYouTubeVideo
}; 