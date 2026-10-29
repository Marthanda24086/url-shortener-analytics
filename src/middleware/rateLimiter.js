// ============================================================
// src/middleware/rateLimiter.js
// PURPOSE: Prevent abuse — limit requests per IP per time window.
// WHY: Without rate limiting, anyone can spam your API,
//      exhaust your DB connections, or brute-force short codes.
// HOW: Uses express-rate-limit with in-memory window counter.
// ============================================================

const rateLimit = require('express-rate-limit');

/**
 * HOW RATE LIMITING WORKS:
 *
 * The library maintains a sliding/fixed window counter per IP address.
 * Each request increments the counter. When counter > limit, block.
 * After windowMs milliseconds, the counter resets.
 *
 * Default store: In-memory (MemoryStore) — resets on server restart.
 * Production: Use RedisStore for persistence across restarts/instances.
 *
 * Response headers added automatically:
 *  - X-RateLimit-Limit: max requests allowed
 *  - X-RateLimit-Remaining: requests remaining in window
 *  - X-RateLimit-Reset: timestamp when window resets
 */

// ── API Rate Limiter ─────────────────────────────────────────────────────────
// For POST /api/shorten and other write operations
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes in milliseconds
  max: 100,                  // 100 requests per 15 min per IP
  standardHeaders: true,     // Include RateLimit headers in response
  legacyHeaders: false,      // Disable old X-RateLimit-* headers

  // Custom message when rate limit exceeded
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again after 15 minutes.',
    retryAfter: '15 minutes',
  },

  // keyGenerator: by default uses req.ip
  // We could customize to use API key instead of IP
  keyGenerator: (req) => req.headers['x-api-key'] || req.ip,

  // skip: function to bypass rate limiting (e.g., for trusted IPs)
  skip: (req) => {
    const trustedIps = (process.env.TRUSTED_IPS || '').split(',');
    return trustedIps.includes(req.ip);
  },
});

// ── Strict Limiter ────────────────────────────────────────────────────────────
// For sensitive endpoints like API key generation
const strictLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,                    // Only 5 attempts per hour
  message: {
    success: false,
    error: 'Too many attempts. Try again in an hour.',
  },
});

// ── Redirect Limiter ─────────────────────────────────────────────────────────
// Lighter limit for the redirect endpoint (public, high traffic expected)
const redirectLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60,                  // 60 redirects per minute (1/sec average)
  message: {
    success: false,
    error: 'Too many requests.',
  },
});

module.exports = { apiLimiter, strictLimiter, redirectLimiter };
