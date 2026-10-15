const express = require('express');
const { User, Doctor, Appointment } = require('../models');
const { clean, wrap, fail, auth } = require('../middleware/auth');
const router = express.Router();

// GET /api/me  -> current logged-in user
router.get('/me', auth(), wrap(async (req, res) => {
  res.json(clean(await User.findById(req.user.id)));
}));

// GET /api/doctors?specialization=Cardiology
router.get('/doctors', auth(), wrap(async (req, res) => {
  const filter = req.query.specialization ? { specialization: req.query.specialization } : {};
  res.json(await Doctor.find(filter).sort('name'));
}));

// POST /api/doctors  (admin only)
router.post('/doctors', auth('admin'), wrap(async (req, res) => {
  const { name, specialization } = req.body;
  if (!name || !specialization) throw fail(400, 'Name and specialization are required');
  res.status(201).json(await Doctor.create(req.body));
}));

// DELETE /api/doctors/:id  (admin only)
router.delete('/doctors/:id', auth('admin'), wrap(async (req, res) => {
  await Doctor.findByIdAndDelete(req.params.id);
  await Appointment.deleteMany({ doctor: req.params.id, status: { $in: ['Booked', 'Confirmed'] } });
  res.json({ deleted: true });
}));

// GET /api/doctors/:id/slots?date=YYYY-MM-DD  -> free time slots for the day
router.get('/doctors/:id/slots', auth(), wrap(async (req, res) => {
  const doctor = await Doctor.findById(req.params.id);
  if (!doctor) throw fail(404, 'Doctor not found');
  const taken = await Appointment.find({
    doctor: doctor._id,
    date: req.query.date,
    status: { $ne: 'Cancelled' }
  }).distinct('timeSlot');
  res.json(doctor.timeSlots.filter((t) => !taken.includes(t)));
}));

module.exports = router;
