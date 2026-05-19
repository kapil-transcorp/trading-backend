const { User, BankAccount, KYCDocument } = require('../models');
const { encrypt } = require('../utils/encryption');
const { uploadToCloudinary, deleteFromCloudinary, extractPublicId } = require('../utils/cloudinary');



class UserService {
  async getProfile(userId) {
    const user = await User.findByPk(userId, {
      attributes: { exclude: ['password', 'otp', 'otp_expires_at'] }
    });
    if (!user) return null;

    const plainUser = user.toJSON();
    // Inject all standard naming aliases for 100% frontend UI compatibility
    plainUser.avatar_url = user.selfie_url;
    plainUser.avatar = user.selfie_url;
    plainUser.profile_image = user.selfie_url;

    return plainUser;
  }

  async updateProfile(userId, updateData) {
    const user = await User.findByPk(userId);
    if (!user) throw new Error('User not found');
    await user.update(updateData);
    return this.getProfile(userId);
  }

  async uploadAvatar(userId, fileBuffer) {
    const user = await User.findByPk(userId);
    if (!user) throw new Error('User not found');

    // Delete old avatar from Cloudinary if exists
    if (user.selfie_url) {
      const oldPublicId = extractPublicId(user.selfie_url);
      if (oldPublicId) {
        await deleteFromCloudinary(oldPublicId).catch(() => {}); // Non-blocking
      }
    }

    // Upload new avatar — stored in trading/avatars/<userId>
    const result = await uploadToCloudinary(fileBuffer, 'trading/avatars', `avatar-${userId}`);

    // Save Cloudinary secure URL to user record
    await user.update({ selfie_url: result.secure_url });

    return {
      avatar_url: result.secure_url,
      public_id: result.public_id
    };
  }

  async uploadKYC(userId, kycData) {
    const doc = await KYCDocument.create({
      user_id: userId,
      ...kycData
    });
    
    // Update user status
    await User.update({ kyc_status: 'UNDER_REVIEW' }, { where: { id: userId } });
    
    return doc;
  }

  async addBankAccount(userId, bankData) {
    if (bankData.account_number) {
      bankData.account_number = encrypt(bankData.account_number);
    }
    return await BankAccount.create({
      user_id: userId,
      ...bankData
    });
  }

  async getBankAccount(userId) {
    const { decrypt } = require('../utils/encryption');
    const bankAccount = await BankAccount.findOne({ where: { user_id: userId } });
    if (!bankAccount) return null;
    
    let decryptedNumber = '';
    try {
      decryptedNumber = decrypt(bankAccount.account_number);
    } catch (e) {
      decryptedNumber = bankAccount.account_number;
    }

    const maskedNumber = decryptedNumber && decryptedNumber.length > 4
      ? '*'.repeat(decryptedNumber.length - 4) + decryptedNumber.slice(-4)
      : decryptedNumber;

    return {
      id: bankAccount.id,
      bank_name: bankAccount.bank_name,
      ifsc_code: bankAccount.ifsc_code,
      account_holder_name: bankAccount.account_holder_name,
      account_number: decryptedNumber,
      masked_account_number: maskedNumber,
      is_verified: bankAccount.is_verified,
      created_at: bankAccount.created_at,
      updated_at: bankAccount.updated_at
    };
  }

  async verifyBankAccount(userId, bankData) {
    // Penny Drop Logic simulation
    // 1. Backend initiates a ₹1.00 deposit to user's account via payment gateway
    // 2. If successful, bank status = VERIFIED
    
    const bankAccount = await BankAccount.findOne({ where: { user_id: userId } });
    if (bankAccount) {
      bankAccount.is_verified = true; // Assuming there is an is_verified or status field
      await bankAccount.save();
    }
    
    // In a real scenario, this would trigger an async job or webhook
    return { status: 'processing' };
  }

  async getSettings(userId) {
    const user = await User.findByPk(userId, {
      attributes: ['trading_preferences']
    });
    if (!user) return null;

    let parsedSettings = null;
    if (user.trading_preferences) {
      if (typeof user.trading_preferences === 'string') {
        try {
          parsedSettings = JSON.parse(user.trading_preferences);
        } catch (e) {
          parsedSettings = null;
        }
      } else if (typeof user.trading_preferences === 'object' && !Array.isArray(user.trading_preferences)) {
        parsedSettings = user.trading_preferences;
      }
    }

    // Return robust defaults if settings are uninitialized
    if (!parsedSettings || Object.keys(parsedSettings).length === 0) {
      return {
        email_notifications: true,
        push_notifications: true,
        sms_notifications: false,
        trade_execution_alerts: true,
        news_market_alerts: true,
        ai_agent_enabled: true,
        risk_appetite: 'medium',
        max_concurrent_trades: 5,
        default_trade_amount: 2000,
        two_factor_auth: false,
        biometric_login: false,
        theme: 'dark',
        language: 'en',
        currency: 'INR'
      };
    }
    return parsedSettings;
  }

  async updateSettings(userId, settings) {
    const user = await User.findByPk(userId);
    if (!user) throw new Error('User not found');

    let existing = {};
    if (user.trading_preferences) {
      if (typeof user.trading_preferences === 'string') {
        try {
          existing = JSON.parse(user.trading_preferences);
        } catch (e) {
          existing = {};
        }
      } else if (typeof user.trading_preferences === 'object' && !Array.isArray(user.trading_preferences)) {
        existing = user.trading_preferences;
      }
    }

    let incoming = {};
    if (settings) {
      if (typeof settings === 'string') {
        try {
          incoming = JSON.parse(settings);
        } catch (e) {
          incoming = {};
        }
      } else if (typeof settings === 'object' && !Array.isArray(settings)) {
        incoming = settings;
      }
    }

    // Merge existing settings with new updates safely
    const updated = {
      ...existing,
      ...incoming
    };

    await user.update({ trading_preferences: updated });
    return updated;
  }

  async getKYCStatus(userId) {
    const user = await User.findByPk(userId);
    
    const panDoc = await KYCDocument.findOne({ where: { user_id: userId, document_type: 'pan' } });
    const aadhaarDoc = await KYCDocument.findOne({ where: { user_id: userId, document_type: 'aadhaar' } });
    const bankAcc = await BankAccount.findOne({ where: { user_id: userId } });

    return {
      kyc_status: user.kyc_status,
      pan_uploaded: !!panDoc,
      aadhaar_uploaded: !!aadhaarDoc,
      selfie_uploaded: !!user.selfie_url,
      bank_verified: bankAcc ? !!bankAcc.is_verified : false,
      trading_profile_completed: !!(user.occupation && user.trading_experience && user.annual_income),
      nominee_provided: !!user.nominee,
      address_provided: !!user.address,
      pan_details: panDoc ? {
        document_number: user.pan_number,
        status: panDoc.status,
        document_url: panDoc.document_url
      } : null,
      aadhaar_details: aadhaarDoc ? {
        document_number: user.aadhaar_number,
        status: aadhaarDoc.status,
        document_url: aadhaarDoc.document_url
      } : null,
      selfie_url: user.selfie_url || null,
      address_details: user.address || null,
      nominee_details: user.nominee || null
    };
  }

  async submitIdentityDocs(userId, data) {
    const user = await User.findByPk(userId);
    
    if (data.pan_number) user.pan_number = data.pan_number;
    if (data.aadhaar_number) user.aadhaar_number = data.aadhaar_number;
    await user.save();

    if (data.pan_url) {
      await KYCDocument.destroy({ where: { user_id: userId, document_type: 'pan' } });
      await KYCDocument.create({
        user_id: userId,
        document_type: 'pan',
        document_number: user.pan_number,
        document_url: data.pan_url,
        status: 'UNDER_REVIEW'
      });
    }

    if (data.aadhaar_url) {
      await KYCDocument.destroy({ where: { user_id: userId, document_type: 'aadhaar' } });
      await KYCDocument.create({
        user_id: userId,
        document_type: 'aadhaar',
        document_number: user.aadhaar_number,
        document_url: data.aadhaar_url,
        status: 'UNDER_REVIEW'
      });
    }

    user.kyc_status = 'UNDER_REVIEW';
    await user.save();

    return await this.getKYCStatus(userId);
  }

  async submitSelfie(userId, data) {
    const user = await User.findByPk(userId);
    user.selfie_url = data.selfie_url;
    
    // Auto-verify user KYC upon selfie submission for a premium, instant experience!
    user.kyc_status = 'VERIFIED';
    await user.save();

    // Auto-verify linked documents
    await KYCDocument.update({ status: 'VERIFIED' }, { where: { user_id: userId } });

    return await this.getKYCStatus(userId);
  }

  async completeOnboarding(userId, onboardingData) {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error('User not found');
    }

    await user.update({
      occupation: onboardingData.occupation,
      annual_income: onboardingData.annual_income,
      trading_experience: onboardingData.trading_experience,
      nominee: onboardingData.nominee !== undefined ? onboardingData.nominee : user.nominee,
      address: onboardingData.address !== undefined ? onboardingData.address : user.address
    });

    return await this.getProfile(userId);
  }

  async updateTradingProfile(userId, data) {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error('User not found');
    }
    await user.update({
      occupation: data.occupation !== undefined ? data.occupation : user.occupation,
      trading_experience: data.trading_experience !== undefined ? data.trading_experience : user.trading_experience,
      annual_income: data.annual_income !== undefined ? data.annual_income : user.annual_income,
      nominee: data.nominee !== undefined ? data.nominee : user.nominee
    });
    return await this.getProfile(userId);
  }

  async updateAddress(userId, address) {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error('User not found');
    }
    await user.update({ address });
    return await this.getProfile(userId);
  }
}

module.exports = new UserService();
