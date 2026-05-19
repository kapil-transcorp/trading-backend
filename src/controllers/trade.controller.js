const tradeService = require('../services/trade.service');
const { successResponse, errorResponse } = require('../utils/response');

class TradeController {
  async buyStock(req, res) {
    try {
      const trade = await tradeService.buyStock(req.user.id, req.body);
      return successResponse(res, 'Stock bought successfully', trade, 201);
    } catch (error) {
      return errorResponse(res, error.message);
    }
  }

  async sellStock(req, res) {
    try {
      const trade = await tradeService.sellStock(req.user.id, req.body);
      return successResponse(res, 'Stock sold successfully', trade, 201);
    } catch (error) {
      return errorResponse(res, error.message);
    }
  }

  async getHoldings(req, res) {
    try {
      const holdings = await tradeService.getHoldings(req.user.id);
      return successResponse(res, 'Holdings fetched successfully', holdings);
    } catch (error) {
      return errorResponse(res, error.message);
    }
  }

  async getPortfolio(req, res) {
    try {
      const portfolio = await tradeService.getPortfolioSummary(req.user.id);
      return successResponse(res, 'Portfolio summary fetched successfully', portfolio);
    } catch (error) {
      return errorResponse(res, error.message);
    }
  }

  async getTradeHistory(req, res) {
    try {
      const history = await tradeService.getTradeHistory(req.user.id);
      return successResponse(res, 'Trade history fetched successfully', history);
    } catch (error) {
      return errorResponse(res, error.message);
    }
  }

  async getOpenOrders(req, res) {
    try {
      const orders = await tradeService.getOpenOrders(req.user.id);
      return successResponse(res, 'Open orders fetched successfully', orders);
    } catch (error) {
      return errorResponse(res, error.message);
    }
  }
}

module.exports = new TradeController();
