const { sequelize } = require('./src/config/db');
const { User } = require('./src/models');

async function fixDatabase() {
  try {
    console.log('Attempting to clear redundant indexes and sync database...');
    
    // We force sync to DROP and RECREATE all tables. 
    // WARNING: This will delete ALL data. 
    // This is the fastest way to fix the "ER_TOO_MANY_KEYS" issue in development.
    await sequelize.sync({ force: true });
    
    console.log('Database has been reset and synced successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Failed to fix database:', error);
    process.exit(1);
  }
}

fixDatabase();
