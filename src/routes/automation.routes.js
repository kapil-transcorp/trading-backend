const express = require('express');
const router = express.Router();
const automationController = require('../controllers/automation.controller');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { createAutomationSchema } = require('../validations/automation.validation');
const { sensitiveRateLimiter } = require('../middleware/rateLimit');

router.use(protect);

/**
 * @swagger
 * /api/automation/deploy:
 *   post:
 *     summary: Deploy an automated trading strategy (Supports Gemini AI Technical Setup Logs)
 *     tags: [Automation]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [stock_id, tp, sl]
 *             properties:
 *               stock_id: { type: string, example: "RELIANCE" }
 *               tp: { type: number, example: 5.0 }
 *               sl: { type: number, example: 2.0 }
 *               buy_amount: { type: number, example: 5000 }
 *               loop_enabled: { type: boolean, example: true }
 *               start_time: { type: string, example: "09:15 AM" }
 *               end_time: { type: string, example: "03:30 PM" }
 *     responses:
 *       201:
 *         description: Success
 */
router.post('/deploy', sensitiveRateLimiter, validate(createAutomationSchema), automationController.create);

/**
 * @swagger
 * /api/automation/list:
 *   get:
 *     summary: List all user automations
 *     tags: [Automation]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/list', automationController.list);

/**
 * @swagger
 * /api/automation/{id}:
 *   get:
 *     summary: Get automation details
 *     tags: [Automation]
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
router.get('/:id', automationController.details);

/**
 * @swagger
 * /api/automation/stop/{id}:
 *   post:
 *     summary: Stop an automation
 *     tags: [Automation]
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
router.post('/stop/:id', automationController.stop);

/**
 * @swagger
 * /api/automation/resume/{id}:
 *   post:
 *     summary: Resume an automation
 *     tags: [Automation]
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
router.post('/resume/:id', automationController.resume);

/**
 * @swagger
 * /api/automation/{id}:
 *   delete:
 *     summary: Delete an automation
 *     tags: [Automation]
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
router.delete('/:id', automationController.delete);

/**
 * @swagger
 * /api/automation/logs/{id}:
 *   get:
 *     summary: Get automation logs
 *     tags: [Automation]
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
router.get('/logs/:id', automationController.logs);

module.exports = router;
