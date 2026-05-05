 const express = require('express');
const Payment = require('../models/Payment');
const Order = require('../models/Order');
const { protect } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

router.post('/', async (req, res) => {
  try {
    const { orderId, amount, method, transactionRef, notes } = req.body;

    if (!orderId || !amount || !method) {
      return res.status(400).json({ message: 'Order ID, amount, and payment method are required' });
    }

    const order = await Order.findOne({ orderId });
    if (!order) {
      return res.status(404).json({ message: `Order ${orderId} not found` });
    }

    const payment = await Payment.create({
      orderId, amount, method, transactionRef, notes,
      status: 'PAID',
      paidAt: new Date(),
      createdBy: req.user._id
    });

    res.status(201).json(payment);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const { orderId, status, method } = req.query;
    let filter = {};
    if (orderId) filter.orderId = { $regex: orderId, $options: 'i' };
    if (status) filter.status = status;
    if (method) filter.method = method;
    const payments = await Payment.find(filter).sort({ createdAt: -1 });
    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/stats', async (req, res) => {
  try {
    const payments = await Payment.find();
    const totalCollected = payments.filter(p => p.status === 'PAID').reduce((sum, p) => sum + p.amount, 0);
    const byMethod = { CASH: 0, UPI: 0, CARD: 0, NETBANKING: 0 };
    payments.filter(p => p.status === 'PAID').forEach(p => {
      if (byMethod[p.method] !== undefined) byMethod[p.method] += p.amount;
    });
    res.json({ totalCollected, totalPayments: payments.length, paidCount: payments.filter(p => p.status === 'PAID').length, byMethod });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/:orderId', async (req, res) => {
  try {
    const payments = await Payment.find({ orderId: req.params.orderId });
    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['PENDING', 'PAID', 'FAILED', 'REFUNDED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status. Must be: ' + validStatuses.join(', ') });
    }
    const payment = await Payment.findByIdAndUpdate(
      req.params.id,
      { status, ...(status === 'PAID' ? { paidAt: new Date() } : {}) },
      { new: true }
    );
    if (!payment) return res.status(404).json({ message: 'Payment not found' });
    res.json(payment);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
