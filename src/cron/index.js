const startAutomationCron = () => {
  require('./automationCron');
};

const logger = require('../utils/logger');

const startSystemCron = () => {
  // Placeholder for other system crons
  logger.info('System cron jobs initialized.');
};

module.exports = {
  startAutomationCron,
  startSystemCron
};
