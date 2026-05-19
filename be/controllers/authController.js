const authService = require('../services/authService');

const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password)
      return res.status(400).json({ message: 'Vui lòng nhập lại thông tin' });

    const result = await authService.login(username, password);

    // Set refresh token as HttpOnly cookie
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    // Don't send refresh token in JSON body
    res.json({
      token: result.token,
      user: result.user
    });
  } catch (err) {
    res.status(401).json({ message: err.message });
  }
};

const refresh = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({ message: 'Không tìm thấy refresh token' });
    }

    const result = await authService.refresh(refreshToken);

    res.json({
      token: result.token,
      user: result.user
    });
  } catch (err) {
    res.status(403).json({ message: err.message });
  }
};

const logout = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (refreshToken) {
      await authService.logout(refreshToken);
    }

    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: true,
      sameSite: 'None', // Cookie v0.7+ yêu cầu viết hoa chữ cái đầu
    });

    res.json({ message: 'Đăng xuất thành công' });
  } catch (err) {
    console.error('Logout error:', err);
    res.status(500).json({ message: 'Lỗi đăng xuất' });
  }
};

module.exports = { login, refresh, logout };