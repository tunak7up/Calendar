const jwt = require('jsonwebtoken');
const jwtConfig = require('../config/jwt');

// check access token con thoi han khong
const authenticate = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token)
    return res.status(401).json({ message: 'Không có token, truy cập b�? từ chối' });

  try {
    const decoded = jwt.verify(token, jwtConfig.secret);
    req.user = decoded; // { person_id, username, role }
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Token không hợp l�? hoặc đã hết hạn' });
  }
};

// Phân quyền theo role
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Bạn không có quyền thực hiện h�?nh động n�?y' });
    }
    next();
  };
};

module.exports = { authenticate, authorize };