const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { errorResponse } = require('../utils/response');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return errorResponse(res, 'Not authorized to access this route', 401);
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Admin tokens have role embedded — no users table lookup needed
    if (decoded.role === 'admin') {
      req.user = decoded;
      return next();
    }

    req.user = await User.findByPk(decoded.id);
    
    if (!req.user) {
      return errorResponse(res, 'User no longer exists', 401);
    }

    next();
  } catch (err) {
    return errorResponse(res, 'Not authorized to access this route', 401);
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return errorResponse(
        res,
        `User role ${req.user.role} is not authorized to access this route`,
        403
      );
    }
    next();
  };
};

module.exports = { protect, authorize };
