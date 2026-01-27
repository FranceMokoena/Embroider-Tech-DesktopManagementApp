import './config/env.js';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';

// Import routes
import authRoutes from './routes/auth.js';
import adminRoutes from './routes/admin.js';
import reportsRoutes from './routes/reports.js';
import messagingRoutes from './routes/messaging.js';
import dashboardRoutes from './routes/dashboard.js';
import databaseRoutes from './routes/database.js';

const PORT = process.env.PORT || 5001;
const app = express();
const isDev = process.env.NODE_ENV === 'development';

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: isDev ? false : { policy: 'same-origin' }
}));
app.use(compression());

// CORS configuration
const defaultAllowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002',
  'http://localhost:3003',
  'http://localhost:19006'
];
const allowedHostPrefixes = ['http://localhost', 'http://127.0.0.1', 'http://0.0.0.0'];
const normalizeOrigin = (origin) => origin?.trim().toLowerCase().replace(/\/$/, '');

const allowedOrigins = (
  process.env.ALLOWED_ORIGINS
    ?.split(',')
    .map(origin => origin.trim())
    .filter(Boolean) || defaultAllowedOrigins
).map(origin => normalizeOrigin(origin) ?? origin);

const isAllowedOrigin = (origin) => {
  if (!origin) return true;
  const normalized = normalizeOrigin(origin);
  if (normalized === 'null') return true;
  if (allowedOrigins.includes('*')) return true;
  if (allowedOrigins.includes(normalized)) {
    return true;
  }
  return allowedHostPrefixes.some(prefix => normalized?.startsWith(prefix));
};

const corsOptions = {
  origin: (origin, callback) => {
    if (isAllowedOrigin(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'mobile-token', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Authorization', 'mobile-token'],
  maxAge: 86400
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Rate limiting (after CORS so even 429 responses include CORS headers)
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: isDev ? 10000 : (parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100),
  message: 'Too many requests from this IP, please try again later.',
  skip: (req) => req.method === 'OPTIONS'
});
app.use(limiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ 
    status: '✅ Desktop Admin API is running', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/messaging', messagingRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/database', databaseRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Server error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Desktop Admin API running on http://0.0.0.0:${PORT}`);
  console.log(`📊 Admin Dashboard: http://localhost:${PORT}`);
});
