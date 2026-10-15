const express = require('express');
const { Doctor, Appointment, User } = require('../models');
const { wrap, fail, auth } = require('../middleware/auth');
const router = express.Router();

// POST /api/appointments  -> book a new appointment
router.post('/appointments', auth('patient'), wrap(async (req, res) => {
  const { doctorId, date, timeSlot, reason } = req.body;
  if (!doctorId || !date || !timeSlot) throw fail(400, 'Doctor, date and time slot are required');
  if (new Date(date) < new Date(new Date().toDateString())) throw fail(400, 'Cannot book a past date');
  const doctor = await Doctor.findById(doctorId);
  if (!doctor) throw fail(404, 'Doctor not found');
  if (!doctor.timeSlots.includes(timeSlot)) throw fail(400, 'Invalid time slot');
  const clash = await Appointment.findOne({
    doctor: doctorId, date, timeSlot, status: { $ne: 'Cancelled' }
  });
  if (clash) throw fail(409, 'This slot is already booked');
  const appt = await Appointment.create({
    patient: req.user.id, doctor: doctorId, date, timeSlot, reason
  });
  res.status(201).json(appt);
}));

// GET /api/appointments/mine  -> logged-in patient's appointments
router.get('/appointments/mine', auth(), wrap(async (req, res) => {
  res.json(await Appointment.find({ patient: req.user.id }).populate('doctor').sort('-date'));
}));

// PUT /api/appointments/:id/cancel
router.put('/appointments/:id/cancel', auth('patient'), wrap(async (req, res) => {
  const appt = await Appointment.findOne({ _id: req.params.id, patient: req.user.id });
  if (!appt) throw fail(404, 'Appointment not found');
  if (['Completed', 'Cancelled'].includes(appt.status)) throw fail(400, `Already ${appt.status}`);
  appt.status = 'Cancelled';
  await appt.save();
  res.json(appt);
}));

// GET /api/appointments  (admin) -> all appointments
router.get('/appointments', auth('admin'), wrap(async (req, res) => {
  res.json(await Appointment.find().populate('doctor').populate('patient', 'name email phone').sort('-createdAt'));
}));

// PUT /api/appointments/:id/status  (admin)
router.put('/appointments/:id/status', auth('admin'), wrap(async (req, res) => {
  const allowed = ['Booked', 'Confirmed', 'Completed', 'Cancelled'];
  if (!allowed.includes(req.body.status)) throw fail(400, 'Invalid status');
  res.json(await Appointment.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true }));
}));

// GET /api/stats  (admin) -> dashboard summary
router.get('/stats', auth('admin'), wrap(async (req, res) => {
  const [patients, doctors, appointments, byStatus] = await Promise.all([
    User.countDocuments({ role: 'patient' }),
    Doctor.countDocuments(),
    Appointment.countDocuments(),
    Appointment.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }])
  ]);
  res.json({ patients, doctors, appointments, byStatus });
}));

module.exports = router;
