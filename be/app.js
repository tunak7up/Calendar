require('dotenv').config();
const express = require('express');
const app = express();
const router = require('./routes');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const sequelize = require('./config/db');
require('./models'); // Load all models and associations
const port = process.env.PORT || 5000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
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

async function startServer() {
  try {
    await sequelize.authenticate();
    console.log('Database connection established successfully.');
    await sequelize.sync({ force: false });
    console.log('Database synced successfully.');

    // Seed default theme settings if empty
    try {
      const { theme_setting } = require('./models');
      const count = await theme_setting.count();
      if (count === 0) {
        const defaultThemes = [
          { component: '[data-custom-component="ChartColor-Registered"]', label: 'Biểu đồ - Đăng ký', bg: 'rgba(59, 130, 246, 0.75)', text: '#374151', defaultBg: 'rgba(59, 130, 246, 0.75)', defaultText: '#374151' },
          { component: '[data-custom-component="ChartColor-Actual"]', label: 'Biểu đồ - Thực tế', bg: 'rgba(16, 185, 129, 0.75)', text: '#374151', defaultBg: 'rgba(16, 185, 129, 0.75)', defaultText: '#374151' },
          { component: '[data-custom-component="Attendance-Scheduled"]', label: 'Điểm danh - Có đăng ký trước & đi làm', bg: '#d1fae5', text: '#065f46', defaultBg: '#d1fae5', defaultText: '#065f46' },
          { component: '[data-custom-component="Attendance-Unscheduled"]', label: 'Điểm danh - Không đăng ký trước', bg: '#fef3c7', text: '#92400e', defaultBg: '#fef3c7', defaultText: '#92400e' },
          { component: '[data-custom-component="Attendance-Absent"]', label: 'Điểm danh - Chưa check-in', bg: '#ffffff', text: '#374151', defaultBg: '#ffffff', defaultText: '#374151' },
          { component: '[data-custom-component="TaskStatus-Pending"]', label: 'Trạng thái - Chưa bắt đầu (Pending)', bg: '#f3f4f6', text: '#374151', defaultBg: '#f3f4f6', defaultText: '#374151' },
          { component: '[data-custom-component="TaskStatus-InProgress"]', label: 'Trạng thái - Đang thực hiện (In progress)', bg: '#dbeafe', text: '#1e40af', defaultBg: '#dbeafe', defaultText: '#1e40af' },
          { component: '[data-custom-component="TaskStatus-Completed"]', label: 'Trạng thái - Hoàn thành (Completed)', bg: '#d1fae5', text: '#065f46', defaultBg: '#d1fae5', defaultText: '#065f46' },
          { component: '[data-custom-component="TaskStatus-Overdue"]', label: 'Trạng thái - Trễ hạn (Overdue)', bg: '#f3f4f6', text: '#b91c1c', defaultBg: '#f3f4f6', defaultText: '#b91c1c' }
        ];
        await theme_setting.bulkCreate(defaultThemes);
        console.log('Theme settings seeded successfully.');
      }
    } catch (err) {
      console.error('Failed to seed theme settings:', err.message);
    }
  } catch (error) {
    console.error('Unable to connect to the database:', error.message);
    console.error('Server will still start, but DB features may not work.');
  }

  app.listen(port, () => console.log(`Server running on port ${port}`));
}

startServer();
