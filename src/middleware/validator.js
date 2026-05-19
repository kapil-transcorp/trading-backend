const Joi = require('joi');

const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body, { abortEarly: false });
  if (error) {
    const errorMessage = error.details.map(detail => detail.message).join(', ');
    return res.status(400).json({ success: false, error: errorMessage });
  }
  next();
};

const authSchemas = {
  register: Joi.object({
    name: Joi.string().required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    phone: Joi.string().optional()
  }),
  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  })
};

const tradeSchemas = {
  buy: Joi.object({
    stock_id: Joi.string().uuid().required(),
    quantity: Joi.number().integer().positive().required(),
    price: Joi.number().positive().required()
  }),
  automation: Joi.object({
    stock_id: Joi.string().uuid().required(),
    quantity: Joi.number().integer().positive().required(),
    target_profit_percentage: Joi.number().positive().required(),
    stop_loss_percentage: Joi.number().positive().required(),
    start_time: Joi.date().required(),
    end_time: Joi.date().required(),
    is_loop_enabled: Joi.boolean().default(false)
  })
};

module.exports = { validate, authSchemas, tradeSchemas };
