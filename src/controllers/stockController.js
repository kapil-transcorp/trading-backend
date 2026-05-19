const { Stock, Watchlist } = require('../models');
const { Op } = require('sequelize');

class StockController {
  async searchStocks(req, res) {
    const { query } = req.query;
    const stocks = await Stock.findAll({
      where: {
        [Op.or]: [
          { symbol: { [Op.like]: `%${query}%` } },
          { name: { [Op.like]: `%${query}%` } }
        ]
      },
      limit: 10
    });
    res.status(200).json({ success: true, data: stocks });
  }

  async getLivePrice(req, res) {
    const { symbol } = req.params;
    const stock = await Stock.findOne({ where: { symbol } });
    if (!stock) {
      return res.status(404).json({ success: false, error: 'Stock not found' });
    }
    // In a real app, this would fetch from a trading API or WebSocket
    res.status(200).json({ success: true, data: { symbol: stock.symbol, price: stock.current_price } });
  }

  async addToWatchlist(req, res) {
    const { stock_id } = req.body;
    const exists = await Watchlist.findOne({ where: { user_id: req.user.id, stock_id } });
    if (exists) {
      return res.status(400).json({ success: false, error: 'Stock already in watchlist' });
    }
    const watchlist = await Watchlist.create({ user_id: req.user.id, stock_id });
    res.status(201).json({ success: true, data: watchlist });
  }

  async getWatchlist(req, res) {
    const watchlist = await Watchlist.findAll({
      where: { user_id: req.user.id },
      include: [{ model: Stock }]
    });
    res.status(200).json({ success: true, data: watchlist });
  }
}

module.exports = new StockController();
