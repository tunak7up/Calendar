const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const jwtConfig = require('../config/jwt');
const Person = require('../models/person');
const RefreshToken = require('../models/refresh_token');

const login = async (username, password) => {
  // Tìm user theo username
  const person = await Person.findOne({ where: { username } });
  if (!person)
    throw new Error('Tên đăng nhập không tồn tại');

  // Kiểm tra tài khoản có bị khóa không
  if (!person.status)
    throw new Error('Tài khoản đã bị vô hiệu hóa');

  // So s?nh password
  //   const isMatch = await bcrypt.compare(password, person.password);
  const isMatch = password === person.password;

  if (!isMatch)
    throw new Error('Mật khẩu không đúng');

  // T?o token
  const payload = {
    person_id: person.person_id,
    username: person.username,
    role: person.role,
  };
  const token = jwt.sign(payload, jwtConfig.secret, { expiresIn: jwtConfig.expiresIn });

  // Generate Refresh Token
  const refreshPayload = { person_id: person.person_id };
  const refreshTokenString = jwt.sign(refreshPayload, jwtConfig.refreshSecret, { expiresIn: jwtConfig.refreshExpiresIn });
  const refreshTokenHash = await bcrypt.hash(refreshTokenString, 10);
  
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  await RefreshToken.create({
    person_id: person.person_id,
    token_hash: refreshTokenHash,
    expires_at: expiresAt,
    device_info: ''
  });

  return {
    token,
    refreshToken: refreshTokenString,
    user: {
      person_id: person.person_id,
      name: person.name,
      username: person.username,
      email: person.email,
      role: person.role,
    },
  };
};

// Hash password khi tao user moi
const hashPassword = async (plainPassword) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plainPassword, salt);
};

const refresh = async (refreshTokenString) => {
  if (!refreshTokenString) throw new Error('Không có refresh token');
  
  let decoded;
  try {
    decoded = jwt.verify(refreshTokenString, jwtConfig.refreshSecret);
  } catch (err) {
    throw new Error('Refresh token không hợp lệ hoặc đã hết hạn');
  }

  const tokens = await RefreshToken.findAll({ where: { person_id: decoded.person_id } });
  
  let validTokenRecord = null;
  for (const t of tokens) {
    const isMatch = await bcrypt.compare(refreshTokenString, t.token_hash);
    if (isMatch) {
      validTokenRecord = t;
      break;
    }
  }

  if (!validTokenRecord) {
    throw new Error('Refresh token đã bị thu hồi hoặc không tồn tại');
  }

  if (new Date() > validTokenRecord.expires_at) {
    await validTokenRecord.destroy();
    throw new Error('Refresh token đã hết hạn trong hệ thống');
  }

  const person = await Person.findByPk(decoded.person_id);
  if (!person || !person.status) throw new Error('Tài khoản bị khoá hoặc không tồn tại');

  const payload = { person_id: person.person_id, username: person.username, role: person.role };
  const token = jwt.sign(payload, jwtConfig.secret, { expiresIn: jwtConfig.expiresIn });

  return {
    token,
    user: {
      person_id: person.person_id,
      name: person.name,
      username: person.username,
      email: person.email,
      role: person.role,
    }
  };
};

const logout = async (refreshTokenString) => {
  if (!refreshTokenString) return;
  try {
    const decoded = jwt.verify(refreshTokenString, jwtConfig.refreshSecret);
    const tokens = await RefreshToken.findAll({ where: { person_id: decoded.person_id } });
    for (const t of tokens) {
      const isMatch = await bcrypt.compare(refreshTokenString, t.token_hash);
      if (isMatch) {
        await t.destroy();
        break;
      }
    }
  } catch (err) {
    // Ignore invalid tokens on logout
  }
};

module.exports = { login, hashPassword, refresh, logout };