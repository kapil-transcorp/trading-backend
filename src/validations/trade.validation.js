const Joi = require('joi');

const buyStockSchema = Joi.object({
  symbol: Joi.string().required(),
  quantity: Joi.number().integer().positive().required(),
  price: Joi.number().positive().required()
});

const sellStockSchema = Joi.object({
  symbol: Joi.string().required(),
  quantity: Joi.number().integer().positive().required()
});

module.exports = {
  buyStockSchema,
  sellStockSchema
};
