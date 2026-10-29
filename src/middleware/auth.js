// ============================================================
// src/middleware/auth.js
// PURPOSE: API Key authentication middleware.
// WHY: Protects write endpoints — only registered users can
//      create/delete links. Public redirects remain open.
// HOW: Reads "x-api-key" header, validates against DB.
// ============================================================

const { generateApiKey } = require('../utils/hash');

// In-memory cache of valid API keys → avoids DB hit on every request
// In production: use Redis for distributed cache
const validKeys = new Set();

// Seed with the master key from .env for admin access
// Real app would have a Users collection
const seedKeys = () => {
  if (process.env.MASTER_API_KEY) {
    validKeys.add(process.env.MASTER_API_KEY);
  }
  // Pre-generate a demo key for easy testing
  const demoKey = process.env.DEMO_API_KEY || 'demo_key_12345';
  validKeys.add(demoKey);
};
seedKeys();

/**
 * authenticate — Express middleware function.
 *
 * Middleware signature: (req, res, next) => void
 * - req: Incoming request object
 * - res: Response object
 * - next: Function to pass control to the NEXT middleware/route handler
 *
 * If auth fails: respond with 401 and do NOT call next().
 * If auth passes: attach apiKey to req object and call next().
 *
 * FLOW: Request → authenticate → [next middleware] → controller
 */
const authenticate = (req, res, next) => {
  // API key can come from header OR query param (for convenience)
  const apiKey =
    req.headers['x-api-key'] ||        // Standard header
    req.query.api_key ||               // Query string: ?api_key=sk_xxx
    req.headers['authorization']?.replace('Bearer ', ''); // Bearer token

  if (!apiKey) {
    return res.status(401).json({
      success: false,
      error: 'API key required. Pass it as x-api-key header.',
    });
  }

  if (!validKeys.has(apiKey)) {
    return res.status(403).json({
      success: false,
      error: 'Invalid API key.',
    });
  }

  // Attach the apiKey to request so controllers can use it
  // req.apiKey is now available in all downstream handlers
  req.apiKey = apiKey;

  // Call next() — passes control to the next handler in the chain
  next();
};

/**
 * optionalAuth — Allows unauthenticated requests but enriches
 * authenticated ones. Used for endpoints that work both ways.
 */
const optionalAuth = (req, res, next) => {
  const apiKey =
    req.headers['x-api-key'] ||
    req.query.api_key;

  if (apiKey && validKeys.has(apiKey)) {
    req.apiKey = apiKey;
    req.isAuthenticated = true;
  } else {
    req.isAuthenticated = false;
  }

  next(); // Always call next — auth is optional
};

/**
 * registerKey — Add a new API key to the valid set.
 * In a real app, this would create a User document in MongoDB.
 */
const registerKey = () => {
  const newKey = generateApiKey();
  validKeys.add(newKey);
  return newKey;
};

module.exports = { authenticate, optionalAuth, registerKey };
