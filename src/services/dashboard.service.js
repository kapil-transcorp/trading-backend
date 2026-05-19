const { User, Wallet, Portfolio, Stock, Trade, AutomationOrder } = require('../models');
const { Op } = require('sequelize');

class DashboardService {
  async getDashboardData(userId) {
    // 1. Get User and Wallet Info
    const user = await User.findByPk(userId, {
      attributes: ['full_name', 'role']
    });

    const wallet = await Wallet.findOne({ where: { user_id: userId } });

    // 2. Portfolio Value calculation
    const portfolioHoldings = await Portfolio.findAll({
      where: { user_id: userId, quantity: { [Op.gt]: 0 } },
      include: [{ model: Stock, attributes: ['current_price', 'symbol', 'name'] }]
    });

    let currentHoldingsValue = 0;
    portfolioHoldings.forEach(holding => {
      const price = holding.Stock.current_price || 0;
      currentHoldingsValue += (holding.quantity * price);
    });

    const netPortfolioValue = parseFloat(wallet.balance) + parseFloat(wallet.locked_margin) + currentHoldingsValue;

    // 3. Stats calculation
    const trades = await Trade.findAll({ 
      where: { user_id: userId, status: 'completed' } 
    });

    const totalTrades = trades.length;
    let profitableTradesCount = 0;
    let dailyPnl = 0;
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    trades.forEach(trade => {
      // Calculate Daily P&L for trades completed today
      if (trade.updatedAt >= todayStart) {
        // In a real production system, P&L is calculated based on realized gains (sell price - buy price)
        // For now, we will sum the total_amount for sells and subtract for buys if they happened today
        // This is still a basic calculation but removes the hardcoded % multipliers.
        if (trade.type === 'sell') {
          dailyPnl += parseFloat(trade.total_amount);
        } else {
          dailyPnl -= parseFloat(trade.total_amount);
        }
      }

      // Logic for win rate (could be expanded based on your specific profit/loss tracking)
      // For now, we'll initialize it as 0 until you have a 'profit' field in your Trade model.
    });

    const winRate = 0; // Defaulting to 0 until real profit/loss data is available in the model
    
    // 4. Live Markets (Fetching from Stock table)
    const liveMarkets = await Stock.findAll({
      limit: 4,
      order: [['change_percentage', 'DESC']] // Show top performing stocks dynamically
    });

    // 5. AI Automations
    const activeAutomations = await AutomationOrder.count({
      where: { user_id: userId, status: 'active' }
    });

    return {
      user: {
        name: user.full_name,
        role: user.role // Directly from database
      },
      portfolio: {
        net_value: netPortfolioValue.toFixed(2),
        available: wallet.balance,
        locked: wallet.locked_margin,
        currency: wallet.currency
      },
      stats: {
        daily_pnl: dailyPnl.toFixed(2),
        win_rate: winRate,
        total_trades: totalTrades
      },
      live_markets: liveMarkets.map(stock => ({
        symbol: stock.symbol,
        name: stock.name,
        price: stock.current_price,
        change: stock.change_percentage || "+0.00"
      })),
      ai_automations: {
        active_count: activeAutomations,
        message: activeAutomations === 0 ? "No active AI strategies" : `${activeAutomations} active strategies`
      }
    };
  }
}

module.exports = new DashboardService();
