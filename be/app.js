require('dotenv').config();
const express = require('express');
const app = express();
const router = require('./routes');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const sequelize = require('./config/db');
require('./models'); // Load all models and associations
const port = process.env.PORT || 5000;

// Import attendance notification service
const {
  checkMorningCheckIn,
  checkMorningCheckOut,
  checkAfternoonCheckIn,
  checkAfternoonCheckOut
} = require('./services/attendanceNotificationService');

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
    const { checkType } = req.body; // 'morning-checkin', 'morning-checkout', 'afternoon-checkin', 'afternoon-checkout'

    if (!checkType) {
      return res.status(400).json({ success: false, message: 'checkType is required' });
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
        return res.status(400).json({ success: false, message: 'Invalid checkType' });
    }

    res.json({ success: true, message: `Test email check (${checkType}) triggered successfully` });
  } catch (error) {
    console.error('[Test Endpoint] Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Setup cron jobs cho attendance notifications
 * Các cron jobs chạy vào giờ quy định mỗi ngày
 */
const setupAttendanceNotificationCrons = () => {
  // Polling interval: chạy check mỗi 1 phút
  // Tuy nhiên các hàm sẽ kiểm tra logic để chỉ gửi mail vào đúng giờ
  setInterval(async () => {
    const now = new Date();
    const vnTime = now.toLocaleString('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' });
    const hours = vnTime.split(' ')[1].substring(0, 2);
    const minutes = vnTime.split(' ')[1].substring(3, 5);
    const hm = `${hours}:${minutes}`;

    // 9h31 - Morning shift check-in warning
    if (hm === '09:31') {
      console.log('[Scheduler] Triggering 09:31 morning check-in check...');
      await checkMorningCheckIn().catch(err => console.error('[Scheduler] Error in 09:31 check:', err));
    }

    // 12h15 - Morning shift check-out reminder
    if (hm === '12:15') {
      console.log('[Scheduler] Triggering 12:15 morning check-out check...');
      await checkMorningCheckOut().catch(err => console.error('[Scheduler] Error in 12:15 check:', err));
    }

    // 14h01 - Afternoon shift check-in warning
    if (hm === '14:01') {
      console.log('[Scheduler] Triggering 14:01 afternoon check-in check...');
      await checkAfternoonCheckIn().catch(err => console.error('[Scheduler] Error in 14:01 check:', err));
    }

    // 18h31 - Afternoon shift check-out reminder
    if (hm === '18:31') {
      console.log('[Scheduler] Triggering 18:31 afternoon check-out check...');
      await checkAfternoonCheckOut().catch(err => console.error('[Scheduler] Error in 18:31 check:', err));
    }
  }, 60000); // Check every 1 minute (60000ms)

  console.log('[Scheduler] Attendance notification crons initialized successfully.');
  console.log('[Scheduler] Scheduled times: 09:31 (Morning Check-in), 12:15 (Morning Check-out), 14:01 (Afternoon Check-in), 18:31 (Afternoon Check-out)');
};

async function startServer() {
  try {
    await sequelize.authenticate();
    console.log('Database connection established successfully.');
    await sequelize.sync({ force: false });
    console.log('Database synced successfully.');

    // Setup cron jobs for attendance notifications
    setupAttendanceNotificationCrons();

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



  } catch (error) {
    console.error('Unable to connect to the database:', error.message);
    console.error('Server will still start, but DB features may not work.');
  }

  app.listen(port, () => console.log(`Server running on port ${port}`));
}

startServer();
