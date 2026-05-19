const { Notification } = require('../models');

class NotificationService {
  async getNotifications(userId) {
    return await Notification.findAll({
      where: { user_id: userId },
      order: [['created_at', 'DESC']]
    });
  }

  async markAsRead(userId, id) {
    const notification = await Notification.findOne({ where: { id, user_id: userId } });
    if (!notification) throw new Error('Notification not found');
    
    notification.is_read = true;
    await notification.save();
    return notification;
  }

  async deleteNotification(userId, id) {
    return await Notification.destroy({ where: { id, user_id: userId } });
  }

  async createNotification(userId, title, message, type = 'info') {
    return await Notification.create({
      user_id: userId,
      title,
      message,
      type
    });
  }
}

module.exports = new NotificationService();
