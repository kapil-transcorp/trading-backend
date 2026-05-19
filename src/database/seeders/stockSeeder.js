const { Stock } = require('../../models');

const stocks = [
  { symbol: 'TCS', name: 'Tata Consultancy Services', exchange: 'NSE', current_price: 3500, change_percentage: 1.5 },
  { symbol: 'RELIANCE', name: 'Reliance Industries', exchange: 'NSE', current_price: 2800, change_percentage: -0.5 },
  { symbol: 'INFY', name: 'Infosys', exchange: 'NSE', current_price: 1500, change_percentage: 2.1 },
  { symbol: 'HDFCBANK', name: 'HDFC Bank', exchange: 'NSE', current_price: 1600, change_percentage: 0.8 },
  { symbol: 'ICICIBANK', name: 'ICICI Bank', exchange: 'NSE', current_price: 1000, change_percentage: -1.2 }
];

const seedStocks = async () => {
  try {
    for (const stock of stocks) {
      await Stock.findOrCreate({
        where: { symbol: stock.symbol },
        defaults: stock
      });
    }
    console.log('Stocks seeded successfully');
  } catch (error) {
    console.error('Error seeding stocks:', error);
  }
};

module.exports = seedStocks;
