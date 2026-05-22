const jwt = require('jsonwebtoken');
const jwtConfig = require('../config/jwt');

const generateAccessToken = (payload) =>
  jwt.sign(payload, jwtConfig.secret, { expiresIn: jwtConfig.expiresIn });

const generateRefreshToken = (payload) =>
  jwt.sign(payload, jwtConfig.refreshSecret, { expiresIn: jwtConfig.refreshExpiresIn });

const verifyAccessToken = (token) =>
  jwt.verify(token, jwtConfig.secret);

const verifyRefreshToken = (token) =>
  jwt.verify(token, jwtConfig.refreshSecret);

module.exports = { generateAccessToken, generateRefreshToken, verifyAccessToken, verifyRefreshToken };