// ============================================================
// src/models/Click.js
// PURPOSE: Stores every individual click event for analytics.
// WHY: Separate collection = independent scaling, detailed queries
//      without touching the Url document on every read.
// HOW: Each redirect triggers ONE Click document insertion.
// ============================================================

const mongoose = require('mongoose');

/**
 * clickSchema — one document per click/visit event.
 *
 * Fields explained:
 *  - urlId       : Reference to Url._id (mongoose ObjectId ref)
 *  - shortCode   : Denormalized shortCode (avoids JOIN for simple queries)
 *  - ip          : Hashed visitor IP (privacy-safe; we SHA-256 hash it)
 *  - country     : Resolved via geoip-lite (e.g. "IN", "US")
 *  - city        : City from geoip lookup
 *  - referrer    : HTTP Referer header — where did the visitor come from?
 *  - userAgent   : Raw UA string (we also parse it)
 *  - browser     : Parsed browser name (e.g. "Chrome")
 *  - os          : Parsed OS (e.g. "Windows")
 *  - device      : "desktop" | "mobile" | "tablet"
 *  - isBot       : Flag for bot/crawler traffic
 *  - clickedAt   : When the click happened (default: now)
 */
const clickSchema = new mongoose.Schema(
  {
    // mongoose.Schema.Types.ObjectId creates a reference to another collection
    // The 'ref' property enables Mongoose .populate() — like a JOIN
    urlId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Url',
      required: true,
      index: true, // CRITICAL: we query clicks by urlId constantly
    },

    shortCode: {
      type: String,
      required: true,
      index: true,
    },

    // Privacy: never store raw IPs; store a hash
    ip: {
      type: String,
      default: 'unknown',
    },

    // GeoIP fields
    country: {
      type: String,
      default: 'Unknown',
    },

    city: {
      type: String,
      default: 'Unknown',
    },

    // Traffic source
    referrer: {
      type: String,
      default: 'Direct', // No referrer header = direct visit
    },

    // User-Agent data
    userAgent: {
      type: String,
      default: '',
    },

    browser: {
      type: String,
      default: 'Unknown',
    },

    os: {
      type: String,
      default: 'Unknown',
    },

    // Device type derived from UA parsing
    device: {
      type: String,
      enum: ['desktop', 'mobile', 'tablet', 'unknown'],
      default: 'unknown',
    },

    isBot: {
      type: Boolean,
      default: false,
    },

    clickedAt: {
      type: Date,
      default: Date.now,
      index: true, // index for time-range queries ("clicks in last 7 days")
    },
  },
  {
    // No timestamps needed here; clickedAt IS our timestamp
    timestamps: false,
    // versionKey: false removes the __v field from documents
    versionKey: false,
  }
);

// ── Compound Index ─────────────────────────────────────────────────────────────
// This compound index makes "all clicks for shortCode X in date range" FAST
// Without it: MongoDB does a full collection scan → slow at scale
clickSchema.index({ shortCode: 1, clickedAt: -1 });

// ── Compound Index for unique visitor counting ─────────────────────────────────
// To count unique IPs per shortCode
clickSchema.index({ shortCode: 1, ip: 1 });

module.exports = mongoose.model('Click', clickSchema);
