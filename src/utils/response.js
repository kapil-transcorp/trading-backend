/**
 * Success Response Format
 * {
 *   "success": true,
 *   "message": "Success message",
 *   "data": {}
 * }
 */
const successResponse = (res, message, data = {}, statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data
  });
};

const errorResponse = (res, message, statusCode = 500, errorCode = 'ERROR') => {
  return res.status(statusCode).json({
    error_code: errorCode,
    message,
    timestamp: new Date().toISOString()
  });
};

module.exports = {
  successResponse,
  errorResponse
};
