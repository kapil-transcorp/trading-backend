const dashboardService = require('../services/dashboard.service');
const { successResponse, errorResponse } = require('../utils/response');

class DashboardController {
  getDashboard = async (req, res) => {
    try {
      const userId = req.user.id;
      const data = await dashboardService.getDashboardData(userId);
      return successResponse(res, 'Dashboard data fetched successfully', data);
    } catch (error) {
      return errorResponse(res, error.message, 500);
    }
  }
}

module.exports = new DashboardController();
