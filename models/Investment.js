const mongoose = require('mongoose');

const investmentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  planId: {
    type: String,
    required: true
  },
  planName: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  dailyROI: {
    type: Number,
    default: 15
  },
  roiDaysCompleted: {
    type: Number,
    default: 0
  },
  lastRoiAt: {
    type: Date
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'completed'],
    default: 'pending'
  },
  paymentConfirmed: {
    type: Boolean,
    default: false
  },
  confirmedAt: Date,
  completedAt: Date,
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Investment', investmentSchema);