const cron = require('node-cron');
const Assignment = require('../models/assignment.model');
const Stream = require('../models/stream.model');

/**
 * Auto-publish scheduled assignments when publishDate is reached
 * Runs every minute to check for assignments ready to be published
 */
const startAssignmentScheduler = () => {
  console.log('🚀 Assignment Scheduler started - checking every minute');
  
  // Run every minute: '* * * * *'
  // For production, consider every 5 minutes: '*/5 * * * *'
  cron.schedule('* * * * *', async () => {
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

      if (assignmentsToPublish.length === 0) {
        return; // No assignments to publish
      }

      console.log(`📅 Found ${assignmentsToPublish.length} assignments ready to publish`);

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
            publishAt: new Date() // Published now
          });

          console.log(`✅ Auto-published assignment: "${assignment.title}" in ${assignment.classroom.name}`);
          
        } catch (error) {
          console.error(`❌ Failed to publish assignment ${assignment._id}:`, error);
        }
      }

    } catch (error) {
      console.error('❌ Assignment scheduler error:', error);
    }
  });
};

/**
 * Auto-publish scheduled quizzes when publishDate is reached
 * This can be extended for quizzes if needed
 */
const startQuizScheduler = () => {
  console.log('🎯 Quiz Scheduler started - checking every minute');
  
  cron.schedule('* * * * *', async () => {
    try {
      const Quiz = require('../models/quiz.model');
      const now = new Date();
      
      // Find scheduled quizzes that should be published now
      const quizzesToPublish = await Quiz.find({
        visibility: 'scheduled',
        publishDate: { $lte: now },
        deleted: false,
        isActive: true
      }).populate('createdBy', 'fullName email')
        .populate('classroom', 'name');

      if (quizzesToPublish.length === 0) {
        return; // No quizzes to publish
      }

      console.log(`🎯 Found ${quizzesToPublish.length} quizzes ready to publish`);

      for (const quiz of quizzesToPublish) {
        try {
          // Update quiz visibility to published
          await Quiz.findByIdAndUpdate(quiz._id, {
            visibility: 'published'
          });

          // Create stream entry for the published quiz
          await Stream.create({
            title: quiz.title,
            content: quiz.description || '',
            type: 'quiz',
            classroom: quiz.classroom._id,
            author: quiz.createdBy._id,
            resourceId: quiz._id,
            resourceModel: 'Quiz',
            dueDate: quiz.dueDate,
            totalPoints: quiz.totalPoints,
            publishAt: new Date()
          });

          console.log(`✅ Auto-published quiz: "${quiz.title}" in ${quiz.classroom.name}`);
          
        } catch (error) {
          console.error(`❌ Failed to publish quiz ${quiz._id}:`, error);
        }
      }

    } catch (error) {
      console.error('❌ Quiz scheduler error:', error);
    }
  });
};

/**
 * Cleanup old scheduled items that have expired without being published
 * Runs daily at midnight
 */
const startCleanupScheduler = () => {
  console.log('🧹 Cleanup Scheduler started - running daily at midnight');
  
  // Run daily at midnight: '0 0 * * *'
  cron.schedule('0 0 * * *', async () => {
    try {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      
      // Find assignments scheduled for more than 1 day ago but still not published
      const expiredAssignments = await Assignment.find({
        visibility: 'scheduled',
        publishDate: { $lt: oneDayAgo },
        deleted: false
      });

      if (expiredAssignments.length > 0) {
        console.log(`🧹 Found ${expiredAssignments.length} expired scheduled assignments`);
        
        // Optionally auto-publish them or mark as expired
        for (const assignment of expiredAssignments) {
          await Assignment.findByIdAndUpdate(assignment._id, {
            visibility: 'published' // Auto-publish expired scheduled assignments
          });
          
          console.log(`🔄 Auto-published expired assignment: "${assignment.title}"`);
        }
      }

    } catch (error) {
      console.error('❌ Cleanup scheduler error:', error);
    }
  });
};

/**
 * Start all schedulers
 */
const startAllSchedulers = () => {
  console.log('\n=================================');
  console.log('🎯 Starting LMS Schedulers...');
  console.log('=================================');
  
  startAssignmentScheduler();
  startQuizScheduler();
  startCleanupScheduler();
  
  console.log('✅ All schedulers are running!');
  console.log('=================================\n');
};

module.exports = {
  startAllSchedulers,
  startAssignmentScheduler,
  startQuizScheduler,
  startCleanupScheduler
}; 