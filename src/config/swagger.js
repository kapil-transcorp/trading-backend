const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Trading Backend API',
      version: '1.0.0',
      description: 'API documentation for the Trading Application',
    },
    servers: [
      {
        url: '/',
        description: 'Current server (Auto-detect)',
      },
      {
        url: `http://localhost:${process.env.PORT || 5000}`,
        description: 'Local development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/routes/*.js'],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
