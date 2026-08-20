require('dotenv').config();
const express = require('express');
const app = express();
const router = require('./routes');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const sequelize = require('./config/db');
require('./models'); // Load all models and associations
const port = process.env.PORT || 5000;
app.set('trust proxy', true);

// Import attendance notification service
const {
  checkAttendanceMilestones,
  checkMorningCheckIn,
  checkMorningCheckOut,
  checkAfternoonCheckIn,
  checkAfternoonCheckOut,
  scheduleAllTodayMilestones
} = require('./services/attendanceNotificationService');
const { getVNTime } = require('./utils/dateUtils');
const { notificationQueue } = require('./utils/queue');

// Initialize the notification worker
require('./workers/notificationWorker');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost', // Android Capacitor (HTTP)
  'https://localhost', // Android Capacitor (HTTPS)
  'capacitor://localhost', // iOS Capacitor
  'https://qltt.kis-v.com',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true
}));

// Serve uploads folder as static
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/uploads', (req, res) => {
  res.status(404).send(`
        <div style="font-family: sans-serif; text-align: center; margin-top: 50px; padding: 20px;">
            <h2 style="color: #e53e3e;">Lỗi: Không tìm thấy file</h2>
            <p style="color: #4a5568; font-size: 16px;">File đính kèm này đã bị xóa hoặc không còn tồn tại trên máy chủ.</p>
        </div>
    `);
});

app.use('/api', router);

// Test endpoint for attendance notifications
app.post('/api/test/attendance-email', async (req, res) => {
  try {
    const { checkType } = req.body;

    if (!checkType || checkType === 'all') {
      await checkAttendanceMilestones();
      return res.json({ success: true, message: 'All attendance milestones triggered successfully' });
    }

    switch (checkType) {
      case 'morning-checkin':
        await checkMorningCheckIn();
        break;
      case 'morning-checkout':
        await checkMorningCheckOut();
        break;
      case 'afternoon-checkin':
        await checkAfternoonCheckIn();
        break;
      case 'afternoon-checkout':
        await checkAfternoonCheckOut();
        break;
      default:
        await checkAttendanceMilestones();
        break;
    }

    res.json({ success: true, message: `Test email check (${checkType}) triggered successfully` });
  } catch (error) {
    console.error('[Test Endpoint] Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Setup BullMQ Repeatable Job & khởi tạo lịch thông báo điểm danh hôm nay
 */
const setupAttendanceNotificationCrons = async () => {
  try {
    // 1. Đăng ký Repeatable Job chạy lúc 00:01 hàng ngày trên BullMQ
    await notificationQueue.add('daily-attendance-scheduler', {}, {
      jobId: 'daily_attendance_scheduler_repeatable',
      repeat: {
        pattern: '1 0 * * *' // 00:01 mỗi ngày
      },
      removeOnComplete: true
    }).catch(err => {
      console.error('[Scheduler] Warning adding repeatable job:', err.message);
    });

    // 2. Nạp ngay các mốc thông báo của ngày hôm nay vào hàng đợi Delayed Jobs
    await scheduleAllTodayMilestones();

    console.log('[Scheduler] Attendance notification BullMQ scheduler initialized successfully.');
  } catch (err) {
    console.error('[Scheduler] Error initializing attendance notification scheduler:', err);
  }
};

async function startServer() {
  try {
    await sequelize.authenticate();
    console.log('Database connection established successfully.');
    await sequelize.sync(); // Avoid using alter: true as it generates invalid ALTER COLUMN syntax for constraints in MSSQL
    console.log('Database synced successfully.');

    // Setup BullMQ scheduler for attendance notifications
    await setupAttendanceNotificationCrons();

    // Seed default task statuses if table is empty
    const { task_status } = require('./models');
    const count = await task_status.count();
    if (count === 0) {
      console.log('Seeding default task statuses...');
      await task_status.bulkCreate([
        { name: 'pending', label: 'To Do', color_bg: '#f3f4f6', color_text: '#374151' },
        { name: 'in progress', label: 'In Progress', color_bg: '#dbeafe', color_text: '#1e40af' },
        { name: 'in review', label: 'In Review', color_bg: '#f3e8ff', color_text: '#6b21a8' },
        { name: 'completed', label: 'Done', color_bg: '#d1fae5', color_text: '#065f46' }
      ]);
      console.log('Task statuses seeded successfully.');
    }

    // Cleanup expired refresh tokens on server startup
    const { cleanupExpiredRefreshTokens } = require('./services/authService');
    await cleanupExpiredRefreshTokens();
  } catch (error) {
    console.error('Unable to connect to the database:', error.message);
    console.error('Server will still start, but DB features may not work.');
  }

  app.listen(port, () => console.log(`Server running on port ${port}`));
}

startServer();
