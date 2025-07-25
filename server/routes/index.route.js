const authRoutes = require('./auth.route.js');
const userRoutes = require('./user.route.js');
const adminRoutes = require('./admin.route.js');
const genderAIRoute = require('./generateAI.route.js');
const classroomRoutes = require('./classroom.route.js');
const assignmentRoutes = require('./assignment.route.js');
const requestRoutes = require('./request.route.js');
const streamRoutes = require('./stream.route.js');
const videoWatchRoutes = require('./videoWatch.route.js');
const fileRoutes = require('./file.route.js');
const materialRoutes = require('./material.route.js');
const teacherTodoRoutes = require('./teacher.todo.route.js');
const quizRoutes = require('./quizzes.route.js');
const teacherDashboardRoutes = require('./teacher.dashboard.route.js');
const assignmentAnalyticsRoutes = require('./assginment.analyze.route.js');
const chatRoutes = require('./chat.route.js');
const notificationRoutes = require('./notification.route.js');
const initRoutes = (app) => {
  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/stream', streamRoutes);
  app.use('/api/video-watch', videoWatchRoutes);
  
  app.use('/api/assignments', assignmentRoutes);
  app.use('/api/assignments/analytics', assignmentAnalyticsRoutes);
  app.use('/api/teacher-dashboard', teacherDashboardRoutes);
  
  app.use('/api/files', fileRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/materials', materialRoutes);
  
  app.use('/api/teacher-todo', teacherTodoRoutes);
  app.use("/api/questions/ai/", genderAIRoute);
  app.use('/api/quizzes', quizRoutes);

  app.use('/api/classrooms',classroomRoutes);
  app.use('/api/requests', requestRoutes);
  app.use('/api/chats', chatRoutes);
  app.use('/api/notifications', notificationRoutes);
};

module.exports = initRoutes;
