const { AutomationOrder, AutomationLog, Stock, Portfolio, Wallet, Trade, sequelize } = require('../models');
const tradeService = require('../services/trade.service');
const stockService = require('../services/stock.service');
const notificationService = require('../services/notification.service');

class AutomationEngine {
  async processAutomations() {
    console.log('Processing all automations...');
    const activeAutomations = await AutomationOrder.findAll({
      where: { status: 'active' },
      include: [Stock]
    });

    for (const automation of activeAutomations) {
      try {
        await this.checkAndExecute(automation);
      } catch (error) {
        console.error(`Error processing automation ${automation.id}:`, error);
      }
    }
  }

  async processPriceUpdate(symbol, currentPrice) {
    const activeAutomations = await AutomationOrder.findAll({
      where: { status: 'active' },
      include: [{
        model: Stock,
        where: { symbol }
      }]
    });

    for (const automation of activeAutomations) {
      try {
        await this.checkAndExecute(automation, currentPrice);
      } catch (error) {
        console.error(`Error processing automation ${automation.id}:`, error);
      }
    }
  }

  async checkAndExecute(automation, providedPrice = null) {
    const { Stock: stock, user_id, quantity, buy_price, target_profit_percentage, stop_loss_percentage, end_time } = automation;
    
    // Use provided price (from socket) or fetch from service
    const currentPrice = providedPrice || (await stockService.getLivePrice(stock.symbol)).current_price;

    // 1. Check if market is closed (Mocked by end_time)
    if (new Date() > new Date(end_time)) {
      automation.status = 'completed';
      await automation.save();
      await AutomationLog.create({
        automation_id: automation.id,
        action: 'AUTO_CLOSE',
        details: 'Market hours ended, automation completed.'
      });
      return;
    }

    // 2. Logic: Buy if price drops to buy_price (if not already holding for this automation)
    const existingTrade = await Trade.findOne({
      where: { automation_id: automation.id, type: 'buy', status: 'completed' },
      order: [['created_at', 'DESC']]
    });

    // We check if the last trade was a 'sell' or if no 'buy' exists
    const lastTrade = await Trade.findOne({
        where: { automation_id: automation.id },
        order: [['created_at', 'DESC']]
    });

    if (!lastTrade || lastTrade.type === 'sell') {
      // Re-buy logic or initial buy
      if (currentPrice <= buy_price) {
        await tradeService.buyStock(user_id, {
          symbol: stock.symbol,
          quantity,
          price: currentPrice,
          automation_id: automation.id
        });
        
        await AutomationLog.create({
          automation_id: automation.id,
          action: 'BUY',
          details: `Auto-buy executed at ${currentPrice}`
        });

        await notificationService.createNotification(user_id, 'Trade Executed', `Auto-buy for ${stock.symbol} at ${currentPrice}`, 'trade');
      }
    } else if (lastTrade.type === 'buy' && lastTrade.status === 'completed') {
      // 3. Logic: Sell if Target Profit or Stop Loss reached
      const purchasePrice = parseFloat(lastTrade.price);
      const targetPrice = purchasePrice * (1 + target_profit_percentage / 100);
      const stopLossPrice = purchasePrice * (1 - stop_loss_percentage / 100);

      if (currentPrice >= targetPrice) {
        await tradeService.sellStock(user_id, {
          symbol: stock.symbol,
          quantity,
          automation_id: automation.id
        });

        await AutomationLog.create({
          automation_id: automation.id,
          action: 'SELL_PROFIT',
          details: `Target profit reached! Sold at ${currentPrice}`
        });

        if (!automation.is_loop_enabled) {
          automation.status = 'completed';
          await automation.save();
        }
      } else if (currentPrice <= stopLossPrice) {
        await tradeService.sellStock(user_id, {
          symbol: stock.symbol,
          quantity
        });

        await AutomationLog.create({
          automation_id: automation.id,
          action: 'SELL_STOPLOSS',
          details: `Stop loss hit. Sold at ${currentPrice}`
        });

        automation.status = 'stopped';
        await automation.save();
      }
    }
  }
}

module.exports = new AutomationEngine();
