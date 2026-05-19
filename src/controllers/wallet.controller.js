const walletService = require('../services/wallet.service');
const { successResponse, errorResponse } = require('../utils/response');

class WalletController {
  async addMoney(req, res) {
    try {
      const order = await walletService.addMoney(req.user.id, req.body.amount);
      return successResponse(res, 'Order created successfully', order);
    } catch (error) {
      return errorResponse(res, error.message, 400, error.code || 'DEPOSIT_FAILED');
    }
  }

  async verifyPayment(req, res) {
    try {
      const wallet = await walletService.verifyPayment(req.user.id, req.body);
      return successResponse(res, 'Payment verified and wallet updated', wallet);
    } catch (error) {
      return errorResponse(res, error.message, 400, error.code || 'PAYMENT_VERIFICATION_FAILED');
    }
  }

  async withdrawMoney(req, res) {
    try {
      const transaction = await walletService.withdrawMoney(req.user.id, req.body.amount, req.body.bank_account_id);
      return successResponse(res, 'Withdrawal request processed', transaction);
    } catch (error) {
      return errorResponse(res, error.message, 400, error.code || 'WITHDRAWAL_FAILED');
    }
  }

  async getBalance(req, res) {
    try {
      const wallet = await walletService.getBalance(req.user.id);
      return res.status(200).json(wallet);
    } catch (error) {
      return errorResponse(res, error.message, 400, error.code || 'FETCH_BALANCE_FAILED');
    }
  }

  async getHistory(req, res) {
    try {
      const history = await walletService.getHistory(req.user.id);
      return successResponse(res, 'Wallet history fetched', history);
    } catch (error) {
      return errorResponse(res, error.message);
    }
  }

  adminDeposit = async (req, res) => {
    try {
      const { userIdentifier, amount } = req.body;
      const result = await walletService.adminDeposit(userIdentifier, amount);
      return successResponse(res, 'Admin deposit successful', result);
    } catch (error) {
      return errorResponse(res, error.message);
    }
  }
}

module.exports = new WalletController();
