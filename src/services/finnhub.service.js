const axios = require('axios');
const logger = require('../utils/logger');

class FinnhubService {
  constructor() {
    this.apiKey = process.env.FINNHUB_API_KEY;
    this.baseUrl = 'https://finnhub.io/api/v1';
    
    if (!this.apiKey) {
      logger.error('FINNHUB_API_KEY is not defined in environment variables');
    }

    this.client = axios.create({
      baseURL: this.baseUrl,
      params: {
        token: this.apiKey
      }
    });
  }

  /**
   * Get real-time quote for a symbol
   */
  async getQuote(symbol) {
    try {
      const response = await this.client.get('/quote', {
        params: { symbol: symbol.toUpperCase() }
      });
      
      // Finnhub returns {c: 0} for some restricted/invalid symbols
      if (!response.data || response.data.c === 0) {
        logger.warn(`Finnhub returned empty quote for ${symbol}`);
      }
      
      return response.data;
    } catch (error) {
      if (error.response && error.response.status === 403) {
        logger.warn(`Finnhub 403: Symbol ${symbol} is restricted for your API tier.`);
        return { c: null, d: null, dp: null, h: null, l: null, o: null, pc: null };
      }
      logger.error(`Finnhub getQuote error for ${symbol}:`, error.message);
      throw error;
    }
  }

  /**
   * Search for symbols
   */
  async searchSymbols(query) {
    try {
      const response = await this.client.get('/search', {
        params: { q: query }
      });
      return response.data;
    } catch (error) {
      logger.error(`Finnhub searchSymbols error for ${query}:`, error.message);
      throw error;
    }
  }

  /**
   * Get historical data (candles)
   * resolution: 1, 5, 15, 30, 60, D, W, M
   */
  async getCandles(symbol, resolution = 'D', from, to) {
    try {
      const response = await this.client.get('/stock/candle', {
        params: {
          symbol: symbol.toUpperCase(),
          resolution,
          from,
          to
        }
      });
      return response.data;
    } catch (error) {
      if (error.response && error.response.status === 403) {
        logger.warn(`Finnhub 403 (Candles): Symbol ${symbol} chart is restricted.`);
        return { s: 'no_data', t: [], c: [], h: [], l: [], o: [], v: [] };
      }
      logger.error(`Finnhub getCandles error for ${symbol}:`, error.message);
      throw error;
    }
  }

  /**
   * Get company profile
   */
  async getCompanyProfile(symbol) {
    try {
      const response = await this.client.get('/stock/profile2', {
        params: { symbol: symbol.toUpperCase() }
      });
      return response.data;
    } catch (error) {
      logger.error(`Finnhub getCompanyProfile error for ${symbol}:`, error.message);
      throw error;
    }
  }

  /**
   * Get market news
   */
  async getMarketNews(category = 'general') {
    try {
      const response = await this.client.get('/news', {
        params: { category }
      });
      return response.data;
    } catch (error) {
      logger.error('Finnhub getMarketNews error:', error.message);
      throw error;
    }
  }
}

module.exports = new FinnhubService();
