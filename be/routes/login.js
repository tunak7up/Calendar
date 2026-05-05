const express = require('express');
const router = express.Router();
const loginController = require('../controllers/loginController');
const { verifyToken } = require('../utils/authMiddleware');

// POST /api/login - Đăng nhập
router.post('/', loginController.login);

// POST /api/login/refresh - Làm mới access token
router.post('/refresh', loginController.refreshToken);

// GET /api/login/me - Lấy thông tin user hiện tại (cần xác thực)
router.get('/me', verifyToken, loginController.getMe);

module.exports = router;