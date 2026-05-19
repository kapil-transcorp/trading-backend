const express = require('express');
const authRoutes = require('./auth.routes');
const walletRoutes = require('./wallet.routes');
const stockRoutes = require('./stock.routes');
const tradeRoutes = require('./trade.routes');
const automationRoutes = require('./automation.routes');
const userRoutes = require('./user.routes');
const notificationRoutes = require('./notification.routes');
const adminRoutes = require('./admin.routes');
const dashboardRoutes = require('./dashboard.routes');

const router = express.Router();

router.get('/', (req, res) => {
  res.json({ success: true, message: 'AI Trading Backend API v1 is running' });
});

router.use('/auth', authRoutes);
router.use('/wallet', walletRoutes);
router.use('/stocks', stockRoutes);
router.use('/trade', tradeRoutes);
router.use('/automation', automationRoutes);
router.use('/user', userRoutes);
router.use('/notifications', notificationRoutes);
router.use('/admin', adminRoutes);
router.use('/dashboard', dashboardRoutes);

// For /api/kyc and /api/bank we can route to userRoutes since it has the handlers, 
// but we will redefine them specifically here to match docs.
const kycRouter = express.Router();
const userController = require('../controllers/user.controller');
const { protect } = require('../middleware/auth');
/**
 * @swagger
 * /api/kyc/upload:
 *   post:
 *     summary: Upload KYC documents (Alternative endpoint)
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 */
kycRouter.post('/upload', protect, userController.uploadKYC);
router.use('/kyc', kycRouter);

const bankRouter = express.Router();
/**
 * @swagger
 * /api/bank/verify:
 *   post:
 *     summary: Verify bank account (Alternative endpoint)
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 */
bankRouter.post('/verify', protect, userController.verifyBankAccount);
router.use('/bank', bankRouter);

module.exports = router;
