const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  orderId: {
    type: String,
    required: [true, 'Order ID is required'],
    ref: 'Order'
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: 0
  },
  method: {
    type: String,
    enum: ['CASH', 'UPI', 'CARD', 'NETBANKING'],
    required: [true, 'Payment method is required']
  },
  status: {
    type: String,
    enum: ['PENDING', 'PAID', 'FAILED', 'REFUNDED'],
    default: 'PENDING'
  },
  transactionRef: { type: String, trim: true },
  notes: { type: String, trim: true },
  paidAt: { type: Date },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);
