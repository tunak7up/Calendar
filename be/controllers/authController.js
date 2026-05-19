const authService = require('../services/authService');

const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password)
      return res.status(400).json({ message: 'Vui lòng nhập lại thông tin' });

    const result = await authService.login(username, password);
    res.json(result);
  } catch (err) {
    res.status(401).json({ message: err.message });
  }
};

module.exports = { login };