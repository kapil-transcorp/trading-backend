const { User, Wallet, RefreshToken } = require('../models');
const { generateAccessToken, generateRefreshToken } = require('../utils/token');
const { sequelize } = require('../config/db');

class AuthService {
  async register(userData) {
    const t = await sequelize.transaction();
    try {
      const user = await User.create(userData, { transaction: t });
      
      // Create wallet for new user
      await Wallet.create({ user_id: user.id }, { transaction: t });
      
      await t.commit();
      return user;
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  async login(email, password) {
    const user = await User.findOne({ where: { email } });
    
    if (!user || !(await user.comparePassword(password))) {
      throw new Error('Invalid credentials');
    }

    if (!user.is_active) {
      throw new Error('Account is deactivated');
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Store refresh token
    await RefreshToken.create({
      user_id: user.id,
      token: refreshToken,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    });

    user.last_login = new Date();
    await user.save();

    return { user, accessToken, refreshToken };
  }

  async logout(userId, refreshToken) {
    await RefreshToken.destroy({
      where: {
        user_id: userId,
        token: refreshToken
      }
    });
  }

  async refreshToken(token) {
    const storedToken = await RefreshToken.findOne({ where: { token } });
    if (!storedToken || storedToken.expires_at < new Date()) {
      throw new Error('Invalid or expired refresh token');
    }

    const user = await User.findByPk(storedToken.user_id);
    const newAccessToken = generateAccessToken(user);
    
    return { accessToken: newAccessToken };
  }
}

module.exports = new AuthService();
