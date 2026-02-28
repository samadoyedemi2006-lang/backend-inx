const mongoose = require('mongoose');

const withdrawalSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userName: String,
  amount: {
    type: Number,
    required: true
  },
  bankName: {
    type: String,
    required: true
  },
  accountNumber: {
    type: String,
    required: true
  },
  accountName: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'paid'],
    default: 'pending'
  },
  paidAt: Date,
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Withdrawal', withdrawalSchema);