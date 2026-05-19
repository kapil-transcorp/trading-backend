const notificationService = require('../services/notification.service');
const { successResponse, errorResponse } = require('../utils/response');

class NotificationController {
  async list(req, res) {
    try {
      const list = await notificationService.getNotifications(req.user.id);
      return successResponse(res, 'Notifications fetched successfully', list);
    } catch (error) {
      return errorResponse(res, error.message);
    }
  }

  async markAsRead(req, res) {
    try {
      const notification = await notificationService.markAsRead(req.user.id, req.params.id);
      return successResponse(res, 'Notification marked as read', notification);
    } catch (error) {
      return errorResponse(res, error.message);
    }
  }

  async delete(req, res) {
    try {
      await notificationService.deleteNotification(req.user.id, req.params.id);
      return successResponse(res, 'Notification deleted successfully');
    } catch (error) {
      return errorResponse(res, error.message);
    }
  }
}

module.exports = new NotificationController();
