const rateLimit = require('express-rate-limit');
const { errorResponse } = require('../utils/response');

const sensitiveRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // Limit each IP to 60 requests per windowMs
  handler: (req, res) => {
    return errorResponse(res, 'Too many requests, please try again after a minute.', 429, 'RATE_LIMIT_EXCEEDED');
  }
});

module.exports = { sensitiveRateLimiter };
