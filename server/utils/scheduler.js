const cron = require('node-cron');
const moment = require('moment');
const Assignment = require('../models/assignment.model');
const Stream = require('../models/stream.model');
const User = require('../models/user.model');

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
  console.log('🎯 Starting CMS Schedulers...');
  console.log('=================================');
  
  startAssignmentScheduler();
  startQuizScheduler();
  startCleanupScheduler();
  autoGradeScheduler.start(); // Start auto-grade scheduler
  
  console.log('✅ All schedulers are running!');
  console.log('=================================\n');
};

class AutoGradeScheduler {
  constructor() {
    this.isRunning = false;
  }

  // Start the scheduler - chạy mỗi giờ
  start() {
    if (this.isRunning) {
      console.log('📅 Auto-grade scheduler already running');
      return;
    }

    // Chạy mỗi giờ (0 minutes past the hour)
    cron.schedule('0 * * * *', async () => {
      console.log('🔄 Running auto-grade scheduler at:', new Date().toISOString());
      await this.checkAndAutoGrade();
    });

    // Chạy ngay khi start server (for testing)
    setTimeout(() => {
      this.checkAndAutoGrade();
    }, 5000);

    this.isRunning = true;
    console.log('✅ Auto-grade scheduler started');
  }

  // Main function - check tất cả assignments cần auto-grade
  async checkAndAutoGrade() {
    try {
      const now = moment();
      
      // Find assignments cần auto-grade
      const assignments = await Assignment.find({
        'missingSubmissionPolicy.autoGradeWhenOverdue': true,
        dueDate: { $lt: now.toDate() }, // Đã quá hạn
        visibility: 'published'
      }).populate('classroom');

      for (const assignment of assignments) {
        console.log(`🔍 Processing assignment: ${assignment.title} (ID: ${assignment._id})`);
        await this.processAssignment(assignment, now);
      }

    } catch (error) {
      console.error('❌ Auto-grade scheduler error:', error);
    }
  }

  // Process từng assignment
  async processAssignment(assignment, now) {
    try {
      const policy = assignment.missingSubmissionPolicy;
      const dueDate = moment(assignment.dueDate);
      const daysOverdue = now.diff(dueDate, 'days');
      // Check conflicts với late submission
      if (assignment.allowLateSubmission) {
        const maxLateDays = assignment.maxLateDays || 7; // Default 7 days
        const latePeriodEnd = dueDate.clone().add(maxLateDays, 'days');
        
        // Nếu vẫn trong late submission period → skip
        if (now.isBefore(latePeriodEnd)) {
          console.log(`⏳ Assignment ${assignment.title}: Still in late submission period`);
          return;
        }

        // Auto-grade phải sau khi hết late period
        const minAutoGradeDays = maxLateDays + (policy.daysAfterDueForAutoGrade ?? 1);
        if (daysOverdue < minAutoGradeDays) {
          console.log(`⏳ Assignment ${assignment.title}: Waiting for late period + buffer (${daysOverdue} < ${minAutoGradeDays})`);
          return;
        }
      } else {
        // No late submission → check normal auto-grade timing
        const requiredDays = policy.daysAfterDueForAutoGrade;
        if (daysOverdue < requiredDays) {
          console.log(`⏳ Assignment ${assignment.title}: Not enough days overdue (${daysOverdue} < ${requiredDays})`);
          return;
        }
      }

      // Check if already auto-graded
      const lastAutoGrade = assignment.autoGradeHistory || [];
      const alreadyAutoGraded = lastAutoGrade.some(entry => 
        moment(entry.autoGradedAt).isSame(now, 'day')
      );

      if (alreadyAutoGraded) {
        console.log(`✅ Assignment ${assignment.title}: Already auto-graded today`);
        return;
      }

      // Proceed with auto-grading
      await this.autoGradeAssignment(assignment);

    } catch (error) {
      console.error(`❌ Error processing assignment ${assignment.title}:`, error);
    }
  }

  // Auto-grade assignment with embedded submissions
  async autoGradeAssignment(assignment) {
    try {
      // Get all students in classroom
        // Extract student IDs from enrollment records
        const studentIds = assignment.classroom.students?.map(enrollment => enrollment.student) || [];
        
        if (!assignment.classroom) {
        console.log(`⚠️ Assignment ${assignment.title}: No classroom found`);
        return;
      }

      if (!assignment.classroom.students || assignment.classroom.students.length === 0) {
        console.log(`⚠️ Assignment ${assignment.title}: No students in classroom`);
        return;
      }

              // Fetch students manually (safer approach)
        const students = await User.find({
          _id: { $in: studentIds },
          role: 'student'
        });

      if (students.length === 0) {
        console.log(`⚠️ Assignment ${assignment.title}: No students found in classroom`);
        return;
      }

              // Get existing submissions from embedded array
        const existingSubmissions = assignment.submissions || [];
        const submittedStudentIds = existingSubmissions.map(sub => sub.student.toString());

              // Find students who haven't submitted
        const missingStudents = students.filter(student => 
          !submittedStudentIds.includes(student._id.toString())
        );

      if (missingStudents.length === 0) {
        console.log(`✅ Assignment ${assignment.title}: No missing submissions`);
        return;
      }

      const policy = assignment.missingSubmissionPolicy;
      const gradeValue = policy.autoGradeValue || 0;

      // Create auto-grade submissions for missing students
      const autoSubmissions = missingStudents.map(student => ({
        student: student._id,
        content: null,
        attachments: [],
        submittedAt: null,
        grade: gradeValue, // Final grade
        originalGrade: gradeValue, // Original grade before penalty
        feedback: `Auto-graded: No submission received. Assignment was overdue and automatically graded according to missing submission policy.`,
        status: 'graded',
        gradedAt: new Date(),
        gradedBy: null, // System auto-grade
        
        // Enhanced grading system
        gradingHistory: [{
          grade: gradeValue,
          originalGrade: gradeValue,
          feedback: 'Auto-graded due to missing submission',
          gradedAt: new Date(),
          gradedBy: null, // System
          gradedByName: 'System Auto-Grade',
          isLatest: true,
          gradeReason: 'Missing submission - auto-graded by system',
          changeType: 'initial',
          
          // No late penalty for missing submissions
          latePenalty: {
            applied: false,
            percentage: 0,
            daysLate: 0,
            penaltyAmount: 0
          }
        }],
        
        // Additional submission options
        allowResubmit: false, // Don't allow resubmit for auto-graded
        hideGradeFromStudent: false,
        resubmissionCount: 0,
        lastModified: new Date()
      }));

      // Use atomic operation to update assignment with new submissions and history
      const updateResult = await Assignment.findByIdAndUpdate(
        assignment._id,
        {
          $push: {
            // Add auto-grade submissions to embedded array
            submissions: { $each: autoSubmissions },
            
            // Add auto-grade history entry
            autoGradeHistory: {
              autoGradedAt: new Date(),
              studentsAutoGraded: missingStudents.map(s => s._id),
              gradeValue: gradeValue,
              reason: 'Scheduled auto-grade for missing submissions'
            }
          }
        },
        { 
          new: true, // Return updated document
          runValidators: true // Run mongoose validators
        }
      );

      if (!updateResult) {
        throw new Error(`Failed to update assignment ${assignment._id} with auto-grade submissions`);
      }

      // TODO: Send notifications to students (optional)
      // await this.notifyAutoGradedStudents(missingStudents, assignment, gradeValue);
      return {
        success: true,
        autoGradedCount: missingStudents.length,
        gradeValue: gradeValue,
        studentsAutoGraded: missingStudents.map(s => s._id)
      };

    } catch (error) {
      console.error(`❌ Error auto-grading assignment ${assignment.title}:`, error);
      throw error;
    }
  }

  // Optional: Send notifications
  async notifyAutoGradedStudents(students, assignment, gradeValue) {
    // TODO: Implement email notifications
    // EmailService.sendAutoGradeNotification(students, assignment, gradeValue);
  }

  // Stop scheduler
  stop() {
    // Note: node-cron doesn't provide direct stop method for scheduled tasks
    // This would require storing task references
    this.isRunning = false;
    console.log('🛑 Auto-grade scheduler stopped');
  }
}

// Export singleton instance
const autoGradeScheduler = new AutoGradeScheduler();

module.exports = {
  startAllSchedulers,
  startAssignmentScheduler,
  startQuizScheduler,
  startCleanupScheduler,
  autoGradeScheduler
}; 