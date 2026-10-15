const mongoose = require('mongoose');
const { Schema } = mongoose;

const userSchema = new Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['patient', 'admin'], default: 'patient' },
  age: Number,
  phone: String
}, { timestamps: true });

const doctorSchema = new Schema({
  name: { type: String, required: true },
  specialization: { type: String, required: true },
  hospital: String,
  experience: { type: Number, default: 0 },
  fee: { type: Number, default: 0 },
  timeSlots: { type: [String], default: ['10:00', '11:00', '14:00', '15:00', '16:00'] }
}, { timestamps: true });

const appointmentSchema = new Schema({
  patient: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  doctor: { type: Schema.Types.ObjectId, ref: 'Doctor', required: true },
  date: { type: String, required: true },      // YYYY-MM-DD
  timeSlot: { type: String, required: true },
  reason: String,
  status: {
    type: String,
    enum: ['Booked', 'Confirmed', 'Completed', 'Cancelled'],
    default: 'Booked'
  }
}, { timestamps: true });

module.exports = {
  User: mongoose.model('User', userSchema),
  Doctor: mongoose.model('Doctor', doctorSchema),
  Appointment: mongoose.model('Appointment', appointmentSchema)
};
