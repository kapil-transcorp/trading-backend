const userService = require('../services/user.service');
const aiService = require('../services/ai.service');
const { successResponse, errorResponse } = require('../utils/response');

class UserController {
  async getProfile(req, res) {
    try {
      const profile = await userService.getProfile(req.user.id);
      return successResponse(res, 'Profile fetched successfully', profile);
    } catch (error) {
      return errorResponse(res, error.message);
    }
  }

  async updateProfile(req, res) {
    try {
      const profile = await userService.updateProfile(req.user.id, req.body);
      return successResponse(res, 'Profile updated successfully', profile);
    } catch (error) {
      return errorResponse(res, error.message);
    }
  }

  async uploadAvatar(req, res) {
    try {
      if (!req.file) {
        return errorResponse(res, 'Image file is required. Send as multipart/form-data with field name "avatar"', 400);
      }
      const result = await userService.uploadAvatar(req.user.id, req.file.buffer);
      return successResponse(res, 'Profile photo uploaded successfully', result);
    } catch (error) {
      return errorResponse(res, error.message);
    }
  }

  async uploadKYC(req, res) {
    try {
      if (!req.files) {
        return errorResponse(res, 'Files are required', 400);
      }
      // Multer will provide files. In this simple demo, we just log them.
      // req.files would contain { aadhaar: [], pan: [], selfie: [] }
      const result = await userService.uploadKYC(req.user.id, {
        document_type: req.body.type,
        document_number: req.body.number,
        document_url: req.files ? 'path/to/file' : 'demo_url'
      });
      return successResponse(res, 'KYC documents uploaded successfully', result);
    } catch (error) {
      return errorResponse(res, error.message);
    }
  }

  async addBankAccount(req, res) {
    try {
      const result = await userService.addBankAccount(req.user.id, req.body);
      return successResponse(res, 'Bank account added successfully', result);
    } catch (error) {
      return errorResponse(res, error.message);
    }
  }

  async getBankAccount(req, res) {
    try {
      const result = await userService.getBankAccount(req.user.id);
      if (!result) {
        return errorResponse(res, 'Bank account details not found', 404);
      }
      return successResponse(res, 'Bank account details fetched successfully', result);
    } catch (error) {
      return errorResponse(res, error.message);
    }
  }

  async verifyBankAccount(req, res) {
    try {
      const result = await userService.verifyBankAccount(req.user.id, req.body);
      return res.status(200).json({
        status: "processing",
        message: "Verification usually takes 2-4 seconds"
      });
    } catch (error) {
      return errorResponse(res, error.message, 400, 'BANK_VERIFICATION_FAILED');
    }
  }

  async getSettings(req, res) {
    try {
      const settings = await userService.getSettings(req.user.id);
      
      // Shape response with BOTH flat keys and nested trading_preferences key
      const responseData = {
        ...settings,
        trading_preferences: settings
      };
      
      return successResponse(res, 'Settings fetched successfully', responseData);
    } catch (error) {
      return errorResponse(res, error.message);
    }
  }

  async updateSettings(req, res) {
    try {
      // Accept both: { trading_preferences: {...} } or flat { email_notifications: true, ... }
      let preferences = req.body;
      if (req.body.trading_preferences && typeof req.body.trading_preferences === 'object') {
        preferences = req.body.trading_preferences;
      }
      
      if (!preferences || typeof preferences !== 'object' || Array.isArray(preferences)) {
        return errorResponse(res, 'Invalid settings payload', 400);
      }
      
      const settings = await userService.updateSettings(req.user.id, preferences);
      
      // Shape response with BOTH flat keys and nested trading_preferences key
      const responseData = {
        ...settings,
        trading_preferences: settings
      };
      
      return successResponse(res, 'Settings updated successfully', responseData);
    } catch (error) {
      console.error('SETTINGS UPDATE CRASH:', error);
      return errorResponse(res, error.message);
    }
  }

  async getKYCStatus(req, res) {
    try {
      const result = await userService.getKYCStatus(req.user.id);
      return successResponse(res, 'KYC status retrieved successfully', result);
    } catch (error) {
      return errorResponse(res, error.message);
    }
  }

  async submitIdentityDocs(req, res) {
    try {
      const result = await userService.submitIdentityDocs(req.user.id, req.body);
      return successResponse(res, 'Identity documents submitted successfully', result);
    } catch (error) {
      return errorResponse(res, error.message);
    }
  }

  async submitSelfie(req, res) {
    try {
      if (!req.body.selfie_url) {
        return errorResponse(res, 'Selfie URL is required', 400);
      }
      const result = await userService.submitSelfie(req.user.id, req.body);
      return successResponse(res, 'Selfie uploaded and matched successfully', result);
    } catch (error) {
      return errorResponse(res, error.message);
    }
  }

  async completeOnboarding(req, res) {
    try {
      const result = await userService.completeOnboarding(req.user.id, req.body);
      return successResponse(res, 'Onboarding completed and profile configured successfully', result);
    } catch (error) {
      return errorResponse(res, error.message);
    }
  }

  async updateTradingProfile(req, res) {
    try {
      const result = await userService.updateTradingProfile(req.user.id, req.body);
      return successResponse(res, 'Trading profile updated successfully', result);
    } catch (error) {
      return errorResponse(res, error.message);
    }
  }

  async updateAddress(req, res) {
    try {
      const result = await userService.updateAddress(req.user.id, req.body.address);
      return successResponse(res, 'Address details updated successfully', result);
    } catch (error) {
      return errorResponse(res, error.message);
    }
  }

  async getExpertSuggestions(req, res) {
    try {
      const topic = req.query.topic || 'portfolio';
      const suggestions = await aiService.getExpertSuggestions(req.user.id, topic);
      return successResponse(res, 'Expert AI suggestions retrieved successfully', suggestions);
    } catch (error) {
      return errorResponse(res, error.message);
    }
  }
}

module.exports = new UserController();
