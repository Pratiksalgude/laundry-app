const mongoose = require('mongoose');

const pickupSchema = new mongoose.Schema({
  pickupId: { type: String, unique: true },
  customerName: {
    type: String,
    required: [true, 'Customer name is required'],
    trim: true
  },
  phoneNumber: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true
  },
  address: {
    type: String,
    required: [true, 'Pickup address is required'],
    trim: true
  },
  scheduledDate: {
    type: String,
    required: [true, 'Scheduled date is required']
  },
  scheduledSlot: {
    type: String,
    enum: ['MORNING (9AM–12PM)', 'AFTERNOON (12PM–4PM)', 'EVENING (4PM–8PM)'],
    required: [true, 'Time slot is required']
  },
  status: {
    type: String,
    enum: ['SCHEDULED', 'PICKED_UP', 'CANCELLED'],
    default: 'SCHEDULED'
  },
  notes: { type: String, trim: true },
  linkedOrderId: { type: String, ref: 'Order' },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

pickupSchema.pre('save', function (next) {
  if (!this.pickupId) {
    this.pickupId = 'PKP-' + Math.random().toString(36).slice(2, 8).toUpperCase();
  }
  next();
});

module.exports = mongoose.model('Pickup', pickupSchema);
