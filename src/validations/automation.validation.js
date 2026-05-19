const Joi = require('joi');

const createAutomationSchema = Joi.object({
  stock_id: Joi.string().required(),
  buy_amount: Joi.number().positive().default(5000),
  tp: Joi.number().positive().required(),
  sl: Joi.number().positive().required(),
  loop_enabled: Joi.boolean().default(true),
  start_time: Joi.string().allow('', null).optional().default('09:15 AM'),
  end_time: Joi.string().allow('', null).optional().default('03:30 PM')
});

module.exports = {
  createAutomationSchema
};
