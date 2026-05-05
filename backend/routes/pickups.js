const express = require('express');
const Pickup = require('../models/Pickup');
const { protect } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

router.post('/', async (req, res) => {
  try {
    const { customerName, phoneNumber, address, scheduledDate, scheduledSlot, notes, linkedOrderId } = req.body;

    if (!customerName || !phoneNumber || !address || !scheduledDate || !scheduledSlot) {
      return res.status(400).json({ message: 'Name, phone, address, date, and time slot are required' });
    }

    const today = new Date().toISOString().split('T')[0];
    if (scheduledDate < today) {
      return res.status(400).json({ message: 'Pickup date must be today or in the future' });
    }

    const pickup = await Pickup.create({
      customerName, phoneNumber, address, scheduledDate,
      scheduledSlot, notes, linkedOrderId,
      createdBy: req.user._id
    });

    res.status(201).json(pickup);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const { status, date, customerName } = req.query;
    let filter = {};
    if (status) filter.status = status;
    if (date) filter.scheduledDate = date;
    if (customerName) filter.customerName = { $regex: customerName, $options: 'i' };
    const pickups = await Pickup.find(filter).sort({ scheduledDate: 1, createdAt: -1 });
    res.json(pickups);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/today', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const pickups = await Pickup.find({ scheduledDate: today, status: 'SCHEDULED' }).sort({ scheduledSlot: 1 });
    res.json(pickups);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const pickup = await Pickup.findOne({ pickupId: req.params.id });
    if (!pickup) return res.status(404).json({ message: 'Pickup not found' });
    res.json(pickup);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['SCHEDULED', 'PICKED_UP', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status. Must be: ' + validStatuses.join(', ') });
    }
    const pickup = await Pickup.findOneAndUpdate(
      { pickupId: req.params.id },
      { status },
      { new: true }
    );
    if (!pickup) return res.status(404).json({ message: 'Pickup not found' });
    res.json(pickup);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const pickup = await Pickup.findOneAndDelete({ pickupId: req.params.id });
    if (!pickup) return res.status(404).json({ message: 'Pickup not found' });
    res.json({ message: 'Pickup cancelled successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
