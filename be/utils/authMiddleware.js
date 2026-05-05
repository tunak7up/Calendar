const jwt = require('jsonwebtoken');
const { sendRes } = require('./responseHelper');

const secretKey = process.env.ACCESS_SECRET_KEY;

/**
 * Middleware xác thực JWT token.
 * Kiểm tra header Authorization: Bearer <token>
 */
const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

    if (!token) {
        return sendRes(res, 401, 'Access denied. No token provided.');
    }

    try {
        const decoded = jwt.verify(token, secretKey);
        req.user = decoded; // Gắn thông tin user vào request
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return sendRes(res, 401, 'Token has expired.');
        }
        return sendRes(res, 403, 'Invalid token.');
    }
};

/**
 * Middleware kiểm tra quyền theo role.
 * Sử dụng sau verifyToken.
 * @param  {...string} roles - Danh sách role được phép truy cập
 */
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return sendRes(res, 403, 'Forbidden. You do not have permission to access this resource.');
        }
        next();
    };
};

module.exports = { verifyToken, authorize };
