require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { User, Doctor, Appointment } = require('./models');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/mediconnect';

async function seed() {
  try {
    console.log('Connecting to MongoDB at:', MONGODB_URI);
    await mongoose.connect(MONGODB_URI);
    console.log('Connected! Clearing existing data...');

    await Promise.all([
      User.deleteMany({}),
      Doctor.deleteMany({}),
      Appointment.deleteMany({})
    ]);

    console.log('Creating Admin and Patient accounts...');
    const adminPassword = await bcrypt.hash('admin123', 10);
    const patientPassword = await bcrypt.hash('patient123', 10);

    const [admin, patient] = await Promise.all([
      User.create({
        name: 'Admin',
        email: 'admin@mediconnect.com',
        password: adminPassword,
        role: 'admin',
        phone: '9998887770'
      }),
      User.create({
        name: 'Aayush Chapagain',
        email: 'patient@mediconnect.com',
        password: patientPassword,
        phone: '9876543210',
        age: 21,
        role: 'patient'
      })
    ]);

    console.log('Creating Doctors...');
    const defaultSlots = ['10:00', '11:00', '14:00', '15:00', '16:00'];
    const doctors = await Doctor.insertMany([
      {
        name: 'Dr. Meena Raghavan',
        specialization: 'Cardiology',
        hospital: 'KG Hospital, Coimbatore',
        experience: 14,
        fee: 800,
        timeSlots: defaultSlots
      },
      {
        name: 'Dr. Arjun Menon',
        specialization: 'Dermatology',
        hospital: 'PSG Hospitals',
        experience: 9,
        fee: 600,
        timeSlots: defaultSlots
      },
      {
        name: 'Dr. Kavya Nair',
        specialization: 'Pediatrics',
        hospital: 'Kovai Medical Center',
        experience: 11,
        fee: 500,
        timeSlots: defaultSlots
      },
      {
        name: 'Dr. Ramesh Iyer',
        specialization: 'Orthopedics',
        hospital: 'Ganga Hospital',
        experience: 18,
        fee: 900,
        timeSlots: defaultSlots
      }
    ]);

    // Format today's date YYYY-MM-DD
    const today = new Date().toISOString().split('T')[0];

    console.log('Creating sample appointments...');
    await Appointment.create([
      {
        patient: patient._id,
        doctor: doctors[0]._id, // Dr. Meena Raghavan
        date: today,
        timeSlot: '10:00',
        reason: 'Regular heart health checkup',
        status: 'Booked'
      },
      {
        patient: patient._id,
        doctor: doctors[1]._id, // Dr. Arjun Menon
        date: today,
        timeSlot: '14:00',
        reason: 'Skin allergy consultation',
        status: 'Confirmed'
      }
    ]);

    console.log('✅ Database seeded successfully!');
    console.log('Admin login: admin@mediconnect.com / admin123');
    console.log('Patient login: patient@mediconnect.com / patient123');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seed();
