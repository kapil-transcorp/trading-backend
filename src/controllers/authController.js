const authService = require('../services/authService');

class AuthController {
  async register(req, res) {
    const user = await authService.register(req.body);
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });
  }

  async login(req, res) {
    const { email, password } = req.body;
    const { user, accessToken, refreshToken } = await authService.login(email, password);
    
    // Set cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        },
        accessToken
      }
    });
  }

  async logout(req, res) {
    const refreshToken = req.cookies.refreshToken;
    await authService.logout(req.user.id, refreshToken);
    res.clearCookie('refreshToken');
    res.status(200).json({ success: true, message: 'Logged out successfully' });
  }

  async refresh(req, res) {
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
    if (!refreshToken) {
      return res.status(400).json({ success: false, error: 'Refresh token required' });
    }
    const { accessToken } = await authService.refreshToken(refreshToken);
    res.status(200).json({ success: true, data: { accessToken } });
  }
}

module.exports = new AuthController();
