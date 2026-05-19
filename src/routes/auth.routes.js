const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const {
  registerSchema,
  loginSchema,
  verifyOtpSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  sendOtpSchema,
  loginOtpSchema
} = require('../validations/auth.validation');

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [full_name, email, mobile, password, pan_number, aadhaar_number, dob]
 *             properties:
 *               full_name: { type: string }
 *               email: { type: string }
 *               mobile: { type: string }
 *               password: { type: string }
 *               pan_number: { type: string }
 *               aadhaar_number: { type: string }
 *               dob: { type: string, description: "DD/MM/YYYY" }
 *     responses:
 *       201:
 *         description: OTP sent to mobile
 */
router.post('/register', validate(registerSchema), authController.register);

/**
 * @swagger
 * /api/auth/verify-otp:
 *   post:
 *     summary: Verify OTP
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [mobile, otp]
 *             properties:
 *               mobile: { type: string }
 *               otp: { type: string, description: "4-digit OTP" }
 *     responses:
 *       200:
 *         description: Success
 */
router.post('/verify-otp', validate(verifyOtpSchema), authController.verifyOtp);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [identifier, password]
 *             properties:
 *               identifier: { type: string, description: "Email or Mobile number" }
 *               password: { type: string }
 *     responses:
 *       200:
 *         description: Success
 */
router.post('/login', validate(loginSchema), authController.login);

/**
 * @swagger
 * /api/auth/send-otp:
 *   post:
 *     summary: Send OTP for mobile login
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [mobile]
 *             properties:
 *               mobile: { type: string }
 *     responses:
 *       200:
 *         description: Success
 */
router.post('/send-otp', validate(sendOtpSchema), authController.sendLoginOtp);

/**
 * @swagger
 * /api/auth/login-otp:
 *   post:
 *     summary: Login with mobile and OTP
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [mobile, otp]
 *             properties:
 *               mobile: { type: string }
 *               otp: { type: string, description: "4-digit OTP" }
 *     responses:
 *       200:
 *         description: Success
 */
router.post('/login-otp', validate(loginOtpSchema), authController.loginWithOtp);

/**
 * @swagger
 * /api/auth/refresh-token:
 *   post:
 *     summary: Refresh JWT token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken: { type: string }
 *     responses:
 *       200:
 *         description: Success
 */
router.post('/refresh-token', authController.refreshToken);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout user
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken: { type: string, description: "Optional if using cookies" }
 *     responses:
 *       200:
 *         description: Success
 */
router.post('/logout', protect, authController.logout);

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: Request password reset link
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email: { type: string }
 *     responses:
 *       200:
 *         description: Success
 */
router.post('/forgot-password', validate(forgotPasswordSchema), authController.forgotPassword);

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Reset password
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token, password]
 *             properties:
 *               token: { type: string }
 *               password: { type: string }
 *     responses:
 *       200:
 *         description: Success
 */
router.post('/reset-password', validate(resetPasswordSchema), authController.resetPassword);

/**
 * @swagger
 * /api/auth/change-password:
 *   post:
 *     summary: Change password
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [currentPassword, newPassword]
 *             properties:
 *               currentPassword: { type: string }
 *               newPassword: { type: string }
 *     responses:
 *       200:
 *         description: Success
 */
router.post('/change-password', protect, validate(changePasswordSchema), authController.changePassword);

// Active Sessions management
/**
 * @swagger
 * /api/auth/sessions:
 *   get:
 *     summary: Get all active login sessions
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/sessions', protect, authController.getActiveSessions);

/**
 * @swagger
 * /api/auth/sessions/{id}:
 *   delete:
 *     summary: Revoke / delete a specific session (Log out device remotely)
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Refresh token session ID to revoke
 *     responses:
 *       200:
 *         description: Success
 */
router.delete('/sessions/:id', protect, authController.revokeSession);

module.exports = router;
