import authRoutes from './auth.route.js';
import userRoutes from './user.route.js';
import adminRoutes from './admin.route.js';
const initRoutes = (app) => {
  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/admin', adminRoutes);
};

export default initRoutes;
