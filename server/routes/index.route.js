import authRoutes from './auth.route.js';

const initRoutes = (app) => {
  app.use('/api/auth', authRoutes);
};

export default initRoutes;
