// ============================================================
// src/routes/api.js
// PURPOSE: All /api/* endpoints defined here.
// WHY: Router modularizes routes — app.js stays clean.
// HOW: express.Router() creates a mini-app with its own middleware.
// ============================================================

const express = require('express');
const router = express.Router();

const { authenticate, registerKey } = require('../middleware/auth');
const { apiLimiter, strictLimiter } = require('../middleware/rateLimiter');
const {
  shortenUrl,
  getMyUrls,
  getUrlDetails,
  deleteUrl,
  updateUrl,
  getQRCode,
} = require('../controllers/urlController');
const {
  getClickStats,
  getDashboardStats,
} = require('../controllers/analyticsController');

// ── Apply rate limiting to all /api routes ────────────────────────────────────
// Middleware applied to the router applies to ALL routes in this router
router.use(apiLimiter);

// ── Health Check ─────────────────────────────────────────────────────────────
// Public endpoint — no auth required
// Use: load balancers, monitoring systems
router.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(), // seconds since server started
    memoryUsage: process.memoryUsage(), // MB of RAM used
  });
});

// ── Generate API Key ──────────────────────────────────────────────────────────
// Strict rate limit (5 per hour) — prevents key farming
router.post('/keys/generate', strictLimiter, (req, res) => {
  const newKey = registerKey();
  res.status(201).json({
    success: true,
    message: 'API key generated. Store it securely — it will not be shown again.',
    apiKey: newKey,
  });
});

// ── URL Shortening Endpoints ──────────────────────────────────────────────────
// All require authentication (authenticate middleware)

// POST /api/shorten → create new short URL
router.post('/shorten', authenticate, shortenUrl);

// GET /api/urls → list all URLs for this API key
router.get('/urls', authenticate, getMyUrls);

// GET /api/urls/:code → get one URL's details
router.get('/urls/:code', authenticate, getUrlDetails);

// PUT /api/urls/:code → update a URL
router.put('/urls/:code', authenticate, updateUrl);

// DELETE /api/urls/:code → soft-delete a URL
router.delete('/urls/:code', authenticate, deleteUrl);

// ── QR Code Endpoint ──────────────────────────────────────────────────────────
// GET /api/qr/:code → returns PNG image
router.get('/qr/:code', getQRCode); // Public — anyone can get QR

// ── Analytics Endpoints ───────────────────────────────────────────────────────

// GET /api/analytics/dashboard → overview stats
router.get('/analytics/dashboard', authenticate, getDashboardStats);

// GET /api/analytics/:code → per-URL analytics
// NOTE: 'dashboard' route must be defined BEFORE '/:code' to avoid conflict!
// Express matches routes top-to-bottom; if :code was first, 'dashboard'
// would be treated as a code value, not a route.
router.get('/analytics/:code', authenticate, getClickStats);

module.exports = router;
