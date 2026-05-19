const { Trade, Portfolio, Wallet, Stock, WalletTransaction } = require('../models');
const { sequelize } = require('../config/db');
const socketUtil = require('../utils/socket');


class TradeService {
  async buyStock(userId, tradeData) {
    const { symbol, quantity, price, order_type = 'market' } = tradeData;
    const brokerage = 12.50; // Fixed brokerage as per screenshot
    const orderValue = quantity * price;
    const totalAmount = orderValue + brokerage;

    const t = await sequelize.transaction();

    try {
      const { Op } = require('sequelize');
      const stock = await Stock.findOne({
        where: {
          [Op.or]: [
            { id: symbol || tradeData.stock_id },
            { symbol: symbol || tradeData.stock_id }
          ]
        }
      });
      if (!stock) throw new Error('Stock not found');

      const wallet = await Wallet.findOne({ where: { user_id: userId } });
      if (parseFloat(wallet.balance) < totalAmount) throw new Error('Insufficient wallet balance');

      // Deduct from wallet
      const beforeBalance = wallet.balance;
      wallet.balance = parseFloat(wallet.balance) - totalAmount;
      await wallet.save({ transaction: t });

      // Create Wallet Transaction
      await WalletTransaction.create({
        wallet_id: wallet.id,
        amount: totalAmount,
        type: 'trade_buy',
        status: 'completed',
        before_balance: beforeBalance,
        after_balance: wallet.balance,
        description: `Buy ${quantity} ${symbol} (${order_type})`
      }, { transaction: t });

      // Create Trade record
      const trade = await Trade.create({
        user_id: userId,
        stock_id: stock.id,
        type: 'buy',
        order_type,
        quantity,
        price,
        total_amount: orderValue,
        brokerage,
        status: 'completed'
      }, { transaction: t });

      // Update Portfolio
      let portfolio = await Portfolio.findOne({ where: { user_id: userId, stock_id: stock.id } });
      if (portfolio) {
        const newQuantity = portfolio.quantity + quantity;
        const newAvgPrice = (parseFloat(portfolio.average_buy_price) * portfolio.quantity + orderValue) / newQuantity;
        portfolio.quantity = newQuantity;
        portfolio.average_buy_price = newAvgPrice;
        portfolio.total_investment = parseFloat(portfolio.total_investment) + orderValue;
        await portfolio.save({ transaction: t });
      } else {
        await Portfolio.create({
          user_id: userId,
          stock_id: stock.id,
          quantity,
          average_buy_price: price,
          total_investment: orderValue
        }, { transaction: t });
      }

      await t.commit();
      return trade;
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  async sellStock(userId, tradeData) {
    const { symbol, quantity, order_type = 'market' } = tradeData;
    const brokerage = 12.50;

    const t = await sequelize.transaction();

    try {
      const { Op } = require('sequelize');
      const stock = await Stock.findOne({
        where: {
          [Op.or]: [
            { id: symbol || tradeData.stock_id },
            { symbol: symbol || tradeData.stock_id }
          ]
        }
      });
      if (!stock) throw new Error('Stock not found');

      const portfolio = await Portfolio.findOne({ where: { user_id: userId, stock_id: stock.id } });
      if (!portfolio || portfolio.quantity < quantity) throw new Error('Exceeds available holdings');

      const currentPrice = stock.current_price || tradeData.price || 0;
      const orderValue = quantity * currentPrice;
      const netReceivable = orderValue - brokerage;
      const realizedPnl = (currentPrice - parseFloat(portfolio.average_buy_price)) * quantity;

      // Update Portfolio
      portfolio.quantity -= quantity;
      portfolio.total_investment = parseFloat(portfolio.total_investment) - (parseFloat(portfolio.average_buy_price) * quantity);
      if (portfolio.quantity === 0) {
        await portfolio.destroy({ transaction: t });
      } else {
        await portfolio.save({ transaction: t });
      }

      // Add to wallet
      const wallet = await Wallet.findOne({ where: { user_id: userId } });
      const beforeBalance = wallet.balance;
      wallet.balance = parseFloat(wallet.balance) + netReceivable;
      await wallet.save({ transaction: t });

      // Create Wallet Transaction
      await WalletTransaction.create({
        wallet_id: wallet.id,
        amount: netReceivable,
        type: 'trade_sell',
        status: 'completed',
        before_balance: beforeBalance,
        after_balance: wallet.balance,
        description: `Sell ${quantity} ${symbol} (${order_type})`
      }, { transaction: t });

      // Create Trade record
      const trade = await Trade.create({
        user_id: userId,
        stock_id: stock.id,
        type: 'sell',
        order_type,
        quantity,
        price: currentPrice,
        total_amount: orderValue,
        brokerage,
        realized_pnl: realizedPnl,
        status: 'completed'
      }, { transaction: t });

      await t.commit();
      return trade;
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  async getHoldings(userId) {
    return await Portfolio.findAll({
      where: { user_id: userId },
      include: [Stock]
    });
  }

  async getPortfolioSummary(userId) {
    const holdings = await this.getHoldings(userId);
    let totalInvestment = 0;
    let currentValuation = 0;

    holdings.forEach(h => {
      totalInvestment += parseFloat(h.total_investment);
      currentValuation += h.quantity * (h.Stock.current_price || 0);
    });

    return {
      total_investment: totalInvestment,
      current_valuation: currentValuation,
      total_pnl: currentValuation - totalInvestment,
      pnl_percentage: totalInvestment > 0 ? ((currentValuation - totalInvestment) / totalInvestment) * 100 : 0
    };
  }

  async getTradeHistory(userId) {
    return await Trade.findAll({
      where: { user_id: userId },
      include: [Stock],
      order: [['created_at', 'DESC']]
    });
  }

  async getOpenOrders(userId) {
    return await Trade.findAll({
      where: { user_id: userId, status: 'pending' },
      include: [Stock]
    });
  }
}

module.exports = new TradeService();
