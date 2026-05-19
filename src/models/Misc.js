const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Notification = sequelize.define('Notification', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  type: {
    type: DataTypes.STRING,
    allowNull: true
  },
  is_read: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  tableName: 'notifications'
});

const BankAccount = sequelize.define('BankAccount', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  account_number: {
    type: DataTypes.STRING,
    allowNull: false
  },
  ifsc_code: {
    type: DataTypes.STRING,
    allowNull: false
  },
  bank_name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  account_holder_name: {
    type: DataTypes.STRING,
    allowNull: false
  }
}, {
  tableName: 'bank_accounts'
});

const KYCDocument = sequelize.define('KYCDocument', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  document_type: {
    type: DataTypes.ENUM('pan', 'aadhaar', 'voter_id'),
    allowNull: false
  },
  document_number: {
    type: DataTypes.STRING,
    allowNull: false
  },
  document_url: {
    type: DataTypes.STRING,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('PENDING', 'UNDER_REVIEW', 'VERIFIED', 'REJECTED'),
    defaultValue: 'PENDING'
  }
}, {
  tableName: 'kyc_documents'
});

const RefreshToken = sequelize.define('RefreshToken', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  token: {
    type: DataTypes.STRING,
    allowNull: false
  },
  device_id: {
    type: DataTypes.STRING,
    allowNull: true
  },
  expires_at: {
    type: DataTypes.DATE,
    allowNull: false
  }
}, {
  tableName: 'refresh_tokens'
});

module.exports = { Notification, BankAccount, KYCDocument, RefreshToken };
