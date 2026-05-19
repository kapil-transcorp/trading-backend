const express = require('express');
const router = express.Router();
const stockController = require('../controllers/stock.controller');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { watchlistSchema } = require('../validations/stock.validation');

/**
 * @swagger
 * /api/stocks/search:
 *   get:
 *     summary: Search stocks
 *     tags: [Stocks]
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Search query
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/search', stockController.searchStocks);

/**
 * @swagger
 * /api/stocks/live/{symbol}:
 *   get:
 *     summary: Get live price of a stock
 *     tags: [Stocks]
 *     parameters:
 *       - in: path
 *         name: symbol
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/live/:symbol', stockController.getLivePrice);

/**
 * @swagger
 * /api/stocks/history/{symbol}:
 *   get:
 *     summary: Get historical data of a stock
 *     tags: [Stocks]
 *     parameters:
 *       - in: path
 *         name: symbol
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: interval
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/history/:symbol', stockController.getHistory);

/**
 * @swagger
 * /api/stocks/trending:
 *   get:
 *     summary: Get trending stocks
 *     tags: [Stocks]
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/trending', stockController.getTrending);

/**
 * @swagger
 * /api/stocks/top-gainers:
 *   get:
 *     summary: Get top gaining stocks
 *     tags: [Stocks]
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/top-gainers', stockController.getTopGainers);

/**
 * @swagger
 * /api/stocks/top-losers:
 *   get:
 *     summary: Get top losing stocks
 *     tags: [Stocks]
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/top-losers', stockController.getTopLosers);

/**
 * @swagger
 * /api/stocks/news:
 *   get:
 *     summary: Get market news
 *     tags: [Stocks]
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: News category (general, forex, crypto, merger)
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/news', stockController.getMarketNews);

router.use(protect);

/**
 * @swagger
 * /api/stocks/details/{symbol}:
 *   get:
 *     summary: Get comprehensive stock details (Live Price, Stats, Chart)
 *     tags: [Stocks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: symbol
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: interval
 *         schema:
 *           type: string
 *         description: Chart interval (1m, 5m, 15m, 1h, D, W, M)
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/details/:symbol', stockController.getStockDetails);

/**
 * @swagger
 * /api/stocks/watchlist:
 *   post:
 *     summary: Add stock to watchlist
 *     tags: [Stocks]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [stock_id]
 *             properties:
 *               stock_id: { type: string }
 *     responses:
 *       200:
 *         description: Success
 */
router.post('/watchlist', validate(watchlistSchema), stockController.addToWatchlist);

/**
 * @swagger
 * /api/stocks/watchlist/{id}:
 *   delete:
 *     summary: Remove stock from watchlist
 *     tags: [Stocks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 */
router.delete('/watchlist/:id', stockController.removeFromWatchlist);

/**
 * @swagger
 * /api/stocks/watchlist:
 *   get:
 *     summary: Get user watchlist
 *     tags: [Stocks]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/watchlist', stockController.getWatchlist);

module.exports = router;
