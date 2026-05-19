const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Stock = sequelize.define('Stock', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  symbol: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  exchange: {
    type: DataTypes.STRING,
    allowNull: false
  },
  current_price: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: true
  },
  change_percentage: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true
  }
}, {
  tableName: 'stocks'
});

const Watchlist = sequelize.define('Watchlist', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  stock_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'stocks',
      key: 'id'
    }
  }
}, {
  tableName: 'watchlists'
});

const Portfolio = sequelize.define('Portfolio', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  stock_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'stocks',
      key: 'id'
    }
  },
  quantity: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  average_buy_price: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0.00
  },
  total_investment: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0.00
  }
}, {
  tableName: 'portfolios'
});

module.exports = { Stock, Watchlist, Portfolio };
