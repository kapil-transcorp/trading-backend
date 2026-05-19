const User = require('./User');
const { Wallet, WalletTransaction } = require('./Wallet');
const { Stock, Watchlist, Portfolio } = require('./Stock');
const { Trade, AutomationOrder, AutomationLog } = require('./Trade');
const { Notification, BankAccount, KYCDocument, RefreshToken } = require('./Misc');
const AdminUser = require('./AdminUser');


// User Relationships
User.hasOne(Wallet, { foreignKey: 'user_id' });
Wallet.belongsTo(User, { foreignKey: 'user_id' });

User.hasMany(WalletTransaction, { foreignKey: 'user_id' }); // Note: WalletTransaction has wallet_id but we can also link to user
Wallet.hasMany(WalletTransaction, { foreignKey: 'wallet_id' });
WalletTransaction.belongsTo(Wallet, { foreignKey: 'wallet_id' });

User.hasMany(Watchlist, { foreignKey: 'user_id' });
Watchlist.belongsTo(User, { foreignKey: 'user_id' });

User.hasMany(Portfolio, { foreignKey: 'user_id' });
Portfolio.belongsTo(User, { foreignKey: 'user_id' });

User.hasMany(Trade, { foreignKey: 'user_id' });
Trade.belongsTo(User, { foreignKey: 'user_id' });

User.hasMany(AutomationOrder, { foreignKey: 'user_id' });
AutomationOrder.belongsTo(User, { foreignKey: 'user_id' });

User.hasMany(Notification, { foreignKey: 'user_id' });
Notification.belongsTo(User, { foreignKey: 'user_id' });

User.hasMany(BankAccount, { foreignKey: 'user_id' });
BankAccount.belongsTo(User, { foreignKey: 'user_id' });

User.hasMany(KYCDocument, { foreignKey: 'user_id' });
KYCDocument.belongsTo(User, { foreignKey: 'user_id' });

User.hasMany(RefreshToken, { foreignKey: 'user_id' });
RefreshToken.belongsTo(User, { foreignKey: 'user_id' });

// Stock Relationships
Stock.hasMany(Watchlist, { foreignKey: 'stock_id' });
Watchlist.belongsTo(Stock, { foreignKey: 'stock_id' });

Stock.hasMany(Portfolio, { foreignKey: 'stock_id' });
Portfolio.belongsTo(Stock, { foreignKey: 'stock_id' });

Stock.hasMany(Trade, { foreignKey: 'stock_id' });
Trade.belongsTo(Stock, { foreignKey: 'stock_id' });

Stock.hasMany(AutomationOrder, { foreignKey: 'stock_id' });
AutomationOrder.belongsTo(Stock, { foreignKey: 'stock_id' });

// Automation Relationships
AutomationOrder.hasMany(AutomationLog, { foreignKey: 'automation_id' });
AutomationLog.belongsTo(AutomationOrder, { foreignKey: 'automation_id' });

AutomationOrder.hasMany(Trade, { foreignKey: 'automation_id' });
Trade.belongsTo(AutomationOrder, { foreignKey: 'automation_id' });

module.exports = {
  User,
  Wallet,
  WalletTransaction,
  Stock,
  Watchlist,
  Portfolio,
  Trade,
  AutomationOrder,
  AutomationLog,
  Notification,
  BankAccount,
  KYCDocument,
  RefreshToken,
  AdminUser
};
