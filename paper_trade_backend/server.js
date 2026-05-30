const express        = require('express');
const mongoose       = require('mongoose');
const cors           = require('cors');
const helmet         = require('helmet');
const rateLimit      = require('express-rate-limit');
const cookieParser   = require('cookie-parser');
require('dotenv').config();

const app = express();

// ─────────────────────────────────────────────────────────────────────────────
// 🛡️  SECURITY MIDDLEWARE — applied BEFORE all routes
// ─────────────────────────────────────────────────────────────────────────────

// 1. HTTP Security Headers (CSP, HSTS, X-Frame-Options, etc.)
app.use(helmet({
  crossOriginEmbedderPolicy: false,  // Allow embedding charts from Yahoo/Unsplash
  contentSecurityPolicy: false,       // Too strict for dev; enable in prod with proper config
}));

// 2. CORS — STRICT whitelist (add your production domain when deploying)
const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:3000',
  process.env.FRONTEND_URL,          // Set this in .env for production
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin || ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
    callback(new Error(`CORS blocked: ${origin} is not whitelisted.`));
  },
  credentials: true,                 // Allow cookies (for refresh tokens)
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'auth-token', 'Authorization'],
}));

// 3. Parse cookies (for refresh token httpOnly cookie)
app.use(cookieParser());

// 4. Body parser
app.use(express.json({ limit: '500kb' })); // cap body size to prevent DoS


// ─────────────────────────────────────────────────────────────────────────────
// 🚦  RATE LIMITERS
// ─────────────────────────────────────────────────────────────────────────────

// Global limiter: 200 requests per 15 minutes per IP
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please slow down.' },
});
app.use(globalLimiter);

// Auth limiter: 10 requests per 15 minutes per IP (prevents brute force)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many auth attempts. Try again in 15 minutes.' },
  skipSuccessfulRequests: true,      // Only count failed requests
});

// Trade limiter: 60 requests per minute (prevents order spamming)
const tradeLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Order rate limit reached. Max 60 requests/minute.' },
});

// ─────────────────────────────────────────────────────────────────────────────
// 📌  ROUTES
// ─────────────────────────────────────────────────────────────────────────────
const authRoutes      = require('./routes/auth');
const tradeRoutes     = require('./routes/trade');
const syntheticRoutes = require('./routes/syntheticRoutes');

app.use('/api/auth',      authLimiter, authRoutes);
app.use('/api/trade',     tradeLimiter, tradeRoutes);
app.use('/api/synthetic', syntheticRoutes);

// ─────────────────────────────────────────────────────────────────────────────
// 🗄️  DATABASE
// ─────────────────────────────────────────────────────────────────────────────
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB Error: ${error.message}`);
    process.exit(1);
  }
};
connectDB();

// ─────────────────────────────────────────────────────────────────────────────
// ❌  GLOBAL ERROR HANDLER — Never expose stack traces to the client
// ─────────────────────────────────────────────────────────────────────────────
app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
  const status = err.status || 500;
  // In production, return a generic message; in dev, show the real error
  const message = process.env.NODE_ENV === 'production'
    ? 'An internal server error occurred.'
    : err.message || 'An internal server error occurred.';
  console.error(`[ERROR] ${req.method} ${req.path}:`, err.message);
  res.status(status).json({ success: false, error: message });
});

app.get('/', (req, res) => res.json({ status: 'Paper Trade API is running 🚀', version: '2.0' }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));