const Stream = require('../models/stream.model');

/**
 * Middleware to automatically create stream entries for assignments, materials, and quizzes
 */

const createStreamEntry = async (resource, resourceModel, classroom, author, type = null) => {
  try {
    const streamData = {
      title: resource.title,
      content: resource.description || '',
      type: type || resourceModel.toLowerCase(),
      classroom: classroom,
      author: author,
      resourceId: resource._id,
      resourceModel: resourceModel,
      status: 'published'
    };

    // Add specific fields based on resource type
    if (resourceModel === 'Assignment') {
      streamData.dueDate = resource.dueDate;
      streamData.totalPoints = resource.totalPoints;
      streamData.description = resource.description;
    }

    if (resourceModel === 'Quiz') {
      streamData.dueDate = resource.dueDate;
      streamData.totalPoints = resource.totalPoints;
      streamData.description = resource.description;
    }

    if (resourceModel === 'Material') {
      streamData.description = resource.description;
    }

    const streamEntry = await Stream.create(streamData);
    console.log(`Stream entry created for ${resourceModel}:`, streamEntry._id);
    return streamEntry;
  } catch (error) {
    console.error(`Error creating stream entry for ${resourceModel}:`, error);
    throw error;
  }
};

const updateStreamEntry = async (resourceId, resourceModel, updateData) => {
  try {
    const streamEntry = await Stream.findOne({
      resourceId: resourceId,
      resourceModel: resourceModel
    });

    if (streamEntry) {
      const updateFields = {};
      
      if (updateData.title) updateFields.title = updateData.title;
      if (updateData.description !== undefined) updateFields.content = updateData.description;
      if (updateData.dueDate) updateFields.dueDate = updateData.dueDate;
      if (updateData.totalPoints) updateFields.totalPoints = updateData.totalPoints;

      if (Object.keys(updateFields).length > 0) {
        await Stream.findByIdAndUpdate(streamEntry._id, updateFields);
        console.log(`Stream entry updated for ${resourceModel}:`, streamEntry._id);
      }
    }
  } catch (error) {
    console.error(`Error updating stream entry for ${resourceModel}:`, error);
    throw error;
  }
};

const deleteStreamEntry = async (resourceId, resourceModel) => {
  try {
    const streamEntry = await Stream.findOne({
      resourceId: resourceId,
      resourceModel: resourceModel
    });

    if (streamEntry) {
      await Stream.findByIdAndUpdate(streamEntry._id, {
        status: 'deleted',
        isActive: false,
        deletedAt: new Date()
      });
      console.log(`Stream entry deleted for ${resourceModel}:`, streamEntry._id);
    }
  } catch (error) {
    console.error(`Error deleting stream entry for ${resourceModel}:`, error);
    throw error;
  }
};

/**
 * Assignment Middleware
 */
const assignmentStreamMiddleware = {
  // After assignment creation
  postSave: async function(doc) {
    if (doc.isNew && doc.visibility === 'published') {
      await createStreamEntry(doc, 'Assignment', doc.classroom, doc.createdBy);
    }
  },

  // After assignment update
  postFindOneAndUpdate: async function(doc) {
    if (doc && doc.visibility === 'published') {
      await updateStreamEntry(doc._id, 'Assignment', {
        title: doc.title,
        description: doc.description,
        dueDate: doc.dueDate,
        totalPoints: doc.totalPoints
      });
    }
  },

  // Before assignment deletion
  preDelete: async function(doc) {
    if (doc) {
      await deleteStreamEntry(doc._id, 'Assignment');
    }
  }
};

/**
 * Material Middleware
 */
const materialStreamMiddleware = {
  // After material creation
  postSave: async function(doc) {
    if (doc.isNew && doc.isActive) {
      await createStreamEntry(doc, 'Material', doc.classroom, doc.uploadedBy, 'material');
    }
  },

  // After material update
  postFindOneAndUpdate: async function(doc) {
    if (doc && doc.isActive) {
      await updateStreamEntry(doc._id, 'Material', {
        title: doc.title,
        description: doc.description
      });
    }
  },

  // Before material deletion
  preDelete: async function(doc) {
    if (doc) {
      await deleteStreamEntry(doc._id, 'Material');
    }
  }
};

/**
 * Quiz Middleware
 */
const quizStreamMiddleware = {
  // After quiz creation
  postSave: async function(doc) {
    if (doc.isNew && doc.status === 'published') {
      await createStreamEntry(doc, 'Quiz', doc.classroom, doc.createdBy);
    }
  },

  // After quiz update
  postFindOneAndUpdate: async function(doc) {
    if (doc && doc.status === 'published') {
      await updateStreamEntry(doc._id, 'Quiz', {
        title: doc.title,
        description: doc.description,
        dueDate: doc.dueDate,
        totalPoints: doc.totalPoints
      });
    }
  },

  // Before quiz deletion
  preDelete: async function(doc) {
    if (doc) {
      await deleteStreamEntry(doc._id, 'Quiz');
    }
  }
};

/**
 * Activity Middleware - for creating activity stream entries
 */
const activityStreamMiddleware = {
  // Student joins classroom
  studentJoined: async (classroomId, studentId, studentName) => {
    try {
      await Stream.createActivity(classroomId, studentId, 'student_joined', {
        studentName: studentName,
        metadata: { action: 'join', timestamp: new Date() }
      });
    } catch (error) {
      console.error('Error creating student joined activity:', error);
    }
  },

  // Student leaves classroom
  studentLeft: async (classroomId, studentId, studentName) => {
    try {
      await Stream.createActivity(classroomId, studentId, 'student_left', {
        studentName: studentName,
        metadata: { action: 'leave', timestamp: new Date() }
      });
    } catch (error) {
      console.error('Error creating student left activity:', error);
    }
  },

  // Assignment submitted
  assignmentSubmitted: async (classroomId, assignmentId, studentId, teacherId) => {
    try {
      await Stream.createActivity(classroomId, teacherId, 'assignment_submitted', {
        submissionCount: 1,
        metadata: { 
          assignmentId: assignmentId,
          studentId: studentId,
          timestamp: new Date() 
        }
      });
    } catch (error) {
      console.error('Error creating assignment submitted activity:', error);
    }
  },

  // Quiz completed
  quizCompleted: async (classroomId, quizId, studentId, studentName, teacherId) => {
    try {
      await Stream.createActivity(classroomId, teacherId, 'quiz_completed', {
        studentName: studentName,
        metadata: { 
          quizId: quizId,
          studentId: studentId,
          timestamp: new Date() 
        }
      });
    } catch (error) {
      console.error('Error creating quiz completed activity:', error);
    }
  },

  // Material uploaded
  materialUploaded: async (classroomId, materialId, teacherId) => {
    try {
      await Stream.createActivity(classroomId, teacherId, 'material_uploaded', {
        metadata: { 
          materialId: materialId,
          timestamp: new Date() 
        }
      });
    } catch (error) {
      console.error('Error creating material uploaded activity:', error);
    }
  }
};

/**
 * Helper function to apply middleware to models
 */
const applyStreamMiddleware = (model, middleware) => {
  if (middleware.postSave) {
    model.schema.post('save', middleware.postSave);
  }
  
  if (middleware.postFindOneAndUpdate) {
    model.schema.post('findOneAndUpdate', middleware.postFindOneAndUpdate);
  }
  
  if (middleware.preDelete) {
    model.schema.pre('findOneAndDelete', middleware.preDelete);
    model.schema.pre('deleteOne', middleware.preDelete);
  }
};

module.exports = {
  assignmentStreamMiddleware,
  materialStreamMiddleware,
  quizStreamMiddleware,
  activityStreamMiddleware,
  applyStreamMiddleware,
  createStreamEntry,
  updateStreamEntry,
  deleteStreamEntry
}; 