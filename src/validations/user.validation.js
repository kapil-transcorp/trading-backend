const Joi = require('joi');

const updateProfileSchema = Joi.object({
  full_name: Joi.string().allow('', null),
  mobile: Joi.string().length(10).pattern(/^[0-9]+$/),
  nominee: Joi.string().allow('', null),
  address: Joi.string().allow('', null),
  occupation: Joi.string().allow('', null),
  annual_income: Joi.string().allow('', null),
  trading_experience: Joi.string().allow('', null)
});

const bankAccountSchema = Joi.object({
  account_number: Joi.string().required(),
  ifsc_code: Joi.string().required(),
  bank_name: Joi.string().required(),
  account_holder_name: Joi.string().required()
});

const updateSettingsSchema = Joi.object({
  // Accept flat root-level keys
  email_notifications: Joi.boolean(),
  push_notifications: Joi.boolean(),
  sms_notifications: Joi.boolean(),
  trade_execution_alerts: Joi.boolean(),
  news_market_alerts: Joi.boolean(),
  ai_agent_enabled: Joi.boolean(),
  risk_appetite: Joi.string().valid('low', 'medium', 'high'),
  max_concurrent_trades: Joi.number().integer().min(1).max(20),
  default_trade_amount: Joi.number().positive(),
  two_factor_auth: Joi.boolean(),
  biometric_login: Joi.boolean(),
  theme: Joi.string().valid('light', 'dark', 'system'),
  language: Joi.string(),
  currency: Joi.string().valid('INR', 'USD'),

  // Also accept nested trading_preferences key
  trading_preferences: Joi.object({
    email_notifications: Joi.boolean(),
    push_notifications: Joi.boolean(),
    sms_notifications: Joi.boolean(),
    trade_execution_alerts: Joi.boolean(),
    news_market_alerts: Joi.boolean(),
    ai_agent_enabled: Joi.boolean(),
    risk_appetite: Joi.string().valid('low', 'medium', 'high'),
    max_concurrent_trades: Joi.number().integer().min(1).max(20),
    default_trade_amount: Joi.number().positive(),
    two_factor_auth: Joi.boolean(),
    biometric_login: Joi.boolean(),
    theme: Joi.string().valid('light', 'dark', 'system'),
    language: Joi.string(),
    currency: Joi.string().valid('INR', 'USD')
  }).optional()
});

const submitIdentityDocsSchema = Joi.object({
  pan_number: Joi.string().length(10),
  pan_url: Joi.string().uri(),
  aadhaar_number: Joi.string().length(12).pattern(/^[0-9]+$/),
  aadhaar_url: Joi.string().uri()
});

const submitSelfieSchema = Joi.object({
  selfie_url: Joi.string().uri().required()
});

const completeOnboardingSchema = Joi.object({
  occupation: Joi.string().required(),
  annual_income: Joi.string().required(),
  trading_experience: Joi.string().required(),
  nominee: Joi.string().allow('', null).optional(),
  address: Joi.string().allow('', null).optional()
});

const updateTradingProfileSchema = Joi.object({
  occupation: Joi.string().allow('', null),
  trading_experience: Joi.string().allow('', null),
  annual_income: Joi.string().allow('', null),
  nominee: Joi.string().allow('', null)
});

const updateAddressSchema = Joi.object({
  address: Joi.string().required()
});

module.exports = {
  updateProfileSchema,
  bankAccountSchema,
  updateSettingsSchema,
  submitIdentityDocsSchema,
  submitSelfieSchema,
  completeOnboardingSchema,
  updateTradingProfileSchema,
  updateAddressSchema
};
