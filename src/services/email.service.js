const { MailSlurp } = require('mailslurp-client');
const logger = require('../utils/logger');

class EmailService {
  constructor() {
    this.mailslurp = new MailSlurp({ apiKey: process.env.MAILSLURP_API_KEY });
    this.systemInboxId = null;
  }

  async getSystemInbox() {
    try {
      if (this.systemInboxId) return this.systemInboxId;

      logger.info('Attempting to fetch MailSlurp inboxes...');
      let inboxes;
      try {
        // Try getInboxes first (common in many versions)
        inboxes = await this.mailslurp.inboxController.getInboxes({ page: 0, size: 1 });
      } catch (e) {
        logger.warn('getInboxes failed, trying getAllInboxes...');
        inboxes = await this.mailslurp.inboxController.getAllInboxes({ page: 0, size: 1 });
      }
      
      if (inboxes && inboxes.content && inboxes.content.length > 0) {
        this.systemInboxId = inboxes.content[0].id;
        logger.info(`Using existing MailSlurp inbox: ${this.systemInboxId}`);
      } else {
        logger.info('No inboxes found. Creating new MailSlurp inbox...');
        const inbox = await this.mailslurp.inboxController.createInboxWithDefaults();
        this.systemInboxId = inbox.id;
        logger.info(`Created new MailSlurp inbox: ${this.systemInboxId}`);
      }
      return this.systemInboxId;
    } catch (error) {
      logger.error('Failed to get/create MailSlurp inbox:', error);
      // Last resort: just try to create one directly
      try {
        const inbox = await this.mailslurp.inboxController.createInboxWithDefaults();
        this.systemInboxId = inbox.id;
        return this.systemInboxId;
      } catch (finalError) {
        logger.error('Final attempt to create inbox failed:', finalError);
        throw finalError;
      }
    }
  }

  async sendOTP(email, otp) {
    try {
      logger.info(`Attempting to send OTP email to ${email}...`);
      const inboxId = await this.getSystemInbox();
      logger.info(`Using inboxId for sending: ${inboxId}`);
      
      await this.mailslurp.sendEmail(inboxId, {
        to: [email],
        subject: 'Your Trading App OTP',
        body: `Your OTP for verification is: ${otp}. It will expire in 10 minutes.`,
      });
      
      logger.info(`Email OTP successfully sent to ${email}`);
      return true;
    } catch (error) {
      logger.error(`Error sending email OTP to ${email}:`, error);
      return false;
    }
  }

  async sendPasswordResetOTP(email, otp) {
    try {
      logger.info(`Attempting to send Password Reset email to ${email}...`);
      const inboxId = await this.getSystemInbox();
      logger.info(`Using inboxId for sending: ${inboxId}`);

      await this.mailslurp.sendEmail(inboxId, {
        to: [email],
        subject: 'Password Reset OTP',
        body: `You requested a password reset. Your OTP is: ${otp}. It will expire in 10 minutes.`,
      });
      
      logger.info(`Password reset OTP successfully sent to ${email}`);
      return true;
    } catch (error) {
      logger.error(`Error sending password reset email to ${email}:`, error);
      return false;
    }
  }
}

module.exports = new EmailService();
