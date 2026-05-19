const Joi = require('joi');

const registerSchema = Joi.object({
  full_name: Joi.string().max(100).required(),
  email: Joi.string().email().required(),
  mobile: Joi.string().length(10).pattern(/^[0-9]+$/).required(),
  password: Joi.string().min(8).required(),
  pan_number: Joi.string().pattern(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/).required(),
  aadhaar_number: Joi.string().length(12).pattern(/^[0-9]+$/).required(),
  dob: Joi.string().pattern(/^\d{2}\/\d{2}\/\d{4}$/).required()
}).custom((obj, helpers) => {
  const [day, month, year] = obj.dob.split('/');
  const dobDate = new Date(`${year}-${month}-${day}`);
  let age = new Date().getFullYear() - dobDate.getFullYear();
  const m = new Date().getMonth() - dobDate.getMonth();
  if (m < 0 || (m === 0 && new Date().getDate() < dobDate.getDate())) {
    age--;
  }
  if (age < 18) {
    return helpers.error('any.invalid', { message: 'Must be 18 years or older' });
  }
  return obj;
});

const loginSchema = Joi.object({
  identifier: Joi.string().required(),
  password: Joi.string().required()
});

const verifyOtpSchema = Joi.object({
  mobile: Joi.string().length(10).pattern(/^[0-9]+$/).required(),
  otp: Joi.string().length(4).required()
});

const sendOtpSchema = Joi.object({
  mobile: Joi.string().length(10).pattern(/^[0-9]+$/).required()
});

const loginOtpSchema = Joi.object({
  mobile: Joi.string().length(10).pattern(/^[0-9]+$/).required(),
  otp: Joi.string().length(4).required()
});

const resetPasswordSchema = Joi.object({
  token: Joi.string().required(),
  password: Joi.string().min(6).required()
});

const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string().min(6).required()
});

const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required()
});

module.exports = {
  registerSchema,
  loginSchema,
  verifyOtpSchema,
  resetPasswordSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  sendOtpSchema,
  loginOtpSchema
};
