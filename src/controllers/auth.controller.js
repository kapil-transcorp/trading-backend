const authService = require('../services/auth.service');
const { successResponse, errorResponse } = require('../utils/response');

class AuthController {
  constructor() {
    // Bind all methods to ensure 'this' context is preserved
    const methods = Object.getOwnPropertyNames(AuthController.prototype);
    methods.forEach(method => {
      if (method !== 'constructor') {
        this[method] = this[method].bind(this);
      }
    });
  }

  register = async (req, res) => {
    try {
      console.log('Registering user:', req.body.email);
      const result = await authService.register(req.body);
      return res.status(201).json(result);
    } catch (error) {
      console.error('Registration error:', error.message);
      return errorResponse(res, error.message, 400, 'REGISTRATION_FAILED');
    }
  }

  getFriendlyDeviceName = (req) => {
    const body = req.body || {};
    const headers = req.headers || {};
    
    let candidate = body.device_name || body.device_model || headers['x-device-name'] || headers['device-name'] || body.device_id;
    
    if (!candidate) {
      candidate = headers['user-agent'] || 'Unknown Device';
    }
    
    let friendly = String(candidate).trim();
    
    if (friendly.includes('Mozilla') || friendly.includes('Chrome') || friendly.includes('Safari')) {
      if (friendly.includes('Windows')) return 'Windows PC';
      if (friendly.includes('Macintosh')) return 'macOS Device';
      if (friendly.includes('iPhone')) return 'iPhone (Web)';
      if (friendly.includes('Android')) return 'Android Device (Web)';
      return 'Web Browser';
    }
    
    if (friendly.includes('Dart/') || friendly.includes('dart:io') || friendly.includes('Flutter')) {
      if (friendly.toLowerCase().includes('iphone') || friendly.toLowerCase().includes('ios')) {
        return 'iPhone App';
      }
      if (friendly.toLowerCase().includes('android')) {
        return 'Android App';
      }
      return 'iPhone / Android App';
    }

    if (friendly.toLowerCase() === 'unknown device' || friendly === '') {
      return 'Mobile Client';
    }
    
    return friendly;
  }

  verifyOtp = async (req, res) => {
    try {
      console.log('Verifying OTP for:', req.body.mobile);
      const { mobile, otp } = req.body;
      const friendlyDevice = this.getFriendlyDeviceName(req);
      
      const result = await authService.verifyOtp(mobile, otp, friendlyDevice);
      return successResponse(res, 'OTP verified successfully', result);
    } catch (error) {
      console.error('OTP Verification error:', error.message);
      return errorResponse(res, error.message, 400, 'VERIFY_OTP_FAILED');
    }
  }

  login = async (req, res) => {
    try {
      console.log('Login attempt for:', req.body.identifier);
      const { identifier, password } = req.body;
      const friendlyDevice = this.getFriendlyDeviceName(req);
      
      const result = await authService.login(identifier, password, friendlyDevice);
      
      this.setTokenCookies(res, result.refreshToken);
      
      return res.status(200).json({
        success: true,
        message: 'Login successful (Updated Version)',
        token: result.accessToken,
        refresh_token: result.refreshToken,
        user: result.user
      });
    } catch (error) {
      console.error('Login error:', error.message);
      return errorResponse(res, error.message, 401, 'INVALID_CREDENTIALS');
    }
  }

  sendLoginOtp = async (req, res) => {
    try {
      console.log('Sending login OTP to:', req.body.mobile);
      const { mobile } = req.body;
      const result = await authService.sendLoginOtp(mobile);
      return successResponse(res, 'OTP sent successfully', result);
    } catch (error) {
      console.error('Send OTP error:', error.message);
      return errorResponse(res, error.message, 400);
    }
  }

  loginWithOtp = async (req, res) => {
    try {
      console.log('Login with OTP for:', req.body.mobile);
      const { mobile, otp } = req.body;
      const friendlyDevice = this.getFriendlyDeviceName(req);
      
      const result = await authService.loginWithOtp(mobile, otp, friendlyDevice);
      
      this.setTokenCookies(res, result.refreshToken);
 
      return res.status(200).json({
        success: true,
        message: 'Login successful (Updated Version)',
        token: result.accessToken,
        refresh_token: result.refreshToken,
        user: result.user
      });
    } catch (error) {
      console.error('Login with OTP error:', error.message);
      return errorResponse(res, error.message, 401, 'INVALID_OTP');
    }
  }

  setTokenCookies(res, refreshToken) {
    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
  }

  refreshToken = async (req, res) => {
    try {
      const refreshToken = req.body.refreshToken || req.body.refresh_token || req.cookies.refresh_token;
      
      if (!refreshToken) {
        return errorResponse(res, 'Refresh token is required', 400);
      }

      const result = await authService.refreshToken(refreshToken);
      
      // Update cookie with new refresh token if it changed (though usually it stays the same or is rotated)
      if (result.refreshToken) {
        this.setTokenCookies(res, result.refreshToken);
      }

      return successResponse(res, 'Token refreshed successfully', result);
    } catch (error) {
      console.error('Refresh token error:', error.message);
      return errorResponse(res, error.message, 401);
    }
  }

  logout = async (req, res) => {
    try {
      const refreshToken = req.body.refreshToken || req.body.refresh_token || req.cookies.refresh_token;
      
      if (refreshToken) {
        await authService.logout(req.user.id, refreshToken);
      }

      // Clear the refresh token cookie
      res.clearCookie('refresh_token');
      
      return successResponse(res, 'Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error.message);
      return errorResponse(res, error.message, 400);
    }
  }

  forgotPassword = async (req, res) => {
    try {
      const { email } = req.body;
      const result = await authService.forgotPassword(email);
      return successResponse(res, result.message);
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }

  resetPassword = async (req, res) => {
    return successResponse(res, 'Password reset successfully');
  }

  changePassword = async (req, res) => {
    return successResponse(res, 'Password changed successfully');
  }

  getActiveSessions = async (req, res) => {
    try {
      const currentToken = req.body.refreshToken || req.body.refresh_token || req.cookies.refresh_token || '';
      const sessions = await authService.getActiveSessions(req.user.id, currentToken);
      return successResponse(res, 'Active sessions retrieved successfully', sessions);
    } catch (error) {
      return errorResponse(res, error.message);
    }
  }

  revokeSession = async (req, res) => {
    try {
      const { id } = req.params;
      await authService.revokeSession(req.user.id, id);
      return successResponse(res, 'Session revoked successfully');
    } catch (error) {
      return errorResponse(res, error.message);
    }
  }
}

module.exports = new AuthController();
