const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const jwtConfig = require('../config/jwt');
const Person = require('../models/person');
const RefreshToken = require('../models/refresh_token');

const hashToken = (token) =>
  crypto.createHash('sha256').update(token).digest('hex');

const login = async (username, password, deviceInfo) => {
  const person = await Person.findOne({ where: { username } });
  if (!person)
    throw new Error('Tai khoan khong ton tai');

  if (!person.status)
    throw new Error('Tai khoan chua duoc kich hoat');

  const isMatch = await bcrypt.compare(password, person.password);
  if (!isMatch)
    throw new Error('Mat khau khong chinh xac');

  const payload = {
    person_id: person.person_id,
    username: person.username,
    role: person.role,
  };
  const token = jwt.sign(payload, jwtConfig.secret, { expiresIn: jwtConfig.expiresIn });

  const refreshPayload = { person_id: person.person_id };
  const refreshTokenString = jwt.sign(
    refreshPayload,
    jwtConfig.refreshSecret,
    { expiresIn: jwtConfig.refreshExpiresIn }
  );

  const tokenHash = hashToken(refreshTokenString);

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  await RefreshToken.create({
    person_id: person.person_id,
    token_hash: tokenHash,
    expires_at: expiresAt,
    device_info: deviceInfo || 'unknown device',
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

const refresh = async (refreshTokenString) => {
  if (!refreshTokenString) throw new Error('Khong co refresh token');

  let decoded;
  try {
    decoded = jwt.verify(refreshTokenString, jwtConfig.refreshSecret);
  } catch {
    throw new Error('Refresh token khong hop le hoac da het han');
  }

  const tokenHash = hashToken(refreshTokenString);
  const tokenRecord = await RefreshToken.findOne({
    where: {
      person_id: decoded.person_id,
      token_hash: tokenHash,
    }
  });

  if (!tokenRecord)
    throw new Error('Refresh token khong ton tai hoac da bi thu hoi');

  if (new Date() > tokenRecord.expires_at) {
    await tokenRecord.destroy();
    throw new Error('Refresh token da het han');
  }

  const person = await Person.findByPk(decoded.person_id);
  if (!person || !person.status)
    throw new Error('Tai khoan bi vo hieu hoa');

  const payload = {
    person_id: person.person_id,
    username: person.username,
    role: person.role,
  };
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
    const tokenHash = hashToken(refreshTokenString);
    await RefreshToken.destroy({ where: { token_hash: tokenHash } });
  } catch (err) {
    console.error('Lỗi xóa refresh token khi logout', err);
  }
};

const revokeTokensByPersonId = async (personId) => {
  if (!personId) return;
  try {
    const deletedCount = await RefreshToken.destroy({ where: { person_id: personId } });
    console.log(`[Auth Service] Đã thu hồi ${deletedCount} refresh token cho person_id: ${personId}`);
    return deletedCount;
  } catch (err) {
    console.error(`Lỗi xóa toàn bộ refresh token cho person_id: ${personId}:`, err);
    throw err;
  }
};

const hashPassword = async (plainPassword) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plainPassword, salt);
};

module.exports = { login, hashPassword, refresh, logout, revokeTokensByPersonId };