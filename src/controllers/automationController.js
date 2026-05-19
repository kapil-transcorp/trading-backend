const { AutomationOrder, AutomationLog, Stock } = require('../models');

class AutomationController {
  async createAutomation(req, res) {
    const { 
      stock_id, 
      quantity, 
      target_profit_percentage, 
      stop_loss_percentage, 
      start_time, 
      end_time, 
      is_loop_enabled 
    } = req.body;

    const automation = await AutomationOrder.create({
      user_id: req.user.id,
      stock_id,
      quantity,
      target_profit_percentage,
      stop_loss_percentage,
      start_time,
      end_time,
      is_loop_enabled,
      status: 'active'
    });

    res.status(201).json({ success: true, data: automation });
  }

  async listAutomations(req, res) {
    const automations = await AutomationOrder.findAll({
      where: { user_id: req.user.id },
      include: [{ model: Stock }]
    });
    res.status(200).json({ success: true, data: automations });
  }

  async stopAutomation(req, res) {
    const { id } = req.params;
    const automation = await AutomationOrder.findOne({ 
      where: { id, user_id: req.user.id } 
    });

    if (!automation) {
      return res.status(404).json({ success: false, error: 'Automation not found' });
    }

    automation.status = 'stopped';
    await automation.save();

    await AutomationLog.create({
      automation_id: automation.id,
      action: 'STOP',
      details: 'User manually stopped automation'
    });

    res.status(200).json({ success: true, message: 'Automation stopped' });
  }

  async getLogs(req, res) {
    const { id } = req.params;
    const logs = await AutomationLog.findAll({
      where: { automation_id: id },
      order: [['created_at', 'DESC']]
    });
    res.status(200).json({ success: true, data: logs });
  }
}

module.exports = new AutomationController();
