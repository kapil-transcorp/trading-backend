const express = require('express');
const router = express.Router();
const walletController = require('../controllers/wallet.controller');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  addMoneySchema,
  verifyPaymentSchema,
  withdrawMoneySchema
} = require('../validations/wallet.validation');
const { sensitiveRateLimiter } = require('../middleware/rateLimit');

/**
 * @swagger
 * /api/wallet/admin/deposit:
 *   post:
 *     summary: (Admin Only) Add manual balance to any user
 *     tags: [Admin]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userIdentifier, amount]
 *             properties:
 *               userIdentifier: { type: string, description: "Can be UUID or human-readable userId" }
 *               amount: { type: number }
 *     responses:
 *       200:
 *         description: Success
 */
router.post('/admin/deposit', walletController.adminDeposit);

router.use(protect);

/**
 * @swagger
 * /api/wallet/add-money:
 *   post:
 *     summary: Add money to wallet
 *     tags: [Wallet]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [amount]
 *             properties:
 *               amount: { type: number }
 *     responses:
 *       200:
 *         description: Success
 */
router.post('/add-money', validate(addMoneySchema), walletController.addMoney);

/**
 * @swagger
 * /api/wallet/verify-payment:
 *   post:
 *     summary: Verify payment and update wallet
 *     tags: [Wallet]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [razorpay_order_id, razorpay_payment_id, razorpay_signature]
 *             properties:
 *               razorpay_order_id: { type: string }
 *               razorpay_payment_id: { type: string }
 *               razorpay_signature: { type: string }
 *     responses:
 *       200:
 *         description: Success
 */
router.post('/verify-payment', validate(verifyPaymentSchema), walletController.verifyPayment);

/**
 * @swagger
 * /api/wallet/withdraw:
 *   post:
 *     summary: Withdraw money from wallet
 *     tags: [Wallet]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [amount, bank_account_id]
 *             properties:
 *               amount: { type: number }
 *               bank_account_id: { type: string }
 *     responses:
 *       200:
 *         description: Success
 */
router.post('/withdraw', sensitiveRateLimiter, validate(withdrawMoneySchema), walletController.withdrawMoney);

/**
 * @swagger
 * /api/wallet/balance:
 *   get:
 *     summary: Get wallet balance
 *     tags: [Wallet]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/balance', walletController.getBalance);

/**
 * @swagger
 * /api/wallet/history:
 *   get:
 *     summary: Get wallet transaction history
 *     tags: [Wallet]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/history', walletController.getHistory);

module.exports = router;
