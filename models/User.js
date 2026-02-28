const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  referralCode: {
    type: String,
    required: true,
    unique: true
  },
  referredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  referralBonusPaid: {
    type: Boolean,
    default: false
  },
  walletBalance: {
    type: Number,
    default: 700  // welcome bonus
  },
  withdrawableBalance: {
    type: Number,
    default: 0
  },
  totalInvested: {
    type: Number,
    default: 0
  },
  referralEarnings: {
    type: Number,
    default: 0
  },
  activeInvestments: {
    type: Number,
    default: 0
  },
  isBlocked: {
    type: Boolean,
    default: false
  },
  isAdmin: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('User', userSchema);