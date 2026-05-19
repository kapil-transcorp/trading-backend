const { errorResponse } = require('../utils/response');

const validate = (schema) => (req, res, next) => {
  const { value, error } = schema.validate(req.body, {
    abortEarly: false,
    allowUnknown: true,
    stripUnknown: true,
  });

  if (error) {
    const errorMessage = error.details.map((details) => details.message).join(', ');
    return errorResponse(res, errorMessage, 400);
  }

  req.body = value;
  next();
};

module.exports = validate;
