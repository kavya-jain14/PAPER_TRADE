const express        = require('express');
const mongoose       = require('mongoose');
const cors           = require('cors');
const helmet         = require('helmet');
const rateLimit      = require('express-rate-limit');
const cookieParser   = require('cookie-parser');
require('dotenv').config();

const app = express();

// Trust proxy so express-rate-limit reads the real client IP behind
// the hosting reverse proxy (Railway, Render, etc.)
app.set('trust proxy', 1);

// ─────────────────────────────────────────────────────────────────────────────
// 🛡️  SECURITY MIDDLEWARE — applied BEFORE all routes
// ─────────────────────────────────────────────────────────────────────────────

// 1. HTTP Security Headers (CSP, HSTS, X-Frame-Options, etc.)
app.use(helmet({
  crossOriginEmbedderPolicy: false,  // Allow embedding charts from Yahoo/Unsplash
  contentSecurityPolicy: false,       // Too strict for dev; enable in prod with proper config
}));

// 2. CORS — explicit allowlist built from:
//    • localhost defaults (always included in dev)
//    • FRONTEND_URL (primary deployment URL — see .env.example)
//    • ALLOWED_ORIGINS (comma-separated additional origins — see .env.example)
const _rawOrigins = [
  process.env.NODE_ENV !== 'production' ? 'http://localhost:5173' : null,
  process.env.NODE_ENV !== 'production' ? 'http://localhost:3000' : null,
  process.env.FRONTEND_URL,
  ...(process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : [])
].map(o => (o || '').trim()).filter(Boolean);

function validateOrigin(raw) {
  const url = new URL(raw);
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error('Protocol must be http: or https:');
  }
  if (url.username || url.password || (url.pathname !== '/' && url.pathname !== '') || url.search || url.hash) {
    throw new Error('URL must contain only protocol, host, and port');
  }
  if (process.env.NODE_ENV === 'production') {
    if (url.protocol !== 'https:') throw new Error('Production origins must use https:');
    let host = url.hostname.toLowerCase();
    if (host.startsWith('[') && host.endsWith(']')) host = host.slice(1, -1);
    if (host.endsWith('.')) host = host.slice(0, -1);
    if (['localhost', '127.0.0.1', '::1'].includes(host)) {
      throw new Error('Production origins must not be loopback addresses');
    }
  }
  return url.origin;
}

const ALLOWED_ORIGINS = [];
for (const raw of _rawOrigins) {
  try {
    ALLOWED_ORIGINS.push(validateOrigin(raw));
  } catch (err) {
    throw new Error(`Invalid CORS origin configuration: "${raw}". ${err.message}`);
  }
}
const UNIQUE_ALLOWED_ORIGINS = [...new Set(ALLOWED_ORIGINS)];

if (process.env.NODE_ENV === 'production' && UNIQUE_ALLOWED_ORIGINS.length === 0) {
  throw new Error('FATAL: In production, FRONTEND_URL or ALLOWED_ORIGINS must be set.');
}

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin || UNIQUE_ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
    callback(new Error(`CORS_ERROR: ${origin} is not whitelisted.`));
  },
  credentials: true,                 // Allow cookies (for refresh tokens)
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'auth-token', 'Authorization'],
}));

// CORS Error Handler (returns 403 instead of 500)
app.use((err, req, res, next) => {
  if (err && err.message && err.message.startsWith('CORS_ERROR:')) {
    return res.status(403).json({ success: false, error: err.message.replace('CORS_ERROR: ', 'CORS blocked: ') });
  }
  next(err);
});

// 3. Parse cookies (for refresh token httpOnly cookie)
app.use(cookieParser());

// 4. Body parser
app.use(express.json({ limit: '500kb' })); // cap body size to prevent DoS


// ─────────────────────────────────────────────────────────────────────────────
// 🚦  RATE LIMITERS
// ─────────────────────────────────────────────────────────────────────────────

// Global limiter disabled for debugging
// const globalLimiter = rateLimit({ ... });

// Auth limiter: 10 requests per 15 minutes per IP (prevents brute force)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
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

// General API limiter for analytics, leaderboard, replay, market-data
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120, // 120 per minute for generic data
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'API rate limit reached. Please slow down.' },
});

// ─────────────────────────────────────────────────────────────────────────────
// 📌  ROUTES
// ─────────────────────────────────────────────────────────────────────────────
const authRoutes      = require('./routes/auth');
const tradeRoutes     = require('./routes/trade');
const syntheticRoutes = require('./routes/syntheticRoutes');
const replayRoutes    = require('./routes/replay');
const analyticsRoutes = require('./routes/analytics');
const leaderboardRoutes = require('./routes/leaderboard');

app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/googlelogin', authLimiter);
app.use('/api/auth', authRoutes);
app.use('/api/trade',     tradeLimiter, tradeRoutes);
app.use('/api/synthetic', apiLimiter, syntheticRoutes);
app.use('/api/replay',    apiLimiter, replayRoutes);
app.use('/api/analytics', apiLimiter, analyticsRoutes);
app.use('/api/leaderboard', apiLimiter, leaderboardRoutes);

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

const PORT = process.env.PORT || 5005;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

// ─────────────────────────────────────────────────────────────────────────────
// ⏰  CRON JOB / KEEP-ALIVE
// ─────────────────────────────────────────────────────────────────────────────
// Prevent server from sleeping on free hosting (Render, Heroku, etc.)
setInterval(() => {
  const serverUrl = process.env.SERVER_URL || `http://localhost:${PORT}`;
  console.log(`⏰ Sending keep-alive ping to ${serverUrl}...`);

  // Use global fetch if available (Node 18+)
  if (typeof fetch !== 'undefined') {
    fetch(serverUrl)
      .then(res => console.log(`⏰ Keep-alive ping successful. Status: ${res.status}`))
      .catch(err => console.error(`⏰ Keep-alive ping failed:`, err.message));
  } else {
    // Fallback for older Node versions
    const client = serverUrl.startsWith('https') ? require('https') : require('http');
    client.get(serverUrl, (res) => {
      console.log(`⏰ Keep-alive ping successful. Status: ${res.statusCode}`);
    }).on('error', (err) => {
      console.error(`⏰ Keep-alive ping failed:`, err.message);
    });
  }
}, 14 * 60 * 1000); // 14 minutes

// ─────────────────────────────────────────────────────────────────────────────
// ❌  PREVENT APP CRASHES (Global Error Handlers)
// ─────────────────────────────────────────────────────────────────────────────
// Catches unhandled errors and prevents the Node.js process from exiting
process.on('uncaughtException', (err) => {
  console.error('🚨 [CRASH AVERTED] Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('🚨 [CRASH AVERTED] Unhandled Rejection at:', promise, 'reason:', reason);
});