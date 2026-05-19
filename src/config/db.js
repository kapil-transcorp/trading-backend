const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = process.env.DATABASE_URL
  ? new Sequelize(process.env.DATABASE_URL, {
      dialect: 'mysql',
      logging: false,
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
      },
      define: {
        timestamps: true,
        underscored: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        deletedAt: 'deleted_at'
      }
    })
  : new Sequelize(
      process.env.DB_NAME,
      process.env.DB_USER,
      process.env.DB_PASS,
      {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        dialect: 'mysql',
        logging: false,
        pool: {
          max: 5,
          min: 0,
          acquire: 30000,
          idle: 10000
        },
        define: {
          timestamps: true,
          underscored: true,
          createdAt: 'created_at',
          updatedAt: 'updated_at',
          deletedAt: 'deleted_at'
        }
      }
    );

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('Connection has been established successfully.');
    
    // Sync models with database
    if (process.env.NODE_ENV === 'development') {
        // Using { alter: true } can cause ER_TOO_MANY_KEYS in MySQL if it repeatedly adds unique constraints.
        // Disable it once the schema is stable or if it causes crashes.
        await sequelize.sync();
        
        // Manual column addition to avoid 'Too many keys' error with alter: true
        const queryInterface = sequelize.getQueryInterface();
        const tableInfo = await queryInterface.describeTable('refresh_tokens');
        if (!tableInfo.device_id) {
            await queryInterface.addColumn('refresh_tokens', 'device_id', {
                type: Sequelize.STRING,
                allowNull: true
            });
            console.log('Added device_id column to refresh_tokens table.');
        }

        const userTableInfo = await queryInterface.describeTable('users');
        if (!userTableInfo.selfie_url) {
            await queryInterface.addColumn('users', 'selfie_url', {
                type: Sequelize.STRING,
                allowNull: true
            });
            console.log('Added selfie_url column to users table.');
        }
        if (!userTableInfo.occupation) {
            await queryInterface.addColumn('users', 'occupation', {
                type: Sequelize.STRING,
                allowNull: true
            });
            console.log('Added occupation column to users table.');
        }
        if (!userTableInfo.annual_income) {
            await queryInterface.addColumn('users', 'annual_income', {
                type: Sequelize.STRING,
                allowNull: true
            });
            console.log('Added annual_income column to users table.');
        }
        if (!userTableInfo.trading_experience) {
            await queryInterface.addColumn('users', 'trading_experience', {
                type: Sequelize.STRING,
                allowNull: true
            });
            console.log('Added trading_experience column to users table.');
        }
        if (!userTableInfo.nominee) {
            await queryInterface.addColumn('users', 'nominee', {
                type: Sequelize.STRING,
                allowNull: true
            });
            console.log('Added nominee column to users table.');
        }
        if (!userTableInfo.address) {
            await queryInterface.addColumn('users', 'address', {
                type: Sequelize.STRING,
                allowNull: true
            });
            console.log('Added address column to users table.');
        }
        if (!userTableInfo.trading_preferences) {
            await queryInterface.addColumn('users', 'trading_preferences', {
                type: Sequelize.JSON,
                allowNull: true
            });
            console.log('Added trading_preferences column to users table.');
        }

        const automationTableInfo = await queryInterface.describeTable('automation_orders');
        if (!automationTableInfo.active_start_time) {
            await queryInterface.addColumn('automation_orders', 'active_start_time', {
                type: Sequelize.STRING,
                allowNull: true
            });
            console.log('Added active_start_time column to automation_orders table.');
        }
        if (!automationTableInfo.active_end_time) {
            await queryInterface.addColumn('automation_orders', 'active_end_time', {
                type: Sequelize.STRING,
                allowNull: true
            });
            console.log('Added active_end_time column to automation_orders table.');
        }

        console.log('Database synced successfully.');

        // Clean up dry session names to show beautiful premium device names
        await sequelize.query(`
          UPDATE refresh_tokens 
          SET device_id = 'iPhone App' 
          WHERE device_id = 'Unknown Device' OR device_id LIKE '%Dart%'
        `).catch(() => {});
    }
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };
