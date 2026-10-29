// ============================================================
// src/app.js
// PURPOSE: Configure and export the Express application.
// WHY: Separating app config from server.js allows testing
//      without starting an actual HTTP server.
// HOW: Create app → apply global middleware → mount routes.
// ============================================================

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config(); // Load .env variables into process.env

const apiRoutes = require('./routes/api');
const redirectRoutes = require('./routes/redirect');

// Create the Express application
const app = express();

// ── Security Middleware (Helmet) ──────────────────────────────────────────────
/**
 * helmet() sets various HTTP security headers automatically:
 *
 * - Content-Security-Policy: prevents XSS by whitelisting content sources
 * - X-Frame-Options: prevents clickjacking (embedding in iframes)
 * - X-Content-Type-Options: prevents MIME sniffing attacks
 * - Strict-Transport-Security: forces HTTPS (in production)
 * - Referrer-Policy: controls how much referrer info is sent
 *
 * One line replaces ~15 manual header configurations.
 */
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", 'cdn.jsdelivr.net', 'cdnjs.cloudflare.com'],
        styleSrc: ["'self'", "'unsafe-inline'", 'fonts.googleapis.com', 'cdnjs.cloudflare.com'],
        fontSrc: ["'self'", 'fonts.gstatic.com'],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'"],
      },
    },
  })
);

// ── CORS ──────────────────────────────────────────────────────────────────────
/**
 * CORS = Cross-Origin Resource Sharing
 *
 * Browsers block requests from one origin (domain) to another by default.
 * This is called the "Same-Origin Policy."
 *
 * CORS headers tell the browser: "It's OK for domain X to talk to me."
 *
 * allowedOrigins: list from env — comma-separated domains
 * credentials: true → allows cookies to be sent cross-origin
 */
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000').split(',');

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (curl, mobile apps, Postman)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key'],
  })
);

// ── Trust Proxy ───────────────────────────────────────────────────────────────
// Behind Nginx / Railway / Render reverse proxies, req.ip would be the proxy IP.
// trust proxy = 1 tells Express to trust X-Forwarded-For header from ONE hop.
// This gives us the real client IP for rate limiting and analytics.
app.set('trust proxy', 1);

// ── Body Parsers ──────────────────────────────────────────────────────────────
/**
 * express.json() parses incoming requests with JSON body
 * (Content-Type: application/json)
 * Makes data available as req.body
 *
 * limit: '10kb' prevents large payload attacks (JSON bomb)
 */
app.use(express.json({ limit: '10kb' }));

// express.urlencoded() parses HTML form submissions
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// ── HTTP Request Logging (Morgan) ─────────────────────────────────────────────
/**
 * morgan('dev') logs: METHOD URL STATUS RESPONSE_TIME - CONTENT_LENGTH
 * Example: GET /api/health 200 2.123 ms - 154
 *
 * 'combined' format logs full Apache-style logs (for production)
 * 'dev' format is colorful, concise (for development)
 */
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

// ── Static Files ──────────────────────────────────────────────────────────────
/**
 * express.static() serves files from the /public directory.
 * Request: GET /  → serves public/index.html
 * Request: GET /dashboard  → serves public/dashboard.html
 * Request: GET /css/style.css  → serves public/css/style.css
 *
 * maxAge: 1 day cache for static assets (CSS, JS, images)
 */
app.use(
  express.static(path.join(__dirname, '..', 'public'), {
    maxAge: process.env.NODE_ENV === 'production' ? '1d' : 0,
  })
);

// ── API Routes ────────────────────────────────────────────────────────────────
// All routes starting with /api are handled by apiRoutes router
app.use('/api', apiRoutes);

// ── Redirect Routes ───────────────────────────────────────────────────────────
// The redirect router handles /:code — must be AFTER /api
// WHY after? If redirect was first, "api" would be treated as a short code.
app.use('/', redirectRoutes);

// ── 404 Handler ───────────────────────────────────────────────────────────────
// Catches any request that didn't match the above routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Route ${req.method} ${req.path} not found`,
  });
});

// ── Global Error Handler ──────────────────────────────────────────────────────
/**
 * Express identifies error-handling middleware by its 4-argument signature.
 * ANY unhandled error thrown in route handlers lands here via next(err).
 *
 * Always define this LAST in the middleware chain.
 */
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.stack);

  // Don't leak stack traces in production
  const message =
    process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message;

  res.status(err.status || 500).json({
    success: false,
    error: message,
  });
});

module.exports = app;
