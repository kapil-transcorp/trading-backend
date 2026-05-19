const { Stock, Watchlist, Portfolio } = require('../models');
const { Op } = require('sequelize');
const finnhubService = require('./finnhub.service');
const massiveService = require('./massive.service');
const logger = require('../utils/logger');

class StockService {
  constructor() {
    this.restrictedSymbolsCache = new Map();
    this.RESTRICTION_TTL = 30 * 60 * 1000; // Cache restriction for 30 minutes
    this.isOffline = false;
    this.lastOfflineCheck = 0;
    this.OFFLINE_CHECK_INTERVAL = 60 * 1000; // Keep offline mode active for 1 minute before retrying
  }

  getSimulatedQuote(marketSymbol, stock) {
    let basePrice = stock ? parseFloat(stock.current_price) || 2500 : 1500;
    if (basePrice <= 0) {
      basePrice = 2500;
    }
    const movement = (Math.random() - 0.5) * 0.01;
    const currentPrice = basePrice * (1 + movement);
    const changePercent = movement * 100;
    const high = currentPrice * 1.02;
    const low = currentPrice * 0.98;
    const open = basePrice;

    if (stock) {
      stock.current_price = currentPrice;
      stock.change_percentage = changePercent;
      stock.last_updated = new Date();
      stock.save().catch(err => logger.error(`Error saving simulated stock in background: ${err.message}`));
    }

    return {
      symbol: marketSymbol,
      current_price: currentPrice,
      high: high,
      low: low,
      open: open,
      previous_close: open,
      change: currentPrice - open,
      change_percentage: changePercent,
      timestamp: new Date()
    };
  }

  isRestrictedSymbol(symbol, exchange) {
    if (!symbol) return false;
    const sym = symbol.toUpperCase();
    
    // Check if it is dynamically cached as restricted
    const cachedTime = this.restrictedSymbolsCache.get(sym);
    if (cachedTime && (Date.now() - cachedTime < this.RESTRICTION_TTL)) {
      return true;
    }
    
    return false;
  }

  markAsRestricted(symbol) {
    if (!symbol) return;
    const sym = symbol.toUpperCase();
    this.restrictedSymbolsCache.set(sym, Date.now());
    logger.info(`Dynamically marked symbol ${sym} as restricted. Bypassing future API calls for this asset.`);
  }

  async searchStocks(query) {
    // Search in local DB first
    const localStocks = await Stock.findAll({
      where: {
        [Op.or]: [
          { symbol: { [Op.like]: `%${query}%` } },
          { name: { [Op.like]: `%${query}%` } }
        ]
      },
      limit: 10
    });

    const nowTime = Date.now();
    const isOfflineMode = this.isOffline && (nowTime - this.lastOfflineCheck < this.OFFLINE_CHECK_INTERVAL);

    // Search in Finnhub (only if online)
    let finnhubResults = { result: [] };
    if (!isOfflineMode) {
      try {
        finnhubResults = await finnhubService.searchSymbols(query);
      } catch (e) {
        const isDnsError = e.code === 'ENOTFOUND' || e.code === 'EAI_AGAIN' || e.message?.includes('ENOTFOUND') || e.message?.includes('EAI_AGAIN');
        if (isDnsError) {
          this.isOffline = true;
          this.lastOfflineCheck = Date.now();
          logger.warn(`Network/DNS is offline during symbol search. Activating Offline Mode Circuit Breaker.`);
        } else {
          logger.error(`Finnhub search failed for query "${query}": ${e.message}`);
        }
      }
    }
    
    // Process external results and ensure they are in our local DB
    const processedExternal = [];
    for (const item of (finnhubResults.result || [])) {
      if (item.symbol.includes('.')) { // Filter for specific exchanges if needed, or keep all
        // Find or Create in local DB
        const [stock] = await Stock.findOrCreate({
          where: { symbol: item.symbol },
          defaults: {
            name: item.description || item.symbol,
            exchange: item.displaySymbol.split(':')[1] || item.displaySymbol.split(':')[0] || 'Global'
          }
        });
        processedExternal.push(stock);
      }
    }

    // Merge and remove duplicates by symbol
    const mergedResults = [...localStocks];
    const localSymbols = new Set(localStocks.map(s => s.symbol));

    processedExternal.forEach(ext => {
      if (!localSymbols.has(ext.symbol)) {
        mergedResults.push(ext);
      }
    });

    const finalResults = mergedResults.slice(0, 5); // Reduced to 5 to avoid 429 errors

    // Fetch live prices for all results in parallel using ONLY Finnhub (to protect Massive rate limits)
    const enrichedResults = await Promise.all(finalResults.map(async (stock) => {
      try {
        let quote = null;
        const isRestricted = this.isRestrictedSymbol(stock.symbol, stock.exchange);
        const currentOfflineMode = this.isOffline && (Date.now() - this.lastOfflineCheck < this.OFFLINE_CHECK_INTERVAL);

        if (!isRestricted && !currentOfflineMode) {
          try {
            quote = await finnhubService.getQuote(stock.symbol);
            if (!quote || quote.c === null || quote.c === 0) {
              this.markAsRestricted(stock.symbol);
            }
          } catch (e) {
            const isDnsError = e.code === 'ENOTFOUND' || e.code === 'EAI_AGAIN' || e.message?.includes('ENOTFOUND') || e.message?.includes('EAI_AGAIN');
            if (isDnsError) {
              this.isOffline = true;
              this.lastOfflineCheck = Date.now();
              logger.warn(`Network/DNS is offline during quote search. Activating Offline Mode.`);
            } else {
              logger.error(`Finnhub quote error for ${stock.symbol} in search: ${e.message}`);
            }
          }
        }

        let currentPrice = (quote && quote.c) ? quote.c : 0;
        let changePercent = (quote && quote.dp) ? quote.dp : 0;

        if (currentPrice === 0) {
          let basePrice = parseFloat(stock.current_price) || 2500;
          if (basePrice <= 0) basePrice = 2500;
          const movement = (Math.random() - 0.5) * 0.01;
          currentPrice = basePrice * (1 + movement);
          changePercent = movement * 100;
        }

        return {
          ...stock.toJSON ? stock.toJSON() : stock,
          current_price: currentPrice,
          change_percentage: changePercent
        };
      } catch (e) {
        return stock;
      }
    }));

    return enrichedResults;
  }

  async getLivePrice(symbol) {
    const stock = await Stock.findOne({
      where: {
        [Op.or]: [
          { id: symbol },
          { symbol: symbol.toUpperCase() }
        ]
      }
    });
    let marketSymbol = stock ? stock.symbol : symbol.toUpperCase();
    if (stock && stock.exchange === 'NSE' && !marketSymbol.includes('.')) {
      marketSymbol = `${marketSymbol}.NS`;
    }

    const exchange = stock ? stock.exchange : null;
    const isRestricted = this.isRestrictedSymbol(marketSymbol, exchange);

    const nowTime = Date.now();
    const isOfflineMode = this.isOffline && (nowTime - this.lastOfflineCheck < this.OFFLINE_CHECK_INTERVAL);

    if (isOfflineMode) {
      logger.info(`System is in OFFLINE mode. Serving ${marketSymbol} quote directly from Smart Simulator.`);
      return this.getSimulatedQuote(marketSymbol, stock);
    }

    let quote = null;
    if (isRestricted) {
      logger.info(`Symbol ${marketSymbol} is cached as restricted. Directing directly to Smart Simulator.`);
    } else {
      try {
        quote = await finnhubService.getQuote(marketSymbol);
        if (!quote || quote.c === null || quote.c === 0) {
          this.markAsRestricted(marketSymbol);
        }
      } catch (e) {
        const isDnsError = e.code === 'ENOTFOUND' || e.code === 'EAI_AGAIN' || e.message?.includes('ENOTFOUND') || e.message?.includes('EAI_AGAIN');
        if (isDnsError) {
          this.isOffline = true;
          this.lastOfflineCheck = Date.now();
          logger.warn(`Network/DNS is offline (ENOTFOUND). Activating Offline Mode Circuit Breaker for 1 minute.`);
          return this.getSimulatedQuote(marketSymbol, stock);
        }
        logger.error(`Finnhub getQuote error for ${marketSymbol}: ${e.message}`);
      }

      // Try Massive API if Finnhub failed, returned empty quote, or was restricted (c === 0 or null)
      if (!this.isOffline && (!quote || quote.c === null || quote.c === 0)) {
        try {
          logger.info(`Finnhub quote unavailable for ${marketSymbol}, attempting Massive API fallback`);
          const massiveQuote = await massiveService.getQuote(marketSymbol);
          if (massiveQuote && massiveQuote.c && massiveQuote.c > 0) {
            quote = massiveQuote;
          } else {
            this.markAsRestricted(marketSymbol);
          }
        } catch (e) {
          const isDnsError = e.code === 'ENOTFOUND' || e.code === 'EAI_AGAIN' || e.message?.includes('ENOTFOUND') || e.message?.includes('EAI_AGAIN');
          if (isDnsError) {
            this.isOffline = true;
            this.lastOfflineCheck = Date.now();
            logger.warn(`Network/DNS is offline (ENOTFOUND) on Massive API. Activating Offline Mode Circuit Breaker for 1 minute.`);
            return this.getSimulatedQuote(marketSymbol, stock);
          }
          logger.error(`Massive API fallback getQuote error for ${marketSymbol}: ${e.message}`);
        }
      }
    }
    
    // Fallback: If both APIs return 0, simulate realistic data for demo
    let currentPrice = (quote && quote.c) ? quote.c : 0;
    let changePercent = (quote && quote.dp) ? quote.dp : 0;
    let high = (quote && quote.h) ? quote.h : 0;
    let low = (quote && quote.l) ? quote.l : 0;
    let open = (quote && quote.o) ? quote.o : 0;

    if (currentPrice === 0) {
      return this.getSimulatedQuote(marketSymbol, stock);
    }

    // Update local DB if stock exists
    if (stock) {
      stock.current_price = currentPrice;
      stock.change_percentage = changePercent;
      stock.last_updated = new Date();
      await stock.save();
    }

    return {
      symbol: marketSymbol,
      current_price: currentPrice,
      high: high,
      low: low,
      open: open,
      previous_close: open,
      change: currentPrice - open,
      change_percentage: changePercent,
      timestamp: new Date()
    };
  }

  async getHistory(symbol, resolution = 'D', days = 7) {
    const stock = await Stock.findOne({
      where: {
        [Op.or]: [
          { id: symbol },
          { symbol: symbol.toUpperCase() }
        ]
      }
    });
    let marketSymbol = stock ? stock.symbol : symbol.toUpperCase();
    if (stock && stock.exchange === 'NSE' && !marketSymbol.includes('.')) {
      marketSymbol = `${marketSymbol}.NS`;
    }

    const to = Math.floor(Date.now() / 1000);
    const from = to - (days * 24 * 60 * 60);
    
    const exchange = stock ? stock.exchange : null;
    const isRestricted = this.isRestrictedSymbol(marketSymbol, exchange);

    const nowTime = Date.now();
    const isOfflineMode = this.isOffline && (nowTime - this.lastOfflineCheck < this.OFFLINE_CHECK_INTERVAL);

    let data = null;
    if (isRestricted || isOfflineMode) {
      if (isOfflineMode) {
        logger.info(`System is in OFFLINE mode. Directly generating simulated candles for ${marketSymbol}.`);
      } else {
        logger.info(`Symbol ${marketSymbol} chart is cached as restricted. Generating Smart Simulator candles.`);
      }
    } else {
      try {
        data = await finnhubService.getCandles(marketSymbol, resolution, from, to);
        if (!data || data.s !== 'ok' || !data.t || data.t.length === 0) {
          this.markAsRestricted(marketSymbol);
        }
      } catch (e) {
        const isDnsError = e.code === 'ENOTFOUND' || e.code === 'EAI_AGAIN' || e.message?.includes('ENOTFOUND') || e.message?.includes('EAI_AGAIN');
        if (isDnsError) {
          this.isOffline = true;
          this.lastOfflineCheck = Date.now();
          logger.warn(`Network/DNS is offline during candles retrieval. Activating Offline Mode.`);
        } else {
          logger.error(`Finnhub getCandles error for ${marketSymbol}: ${e.message}`);
        }
      }
      
      // Try Massive API if Finnhub failed, returned error status, or has empty data
      if (!this.isOffline && (!data || data.s !== 'ok' || !data.t || data.t.length === 0)) {
        try {
          logger.info(`Finnhub candles unavailable for ${marketSymbol}, attempting Massive API fallback`);
          const massiveData = await massiveService.getCandles(marketSymbol, resolution, from, to);
          if (massiveData && massiveData.s === 'ok' && massiveData.t && massiveData.t.length > 0) {
            data = massiveData;
          } else {
            this.markAsRestricted(marketSymbol);
          }
        } catch (e) {
          const isDnsError = e.code === 'ENOTFOUND' || e.code === 'EAI_AGAIN' || e.message?.includes('ENOTFOUND') || e.message?.includes('EAI_AGAIN');
          if (isDnsError) {
            this.isOffline = true;
            this.lastOfflineCheck = Date.now();
            logger.warn(`Network/DNS is offline during Massive candles retrieval. Activating Offline Mode.`);
          } else {
            logger.error(`Massive API fallback getCandles error for ${marketSymbol}: ${e.message}`);
          }
        }
      }
    }

    // If no real data (restricted or weekend), generate realistic demo data
    if (!data || data.s !== 'ok' || !data.t || data.t.length === 0) {
      const mockPoints = resolution === '1' ? 60 : 30; // 60 mins or 30 days
      let basePrice = stock ? parseFloat(stock.current_price) || 2500 : 1500;
      if (basePrice <= 0) basePrice = 2500;
      
      const t = [];
      const o = [];
      const h = [];
      const l = [];
      const c = [];
      const v = [];

      for (let i = 0; i < mockPoints; i++) {
        const timeOffset = resolution === '1' ? i * 60 : i * 24 * 3600;
        const time = from + timeOffset;
        const volatility = 0.02;
        const prevClose = i === 0 ? basePrice : c[i-1];
        
        const close = prevClose * (1 + (Math.random() - 0.5) * volatility);
        const open = prevClose;
        const high = Math.max(open, close) * (1 + Math.random() * 0.005);
        const low = Math.min(open, close) * (1 - Math.random() * 0.005);
        
        t.push(time);
        o.push(open);
        h.push(high);
        l.push(low);
        c.push(close);
        v.push(Math.floor(Math.random() * 100000));
      }
      data = { s: 'ok', t, o, h, l, c, v };
    }
    
    if (data.s === 'ok') {
      return data.t.map((timestamp, index) => ({
        timestamp: timestamp * 1000,
        open: data.o[index],
        high: data.h[index],
        low: data.l[index],
        close: data.c[index],
        volume: data.v[index]
      }));
    }
    
    return [];
  }

  async getTrending() {
    return await Stock.findAll({ limit: 5, order: [['change_percentage', 'DESC']] });
  }

  async getTopGainers() {
    return await Stock.findAll({ limit: 5, order: [['change_percentage', 'DESC']] });
  }

  async getTopLosers() {
    return await Stock.findAll({ limit: 5, order: [['change_percentage', 'ASC']] });
  }

  async addToWatchlist(userId, stockIdOrSymbol) {
    const { Op } = require('sequelize');
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(stockIdOrSymbol);
    
    let stockId = stockIdOrSymbol;
    if (!isUuid) {
      const stock = await Stock.findOne({
        where: {
          [Op.or]: [
            { symbol: stockIdOrSymbol.toUpperCase() },
            { symbol: stockIdOrSymbol.replace('.NS', '').toUpperCase() }
          ]
        }
      });
      if (!stock) {
        throw new Error('Stock not found');
      }
      stockId = stock.id;
    }
    
    // Avoid duplicate entries
    const existing = await Watchlist.findOne({ where: { user_id: userId, stock_id: stockId } });
    if (existing) {
      return existing;
    }

    return await Watchlist.create({ user_id: userId, stock_id: stockId });
  }

  async removeFromWatchlist(userId, watchlistId) {
    return await Watchlist.destroy({ where: { id: watchlistId, user_id: userId } });
  }

  async getWatchlist(userId) {
    const list = await Watchlist.findAll({
      where: { user_id: userId },
      include: [Stock]
    });

    return list.map(item => {
      const plainItem = item.get({ plain: true });
      const stock = plainItem.Stock || {};
      
      return {
        ...plainItem,
        // Flat properties for frontend StockCard component compatibility
        symbol: stock.symbol || '',
        name: stock.name || '',
        exchange: stock.exchange || '',
        current_price: stock.current_price || '0.00',
        change_percentage: stock.change_percentage || '0.00',
        // Also retain nested objects for compatibility
        stock: stock,
        Stock: stock
      };
    });
  }

  async getStockDetails(userId, symbol, resolution = 'D') {
    const stock = await Stock.findOne({
      where: {
        [Op.or]: [
          { id: symbol },
          { symbol: symbol.toUpperCase() }
        ]
      }
    });
    if (!stock) throw new Error('Stock not found');

    // 1. Get Live Data
    const quote = await this.getLivePrice(symbol);
    
    // 2. Get Chart Data (Default 7 days)
    const chartData = await this.getHistory(symbol, resolution, 7);

    // 3. Get User Portfolio for this stock
    const portfolio = await Portfolio.findOne({ 
      where: { user_id: userId, stock_id: stock.id } 
    });

    let stats = {
      daily_pnl: 0,
      weekly_pnl: 0,
      total_pnl: 0,
      holdings: 0,
      avg_cost: 0
    };

    if (portfolio) {
      const currentValuation = portfolio.quantity * quote.current_price;
      const totalInvestment = parseFloat(portfolio.total_investment);
      
      stats = {
        daily_pnl: portfolio.quantity * quote.change, // Simple daily P&L
        weekly_pnl: (currentValuation - totalInvestment) * 0.7, // Simulated weekly
        total_pnl: currentValuation - totalInvestment,
        holdings: portfolio.quantity,
        avg_cost: portfolio.average_buy_price
      };
    }

    return {
      stock: {
        ...stock.toJSON(),
        ...quote,
        is_market_open: this.isMarketOpen(stock.exchange)
      },
      stats,
      chart: chartData
    };
  }

  isMarketOpen(exchange) {
    const now = new Date();
    const day = now.getUTCDay(); // 0 (Sun) to 6 (Sat)
    
    // Weekend check
    if (day === 0 || day === 6) return false;

    // Convert to IST for NSE (UTC+5.5)
    if (exchange === 'NSE' || exchange === 'NS') {
      const istTime = new Date(now.getTime() + (5.5 * 60 * 60 * 1000));
      const hours = istTime.getUTCHours();
      const minutes = istTime.getUTCMinutes();
      const totalMinutes = hours * 60 + minutes;

      // 9:15 AM (555 mins) to 3:30 PM (930 mins)
      return totalMinutes >= 555 && totalMinutes <= 930;
    }

    // Default US Market (UTC-4/-5)
    // 9:30 AM (13:30 UTC) to 4:00 PM (20:00 UTC)
    const utcHours = now.getUTCHours();
    const utcMinutes = now.getUTCMinutes();
    const totalUtcMinutes = utcHours * 60 + utcMinutes;
    return totalUtcMinutes >= 810 && totalUtcMinutes <= 1200;
  }

  async getMarketNews(category) {
    const nowTime = Date.now();
    const isOfflineMode = this.isOffline && (nowTime - this.lastOfflineCheck < this.OFFLINE_CHECK_INTERVAL);
    if (isOfflineMode) {
      return [];
    }
    try {
      return await finnhubService.getMarketNews(category);
    } catch (e) {
      const isDnsError = e.code === 'ENOTFOUND' || e.code === 'EAI_AGAIN' || e.message?.includes('ENOTFOUND') || e.message?.includes('EAI_AGAIN');
      if (isDnsError) {
        this.isOffline = true;
        this.lastOfflineCheck = Date.now();
        logger.warn(`Network/DNS is offline during getMarketNews. Activating Offline Mode.`);
      } else {
        logger.error(`Finnhub getMarketNews failed: ${e.message}`);
      }
      return [];
    }
  }
}

module.exports = new StockService();
