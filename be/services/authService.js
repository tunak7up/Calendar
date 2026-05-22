const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const jwtConfig = require('../config/jwt');
const Person = require('../models/person');
const RefreshToken = require('../models/refresh_token');

const login = async (username, password) => {
  const person = await Person.findOne({ where: { username } });
  if (!person)
    throw new Error('Tai khoan khong ton tai');

  if (!person.status)
    throw new Error('Tai khoan chua duoc kich hoat, lien lac voi manager');

  const isMatch = await bcrypt.compare(password, person.password);
  // const isMatch = password === person.password;

  if (!isMatch)
    throw new Error('Mat khau khong chinh xac');

  // Tao access token
  const payload = {
    person_id: person.person_id,
    username: person.username,
    role: person.role,
  };
  const token = jwt.sign(payload, jwtConfig.secret, { expiresIn: jwtConfig.expiresIn });

  // Tao Refresh Token
  const refreshPayload = { person_id: person.person_id };
  const refreshTokenString = jwt.sign(refreshPayload, jwtConfig.refreshSecret, { expiresIn: jwtConfig.refreshExpiresIn });
  const refreshTokenHash = await bcrypt.hash(refreshTokenString, 10);

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  await RefreshToken.create({
    person_id: person.person_id,
    token_hash: refreshTokenHash,
    expires_at: expiresAt,
    device_info: 'mock pc'
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
  if (!refreshTokenString) throw new Error('Khong co refresh token');

  let decoded;
  try {
    decoded = jwt.verify(refreshTokenString, jwtConfig.refreshSecret);
  } catch (err) {
    throw new Error('Refresh token khong chuan voi khoa refresh secret hoac da het han');
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
    throw new Error('Refresh token khong ton tai hoac da bi thu hoi');
  }

  if (new Date() > validTokenRecord.expires_at) {
    await validTokenRecord.destroy();
    throw new Error('Refresh token da het han trong he thong');
  }

  const person = await Person.findByPk(decoded.person_id);
  if (!person || !person.status) throw new Error('Tai khoan bi vo hieu hoa hoac khong ton tai');

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