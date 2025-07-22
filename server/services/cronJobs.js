const { autoPublishQuizzes } = require('../controllers/quizzes.controller');

// Khởi động tất cả cron jobs
const startCronJobs = () => {
    console.log('🕐 Starting all cron jobs...');

    // Khởi động auto-publish quiz cron job
    autoPublishQuizzes();

    console.log('✅ All cron jobs started successfully');
};

module.exports = {
    startCronJobs
};
