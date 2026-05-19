const express = require("express");
const router = express.Router();
const adminController = require("../controllers/admin.controller");
const { protect, authorize } = require("../middleware/auth");

/**
 * @swagger
 * /api/admin/login:
 *   post:
 *     summary: Admin login
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: Success
 */
router.post("/login", adminController.login);

router.use(protect);
router.use(authorize("admin"));

/**
 * @swagger
 * /api/admin/dashboard:
 *   get:
 *     summary: Get admin dashboard stats
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 */
router.get("/dashboard", adminController.dashboard);

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: List all users
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 */
router.get("/users", adminController.users);

/**
 * @swagger
 * /api/admin/users/{id}:
 *   get:
 *     summary: Get user details
 *     tags: [Admin]
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
router.get("/users/:id", adminController.userDetails);

/**
 * @swagger
 * /api/admin/wallet-transactions:
 *   get:
 *     summary: Monitor wallet transactions
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 */
router.get("/wallet-transactions", adminController.transactions);

/**
 * @swagger
 * /api/admin/automations:
 *   get:
 *     summary: Monitor all automations
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 */
router.get("/automations", adminController.automations);

/**
 * @swagger
 * /api/admin/trades:
 *   get:
 *     summary: Monitor all trades
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 */
router.get("/trades", adminController.trades);

/**
 * @swagger
 * /api/admin/revenue:
 *   get:
 *     summary: Get revenue analytics
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 */
router.get("/revenue", adminController.revenue);

/**
 * @swagger
 * /api/admin/kyc/pending:
 *   get:
 *     summary: List users requiring manual KYC approval
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 */
router.get("/kyc/pending", adminController.kycPending);
router.post("/users/:id/kyc", adminController.approveKyc);
router.post("/users/:id/status", adminController.updateUserStatus);

/**
 * @swagger
 * /api/admin/broadcast:
 *   post:
 *     summary: Send push notifications to all active users
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 */
router.post("/broadcast", adminController.broadcast);

module.exports = router;
