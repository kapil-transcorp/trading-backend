module.exports = {
  ROLES: {
    USER: 'user',
    ADMIN: 'admin'
  },
  TRANSACTION_TYPES: {
    DEPOSIT: 'deposit',
    WITHDRAWAL: 'withdrawal',
    TRADE_BUY: 'trade_buy',
    TRADE_SELL: 'trade_sell',
    REFUND: 'refund'
  },
  ORDER_STATUS: {
    PENDING: 'pending',
    COMPLETED: 'completed',
    FAILED: 'failed',
    CANCELLED: 'cancelled'
  },
  AUTOMATION_STATUS: {
    ACTIVE: 'active',
    PAUSED: 'paused',
    COMPLETED: 'completed',
    STOPPED: 'stopped'
  }
};
