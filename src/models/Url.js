// ============================================================
// src/models/Url.js
// PURPOSE: Mongoose Schema + Model for a shortened URL document.
// WHY: Schema enforces data shape; Mongoose gives us ORM methods.
// HOW: Each document represents ONE original<->short mapping.
// ============================================================

const mongoose = require('mongoose');

/**
 * urlSchema defines the shape of every URL document in MongoDB.
 *
 * Fields explained:
 *  - originalUrl   : The long URL submitted by the user
 *  - shortCode     : The unique 6-char identifier (e.g. "aB3kZ9")
 *  - customAlias   : Optional human-readable alias (e.g. "my-blog")
 *  - clicks        : Denormalized counter (fast reads, updated on every redirect)
 *  - apiKey        : Which API key created this link (for ownership)
 *  - isActive      : Soft-delete flag — deactivated links return 404
 *  - expiresAt     : Optional TTL date; null = never expires
 *  - password      : bcrypt hash — if set, visitor must enter password
 *  - qrCode        : Base64 PNG of the QR code (generated once, stored)
 *  - title         : Auto-fetched page title for display in dashboard
 *  - tags          : Array of strings for grouping/filtering
 *  - createdAt     : Auto-managed by Mongoose timestamps option
 */
const urlSchema = new mongoose.Schema(
  {
    originalUrl: {
      type: String,
      required: [true, 'Original URL is required'],
      trim: true,
    },

    shortCode: {
      type: String,
      required: true,
      unique: true, // MongoDB creates a unique index on this field
      trim: true,
      lowercase: true,
    },

    customAlias: {
      type: String,
      unique: true,
      sparse: true, // sparse=true means the unique index ignores null values
      trim: true,
      lowercase: true,
    },

    // Denormalized click counter — avoids expensive COUNT queries
    clicks: {
      type: Number,
      default: 0,
    },

    apiKey: {
      type: String,
      required: true,
      index: true, // index for fast lookup of "links owned by this API key"
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    expiresAt: {
      type: Date,
      default: null,
      // MongoDB TTL index would auto-delete, but we check manually
      // so we keep the historical record
    },

    password: {
      type: String, // bcrypt hash; null means no password
      default: null,
    },

    qrCode: {
      type: String, // data:image/png;base64,...
      default: null,
    },

    title: {
      type: String,
      default: '',
    },

    tags: {
      type: [String],
      default: [],
    },
  },
  {
    // timestamps: true automatically adds `createdAt` and `updatedAt` fields
    // Mongoose manages these — you never set them manually
    timestamps: true,
  }
);

// ── Virtual Field ─────────────────────────────────────────────────────────────
// A virtual is a computed property NOT stored in MongoDB.
// We can ask the URL's "effective code" — custom alias if exists, else shortCode
urlSchema.virtual('effectiveCode').get(function () {
  return this.customAlias || this.shortCode;
});

// ── Instance Method ───────────────────────────────────────────────────────────
// Check if this URL has expired
urlSchema.methods.isExpired = function () {
  if (!this.expiresAt) return false;
  return new Date() > this.expiresAt;
};

// ── Static Method ─────────────────────────────────────────────────────────────
// Find a URL by its effective code (alias takes priority)
urlSchema.statics.findByCode = async function (code) {
  // Try customAlias first, then shortCode
  return (
    (await this.findOne({ customAlias: code, isActive: true })) ||
    (await this.findOne({ shortCode: code, isActive: true }))
  );
};

/**
 * mongoose.model('Url', urlSchema)
 * - First arg: collection name → Mongoose pluralizes to 'urls'
 * - Second arg: schema to use
 * - Returns a Model class with static methods like .find(), .create(), etc.
 */
module.exports = mongoose.model('Url', urlSchema);
