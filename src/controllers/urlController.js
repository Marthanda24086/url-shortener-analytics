// ============================================================
// src/controllers/urlController.js
// PURPOSE: Business logic for URL CRUD operations.
// WHY: Controllers separate HTTP concerns (req/res) from DB logic.
// HOW: Each function handles one API endpoint's core logic.
// ============================================================

const Joi = require('joi');
const bcrypt = require('bcryptjs');
const Url = require('../models/Url');
const { generateShortCode, hashUrl } = require('../utils/hash');
const { generateQRCode } = require('../utils/qrcode');

// ── Validation Schemas ────────────────────────────────────────────────────────
// Joi is a schema validation library.
// We define expected shape of request bodies here — not in routes.
const shortenSchema = Joi.object({
  url: Joi.string().uri({ scheme: ['http', 'https'] }).required().messages({
    'string.uri': 'Please provide a valid URL starting with http:// or https://',
    'any.required': 'URL is required',
  }),
  customAlias: Joi.string()
    .alphanum()      // only letters and numbers
    .min(3)
    .max(50)
    .optional(),
  expiresIn: Joi.number().integer().min(1).max(365).optional(), // days
  password: Joi.string().min(4).max(100).optional(),
  tags: Joi.array().items(Joi.string()).max(10).optional(),
  title: Joi.string().max(200).optional(),
});

// ── shortenUrl ────────────────────────────────────────────────────────────────
/**
 * POST /api/shorten
 *
 * FLOW:
 * 1. Validate request body with Joi
 * 2. Check for duplicate URL (same originalUrl + same apiKey) → return existing
 * 3. If customAlias, check it's not taken
 * 4. Generate shortCode using nanoid
 * 5. Hash password if provided
 * 6. Generate QR code
 * 7. Save to MongoDB
 * 8. Return response
 */
const shortenUrl = async (req, res) => {
  try {
    // ── Step 1: Validate ─────────────────────────────────────────────────────
    const { error, value } = shortenSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message,
      });
    }

    const { url, customAlias, expiresIn, password, tags, title } = value;

    // ── Step 2: Duplicate Check ──────────────────────────────────────────────
    // If the same API key tries to shorten the same URL, return the existing one
    // Hash the URL for faster comparison (index on hash is faster than long string)
    const urlHash = hashUrl(url);
    const existingUrl = await Url.findOne({
      originalUrl: url,
      apiKey: req.apiKey,
      isActive: true,
    });

    if (existingUrl && !customAlias) {
      // Return the existing short link instead of creating a duplicate
      return res.status(200).json({
        success: true,
        message: 'URL already shortened',
        data: formatUrlResponse(existingUrl, req),
      });
    }

    // ── Step 3: Custom Alias Check ───────────────────────────────────────────
    if (customAlias) {
      const aliasExists = await Url.findOne({ customAlias });
      if (aliasExists) {
        return res.status(409).json({
          success: false,
          error: `Custom alias '${customAlias}' is already taken.`,
        });
      }
    }

    // ── Step 4: Generate Short Code ──────────────────────────────────────────
    // Generate code with collision retry loop
    let shortCode;
    let attempts = 0;
    do {
      // If many attempts, increase length to reduce collision probability
      const length = attempts < 3 ? 6 : 7;
      shortCode = generateShortCode(length);
      attempts++;

      if (attempts > 10) {
        throw new Error('Could not generate unique short code after 10 attempts');
      }
    } while (await Url.findOne({ shortCode })); // Retry if collision

    // ── Step 5: Hash Password ────────────────────────────────────────────────
    let hashedPassword = null;
    if (password) {
      // bcrypt.hash(password, saltRounds)
      // saltRounds=10 means 2^10=1024 bcrypt iterations (secure but fast enough)
      hashedPassword = await bcrypt.hash(password, 10);
    }

    // ── Step 6: Calculate Expiry ─────────────────────────────────────────────
    let expiresAt = null;
    if (expiresIn) {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiresIn);
    }

    // ── Step 7: Build the short URL ──────────────────────────────────────────
    const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
    const shortUrl = `${baseUrl}/${customAlias || shortCode}`;

    // ── Step 8: Generate QR Code ─────────────────────────────────────────────
    const qrCode = await generateQRCode(shortUrl);

    // ── Step 9: Save to MongoDB ──────────────────────────────────────────────
    const newUrl = await Url.create({
      originalUrl: url,
      shortCode,
      customAlias: customAlias || undefined,
      apiKey: req.apiKey,
      expiresAt,
      password: hashedPassword,
      qrCode,
      tags: tags || [],
      title: title || '',
    });

    // ── Step 10: Response ────────────────────────────────────────────────────
    return res.status(201).json({
      success: true,
      message: 'URL shortened successfully',
      data: formatUrlResponse(newUrl, req),
    });

  } catch (err) {
    console.error('shortenUrl error:', err);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

// ── getMyUrls ─────────────────────────────────────────────────────────────────
/**
 * GET /api/urls
 * Returns paginated list of URLs created by the authenticated API key.
 */
const getMyUrls = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';
    const tag = req.query.tag || '';

    // Build filter object dynamically
    const filter = { apiKey: req.apiKey, isActive: true };

    if (search) {
      // $regex allows partial matching; $options: 'i' = case-insensitive
      filter.$or = [
        { originalUrl: { $regex: search, $options: 'i' } },
        { shortCode: { $regex: search, $options: 'i' } },
        { title: { $regex: search, $options: 'i' } },
      ];
    }

    if (tag) {
      filter.tags = tag; // MongoDB checks if array contains this value
    }

    // .countDocuments() for total (pagination metadata)
    const total = await Url.countDocuments(filter);

    // .find() with .sort() .skip() .limit() for the actual page
    const urls = await Url.find(filter)
      .sort({ createdAt: -1 }) // Newest first
      .skip(skip)
      .limit(limit)
      .select('-password -__v'); // Exclude sensitive fields

    const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;

    return res.json({
      success: true,
      data: urls.map((u) => formatUrlResponse(u, req)),
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit,
      },
    });

  } catch (err) {
    console.error('getMyUrls error:', err);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

// ── getUrlDetails ─────────────────────────────────────────────────────────────
/**
 * GET /api/urls/:code
 * Returns details for a single URL.
 */
const getUrlDetails = async (req, res) => {
  try {
    const { code } = req.params;
    const urlDoc = await Url.findByCode(code); // Our custom static method

    if (!urlDoc) {
      return res.status(404).json({ success: false, error: 'URL not found' });
    }

    // Ownership check: only owner can see details
    if (urlDoc.apiKey !== req.apiKey) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    return res.json({ success: true, data: formatUrlResponse(urlDoc, req) });

  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

// ── deleteUrl ─────────────────────────────────────────────────────────────────
/**
 * DELETE /api/urls/:code
 * Soft-deletes a URL (sets isActive: false).
 * WHY soft-delete? Preserves analytics history.
 */
const deleteUrl = async (req, res) => {
  try {
    const { code } = req.params;
    const urlDoc = await Url.findByCode(code);

    if (!urlDoc) {
      return res.status(404).json({ success: false, error: 'URL not found' });
    }

    if (urlDoc.apiKey !== req.apiKey) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    // Soft delete
    urlDoc.isActive = false;
    await urlDoc.save();

    return res.json({ success: true, message: 'URL deleted successfully' });

  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

// ── updateUrl ─────────────────────────────────────────────────────────────────
/**
 * PUT /api/urls/:code
 * Update title, tags, expiry, or toggle active status.
 */
const updateUrl = async (req, res) => {
  try {
    const { code } = req.params;
    const urlDoc = await Url.findByCode(code);

    if (!urlDoc || urlDoc.apiKey !== req.apiKey) {
      return res.status(404).json({ success: false, error: 'URL not found or access denied' });
    }

    const { title, tags, expiresIn, isActive } = req.body;

    if (title !== undefined) urlDoc.title = title;
    if (tags !== undefined) urlDoc.tags = tags;
    if (isActive !== undefined) urlDoc.isActive = isActive;
    if (expiresIn !== undefined) {
      const date = new Date();
      date.setDate(date.getDate() + expiresIn);
      urlDoc.expiresAt = date;
    }

    await urlDoc.save();
    return res.json({ success: true, data: formatUrlResponse(urlDoc, req) });

  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

// ── getQRCode ─────────────────────────────────────────────────────────────────
/**
 * GET /api/qr/:code
 * Returns QR code as PNG image stream.
 */
const getQRCode = async (req, res) => {
  try {
    const { generateQRCodeBuffer } = require('../utils/qrcode');
    const { code } = req.params;
    const urlDoc = await Url.findByCode(code);

    if (!urlDoc) {
      return res.status(404).json({ success: false, error: 'URL not found' });
    }

    const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
    const shortUrl = `${baseUrl}/${urlDoc.effectiveCode}`;
    const buffer = await generateQRCodeBuffer(shortUrl);

    // Set response headers for PNG image
    res.set('Content-Type', 'image/png');
    res.set('Cache-Control', 'public, max-age=86400'); // Cache for 1 day
    res.send(buffer);

  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

// ── Helper ────────────────────────────────────────────────────────────────────
/**
 * formatUrlResponse — Builds the standard API response shape for a URL.
 * Centralizing this avoids inconsistent responses across endpoints.
 */
const formatUrlResponse = (urlDoc, req) => {
  const baseUrl = process.env.BASE_URL || `${req?.protocol}://${req?.get('host')}`;
  const code = urlDoc.customAlias || urlDoc.shortCode;

  return {
    id: urlDoc._id,
    originalUrl: urlDoc.originalUrl,
    shortCode: urlDoc.shortCode,
    customAlias: urlDoc.customAlias || null,
    shortUrl: `${baseUrl}/${code}`,
    qrCode: urlDoc.qrCode,
    clicks: urlDoc.clicks,
    isActive: urlDoc.isActive,
    expiresAt: urlDoc.expiresAt,
    tags: urlDoc.tags,
    title: urlDoc.title,
    hasPassword: !!urlDoc.password,
    createdAt: urlDoc.createdAt,
  };
};

module.exports = {
  shortenUrl,
  getMyUrls,
  getUrlDetails,
  deleteUrl,
  updateUrl,
  getQRCode,
};
