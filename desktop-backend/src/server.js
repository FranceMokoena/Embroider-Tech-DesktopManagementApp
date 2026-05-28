import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';

import authRoutes from './routes/auth.js';
import assetsRoutes from './routes/assets.js';
import rfidRoutes from './routes/rfid.js';
import featuresRoutes from './routes/features.js';

dotenv.config();

const PORT = process.env.PORT || 5001;
const app = express();

app.use(helmet());
app.use(compression());
app.use(rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Too many requests from this IP, please try again later.'
}));

const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5001'];
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.json({
    status: 'RFID ERP API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/assets', assetsRoutes);
app.use('/api/v1/rfid', rfidRoutes);
app.use('/api/v1/features', featuresRoutes);

app.use('/api/auth', authRoutes);
app.use('/api/assets', assetsRoutes);
app.use('/api/rfid', rfidRoutes);
app.use('/api/features', featuresRoutes);

app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`RFID ERP API running on http://0.0.0.0:${PORT}`);
});
