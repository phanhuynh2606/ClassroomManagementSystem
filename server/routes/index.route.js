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

const initRoutes = (app) => {
  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/admin', adminRoutes);
  app.use("/api/questions/ai/", genderAIRoute);
  app.use('/api/classrooms', classroomRoutes);
  app.use('/api/assignments', assignmentRoutes);
  app.use('/api/requests', requestRoutes);
  app.use('/api/stream', streamRoutes);
  app.use('/api/video-watch', videoWatchRoutes);
  app.use('/api/files', fileRoutes);
};

module.exports = initRoutes;
