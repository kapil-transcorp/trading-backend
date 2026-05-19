const app = require('./src/app');
const http = require('http');
const { Server } = require('socket.io');
const { connectDB } = require('./src/config/db');
const socketHandler = require('./src/sockets');
const { startAutomationCron, startSystemCron } = require('./src/cron');
const logger = require('./src/utils/logger');
const socketUtil = require('./src/utils/socket');

require('dotenv').config();
// Server updated at: 2026-05-18 14:52:00

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST']
  }
});

// Pass io to socket handlers
socketUtil.init(io);
socketHandler(io);

// Start Cron Jobs
startAutomationCron();
startSystemCron();


// Connect to Database and start server
const startServer = async () => {
  logger.info('Starting server initialization...');
  await connectDB();
  logger.info('connectDB completed.');
  
  // Optional: Seed stocks in development
  if (process.env.NODE_ENV === 'development') {
    logger.info('Starting seedStocks...');
    const seedStocks = require('./src/database/seeders/stockSeeder');
    await seedStocks();
    logger.info('seedStocks completed.');
  }
  
  server.listen(PORT, '0.0.0.0', () => {
    logger.info(`Server is running on port ${PORT} and accessible on local network`);
  });
};

startServer();

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  logger.error(`Unhandled Rejection: ${err.message}`);
  // Close server & exit process
  // server.close(() => process.exit(1));
});
