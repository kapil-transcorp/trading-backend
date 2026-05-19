const tradingService = require('../services/tradingService');

class TradeController {
  async buy(req, res) {
    const { stock_id, quantity, price } = req.body;
    const trade = await tradingService.buyStock(req.user.id, stock_id, quantity, price);
    res.status(201).json({ success: true, data: trade });
  }

  async sell(req, res) {
    const { stock_id, quantity, price } = req.body;
    const trade = await tradingService.sellStock(req.user.id, stock_id, quantity, price);
    res.status(200).json({ success: true, data: trade });
  }

  async getPortfolio(req, res) {
    const portfolio = await tradingService.getPortfolio(req.user.id);
    res.status(200).json({ success: true, data: portfolio });
  }

  async getHistory(req, res) {
    const trades = await tradingService.getTradeHistory(req.user.id);
    res.status(200).json({ success: true, data: trades });
  }
}

module.exports = new TradeController();
