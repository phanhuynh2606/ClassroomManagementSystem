const Assignment = require('../models/assignment.model');
const Stream = require('../models/stream.model');

// Middleware to resolve classroomId from assignmentId
const resolveClassroomId = async (req, res, next) => {
  try {
    const { assignmentId } = req.params;
    
    if (assignmentId) {
      // Find assignment and get its classroomId
      const assignment = await Assignment.findById(assignmentId).select('classroom');
      
      if (assignment && assignment.classroom) {
        // Set resolved classroomId for upload middleware
        req.resolvedClassroomId = assignment.classroom.toString();
        console.log(`Resolved classroomId: ${req.resolvedClassroomId} for assignmentId: ${assignmentId}`);
      } else {
        console.warn(`Assignment not found or no classroom: ${assignmentId}`);
        req.resolvedClassroomId = 'general';
      }
    }
    
    next();
  } catch (error) {
    console.error('Error resolving classroomId:', error);
    req.resolvedClassroomId = 'general';
    next(); // Continue even if resolution fails
  }
};

/**
 * Middleware to check and auto-publish scheduled assignments
 * This provides real-time publishing when assignments are accessed
 */
const checkScheduledAssignments = async (req, res, next) => {
  try {
    const now = new Date();
    
    // Find scheduled assignments that should be published now
    const assignmentsToPublish = await Assignment.find({
      visibility: 'scheduled',
      publishDate: { $lte: now },
      deleted: false,
      isActive: true
    }).populate('createdBy', 'fullName email')
      .populate('classroom', 'name');

    if (assignmentsToPublish.length > 0) {
      console.log(`⚡ Real-time check: Found ${assignmentsToPublish.length} assignments ready to publish`);

      for (const assignment of assignmentsToPublish) {
        try {
          // Update assignment visibility to published
          await Assignment.findByIdAndUpdate(assignment._id, {
            visibility: 'published'
          });

          // Create stream entry for the published assignment
          await Stream.create({
            title: assignment.title,
            content: assignment.description,
            type: 'assignment',
            classroom: assignment.classroom._id,
            author: assignment.createdBy._id,
            resourceId: assignment._id,
            resourceModel: 'Assignment',
            dueDate: assignment.dueDate,
            totalPoints: assignment.totalPoints,
            attachments: assignment.attachments.map(att => ({
              name: att.name,
              url: att.url,
              type: 'file',
              fileType: att.fileType,
              fileSize: att.fileSize
            })),
            publishAt: new Date()
          });

          console.log(`⚡ Real-time published: "${assignment.title}" in ${assignment.classroom.name}`);
          
        } catch (error) {
          console.error(`❌ Failed to real-time publish assignment ${assignment._id}:`, error);
        }
      }
    }

    next();
  } catch (error) {
    console.error('❌ Real-time assignment check error:', error);
    next(); // Continue even if check fails
  }
};

/**
 * Middleware specifically for assignment detail routes
 * Checks if the specific assignment should be published
 */
const checkSingleAssignment = async (req, res, next) => {
  try {
    const { assignmentId } = req.params;
    
    if (!assignmentId) {
      return next();
    }

    const assignment = await Assignment.findById(assignmentId);
    
    if (assignment && 
        assignment.visibility === 'scheduled' && 
        assignment.publishDate && 
        new Date() >= assignment.publishDate) {
      
      // Auto-publish this specific assignment
      await Assignment.findByIdAndUpdate(assignmentId, {
        visibility: 'published'
      });

      // Create stream entry
      await Stream.create({
        title: assignment.title,
        content: assignment.description,
        type: 'assignment',
        classroom: assignment.classroom,
        author: assignment.createdBy,
        resourceId: assignment._id,
        resourceModel: 'Assignment',
        dueDate: assignment.dueDate,
        totalPoints: assignment.totalPoints,
        attachments: assignment.attachments.map(att => ({
          name: att.name,
          url: att.url,
          type: 'file',
          fileType: att.fileType,
          fileSize: att.fileSize
        })),
        publishAt: new Date()
      });

      console.log(`⚡ Instant published on access: "${assignment.title}"`);
    }

    next();
  } catch (error) {
    console.error('❌ Single assignment check error:', error);
    next();
  }
};

module.exports = {
  resolveClassroomId,
  checkScheduledAssignments,
  checkSingleAssignment
}; 