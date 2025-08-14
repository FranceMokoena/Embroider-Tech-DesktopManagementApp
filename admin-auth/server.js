// server.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const fetch = require('node-fetch');

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

// Admin schema
const adminSchema = new mongoose.Schema({
  name: { type: String, required: true },
  surname: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  department: { type: String, required: true },
  password: { type: String, required: true },
}, { timestamps: true });

const Admin = mongoose.model('Admin', adminSchema);

// Middleware to verify JWT
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.adminId = decoded.id;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// ------------------- ADMIN ROUTES ------------------- //

// Register
app.post('/api/admin/register', async (req, res) => {
  try {
    const { name, surname, username, email, department, password } = req.body;
    const existingAdmin = await Admin.findOne({ $or: [{ username }, { email }] });
    if (existingAdmin) return res.status(400).json({ error: 'Username or email already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);

    const newAdmin = new Admin({
      name, surname, username, email, department, password: hashedPassword
    });

    await newAdmin.save();
    res.status(201).json({ message: 'Admin registered successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Login
app.post('/api/admin/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const admin = await Admin.findOne({ username });
    if (!admin) return res.status(400).json({ error: 'Invalid username or password' });

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) return res.status(400).json({ error: 'Invalid username or password' });

    const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, { expiresIn: '24h' });

    res.status(200).json({
      message: 'Login successful',
      token,
      admin: { username: admin.username, email: admin.email, name: admin.name, surname: admin.surname }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get logged-in admin profile
app.get('/api/auth/profile', authMiddleware, async (req, res) => {
  try {
    const admin = await Admin.findById(req.adminId).select('-password');
    if (!admin) return res.status(404).json({ error: 'Admin not found' });
    res.json(admin);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all admins/users
app.get('/api/admin/users', authMiddleware, async (req, res) => {
  try {
    const admins = await Admin.find().select('-password');
    res.json(admins);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ------------------- MOBILE PROXY ------------------- //

const MOBILE_API = 'https://embroider-scann-app.onrender.com';

// Fetch all scans / user scan history
app.get('/api/mobile-scans', authMiddleware, async (req, res) => {
  try {
    const mobileToken = process.env.MOBILE_API_TOKEN; // Must exist
    const response = await fetch(`${MOBILE_API}/api/scan/history`, {
      headers: { Authorization: `Bearer ${mobileToken}` }
    });

    if (!response.ok) return res.status(response.status).send(await response.text());

    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch mobile scans' });
  }
});

// Fetch users from mobile (if needed)
app.get('/api/mobile-users', authMiddleware, async (req, res) => {
  try {
    const mobileToken = process.env.MOBILE_API_TOKEN;
    const response = await fetch(`${MOBILE_API}/api/users`, {
      headers: { Authorization: `Bearer ${mobileToken}` }
    });
    if (!response.ok) return res.status(response.status).send(await response.text());
    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch mobile users' });
  }
});

// Fetch notifications from mobile (dummy example)
app.get('/api/messaging/notifications', authMiddleware, async (req, res) => {
  try {
    // Example: you can proxy from mobile API or generate dummy notifications
    res.json([
      { _id: '1', message: 'User X completed scan', date: new Date() },
      { _id: '2', message: 'User Y added new device', date: new Date() }
    ]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// ------------------- START SERVER ------------------- //

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
