const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const jwtConfig = require('../config/jwt');
const Person = require('../models/person');

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

  return {
    token,
    user: {
      person_id: person.person_id,
      name: person.name,
      username: person.username,
      email: person.email,
      role: person.role,
    },
  };
};

// Hash password khi t?o user m?i
const hashPassword = async (plainPassword) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plainPassword, salt);
};

module.exports = { login, hashPassword };