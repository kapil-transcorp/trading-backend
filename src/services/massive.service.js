const axios = require('axios');
const logger = require('../utils/logger');

class MassiveService {
  constructor() {
    this.apiKey = process.env.MASSIVE_API_KEY || 'PCkQuqjaJMyji4N7KYhCl9K068qaEE9Z';
    this.baseUrl = 'https://api.massive.com';
    
    // In-memory cache to respect Massive free tier 5-requests/min rate limit
    this.quoteCache = new Map();
    this.candlesCache = new Map();
    this.CACHE_TTL = 60 * 1000; // 1 minute
    
    if (!this.apiKey) {
      logger.error('MASSIVE_API_KEY is not defined in environment variables');
    }

    this.client = axios.create({
      baseURL: this.baseUrl,
      params: {
        apiKey: this.apiKey
      }
    });
  }

  /**
   * Get quote for a symbol using Previous Close or Daily Open/Close
   */
  async getQuote(symbol) {
    const formattedSymbol = symbol.toUpperCase().trim();
    
    // Check Cache first
    const cached = this.quoteCache.get(formattedSymbol);
    if (cached && (Date.now() - cached.timestamp < this.CACHE_TTL)) {
      logger.info(`Returning cached Massive quote for: ${formattedSymbol}`);
      return cached.data;
    }

    try {
      logger.info(`Fetching quote from Massive API for: ${formattedSymbol}`);
      const response = await this.client.get(`/v2/aggs/ticker/${formattedSymbol}/prev`);
      
      if (response.data && response.data.status === 'OK' && response.data.results && response.data.results.length > 0) {
        const result = response.data.results[0];
        const open = parseFloat(result.o) || 0;
        const close = parseFloat(result.c) || 0;
        const high = parseFloat(result.h) || 0;
        const low = parseFloat(result.l) || 0;
        const change = close - open;
        const changePercent = open > 0 ? (change / open) * 100 : 0;
        
        const quoteData = {
          c: close,          // Current price
          h: high,           // High price
          l: low,            // Low price
          o: open,           // Open price
          pc: open,          // Previous close (mapped to open as close approximation)
          d: change,         // Price change
          dp: changePercent, // Price change percentage
          t: Math.floor((result.t || Date.now()) / 1000) // timestamp in seconds
        };

        // Cache the result
        this.quoteCache.set(formattedSymbol, {
          timestamp: Date.now(),
          data: quoteData
        });
        
        return quoteData;
      }
      
      logger.warn(`Massive API returned no results for quote: ${formattedSymbol}`);
      return { c: 0, h: 0, l: 0, o: 0, pc: 0, d: 0, dp: 0, t: 0 };
    } catch (error) {
      logger.error(`Massive getQuote error for ${formattedSymbol}: ${error.message}`);
      return { c: 0, h: 0, l: 0, o: 0, pc: 0, d: 0, dp: 0, t: 0 };
    }
  }

  /**
   * Get historical candle data
   * resolution: 1, 5, 15, 30, 60, D, W, M
   * from & to: timestamps in seconds
   */
  async getCandles(symbol, resolution = 'D', from, to) {
    const formattedSymbol = symbol.toUpperCase().trim();
    const cacheKey = `${formattedSymbol}_${resolution}_${from}_${to}`;
    
    // Check Cache first
    const cached = this.candlesCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp < this.CACHE_TTL)) {
      logger.info(`Returning cached Massive candles for: ${formattedSymbol}`);
      return cached.data;
    }

    try {
      logger.info(`Fetching candles from Massive API for: ${formattedSymbol}, resolution: ${resolution}`);
      
      // Map Finnhub/generic resolutions to Massive API formats
      let timespan = 'day';
      let multiplier = 1;
      
      const resStr = String(resolution).toLowerCase();
      if (resStr === 'd') {
        timespan = 'day';
        multiplier = 1;
      } else if (resStr === 'w') {
        timespan = 'week';
        multiplier = 1;
      } else if (resStr === 'm') {
        timespan = 'month';
        multiplier = 1;
      } else {
        timespan = 'minute';
        // Extract numeric part if present, e.g. "15m" -> 15, or default to 1
        const parsedMultiplier = parseInt(resStr.replace(/[^0-9]/g, ''), 10);
        multiplier = isNaN(parsedMultiplier) ? 1 : parsedMultiplier;
      }

      // Convert seconds to milliseconds (Massive API takes milliseconds)
      const fromMs = from * 1000;
      const toMs = to * 1000;

      const url = `/v2/aggs/ticker/${formattedSymbol}/range/${multiplier}/${timespan}/${fromMs}/${toMs}`;
      const response = await this.client.get(url, {
        params: {
          adjusted: true,
          sort: 'asc',
          limit: 5000
        }
      });

      if (response.data && response.data.status === 'OK' && response.data.results && response.data.results.length > 0) {
        const results = response.data.results;
        
        const t = [];
        const o = [];
        const h = [];
        const l = [];
        const c = [];
        const v = [];

        results.forEach(bar => {
          t.push(Math.floor(bar.t / 1000)); // convert back to seconds
          o.push(bar.o);
          h.push(bar.h);
          l.push(bar.l);
          c.push(bar.c);
          v.push(bar.v);
        });

        const candleData = {
          s: 'ok',
          t,
          o,
          h,
          l,
          c,
          v
        };

        // Cache the result
        this.candlesCache.set(cacheKey, {
          timestamp: Date.now(),
          data: candleData
        });

        return candleData;
      }

      logger.warn(`Massive API returned no candle data for: ${formattedSymbol}`);
      return { s: 'no_data', t: [], c: [], h: [], l: [], o: [], v: [] };
    } catch (error) {
      logger.error(`Massive getCandles error for ${formattedSymbol}: ${error.message}`);
      return { s: 'no_data', t: [], c: [], h: [], l: [], o: [], v: [] };
    }
  }

  /**
   * Search for tickers
   */
  async searchSymbols(query) {
    try {
      logger.info(`Searching symbols in Massive API for: ${query}`);
      const response = await this.client.get('/v3/reference/tickers', {
        params: {
          search: query,
          market: 'stocks',
          active: true,
          limit: 10
        }
      });

      if (response.data && response.data.status === 'OK' && response.data.results) {
        // Map Massive results to Finnhub / generic search format
        const result = response.data.results.map(item => ({
          description: item.name,
          displaySymbol: item.ticker,
          symbol: item.ticker,
          type: item.type || 'Common Stock'
        }));
        return { count: result.length, result };
      }

      return { count: 0, result: [] };
    } catch (error) {
      logger.error(`Massive searchSymbols error for ${query}: ${error.message}`);
      return { count: 0, result: [] };
    }
  }
}

module.exports = new MassiveService();
