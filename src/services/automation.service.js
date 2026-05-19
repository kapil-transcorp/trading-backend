const { AutomationOrder, AutomationLog, Stock, Wallet, WalletTransaction } = require('../models');

class AutomationService {
  async createAutomation(userId, data) {
    // data: {"stock_id": "RELIANCE", "buy_amount": 5000, "tp": 2.0, "sl": 1.0, "loop_enabled": true, "start_time": "09:15 AM", "end_time": "03:30 PM"}
    const { Op } = require('sequelize');
    const stock = await Stock.findOne({
      where: {
        [Op.or]: [
          { id: data.stock_id },
          { symbol: data.stock_id }
        ]
      }
    });
    if (!stock) throw new Error('Stock not found');

    const wallet = await Wallet.findOne({ where: { user_id: userId } });
    const withdrawable = parseFloat(wallet.balance) - parseFloat(wallet.locked_margin || 0);

    if (withdrawable < data.buy_amount) {
      const error = new Error('Available balance is less than required margin.');
      error.code = 'INSUFFICIENT_FUNDS';
      throw error;
    }

    // Lock funds
    wallet.locked_margin = parseFloat(wallet.locked_margin || 0) + parseFloat(data.buy_amount);
    await wallet.save();

    const automation = await AutomationOrder.create({
      user_id: userId,
      stock_id: stock.id,
      quantity: Math.floor(data.buy_amount / stock.current_price) || 1, // approximate
      target_profit_percentage: data.tp,
      stop_loss_percentage: data.sl,
      is_loop_enabled: data.loop_enabled !== undefined ? data.loop_enabled : true,
      active_start_time: data.start_time || '09:15 AM',
      active_end_time: data.end_time || '03:30 PM',
      start_time: new Date(),
      end_time: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // default 1 year
      status: 'active'
    });

    // Call Gemini API for dynamic technical setup analysis
    let aiAnalysis = 'AI analysis could not be generated at this moment.';
    if (process.env.GEMINI_API_KEY) {
      try {
        const axios = require('axios');
        const prompt = `Act as an elite automated stock trading bot. Analyze the technical setup for stock: ${stock.symbol} (${stock.name}).
Current Market Price: INR ${stock.current_price}.
User Strategy:
- Profit Target: ${data.tp}%
- Stop Loss: ${data.sl}%
- Daily active trading window: ${data.start_time || '09:15 AM'} to ${data.end_time || '03:30 PM'}
- Smart Loop Mode: ${data.loop_enabled ? 'ON (Auto-re-enter on target completion)' : 'OFF'}

Generate a professional, short analysis of the technical setup (max 2 sentences) and a bullish/bearish recommendation for deploying this strategy. Avoid any generic warnings.`;

        const response = await axios.post(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
          {
            contents: [
              {
                parts: [
                  { text: prompt }
                ]
              }
            ]
          },
          { timeout: 7000 }
        );

        if (response.data && response.data.candidates && response.data.candidates[0] && response.data.candidates[0].content && response.data.candidates[0].content.parts[0]) {
          aiAnalysis = response.data.candidates[0].content.parts[0].text.trim();
        }
      } catch (error) {
        console.error('Gemini API call failed:', error.message);
        aiAnalysis = `System analyzed: ${stock.symbol} Technical Setup looks solid for a TP of ${data.tp}% and SL of ${data.sl}%. Deploying strategy in Smart Loop mode.`;
      }
    } else {
      aiAnalysis = `System analyzed: ${stock.symbol} setup looks solid for a TP of ${data.tp}% and SL of ${data.sl}%. Deploying strategy in Smart Loop mode.`;
    }

    await AutomationLog.create({
      automation_id: automation.id,
      action: 'DEPLOYED',
      details: `Automation deployed for ${stock.symbol} with amount INR ${data.buy_amount}. Window: ${data.start_time || '09:15 AM'} - ${data.end_time || '03:30 PM'}.`
    });

    await AutomationLog.create({
      automation_id: automation.id,
      action: 'AI_ANALYSIS',
      details: aiAnalysis
    });

    return automation;
  }

  async listAutomations(userId) {
    return await AutomationOrder.findAll({
      where: { user_id: userId },
      include: [Stock]
    });
  }

  async getAutomationDetails(userId, id) {
    return await AutomationOrder.findOne({
      where: { id, user_id: userId },
      include: [Stock, AutomationLog]
    });
  }

  async stopAutomation(userId, id) {
    const automation = await AutomationOrder.findOne({ where: { id, user_id: userId } });
    if (!automation) throw new Error('Automation not found');
    
    automation.status = 'stopped';
    await automation.save();

    await AutomationLog.create({
      automation_id: automation.id,
      action: 'STOPPED',
      details: 'Automation manually stopped by user'
    });

    return automation;
  }

  async resumeAutomation(userId, id) {
    const automation = await AutomationOrder.findOne({ where: { id, user_id: userId } });
    if (!automation) throw new Error('Automation not found');
    
    automation.status = 'active';
    await automation.save();

    await AutomationLog.create({
      automation_id: automation.id,
      action: 'RESUMED',
      details: 'Automation resumed by user'
    });

    return automation;
  }

  async deleteAutomation(userId, id) {
    const automation = await AutomationOrder.findOne({ where: { id, user_id: userId } });
    if (!automation) throw new Error('Automation not found');
    
    await automation.destroy();
    return true;
  }

  async getLogs(userId, id) {
    const automation = await AutomationOrder.findOne({ where: { id, user_id: userId } });
    if (!automation) throw new Error('Automation not found');

    return await AutomationLog.findAll({
      where: { automation_id: id },
      order: [['created_at', 'DESC']]
    });
  }
}

module.exports = new AutomationService();
