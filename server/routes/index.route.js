const authRoutes = require('./auth.route.js');
const userRoutes = require('./user.route.js');
const adminRoutes = require('./admin.route.js');

const initRoutes = (app) => {
  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/admin', adminRoutes);
};

module.exports = initRoutes;
