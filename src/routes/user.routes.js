const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const upload = require('../middleware/upload');
const {
  updateProfileSchema,
  bankAccountSchema,
  updateSettingsSchema,
  submitIdentityDocsSchema,
  submitSelfieSchema,
  completeOnboardingSchema,
  updateTradingProfileSchema,
  updateAddressSchema
} = require('../validations/user.validation');

router.use(protect);

/**
 * @swagger
 * /api/user/profile:
 *   get:
 *     summary: Get user profile
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/profile', userController.getProfile);

/**
 * @swagger
 * /api/user/upload-avatar:
 *   post:
 *     summary: Upload or update profile photo (Cloudinary)
 *     description: |
 *       Uploads a profile image to Cloudinary under `trading/avatars/` folder.
 *       - Automatically deletes the old avatar if one exists.
 *       - Crops & resizes to **500x500px** (face-gravity crop).
 *       - Saves the returned URL to `selfie_url` on the user profile.
 *       - Send as **multipart/form-data** with field name **`avatar`**.
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [avatar]
 *             properties:
 *               avatar:
 *                 type: string
 *                 format: binary
 *                 description: "Image file — JPEG, PNG or WEBP. Max size: 5 MB."
 *     responses:
 *       200:
 *         description: Profile photo uploaded and saved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Profile photo uploaded successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     avatar_url:
 *                       type: string
 *                       example: "https://res.cloudinary.com/dyzioo0rx/image/upload/trading/avatars/avatar-user123.jpg"
 *                       description: Cloudinary CDN secure URL — store this in your app
 *                     public_id:
 *                       type: string
 *                       example: "trading/avatars/avatar-user123"
 *                       description: Cloudinary public_id (for future deletion if needed)
 *       400:
 *         description: No file sent or invalid file type
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Image file is required. Send as multipart/form-data with field name \"avatar\""
 *       401:
 *         description: Unauthorized — missing or invalid Bearer token
 *       500:
 *         description: Cloudinary upload failure or server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Must supply api_key"
 */
router.post('/upload-avatar', upload.single('avatar'), userController.uploadAvatar);


/**
 * @swagger
 * /api/user/profile:
 *   put:
 *     summary: Update user profile
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               full_name: { type: string }
 *               mobile: { type: string }
 *               nominee: { type: string, example: "Rahul Kumawat" }
 *               address: { type: string, example: "102, Shanti Nagar, Jaipur, Rajasthan" }
 *               occupation: { type: string, example: "Salaried" }
 *               annual_income: { type: string, example: "5-10L" }
 *               trading_experience: { type: string, example: "2 Years" }
 *     responses:
 *       200:
 *         description: Success
 */
router.put('/profile', validate(updateProfileSchema), userController.updateProfile);

/**
 * @swagger
 * /api/user/upload-kyc:
 *   post:
 *     summary: Upload KYC documents
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 */
router.post('/upload-kyc', userController.uploadKYC);

/**
 * @swagger
 * /api/user/bank-account:
 *   post:
 *     summary: Add bank account
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [account_number, ifsc_code, bank_name, account_holder_name]
 *             properties:
 *               account_number: { type: string }
 *               ifsc_code: { type: string }
 *               bank_name: { type: string }
 *               account_holder_name: { type: string }
 *     responses:
 *       200:
 *         description: Success
 */
router.post('/bank-account', validate(bankAccountSchema), userController.addBankAccount);

/**
 * @swagger
 * /api/user/bank-account/verify:
 *   post:
 *     summary: Verify bank account
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 */
router.post('/bank-account/verify', userController.verifyBankAccount);


/**
 * @swagger
 * /api/user/bank-account:
 *   get:
 *     summary: Get user bank account details
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 *       404:
 *         description: Not Found
 */
router.get('/bank-account', userController.getBankAccount);

/**
 * @swagger
 * /api/user/settings:
 *   get:
 *     summary: Get user settings
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/settings', userController.getSettings);

/**
 * @swagger
 * /api/user/settings:
 *   put:
 *     summary: Update user settings
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               trading_preferences:
 *                 type: object
 *                 properties:
 *                   email_notifications: { type: boolean, example: true }
 *                   push_notifications: { type: boolean, example: true }
 *                   sms_notifications: { type: boolean, example: false }
 *                   trade_execution_alerts: { type: boolean, example: true }
 *                   news_market_alerts: { type: boolean, example: true }
 *                   ai_agent_enabled: { type: boolean, example: true }
 *                   risk_appetite: { type: string, enum: [low, medium, high], example: "medium" }
 *                   max_concurrent_trades: { type: integer, example: 5 }
 *                   default_trade_amount: { type: number, example: 2000 }
 *                   two_factor_auth: { type: boolean, example: false }
 *                   biometric_login: { type: boolean, example: false }
 *                   theme: { type: string, enum: [light, dark, system], example: "dark" }
 *                   language: { type: string, example: "en" }
 *                   currency: { type: string, enum: [INR, USD], example: "INR" }
 *     responses:
 *       200:
 *         description: Success
 */
router.put('/settings', validate(updateSettingsSchema), userController.updateSettings);

/**
 * @swagger
 * /api/user/kyc/status:
 *   get:
 *     summary: Get user KYC verification status and document details
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/kyc/status', userController.getKYCStatus);

/**
 * @swagger
 * /api/user/kyc/identity:
 *   post:
 *     summary: Submit PAN and Aadhaar identity documents
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               pan_number: { type: string, example: "ABCDE1234F" }
 *               pan_url: { type: string, example: "https://example.com/pan.jpg" }
 *               aadhaar_number: { type: string, example: "123456789012" }
 *               aadhaar_url: { type: string, example: "https://example.com/aadhaar.jpg" }
 *     responses:
 *       200:
 *         description: Success
 */
router.post('/kyc/identity', validate(submitIdentityDocsSchema), userController.submitIdentityDocs);

/**
 * @swagger
 * /api/user/kyc/selfie:
 *   post:
 *     summary: Submit facial selfie verification image
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [selfie_url]
 *             properties:
 *               selfie_url: { type: string, example: "https://example.com/selfie.jpg" }
 *     responses:
 *       200:
 *         description: Success
 */
router.post('/kyc/selfie', validate(submitSelfieSchema), userController.submitSelfie);

/**
 * @swagger
 * /api/user/kyc/onboarding:
 *   post:
 *     summary: Complete onboarding by configuring active trading profile
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [occupation, annual_income, trading_experience]
 *             properties:
 *               occupation: { type: string, example: "Salaried" }
 *               annual_income: { type: string, example: "5-10L" }
 *               trading_experience: { type: string, example: "2 Years" }
 *               nominee: { type: string, example: "Rahul Kumawat" }
 *               address: { type: string, example: "102, Shanti Nagar, Jaipur, Rajasthan" }
 *     responses:
 *       200:
 *         description: Success
 */
router.post('/kyc/onboarding', validate(completeOnboardingSchema), userController.completeOnboarding);

/**
 * @swagger
 * /api/user/trading-profile:
 *   put:
 *     summary: Update Trading Profile details (Occupation, Trading Experience, Annual Income, Nominee)
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               occupation: { type: string, example: "Salaried" }
 *               annual_income: { type: string, example: "5-10L" }
 *               trading_experience: { type: string, example: "2 Years" }
 *               nominee: { type: string, example: "Rahul Kumawat" }
 *     responses:
 *       200:
 *         description: Success
 */
router.put('/trading-profile', validate(updateTradingProfileSchema), userController.updateTradingProfile);

/**
 * @swagger
 * /api/user/address:
 *   put:
 *     summary: Update Address details (Permanent Address)
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [address]
 *             properties:
 *               address: { type: string, example: "102, Shanti Nagar, Jaipur, Rajasthan" }
 *     responses:
 *       200:
 *         description: Success
 */
router.put('/address', validate(updateAddressSchema), userController.updateAddress);

/**
 * @swagger
 * /api/user/expert-suggestions:
 *   get:
 *     summary: Get AI-powered expert trading suggestions and portfolio remedies
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: topic
 *         schema:
 *           type: string
 *           enum: [portfolio, market, psychology, general]
 *         description: Topic for suggestions (defaults to portfolio)
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/expert-suggestions', userController.getExpertSuggestions);

module.exports = router;
