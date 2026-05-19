const { Wallet, WalletTransaction, User } = require('../models');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const { Op } = require('sequelize');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_123',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'secret'
});

class WalletService {
  async addMoney(userId, amount) {
    const wallet = await Wallet.findOne({ where: { user_id: userId } });
    
    const options = {
      amount: amount * 100, // in paise
      currency: 'INR',
      receipt: `receipt_${Date.now()}`
    };

    const order = await razorpay.orders.create(options);

    await WalletTransaction.create({
      wallet_id: wallet.id,
      amount,
      type: 'deposit',
      status: 'pending',
      before_balance: wallet.balance,
      after_balance: wallet.balance, // pending, so not added yet
      razorpay_order_id: order.id,
      description: 'Wallet deposit via Razorpay'
    });

    return order;
  }

  async verifyPayment(userId, paymentData) {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = paymentData;
    
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || 'secret')
      .update(body.toString())
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      throw new Error('Invalid signature');
    }

    const transaction = await WalletTransaction.findOne({
      where: { razorpay_order_id }
    });

    if (!transaction) {
      throw new Error('Transaction not found');
    }

    transaction.status = 'completed';
    transaction.razorpay_payment_id = razorpay_payment_id;
    await transaction.save();

    const wallet = await Wallet.findByPk(transaction.wallet_id);
    const beforeBalance = wallet.balance;
    wallet.balance = parseFloat(wallet.balance) + parseFloat(transaction.amount);
    await wallet.save();
    
    transaction.before_balance = beforeBalance;
    transaction.after_balance = wallet.balance;
    await transaction.save();

    return wallet;
  }

  async checkFraud(userId) {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const failedAttempts = await WalletTransaction.count({
      where: {
        type: 'withdrawal',
        status: 'failed',
        created_at: { [Op.gt]: oneHourAgo }
      },
      include: [{
        model: Wallet,
        where: { user_id: userId }
      }]
    });

    if (failedAttempts >= 5) {
      const error = new Error('Too many failed withdrawal attempts. Account flagged for review.');
      error.code = 'FRAUD_DETECTED';
      throw error;
    }
  }

  async withdrawMoney(userId, amount, bankAccountId) {
    await this.checkFraud(userId);
    
    const user = await User.findByPk(userId);
    if (user.kyc_status !== 'VERIFIED') {
      throw new Error('Account must be VERIFIED to withdraw');
    }

    const wallet = await Wallet.findOne({ where: { user_id: userId } });
    
    const withdrawable = parseFloat(wallet.balance) - parseFloat(wallet.locked_margin || 0);
    if (withdrawable < amount) {
      throw new Error('Insufficient withdrawable balance');
    }

    const beforeBalance = wallet.balance;
    wallet.balance = parseFloat(wallet.balance) - parseFloat(amount);
    await wallet.save();

    return await WalletTransaction.create({
      wallet_id: wallet.id,
      amount,
      type: 'withdrawal',
      status: 'completed', // In real app, would be pending until bank transfer
      before_balance: beforeBalance,
      after_balance: wallet.balance,
      description: `Withdrawal to bank account ${bankAccountId}`
    });
  }

  async getBalance(userId) {
    const wallet = await Wallet.findOne({ where: { user_id: userId } });
    const total_balance = parseFloat(wallet.balance);
    const locked_margin = parseFloat(wallet.locked_margin || 0);
    const withdrawable_balance = total_balance - locked_margin;
    
    return {
      total_balance,
      locked_margin,
      withdrawable_balance,
      currency: wallet.currency || 'INR'
    };
  }

  async getHistory(userId) {
    const wallet = await Wallet.findOne({ where: { user_id: userId } });
    return await WalletTransaction.findAll({
      where: { wallet_id: wallet.id },
      order: [['created_at', 'DESC']]
    });
  }

  async adminDeposit(targetIdentifier, amount) {
    // 1. Find User by ID (UUID) or by matching the virtual userId suffix (e.g., 2BA3 from 202605162BA3)
    let user;
    
    // Check if it looks like the virtual readable ID (YYYYMMDD + 4 chars)
    if (targetIdentifier.length >= 12 && /^\d{8}[A-Z0-9]{4}$/.test(targetIdentifier)) {
      const uuidPart = targetIdentifier.substring(8).toLowerCase(); // Extract the 4 chars (e.g., 2ba3)
      user = await User.findOne({
        where: {
          id: { [Op.like]: `${uuidPart}%` }
        }
      });
    } else {
      // Otherwise, try finding by direct UUID
      user = await User.findByPk(targetIdentifier);
    }

    if (!user) throw new Error('User not found with provided ID or Virtual ID');

    const wallet = await Wallet.findOne({ where: { user_id: user.id } });
    if (!wallet) throw new Error('Wallet not found for this user');

    const beforeBalance = wallet.balance;
    wallet.balance = parseFloat(wallet.balance) + parseFloat(amount);
    await wallet.save();

    await WalletTransaction.create({
      wallet_id: wallet.id,
      amount,
      type: 'deposit',
      status: 'completed',
      before_balance: beforeBalance,
      after_balance: wallet.balance,
      description: 'Admin Manual Deposit'
    });

    return {
      user_id: user.id,
      readable_id: user.userId,
      new_balance: wallet.balance
    };
  }
}

module.exports = new WalletService();
