const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Trade = sequelize.define('Trade', {
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
  type: {
    type: DataTypes.ENUM('buy', 'sell'),
    allowNull: false
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  price: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false
  },
  total_amount: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('pending', 'completed', 'failed', 'cancelled'),
    defaultValue: 'completed'
  },
  automation_id: {
    type: DataTypes.UUID,
    allowNull: true
  }
}, {
  tableName: 'trades'
});

const AutomationOrder = sequelize.define('AutomationOrder', {
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
    allowNull: false
  },
  target_profit_percentage: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false
  },
  stop_loss_percentage: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false
  },
  start_time: {
    type: DataTypes.DATE,
    allowNull: false
  },
  end_time: {
    type: DataTypes.DATE,
    allowNull: false
  },
  is_loop_enabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  active_start_time: {
    type: DataTypes.STRING,
    allowNull: true
  },
  active_end_time: {
    type: DataTypes.STRING,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('active', 'paused', 'completed', 'stopped'),
    defaultValue: 'active'
  },
  last_execution_price: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: true
  }
}, {
  tableName: 'automation_orders'
});

const AutomationLog = sequelize.define('AutomationLog', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  automation_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'automation_orders',
      key: 'id'
    }
  },
  action: {
    type: DataTypes.STRING,
    allowNull: false
  },
  details: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'automation_logs'
});

module.exports = { Trade, AutomationOrder, AutomationLog };
