const stockService = require('../services/stock.service');
const { successResponse, errorResponse } = require('../utils/response');

class StockController {
  async searchStocks(req, res) {
    try {
      const stocks = await stockService.searchStocks(req.query.q);
      return successResponse(res, 'Stocks fetched successfully', stocks);
    } catch (error) {
      return errorResponse(res, error.message);
    }
  }

  async getLivePrice(req, res) {
    try {
      const stock = await stockService.getLivePrice(req.params.symbol);
      return successResponse(res, 'Live price fetched successfully', stock);
    } catch (error) {
      return errorResponse(res, error.message);
    }
  }

  async getStockDetails(req, res) {
    try {
      const details = await stockService.getStockDetails(req.user.id, req.params.symbol, req.query.interval);
      return successResponse(res, 'Stock details fetched successfully', details);
    } catch (error) {
      return errorResponse(res, error.message);
    }
  }

  async getHistory(req, res) {
    try {
      const history = await stockService.getHistory(req.params.symbol, req.query.interval);
      return successResponse(res, 'Historical data fetched successfully', history);
    } catch (error) {
      return errorResponse(res, error.message);
    }
  }

  async getTrending(req, res) {
    try {
      const stocks = await stockService.getTrending();
      return successResponse(res, 'Trending stocks fetched successfully', stocks);
    } catch (error) {
      return errorResponse(res, error.message);
    }
  }

  async getTopGainers(req, res) {
    try {
      const stocks = await stockService.getTopGainers();
      return successResponse(res, 'Top gainers fetched successfully', stocks);
    } catch (error) {
      return errorResponse(res, error.message);
    }
  }

  async getTopLosers(req, res) {
    try {
      const stocks = await stockService.getTopLosers();
      return successResponse(res, 'Top losers fetched successfully', stocks);
    } catch (error) {
      return errorResponse(res, error.message);
    }
  }

  async addToWatchlist(req, res) {
    try {
      const result = await stockService.addToWatchlist(req.user.id, req.body.stock_id);
      return successResponse(res, 'Added to watchlist', result);
    } catch (error) {
      return errorResponse(res, error.message);
    }
  }

  async removeFromWatchlist(req, res) {
    try {
      await stockService.removeFromWatchlist(req.user.id, req.params.id);
      return successResponse(res, 'Removed from watchlist');
    } catch (error) {
      return errorResponse(res, error.message);
    }
  }

  async getWatchlist(req, res) {
    try {
      const watchlist = await stockService.getWatchlist(req.user.id);
      return successResponse(res, 'Watchlist fetched successfully', watchlist);
    } catch (error) {
      return errorResponse(res, error.message);
    }
  }
  async getMarketNews(req, res) {
    try {
      const news = await stockService.getMarketNews(req.query.category);
      return successResponse(res, 'Market news fetched successfully', news);
    } catch (error) {
      return errorResponse(res, error.message);
    }
  }
}

module.exports = new StockController();
