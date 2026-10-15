require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const authRoutes = require('./routes/authRoutes');
const doctorRoutes = require('./routes/doctorRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');

const app = express();
app.use(cors({ origin: process.env.CLIENT_URL || true }));
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api', doctorRoutes);
app.use('/api', appointmentRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ ok: true, db: mongoose.connection.readyState === 1 });
});

// ---------- Server Initialization ----------
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/mediconnect';
const JWT_SECRET = process.env.JWT_SECRET || 'mediconnect_local_dev_secret_key_2026';
process.env.JWT_SECRET = JWT_SECRET;

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log(`Connected to MongoDB (${MONGODB_URI.includes('127.0.0.1') || MONGODB_URI.includes('localhost') ? 'Local / Compass' : 'Cloud'})`);
    console.log(`Database name: ${mongoose.connection.name}`);
    app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));
  })
  .catch((e) => {
    console.error('MongoDB connection failed:', e.message);
    process.exit(1);
  });
