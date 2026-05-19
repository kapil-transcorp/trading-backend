const cron = require('node-cron');
const automationEngine = require('../automation/automationEngine');
const logger = require('../utils/logger');

// Run every minute during market hours (mocked as always for now)
cron.schedule('* * * * *', async () => {
  try {
    await automationEngine.processAutomations();
  } catch (error) {
    logger.error('Cron job error:', error);
  }
});

logger.info('Automation cron job scheduled.');
