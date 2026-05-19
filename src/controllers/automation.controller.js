const automationService = require('../services/automation.service');
const { successResponse, errorResponse } = require('../utils/response');

class AutomationController {
  async create(req, res) {
    try {
      const automation = await automationService.createAutomation(req.user.id, req.body);
      return successResponse(res, 'Automation created successfully', automation, 201);
    } catch (error) {
      return errorResponse(res, error.message, 400, error.code || 'DEPLOYMENT_FAILED');
    }
  }

  async list(req, res) {
    try {
      const list = await automationService.listAutomations(req.user.id);
      return successResponse(res, 'Automations fetched successfully', list);
    } catch (error) {
      return errorResponse(res, error.message);
    }
  }

  async details(req, res) {
    try {
      const details = await automationService.getAutomationDetails(req.user.id, req.params.id);
      return successResponse(res, 'Automation details fetched successfully', details);
    } catch (error) {
      return errorResponse(res, error.message);
    }
  }

  async stop(req, res) {
    try {
      const result = await automationService.stopAutomation(req.user.id, req.params.id);
      return successResponse(res, 'Automation stopped successfully', result);
    } catch (error) {
      return errorResponse(res, error.message);
    }
  }

  async resume(req, res) {
    try {
      const result = await automationService.resumeAutomation(req.user.id, req.params.id);
      return successResponse(res, 'Automation resumed successfully', result);
    } catch (error) {
      return errorResponse(res, error.message);
    }
  }

  async delete(req, res) {
    try {
      await automationService.deleteAutomation(req.user.id, req.params.id);
      return successResponse(res, 'Automation deleted successfully');
    } catch (error) {
      return errorResponse(res, error.message);
    }
  }

  async logs(req, res) {
    try {
      const logs = await automationService.getLogs(req.user.id, req.params.id);
      return successResponse(res, 'Automation logs fetched successfully', logs);
    } catch (error) {
      return errorResponse(res, error.message);
    }
  }
}

module.exports = new AutomationController();
