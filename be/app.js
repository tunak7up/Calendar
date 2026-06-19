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
          { component: '[data-custom-component="Button"]', label: 'Nút chính', bg: '#2563eb', text: '#ffffff', defaultBg: '#2563eb', defaultText: '#ffffff' },
          { component: '[data-custom-component="BackButton"]', label: 'Nút quay lại', bg: '#ffffff', text: '#374151', defaultBg: '#ffffff', defaultText: '#374151' },
          { component: '[data-custom-component="CustomSelect"]', label: 'Hộp chọn (Custom Select)', bg: '#ffffff', text: '#374151', defaultBg: '#ffffff', defaultText: '#374151' },
          { component: '[data-custom-component="TaskStatusSelect"]', label: 'Hộp chọn trạng thái công việc (Task Status Select)', bg: '#f3f4f6', text: '#1f2937', defaultBg: '#f3f4f6', defaultText: '#1f2937' },
          { component: '[data-custom-component="HeaderNavLink"]', label: 'Link Menu Header', bg: 'transparent', text: '#4b5563', defaultBg: 'transparent', defaultText: '#4b5563' },
          { component: '[data-custom-component="SidebarBackground"]', label: 'Nền Sidebar', bg: '#f8fafc', text: '#1f2937', defaultBg: '#f8fafc', defaultText: '#1f2937' },
          { component: '[data-custom-component="SidebarBrandIcon"]', label: 'Icon thương hiệu Sidebar', bg: '#0056b3', text: '#ffffff', defaultBg: '#0056b3', defaultText: '#ffffff' },
          { component: '[data-custom-component="SidebarLink-Active"]', label: 'Sidebar Link (Đang chọn)', bg: '#0056b3', text: '#ffffff', defaultBg: '#0056b3', defaultText: '#ffffff' },
          { component: '[data-custom-component="SidebarLink-Inactive"]', label: 'Sidebar Link (Không chọn)', bg: 'transparent', text: '#4b5563', defaultBg: 'transparent', defaultText: '#4b5563' },
          { component: '[data-custom-component="CalendarCard-registered"]', label: 'Thẻ Lịch - Đã đăng ký', bg: '#eff6ff', text: '#1e4ed8', defaultBg: '#eff6ff', defaultText: '#1e4ed8' },
          { component: '[data-custom-component="CalendarCard-unscheduled"]', label: 'Thẻ Lịch - Chưa lên lịch', bg: '#fef3c7', text: '#92400e', defaultBg: '#fef3c7', defaultText: '#92400e' },
          { component: '[data-custom-component="CalendarCard-Individual"]', label: 'Thẻ Lịch - Cá nhân', bg: '#eff6ff', text: '#1e4ed8', defaultBg: '#eff6ff', defaultText: '#1e4ed8' },
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
