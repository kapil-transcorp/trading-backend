const express = require('express');
const router = express.Router();
const tradeController = require('../controllers/trade.controller');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { buyStockSchema, sellStockSchema } = require('../validations/trade.validation');
const { sensitiveRateLimiter } = require('../middleware/rateLimit');

router.use(protect);

/**
 * @swagger
 * /api/trade/buy:
 *   post:
 *     summary: Buy a stock
 *     tags: [Trading]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [symbol, quantity, price]
 *             properties:
 *               symbol: { type: string }
 *               quantity: { type: number }
 *               price: { type: number }
 *     responses:
 *       201:
 *         description: Success
 */
router.post('/buy', sensitiveRateLimiter, validate(buyStockSchema), tradeController.buyStock);

/**
 * @swagger
 * /api/trade/sell:
 *   post:
 *     summary: Sell a stock
 *     tags: [Trading]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [symbol, quantity]
 *             properties:
 *               symbol: { type: string }
 *               quantity: { type: number }
 *     responses:
 *       201:
 *         description: Success
 */
router.post('/sell', sensitiveRateLimiter, validate(sellStockSchema), tradeController.sellStock);

/**
 * @swagger
 * /api/trade/holdings:
 *   get:
 *     summary: Get user holdings
 *     tags: [Trading]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/holdings', tradeController.getHoldings);

/**
 * @swagger
 * /api/trade/portfolio:
 *   get:
 *     summary: Get user portfolio summary
 *     tags: [Trading]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/portfolio', tradeController.getPortfolio);

/**
 * @swagger
 * /api/trade/history:
 *   get:
 *     summary: Get user trade history
 *     tags: [Trading]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/history', tradeController.getTradeHistory);

/**
 * @swagger
 * /api/trade/open-orders:
 *   get:
 *     summary: Get user open orders
 *     tags: [Trading]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/open-orders', tradeController.getOpenOrders);

module.exports = router;
