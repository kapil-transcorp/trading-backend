const { Stock } = require('../models');
const automationEngine = require('../automation/automationEngine');

module.exports = (io) => {
  const tradingNamespace = io.of('/trading');
  
  tradingNamespace.on('connection', (socket) => {
    console.log('New client connected to /trading:', socket.id);

    socket.on('subscribe_market', (data) => {
      if (data && Array.isArray(data.symbols)) {
        data.symbols.forEach(symbol => {
          socket.join(`stock_${symbol}`);
          console.log(`Socket ${socket.id} subscribed to ${symbol}`);
        });
      }
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected from /trading:', socket.id);
    });
  });

  // Simulate live price updates
  setInterval(async () => {
    const stocks = await Stock.findAll();
    stocks.forEach(stock => {
      // Simulate a small price change
      const change = (Math.random() - 0.5) * 2;
      stock.current_price = parseFloat(stock.current_price) + change;
      stock.save();

      tradingNamespace.to(`stock_${stock.symbol}`).emit('price_update', {
        symbol: stock.symbol,
        price: stock.current_price,
        change: change,
        ts: Math.floor(Date.now() / 1000)
      });

      // Trigger automation logic for this stock
      automationEngine.processPriceUpdate(stock.symbol, stock.current_price);
    });
  }, 5000);
};
