const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  reference: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed'],
    default: 'pending'
  },
  confirmedAt: Date,
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Payment', paymentSchema);