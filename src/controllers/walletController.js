const walletService = require('../services/walletService');

class WalletController {
  async getBalance(req, res) {
    const wallet = await walletService.getBalance(req.user.id);
    res.status(200).json({ success: true, data: wallet });
  }

  async addMoney(req, res) {
    const { amount, razorpayData } = req.body;
    const result = await walletService.addMoney(req.user.id, amount, razorpayData);
    res.status(200).json({ success: true, data: result });
  }

  async withdraw(req, res) {
    const { amount } = req.body;
    const result = await walletService.withdrawMoney(req.user.id, amount);
    res.status(200).json({ success: true, data: result });
  }

  async getTransactions(req, res) {
    const transactions = await walletService.getTransactionHistory(req.user.id);
    res.status(200).json({ success: true, data: transactions });
  }
}

module.exports = new WalletController();
