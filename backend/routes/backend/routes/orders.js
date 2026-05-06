const express = require('express');
const Order = require('../models/Order');
const { protect } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

router.post('/', async (req, res) => {
  try {
    const { customerName, phoneNumber, garments } = req.body;
    if (!customerName || !phoneNumber || !garments || garments.length === 0) {
      return res.status(400).json({ message: 'Customer name, phone, and at least one garment are required' });
    }
    const totalBill = garments.reduce((sum, g) => sum + (g.quantity * g.pricePerItem), 0);
    const order = await Order.create({ customerName, phoneNumber, garments, totalBill, createdBy: req.user._id });
    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const { status, customerName, phoneNumber, garmentType } = req.query;
    let filter = {};
    if (status) filter.status = status;
    if (customerName) filter.customerName = { $regex: customerName, $options: 'i' };
    if (phoneNumber) filter.phoneNumber = { $regex: phoneNumber };
    if (garmentType) filter['garments.type'] = { $regex: garmentType, $options: 'i' };
    const orders = await Order.find(filter).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/dashboard/stats', async (req, res) => {
  try {
    const orders = await Order.find();
    const totalRevenue = orders.reduce((sum, o) => sum + o.totalBill, 0);
    const ordersByStatus = {
      RECEIVED: orders.filter(o => o.status === 'RECEIVED').length,
      PROCESSING: orders.filter(o => o.status === 'PROCESSING').length,
      READY: orders.filter(o => o.status === 'READY').length,
      DELIVERED: orders.filter(o => o.status === 'DELIVERED').length
    };
    res.json({ totalOrders: orders.length, totalRevenue, ordersByStatus });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const order = await Order.findOne({ orderId: req.params.id });
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['RECEIVED', 'PROCESSING', 'READY', 'DELIVERED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status. Must be: ' + validStatuses.join(', ') });
    }
    const order = await Order.findOneAndUpdate({ orderId: req.params.id }, { status }, { new: true });
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const order = await Order.findOneAndDelete({ orderId: req.params.id });
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json({ message: 'Order deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
