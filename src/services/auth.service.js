const { User, Wallet, RefreshToken } = require('../models');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { Op } = require('sequelize');
const emailService = require('./email.service');

class AuthService {
  async register(userData) {
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [{ email: userData.email }, { mobile: userData.mobile }, { pan_number: userData.pan_number }, { aadhaar_number: userData.aadhaar_number }]
      }
    });

    if (existingUser) {
      throw new Error('User with this email, mobile, PAN, or Aadhaar already exists');
    }

    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

    const user = await User.create({
      ...userData,
      otp,
      otp_expires_at: otpExpiresAt
    });

    // Create wallet for user
    await Wallet.create({ user_id: user.id });

    console.log(`OTP for ${user.mobile}: ${otp}`);

    return {
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        mobile: user.mobile,
        kyc_status: user.kyc_status
      },
      message: 'Registration successful'
    };
  }

  async verifyOtp(mobile, otp, deviceId) {
    const user = await User.findOne({ where: { mobile, otp } });

    if (!user) {
      throw new Error('Invalid OTP');
    }

    if (user.otp_expires_at < new Date()) {
      throw new Error('OTP expired');
    }

    user.is_phone_verified = true;
    user.otp = null;
    user.otp_expires_at = null;
    await user.save();

    return this.generateAuthResponse(user, deviceId);
  }

  async sendLoginOtp(mobile) {
    const user = await User.findOne({ where: { mobile } });
    if (!user) {
      throw new Error('User with this mobile number not found');
    }

    const otp = Math.floor(1000 + Math.random() * 9000).toString(); // Random 4-digit OTP
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

    user.otp = otp;
    user.otp_expires_at = otpExpiresAt;
    await user.save();

    // For now, just log OTP
    console.log(`Login OTP for ${mobile}: ${otp}`);

    return { message: 'OTP sent successfully to your mobile' };
  }

  async loginWithOtp(mobile, otp, userId) {
    const user = await User.findOne({ where: { mobile } });
    if (!user) {
      throw new Error('User not found');
    }

    if (user.otp !== otp) {
      throw new Error('Invalid OTP');
    }

    if (user.otp_expires_at < new Date()) {
      throw new Error('OTP expired');
    }

    user.otp = null;
    user.otp_expires_at = null;
    user.last_login = new Date();
    await user.save();

    return this.generateAuthResponse(user, userId);
  }

  async login(identifier, password, userId) {
    const user = await User.findOne({ 
      where: { 
        [Op.or]: [{ email: identifier }, { mobile: identifier }]
      } 
    });

    if (!user || !(await user.comparePassword(password))) {
      throw new Error('Invalid email/mobile or password');
    }

    user.last_login = new Date();
    await user.save();

    // Ideally, store device_id in a session/device table
    
    return this.generateAuthResponse(user, userId);
  }

  async refreshToken(token) {
    const refreshToken = await RefreshToken.findOne({
      where: { token, expires_at: { [Op.gt]: new Date() } }
    });

    if (!refreshToken) {
      throw new Error('Invalid or expired refresh token');
    }

    const user = await User.findByPk(refreshToken.user_id);
    
    // Delete the old refresh token (rotation)
    await refreshToken.destroy();
    
    return this.generateAuthResponse(user, refreshToken.device_id); // device_id is still the column name in DB
  }

  async logout(userId, token) {
    await RefreshToken.destroy({ where: { user_id: userId, token } });
  }

  async forgotPassword(email) {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      // Don't throw error to avoid email enumeration, but we won't send anything
      return { message: 'If your email is registered, you will receive an OTP' };
    }

    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

    user.otp = otp;
    user.otp_expires_at = otpExpiresAt;
    await user.save();

    await emailService.sendPasswordResetOTP(user.email, otp);

    return { message: 'OTP sent to your email' };
  }

  async generateAuthResponse(user, userId) {
    const accessToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET || 'secret', {
      expiresIn: process.env.JWT_ACCESS_EXPIRATION || '1h'
    });

    const refreshTokenString = crypto.randomBytes(40).toString('hex');
    const refreshTokenDays = parseInt(process.env.JWT_REFRESH_EXPIRATION) || 7;
    const expiresAt = new Date(Date.now() + refreshTokenDays * 24 * 60 * 60 * 1000); 

    await RefreshToken.create({
      user_id: user.id,
      token: refreshTokenString,
      device_id: userId,
      expires_at: expiresAt
    });

    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    // Using first 4 characters of UUID since id_seq is unavailable due to DB key limits
    const uniquePart = user.id.split('-')[0].substring(0, 4).toUpperCase();
    const customUserId = `${year}${month}${day}${uniquePart}`;

    return {
      user: {
        id: user.id,
        userId: customUserId, // Human-readable ID: YYYYMMDD0001
        full_name: user.full_name,
        email: user.email,
        kyc_status: user.kyc_status,
        role: user.role,
        selfie_url: user.selfie_url || null,
        avatar_url: user.selfie_url || null,
        avatar: user.selfie_url || null,
        profile_image: user.selfie_url || null
      },
      accessToken,
      refreshToken: refreshTokenString
    };
  }

  async getActiveSessions(userId, currentToken) {
    const sessions = await RefreshToken.findAll({
      where: { user_id: userId, expires_at: { [Op.gt]: new Date() } },
      order: [['created_at', 'DESC']]
    });

    return sessions.map(session => ({
      id: session.id,
      device_name: session.device_id || 'Unknown Device',
      last_active: session.updated_at || session.created_at,
      expires_at: session.expires_at,
      is_current: session.token === currentToken
    }));
  }

  async revokeSession(userId, sessionId) {
    return await RefreshToken.destroy({
      where: { id: sessionId, user_id: userId }
    });
  }
}

module.exports = new AuthService();
