const jwt = require('jsonwebtoken');
const jwtConfig = require('../config/jwt');

// X?c th?c token
const authenticate = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

  if (!token)
    return res.status(401).json({ message: 'Kh?ng c? token, truy c?p b? t? ch?i' });

  try {
    const decoded = jwt.verify(token, jwtConfig.secret);
    req.user = decoded; // { person_id, username, role }
    next();
  } catch (err) {
    return res.status(403).json({ message: 'Token kh?ng h?p l? ho?c ?? h?t h?n' });
  }
};

// Ph?n quy?n theo role
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'B?n kh?ng c? quy?n th?c hi?n h?nh ??ng n?y' });
    }
    next();
  };
};

module.exports = { authenticate, authorize };