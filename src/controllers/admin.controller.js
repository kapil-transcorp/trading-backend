const adminService = require('../services/admin.service');
const { successResponse, errorResponse } = require('../utils/response');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Hardcoded super-admin credentials as fallback (works even without DB)
const SUPER_ADMIN = {
  id: 'super-admin-001',
  email: 'admin@balitrading.com',
  password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // "password"
  name: 'Super Administrator',
  role: 'admin'
};

class AdminController {
  async login(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return errorResponse(res, 'Email and password are required', 400);
      }

      let adminUser = null;

      // First try to find admin in DB
      try {
        const { AdminUser } = require('../models');
        const dbAdmin = await AdminUser.findOne({ where: { email } });
        if (dbAdmin) {
          const isMatch = await dbAdmin.comparePassword(password);
          if (!isMatch) {
            return errorResponse(res, 'Invalid credentials', 401);
          }
          adminUser = { id: dbAdmin.id, email: dbAdmin.email, name: dbAdmin.name, role: 'admin' };
        }
      } catch (dbErr) {
        // DB not available — fall through to hardcoded check
      }

      // Fallback: check hardcoded super-admin
      if (!adminUser) {
        if (email !== SUPER_ADMIN.email) {
          return errorResponse(res, 'Invalid credentials', 401);
        }
        const isMatch = await bcrypt.compare(password, SUPER_ADMIN.password);
        if (!isMatch) {
          return errorResponse(res, 'Invalid credentials', 401);
        }
        adminUser = SUPER_ADMIN;
      }

      // Sign a real JWT that the protect middleware can verify
      const token = jwt.sign(
        { id: adminUser.id, email: adminUser.email, role: 'admin' },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_ACCESS_EXPIRATION || '24h' }
      );

      return successResponse(res, 'Admin logged in successfully', { token, admin: { name: adminUser.name, email: adminUser.email } });
    } catch (error) {
      return errorResponse(res, error.message, 500);
    }
  }

  async dashboard(req, res) {
    try {
      const stats = await adminService.getDashboardStats();
      return successResponse(res, 'Dashboard stats fetched', stats);
    } catch (error) {
      return errorResponse(res, error.message);
    }
  }

  async users(req, res) {
    try {
      const users = await adminService.getUsers();
      return successResponse(res, 'Users fetched', users);
    } catch (error) {
      return errorResponse(res, error.message);
    }
  }

  async userDetails(req, res) {
    try {
      const user = await adminService.getUserDetails(req.params.id);
      return successResponse(res, 'User details fetched', user);
    } catch (error) {
      return errorResponse(res, error.message);
    }
  }

  async transactions(req, res) {
    try {
      const txs = await adminService.getWalletTransactions();
      return successResponse(res, 'Transactions fetched', txs);
    } catch (error) {
      return errorResponse(res, error.message);
    }
  }

  async automations(req, res) {
    try {
      const list = await adminService.getAutomations();
      return successResponse(res, 'Automations fetched', list);
    } catch (error) {
      return errorResponse(res, error.message);
    }
  }

  async trades(req, res) {
    try {
      const trades = await adminService.getTrades();
      return successResponse(res, 'Trades fetched', trades);
    } catch (error) {
      return errorResponse(res, error.message);
    }
  }

  async revenue(req, res) {
    try {
      const revenue = await adminService.getRevenueAnalytics();
      return successResponse(res, 'Revenue analytics fetched', revenue);
    } catch (error) {
      return errorResponse(res, error.message);
    }
  }

  async kycPending(req, res) {
    try {
      const users = await adminService.getKycPendingUsers();
      return successResponse(res, 'Pending KYC users fetched', users);
    } catch (error) {
      return errorResponse(res, error.message);
    }
  }

  async approveKyc(req, res) {
    try {
      const user = await adminService.approveKyc(req.params.id, req.body.status);
      return successResponse(res, `KYC status updated to ${req.body.status}`, user);
    } catch (error) {
      return errorResponse(res, error.message);
    }
  }

  async updateUserStatus(req, res) {
    try {
      const user = await adminService.updateUserStatus(req.params.id, req.body.is_active);
      return successResponse(res, `User status updated to ${req.body.is_active ? 'active' : 'inactive'}`, user);
    } catch (error) {
      return errorResponse(res, error.message);
    }
  }

  async broadcast(req, res) {
    try {
      const result = await adminService.broadcastNotification(req.body);
      return successResponse(res, 'Broadcast sent successfully', result);
    } catch (error) {
      return errorResponse(res, error.message);
    }
  }
}

module.exports = new AdminController();
