const Joi = require('joi');

const addMoneySchema = Joi.object({
  amount: Joi.number().positive().required()
});

const verifyPaymentSchema = Joi.object({
  razorpay_order_id: Joi.string().required(),
  razorpay_payment_id: Joi.string().required(),
  razorpay_signature: Joi.string().required()
});

const withdrawMoneySchema = Joi.object({
  amount: Joi.number().positive().required(),
  bank_account_id: Joi.string().required()
});

module.exports = {
  addMoneySchema,
  verifyPaymentSchema,
  withdrawMoneySchema
};
