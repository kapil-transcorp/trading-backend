const { Wallet, WalletTransaction } = require('../models');
const { sequelize } = require('../config/db');

class WalletService {
  async getBalance(userId) {
    return await Wallet.findOne({ where: { user_id: userId } });
  }

  async addMoney(userId, amount, razorpayData = {}) {
    const t = await sequelize.transaction();
    try {
      const wallet = await Wallet.findOne({ where: { user_id: userId }, transaction: t });
      
      wallet.balance = parseFloat(wallet.balance) + parseFloat(amount);
      await wallet.save({ transaction: t });

      const transaction = await WalletTransaction.create({
        wallet_id: wallet.id,
        type: 'deposit',
        amount: amount,
        status: 'completed',
        razorpay_payment_id: razorpayData.payment_id,
        razorpay_order_id: razorpayData.order_id,
        description: 'Money added to wallet'
      }, { transaction: t });

      await t.commit();
      return { wallet, transaction };
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  async withdrawMoney(userId, amount) {
    const t = await sequelize.transaction();
    try {
      const wallet = await Wallet.findOne({ where: { user_id: userId }, transaction: t });
      
      if (parseFloat(wallet.balance) < parseFloat(amount)) {
        throw new Error('Insufficient balance');
      }

      wallet.balance = parseFloat(wallet.balance) - parseFloat(amount);
      await wallet.save({ transaction: t });

      const transaction = await WalletTransaction.create({
        wallet_id: wallet.id,
        type: 'withdrawal',
        amount: amount,
        status: 'completed',
        description: 'Money withdrawn from wallet'
      }, { transaction: t });

      await t.commit();
      return { wallet, transaction };
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  async getTransactionHistory(userId) {
    const wallet = await Wallet.findOne({ where: { user_id: userId } });
    return await WalletTransaction.findAll({
      where: { wallet_id: wallet.id },
      order: [['created_at', 'DESC']]
    });
  }
}

module.exports = new WalletService();
