const { User, WalletTransaction, AutomationOrder, Trade, KYCDocument, sequelize } = require('../models');

class AdminService {
  async getDashboardStats() {
    const totalUsers = await User.count();
    const totalTrades = await Trade.count();
    const totalAutomations = await AutomationOrder.count();
    
    // Revenue can be calculated from trade fees (mocked here)
    const revenue = await Trade.sum('total_amount') * 0.001; // 0.1% fee

    return {
      total_users: totalUsers,
      total_trades: totalTrades,
      total_automations: totalAutomations,
      total_revenue: revenue || 0
    };
  }

  async getUsers() {
    return await User.findAll({
      attributes: { exclude: ['password'] }
    });
  }

  async getUserDetails(id) {
    return await User.findByPk(id, {
      include: ['Wallet', 'Portfolios', 'Trades'],
      attributes: { exclude: ['password'] }
    });
  }

  async getWalletTransactions() {
    return await WalletTransaction.findAll({
      order: [['created_at', 'DESC']]
    });
  }

  async getAutomations() {
    return await AutomationOrder.findAll({
      include: [User, 'Stock'],
      order: [['created_at', 'DESC']]
    });
  }

  async getTrades() {
    return await Trade.findAll({
      include: [User, 'Stock'],
      order: [['created_at', 'DESC']]
    });
  }

  async getRevenueAnalytics() {
    // Mock monthly revenue
    return [
      { month: 'Jan', revenue: 1200 },
      { month: 'Feb', revenue: 1500 },
      { month: 'Mar', revenue: 2100 }
    ];
  }

  async getKycPendingUsers() {
    return await User.findAll({
      where: { kyc_status: 'UNDER_REVIEW' },
      attributes: { exclude: ['password'] }
    });
  }

  async approveKyc(userId, status) {
    const user = await User.findByPk(userId);
    if (!user) throw new Error('User not found');
    user.kyc_status = status; // 'VERIFIED' or 'REJECTED'
    await user.save();
    
    // Update associated KYCDocument statuses
    await KYCDocument.update({ status }, { where: { user_id: userId } });
    
    return user;
  }

  async updateUserStatus(userId, isActive) {
    const user = await User.findByPk(userId);
    if (!user) throw new Error('User not found');
    user.is_active = isActive;
    await user.save();
    return user;
  }

  async broadcastNotification(data) {
    // Logic to send push notifications to all active fcm_tokens
    // Mocking Firebase Cloud Messaging (FCM) broadcast
    const activeUsers = await User.count({ where: { is_active: true } });
    
    // In real app, we would fetch fcm_tokens from user devices/sessions and push via firebase-admin
    return {
      success: true,
      message: `Broadcasted to ${activeUsers} active users.`,
      payload: data
    };
  }
}

module.exports = new AdminService();
