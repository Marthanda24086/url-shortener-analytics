// ============================================================
// src/routes/redirect.js
// PURPOSE: Handle the core redirect logic — GET /:code
// WHY: This is the most-hit route; kept minimal for speed.
// HOW: Lookup code → validate → redirect → record analytics.
// ============================================================

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const Url = require('../models/Url');
const { recordClick } = require('../middleware/analytics');
const { redirectLimiter } = require('../middleware/rateLimiter');

/**
 * GET /:code
 *
 * The redirect flow:
 * 1. Extract short code from URL params
 * 2. Look up in MongoDB (custom alias first, then shortCode)
 * 3. Check if URL is active, not expired, not password-protected
 * 4. Record click analytics (fire-and-forget)
 * 5. Send HTTP 302 redirect to original URL
 *
 * WHY 302 and not 301?
 *  - 301 = Permanent redirect → browsers CACHE it forever
 *    If you change the destination, the browser won't ask the server again.
 *  - 302 = Temporary redirect → browser asks server every time
 *    Allows us to track every click and update destinations.
 */
router.get('/:code', redirectLimiter, async (req, res) => {
  try {
    const { code } = req.params;

    // Sanitize: strip any non-alphanumeric (prevent injection)
    const cleanCode = code.replace(/[^a-zA-Z0-9_-]/g, '');
    if (!cleanCode) {
      return res.status(400).send('Invalid short code');
    }

    // ── Database Lookup ──────────────────────────────────────────────────────
    // Our static method tries customAlias first, then shortCode
    const urlDoc = await Url.findByCode(cleanCode);

    if (!urlDoc) {
      // Redirect to a friendly 404 page
      return res.status(404).sendFile('404.html', { root: 'public' });
    }

    // ── Expiry Check ─────────────────────────────────────────────────────────
    if (urlDoc.isExpired()) {
      return res.status(410).json({
        success: false,
        error: 'This link has expired.',
      });
    }

    // ── Password Protection ──────────────────────────────────────────────────
    if (urlDoc.password) {
      const submittedPassword = req.query.p || req.headers['x-link-password'];

      if (!submittedPassword) {
        // Redirect to password entry page
        return res.redirect(`/password-entry?code=${cleanCode}`);
      }

      // Compare submitted password against bcrypt hash
      const isMatch = await bcrypt.compare(submittedPassword, urlDoc.password);
      if (!isMatch) {
        return res.status(401).json({ success: false, error: 'Incorrect password' });
      }
    }

    // ── Record Analytics (fire-and-forget) ───────────────────────────────────
    // We do NOT await this — it runs in the background
    // The user's redirect is NOT delayed by analytics recording
    recordClick(urlDoc, req);

    // ── Redirect ─────────────────────────────────────────────────────────────
    return res.redirect(302, urlDoc.originalUrl);

  } catch (err) {
    console.error('Redirect error:', err);
    return res.status(500).send('Internal Server Error');
  }
});

module.exports = router;
