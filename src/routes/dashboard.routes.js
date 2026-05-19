const express = require('express');
const dashboardController = require('../controllers/dashboard.controller');
const { protect } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * /api/dashboard:
 *   get:
 *     summary: Get user dashboard data
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard data fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                       properties:
 *                         name:
 *                           type: string
 *                         role:
 *                           type: string
 *                     portfolio:
 *                       type: object
 *                       properties:
 *                         net_value:
 *                           type: string
 *                         available:
 *                           type: string
 *                         locked:
 *                           type: string
 *                         currency:
 *                           type: string
 *                     stats:
 *                       type: object
 *                       properties:
 *                         daily_pnl:
 *                           type: string
 *                         win_rate:
 *                           type: number
 *                         total_trades:
 *                           type: number
 *                     live_markets:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           symbol:
 *                             type: string
 *                           name:
 *                             type: string
 *                           price:
 *                             type: string
 *                           change:
 *                             type: string
 *                     ai_automations:
 *                       type: object
 *                       properties:
 *                         active_count:
 *                           type: number
 *                         message:
 *                           type: string
 */
router.get('/', protect, dashboardController.getDashboard);

module.exports = router;
