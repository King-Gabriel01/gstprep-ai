const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/authRoutes');
const courseRoutes = require('./routes/courseRoutes');
const materialRoutes = require('./routes/materialRoutes');
const questionRoutes = require('./routes/questionRoutes');
const practiceRoutes = require('./routes/practiceRoutes');
const assessmentRoutes = require('./routes/assessmentRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');

const app = express();

// --- Security & core middleware ---
app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_URL || '*',
    credentials: true,
  })
);
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Basic rate limiting to reduce abuse, especially on auth endpoints
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', apiLimiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { message: 'Too many auth attempts. Please try again later.' },
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// --- Health check ---
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'GSTPrep AI API', timestamp: new Date().toISOString() });
});

// --- Routes ---
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/materials', materialRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/practice', practiceRoutes);
app.use('/api/assessments', assessmentRoutes);
app.use('/api/analytics', analyticsRoutes);

// --- 404 handler ---
app.use('/api', (req, res) => {
  res.status(404).json({ message: 'Route not found.' });
});

// --- Global error handler (catches multer errors, etc.) ---
app.use((err, req, res, next) => {
  if (err) {
    const status = err.status || 400;
    return res.status(status).json({ message: err.message || 'Something went wrong.' });
  }
  next();
});

module.exports = app;
