const { Trade, Portfolio, Wallet, Stock, WalletTransaction } = require('../models');
const { sequelize } = require('../config/db');

class TradingService {
  async buyStock(userId, stockId, quantity, price, automationId = null) {
    const t = await sequelize.transaction();
    try {
      const totalAmount = parseFloat(quantity) * parseFloat(price);
      
      // 1. Check wallet balance
      const wallet = await Wallet.findOne({ where: { user_id: userId }, transaction: t });
      if (parseFloat(wallet.balance) < totalAmount) {
        throw new Error('Insufficient balance in wallet');
      }

      // 2. Deduct from wallet
      wallet.balance = parseFloat(wallet.balance) - totalAmount;
      await wallet.save({ transaction: t });

      // 3. Create wallet transaction
      await WalletTransaction.create({
        wallet_id: wallet.id,
        type: 'trade_buy',
        amount: totalAmount,
        status: 'completed',
        description: `Bought ${quantity} shares of stock ID ${stockId}`
      }, { transaction: t });

      // 4. Create Trade record
      const trade = await Trade.create({
        user_id: userId,
        stock_id: stockId,
        type: 'buy',
        quantity,
        price,
        total_amount: totalAmount,
        automation_id: automationId,
        status: 'completed'
      }, { transaction: t });

      // 5. Update Portfolio
      let portfolio = await Portfolio.findOne({ 
        where: { user_id: userId, stock_id: stockId }, 
        transaction: t 
      });

      if (portfolio) {
        const newQuantity = portfolio.quantity + quantity;
        const newTotalInvestment = parseFloat(portfolio.total_investment) + totalAmount;
        portfolio.average_buy_price = newTotalInvestment / newQuantity;
        portfolio.quantity = newQuantity;
        portfolio.total_investment = newTotalInvestment;
        await portfolio.save({ transaction: t });
      } else {
        await Portfolio.create({
          user_id: userId,
          stock_id: stockId,
          quantity,
          average_buy_price: price,
          total_investment: totalAmount
        }, { transaction: t });
      }

      await t.commit();
      return trade;
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  async sellStock(userId, stockId, quantity, price, automationId = null) {
    const t = await sequelize.transaction();
    try {
      // 1. Check portfolio
      const portfolio = await Portfolio.findOne({ 
        where: { user_id: userId, stock_id: stockId }, 
        transaction: t 
      });

      if (!portfolio || portfolio.quantity < quantity) {
        throw new Error('Insufficient shares in portfolio');
      }

      const totalAmount = parseFloat(quantity) * parseFloat(price);

      // 2. Add to wallet
      const wallet = await Wallet.findOne({ where: { user_id: userId }, transaction: t });
      wallet.balance = parseFloat(wallet.balance) + totalAmount;
      await wallet.save({ transaction: t });

      // 3. Create wallet transaction
      await WalletTransaction.create({
        wallet_id: wallet.id,
        type: 'trade_sell',
        amount: totalAmount,
        status: 'completed',
        description: `Sold ${quantity} shares of stock ID ${stockId}`
      }, { transaction: t });

      // 4. Create Trade record
      const trade = await Trade.create({
        user_id: userId,
        stock_id: stockId,
        type: 'sell',
        quantity,
        price,
        total_amount: totalAmount,
        automation_id: automationId,
        status: 'completed'
      }, { transaction: t });

      // 5. Update Portfolio
      portfolio.quantity -= quantity;
      portfolio.total_investment = parseFloat(portfolio.total_investment) - (parseFloat(portfolio.average_buy_price) * quantity);
      
      if (portfolio.quantity === 0) {
        await portfolio.destroy({ transaction: t });
      } else {
        await portfolio.save({ transaction: t });
      }

      await t.commit();
      return trade;
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  async getPortfolio(userId) {
    return await Portfolio.findAll({
      where: { user_id: userId },
      include: [{ model: Stock }]
    });
  }

  async getTradeHistory(userId) {
    return await Trade.findAll({
      where: { user_id: userId },
      include: [{ model: Stock }],
      order: [['created_at', 'DESC']]
    });
  }
}

module.exports = new TradingService();
