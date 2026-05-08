const loginService = require('../services/loginService');
const { sendRes } = require('../utils/responseHelper');
const jwt = require('jsonwebtoken');

const secretKey = process.env.ACCESS_SECRET_KEY;
const ACCESS_TOKEN_EXPIRY = '8h';
const REFRESH_TOKEN_EXPIRY = '7d';

/**
 * POST /api/login
 * Đăng nhập và trả về accessToken + refreshToken
 */
const login = async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return sendRes(res, 400, 'Username and password are required.');
        }

        const user = await loginService.login({ username, password });

        const payload = {
            person_id: user.person_id,
            username: user.username,
            name: user.name,
            role: user.role
        };
        const accessToken = jwt.sign(payload, secretKey, { expiresIn: ACCESS_TOKEN_EXPIRY });

        const refreshToken = jwt.sign({ person_id: user.person_id }, secretKey, { expiresIn: REFRESH_TOKEN_EXPIRY });

        sendRes(res, 200, 'Login successful', {
            accessToken,
            refreshToken
        });
    } catch (error) {
        sendRes(res, 401, 'Invalid username or password.', null, error.message);
    }
};

/**
 * POST /api/login/refresh
 * Làm mới accessToken bằng refreshToken
 */
const refreshToken = async (req, res) => {
    try {
        const { refreshToken: token } = req.body;

        if (!token) {
            return sendRes(res, 400, 'Refresh token is required.');
        }

        // Xác minh refresh token
        const decoded = jwt.verify(token, secretKey);

        // Lấy thông tin user mới nhất từ DB
        const user = await loginService.findById(decoded.person_id);
        if (!user) {
            return sendRes(res, 404, 'User not found.');
        }

        // Tạo access token mới
        const payload = {
            person_id: user.person_id,
            username: user.username,
            name: user.name,
            role: user.role
        };

        const newAccessToken = jwt.sign(payload, secretKey, { expiresIn: ACCESS_TOKEN_EXPIRY });

        sendRes(res, 200, 'Token refreshed successfully', {
            accessToken: newAccessToken
        });
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return sendRes(res, 401, 'Refresh token has expired. Please login again.');
        }
        sendRes(res, 403, 'Invalid refresh token.', null, error.message);
    }
};

/**
 * GET /api/login/me
 * Lấy thông tin user hiện tại từ token (cần verifyToken middleware)
 */
const getMe = async (req, res) => {
    try {
        const user = await loginService.findById(req.user.person_id);
        if (!user) {
            return sendRes(res, 404, 'User not found.');
        }

        sendRes(res, 200, 'User info retrieved', {
            person_id: user.person_id,
            username: user.username,
            name: user.name,
            role: user.role,
            status: user.status
        });
    } catch (error) {
        sendRes(res, 500, 'Error retrieving user info.', null, error.message);
    }
};

module.exports = {
    login,
    refreshToken,
    getMe
};
