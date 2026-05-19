const { User, KYCDocument, BankAccount } = require('../models');

class UserController {
  async getProfile(req, res) {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password', 'otp'] }
    });
    res.status(200).json({ success: true, data: user });
  }

  async updateProfile(req, res) {
    const { name, phone, trading_preferences } = req.body;
    const user = await User.findByPk(req.user.id);
    
    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (trading_preferences) user.trading_preferences = trading_preferences;
    
    await user.save();
    res.status(200).json({ success: true, data: user });
  }

  async uploadKYC(req, res) {
    const { document_type, document_number, document_url } = req.body;
    const kyc = await KYCDocument.create({
      user_id: req.user.id,
      document_type,
      document_number,
      document_url,
      status: 'pending'
    });
    res.status(201).json({ success: true, data: kyc });
  }

  async updateBankDetails(req, res) {
    const { account_number, ifsc_code, bank_name, account_holder_name } = req.body;
    let bank = await BankAccount.findOne({ where: { user_id: req.user.id } });
    
    if (bank) {
      bank.account_number = account_number;
      bank.ifsc_code = ifsc_code;
      bank.bank_name = bank_name;
      bank.account_holder_name = account_holder_name;
      await bank.save();
    } else {
      bank = await BankAccount.create({
        user_id: req.user.id,
        account_number,
        ifsc_code,
        bank_name,
        account_holder_name
      });
    }
    
    res.status(200).json({ success: true, data: bank });
  }
}

module.exports = new UserController();
