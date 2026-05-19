const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Wallet = sequelize.define('Wallet', {
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
  balance: {
    type: DataTypes.DECIMAL(20, 2),
    defaultValue: 0.00
  },
  locked_margin: {
    type: DataTypes.DECIMAL(20, 2),
    defaultValue: 0.00
  },
  currency: {
    type: DataTypes.STRING,
    defaultValue: 'INR'
  }
}, {
  tableName: 'wallets'
});

const WalletTransaction = sequelize.define('WalletTransaction', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  wallet_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'wallets',
      key: 'id'
    }
  },
  type: {
    type: DataTypes.ENUM('deposit', 'withdrawal', 'trade_buy', 'trade_sell', 'refund'),
    allowNull: false
  },
  amount: {
    type: DataTypes.DECIMAL(20, 2),
    allowNull: false
  },
  before_balance: {
    type: DataTypes.DECIMAL(20, 2),
    allowNull: false
  },
  after_balance: {
    type: DataTypes.DECIMAL(20, 2),
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('pending', 'completed', 'failed'),
    defaultValue: 'pending'
  },
  razorpay_order_id: {
    type: DataTypes.STRING,
    allowNull: true
  },
  razorpay_payment_id: {
    type: DataTypes.STRING,
    allowNull: true
  },
  description: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  tableName: 'wallet_transactions'
});

module.exports = { Wallet, WalletTransaction };
