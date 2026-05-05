const { person } = require('../models');

/**
 * Xác thực đăng nhập bằng username + password
 */
const login = async ({ username, password }) => {
    const user = await person.findOne({ where: { username, password } });
    if (!user) {
        throw new Error('Invalid credentials');
    }
    return user;
};

/**
 * Tìm user theo person_id (dùng cho refresh token)
 */
const findById = async (person_id) => {
    const user = await person.findByPk(person_id);
    return user;
};

module.exports = {
    login,
    findById
};