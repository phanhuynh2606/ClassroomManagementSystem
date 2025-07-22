const cron = require('node-cron');
const moment = require('moment');
const Assignment = require('../models/assignment.model');
const Stream = require('../models/stream.model');
const User = require('../models/user.model');
const { sendEmail, emailTemplates } = require('../config/email.config');

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
  scheduleAssignmentReminders();
  autoGradeScheduler.start(); // Start auto-grade scheduler
  
  console.log('✅ All schedulers are running!');
  console.log('=================================\n');
};

/**
 * Gửi nhắc nhở cho một assignment cụ thể
 * @param {Object} assignment - Assignment object đã populate classroom và submissions.student
 * @param {Date} now - Thời gian hiện tại
 */
const sendAssignmentReminderForAssignment = async (assignment, now = new Date()) => {
  try {
    // 1. Kiểm tra xem có được phép gửi thông báo không
    if (!assignment.missingSubmissionPolicy?.notifyStudentsOfMissingSubmission) {
      console.log(`⏩ Bỏ qua reminder cho assignment '${assignment.title}' - notifyStudentsOfMissingSubmission = false`);
      return;
    }

    // 2. Lấy cấu hình reminder days
    const reminderDays = assignment.missingSubmissionPolicy?.reminderDaysBeforeDue || [3, 1];
    
    // 3. Tính số ngày còn lại đến deadline (chính xác hơn)
    const dueDate = new Date(assignment.dueDate);
    const timeDiff = dueDate.getTime() - now.getTime();
    const daysLeft = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
    
    console.log(`📅 Assignment '${assignment.title}': ${daysLeft} ngày còn lại`);
    console.log(`⚙️  Reminder days configured: [${reminderDays.join(', ')}]`);
    
    // 4. Kiểm tra xem hôm nay có phải ngày gửi reminder không
    if (!reminderDays.includes(daysLeft)) {
      console.log(`⏩ Không phải ngày gửi reminder cho assignment '${assignment.title}'`);
      return;
    }

    // 5. Kiểm tra classroom có tồn tại không
    if (!assignment.classroom) {
      console.log(`❌ Assignment '${assignment.title}' không có classroom`);
      return;
    }

    // 6. Lấy danh sách học sinh đã nộp bài
    const submittedStudentIds = new Set();
    if (assignment.submissions && assignment.submissions.length > 0) {
      assignment.submissions.forEach(submission => {
        if (submission.student && submission.submittedAt) {
          const studentId = submission.student._id ? 
            submission.student._id.toString() : 
            submission.student.toString();
          submittedStudentIds.add(studentId);
        }
      });
    }

    console.log(`📝 Đã có ${submittedStudentIds.size} học sinh nộp bài`);

    // 7. Lấy danh sách học sinh trong lớp
    let classroomStudentIds = assignment.classroom.students || [];
    if (classroomStudentIds.length === 0) {
      console.log(`⚠️  Classroom '${assignment.classroom.name}' không có học sinh nào`);
      return;
    }

    classroomStudentIds = classroomStudentIds.map(student => student.student.toString());

    // 8. Tìm học sinh chưa nộp bài và có email
    const studentsToRemind = await User.find({
      _id: { $in: classroomStudentIds },
      role: 'student',
      email: { $exists: true, $ne: null, $ne: '' },
      isActive: { $ne: false }
    }).select('fullName email');

    const studentsNotSubmitted = studentsToRemind.filter(student => 
      !submittedStudentIds.has(student._id.toString())
    );

    console.log(`📧 Sẽ gửi reminder cho ${studentsNotSubmitted.length} học sinh`);

    // 9. Gửi email nhắc nhở
    const emailResults = {
      success: 0,
      failed: 0,
      errors: []
    };

    for (const student of studentsNotSubmitted) {
      console.log("--------------------------------");
      console.log("Student:", student);
      console.log("--------------------------------");
      try {
        const subject = `🔔 Nhắc nhở: Sắp đến hạn nộp bài tập "${assignment.title}"`;
        
        // Tạo nội dung email
        const emailData = {
          studentName: student.fullName,
          assignmentTitle: assignment.title,
          dueDate: dueDate.toLocaleString('vi-VN', { 
            timeZone: 'Asia/Ho_Chi_Minh',
            year: 'numeric',
            month: '2-digit', 
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
          }),
          daysLeft: daysLeft,
          classroomName: assignment.classroom.name || 'Không xác định',
          assignmentDescription: assignment.description?.substring(0, 200) || '',
          isUrgent: daysLeft <= 1
        };

        const html = emailTemplates.assignmentReminder(emailData);
        
        await sendEmail(
          student.email,
          subject,
          html
        );

        console.log(`✅ Gửi reminder thành công cho ${student.fullName} (${student.email})`);
        emailResults.success++;
        
      } catch (emailError) {
        console.error(`❌ Lỗi gửi email reminder cho ${student.fullName} (${student.email}):`, emailError.message);
        emailResults.failed++;
        emailResults.errors.push({
          student: student.fullName,
          email: student.email,
          error: emailError.message
        });
      }
    }

    // 10. Log kết quả
    console.log(`📊 Kết quả gửi reminder cho assignment '${assignment.title}':
      ✅ Thành công: ${emailResults.success}
      ❌ Thất bại: ${emailResults.failed}
      📝 Tổng số học sinh chưa nộp: ${studentsNotSubmitted.length}`);

    return emailResults;

  } catch (error) {
    console.error(`💥 Lỗi trong sendAssignmentReminderForAssignment:`, error);
    throw error;
  }
};

/**
 * Gửi nhắc nhở trước hạn nộp bài cho tất cả assignments
 */
const sendAssignmentReminders = async () => {
  const startTime = Date.now();
  console.log(`🚀 Bắt đầu gửi assignment reminders lúc ${new Date().toLocaleString('vi-VN')}`);
  
  try {
    const now = new Date();
    
    // Tìm tất cả assignments đang active, chưa đến hạn, và cho phép gửi reminder
    const assignments = await Assignment.find({
      isActive: true,
      deleted: false,
      visibility: 'published', // Chỉ gửi reminder cho assignments đã publish
      dueDate: { $gte: now }, // Chưa đến hạn
      'missingSubmissionPolicy.notifyStudentsOfMissingSubmission': true
    })
    .populate('classroom', 'name students') // Populate classroom info
    .populate('submissions.student', 'fullName email') // Populate student info in submissions
    .sort({ dueDate: 1 }); // Sắp xếp theo deadline gần nhất trước

    console.log(`📋 Tìm thấy ${assignments.length} assignments cần kiểm tra reminder`);

    if (assignments.length === 0) {
      console.log(`ℹ️  Không có assignment nào cần gửi reminder`);
      return {
        total: 0,
        processed: 0,
        success: 0,
        failed: 0,
        duration: Date.now() - startTime
      };
    }

    // Thống kê tổng quan
    const totalResults = {
      total: assignments.length,
      processed: 0,
      totalEmailsSent: 0,
      totalEmailsFailed: 0,
      assignmentResults: []
    };

    // Xử lý từng assignment
    for (const assignment of assignments) {
      try {
        console.log(`\n🔄 Đang xử lý assignment: '${assignment.title}'`);
        
        const result = await sendAssignmentReminderForAssignment(assignment, now);
        
        if (result) {
          totalResults.totalEmailsSent += result.success;
          totalResults.totalEmailsFailed += result.failed;
          totalResults.assignmentResults.push({
            assignmentId: assignment._id,
            assignmentTitle: assignment.title,
            ...result
          });
        }
        
        totalResults.processed++;
        
        // Thêm delay nhỏ giữa các assignments để tránh spam
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        console.error(`❌ Lỗi xử lý assignment '${assignment.title}':`, error.message);
        totalResults.assignmentResults.push({
          assignmentId: assignment._id,
          assignmentTitle: assignment.title,
          success: 0,
          failed: 0,
          error: error.message
        });
      }
    }

    const duration = Date.now() - startTime;
    
    // Log kết quả tổng kết
    console.log(`\n🏁 Hoàn thành gửi assignment reminders:
      📊 Tổng assignments: ${totalResults.total}
      ✅ Đã xử lý: ${totalResults.processed}
      📧 Email thành công: ${totalResults.totalEmailsSent}
      ❌ Email thất bại: ${totalResults.totalEmailsFailed}
      ⏱️  Thời gian: ${duration}ms`);

    return {
      ...totalResults,
      duration
    };

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`💥 Lỗi trong sendAssignmentReminders:`, error);
    
    return {
      total: 0,
      processed: 0,
      totalEmailsSent: 0,
      totalEmailsFailed: 0,
      duration,
      error: error.message
    };
  }
};

/**
 * Kiểm tra và gửi reminder cho một assignment cụ thể (API endpoint)
 * @param {string} assignmentId - ID của assignment
 */
const sendReminderForSpecificAssignment = async (assignmentId) => {
  try {
    const assignment = await Assignment.findById(assignmentId)
      .populate('classroom', 'name students')
      .populate('submissions.student', 'fullName email');

    if (!assignment) {
      throw new Error('Assignment không tồn tại');
    }

    if (!assignment.isActive || assignment.deleted) {
      throw new Error('Assignment không active hoặc đã bị xóa');
    }

    const result = await sendAssignmentReminderForAssignment(assignment);
    return result;

  } catch (error) {
    console.error(`❌ Lỗi gửi reminder cho assignment ${assignmentId}:`, error.message);
    throw error;
  }
};

/**
 * Lên lịch chạy reminder tự động (có thể dùng với cron job)
 */
const scheduleAssignmentReminders = () => {
  // Sử dụng với node-cron hoặc agenda
  // Ví dụ: chạy mỗi ngày lúc 9:00 AM
  console.log('📅 Đã lên lịch chạy assignment reminders hàng ngày');
  
  // Nếu sử dụng node-cron:
      cron.schedule('0 7 * * *', async () => {
        console.log('⏰ Chạy scheduled assignment reminders');
        await sendAssignmentReminders();
      });
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
      await this.notifyAutoGradedStudents(missingStudents, assignment, gradeValue);
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
    // Gửi email thông báo auto-grade cho từng sinh viên
    const EmailService = require('../services/email.service'); // Giả định đã có EmailService
    for (const student of students) {
      if (!student.email) continue;
      const subject = `Thông báo: Bài tập '${assignment.title}' đã được chấm tự động`;
      const content = `Chào ${student.fullName || 'bạn'},\n\nBài tập '${assignment.title}' của bạn đã quá hạn nộp và đã được hệ thống chấm tự động theo chính sách lớp học.\n\nĐiểm tự động: ${gradeValue}\n\nNếu có thắc mắc, vui lòng liên hệ giáo viên phụ trách.\n\nTrân trọng.`;
      try {
        await EmailService.sendMail({
          to: student.email,
          subject,
          text: content
        });
      } catch (err) {
        console.error(`❌ Lỗi gửi email auto-grade cho sinh viên ${student.email}:`, err);
      }
    }
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
  autoGradeScheduler,
  scheduleAssignmentReminders
}; 