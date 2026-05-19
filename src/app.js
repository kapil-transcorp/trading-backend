const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
require('express-async-errors');

const errorHandler = require('./middleware/errorHandler');
const routes = require('./routes');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');

const app = express();


// Set security HTTP headers
app.use(helmet({
  contentSecurityPolicy: process.env.NODE_ENV === 'development' ? false : undefined,
  crossOriginOpenerPolicy: process.env.NODE_ENV === 'development' ? false : undefined,
  crossOriginResourcePolicy: process.env.NODE_ENV === 'development' ? false : undefined,
  hsts: process.env.NODE_ENV === 'development' ? false : undefined,
  originAgentCluster: process.env.NODE_ENV === 'development' ? false : undefined,
}));

// Development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Body parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// Implement CORS
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));

// Rate limiting (Relaxed in development mode for seamless local testing)
const isDev = process.env.NODE_ENV === 'development';
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: isDev ? 10000 : (parseInt(process.env.RATE_LIMIT_MAX) || 100),
  message: 'Too many requests from this IP, please try again after 15 minutes'
});
app.use('/api', limiter);

// API Routes
app.use('/api', routes);

// Swagger Documentation Route
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  swaggerOptions: {
    validatorUrl: null
  }
}));

// Base route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to AI Trading Backend API' });
});

// 404 Route
app.all('*', (req, res, next) => {
  const err = new Error(`Can't find ${req.originalUrl} on this server!`);
  err.status = 'fail';
  err.statusCode = 404;
  next(err);
});

// Global Error Handler
app.use(errorHandler);

module.exports = app;
