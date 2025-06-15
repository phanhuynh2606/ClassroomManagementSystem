const authRoutes = require('./auth.route.js');
const userRoutes = require('./user.route.js');
const adminRoutes = require('./admin.route.js');
const classroomRoutes = require('./classroom.route.js');
const requestRoutes = require('./request.route.js')
const initRoutes = (app) => {
  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/classrooms',classroomRoutes);
  app.use('/api/requests', requestRoutes)
};

module.exports = initRoutes;
