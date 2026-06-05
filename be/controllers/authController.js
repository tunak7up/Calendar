const authService = require('../services/authService');

const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password)
      return res.status(400).json({ message: 'Vui long nhap day du thong tin' });

    const result = await authService.login(username, password);
    const isProduction = process.env.NODE_ENV === 'production';
    // Set refresh token as HttpOnly cookie
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: isProduction, // Only set secure flag in production
      sameSite:isProduction ? 'none' : 'lax', // Use 'none' for cross-site in production, 'lax' for development
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
      return res.status(401).json({ message: 'Khong tim thay refresh token' });
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
      // Chạy ngầm hàm logout để không block quá trình clearCookie và phản hồi lại cho user
      authService.logout(refreshToken).catch(err => console.error('Lỗi xóa refresh token ngầm:', err));
    }
    const isProduction = process.env.NODE_ENV === 'production';
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
    });

    res.json({ message: 'Dang xuat thanh cong' });
  } catch (err) {
    console.error('Logout error:', err);
    res.status(500).json({ message: 'Loi dang xuat' });
  }
};

module.exports = { login, refresh, logout };