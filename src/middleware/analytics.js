// ============================================================
// src/middleware/analytics.js
// PURPOSE: Collect and record click analytics on every redirect.
// WHY: We don't want this logic in the controller — SRP.
// HOW: Parses UA string, resolves GeoIP, creates Click document.
// ============================================================

const UAParser = require('ua-parser-js');
const geoip = require('geoip-lite');
const Click = require('../models/Click');
const Url = require('../models/Url');
const { hashIp } = require('../utils/hash');

/**
 * BOT_PATTERNS: Regex to detect known crawlers/bots from their User-Agent.
 * We still record bot clicks but flag them so they don't skew analytics.
 *
 * Common bots: Googlebot, Bingbot, curl, wget, Python requests, etc.
 */
const BOT_PATTERNS = /bot|crawler|spider|crawl|slurp|wget|curl|python|scrapy|headless/i;

/**
 * detectDevice(uaResult)
 *
 * ua-parser-js gives us a device object with type: "mobile" | "tablet" | undefined
 * We normalize it to our three-value enum.
 *
 * @param {Object} uaResult - Parsed result from UAParser
 * @returns {"mobile"|"tablet"|"desktop"|"unknown"}
 */
const detectDevice = (uaResult) => {
  const type = uaResult.device?.type;
  if (type === 'mobile') return 'mobile';
  if (type === 'tablet') return 'tablet';
  if (uaResult.os?.name) return 'desktop'; // Has OS but not mobile/tablet
  return 'unknown';
};

/**
 * recordClick(urlDoc, req)
 *
 * Core analytics function. Called after a successful redirect.
 * ASYNC but we do NOT await it in the redirect handler — fire-and-forget.
 * WHY: We don't want analytics recording to slow down the user's redirect.
 * The user gets redirected in <5ms; analytics saves in background.
 *
 * @param {Object} urlDoc - The Url mongoose document
 * @param {Object} req - Express request object
 */
const recordClick = async (urlDoc, req) => {
  try {
    // ── 1. Parse User-Agent ─────────────────────────────────────────────────
    const userAgentString = req.headers['user-agent'] || '';
    const parser = new UAParser(userAgentString);
    const uaResult = parser.getResult();
    // uaResult = { browser: {name, version}, os: {name}, device: {type} }

    // ── 2. Bot Detection ────────────────────────────────────────────────────
    const isBot = BOT_PATTERNS.test(userAgentString);

    // ── 3. GeoIP Lookup ─────────────────────────────────────────────────────
    // geoip-lite uses a bundled MaxMind GeoLite2 database (offline, fast!)
    // req.ip gives us the client IP (could be IPv4 or IPv6)
    // Express trusts proxies if app.set('trust proxy', 1) is set
    const rawIp = req.ip || req.connection.remoteAddress || 'unknown';
    const cleanIp = rawIp.replace('::ffff:', ''); // Strip IPv6 prefix from IPv4

    // geo is null if IP is private/local (like 127.0.0.1 in development)
    const geo = geoip.lookup(cleanIp);
    const country = geo?.country || 'Unknown';
    const city = geo?.city || 'Unknown';

    // ── 4. Privacy: Hash the IP ─────────────────────────────────────────────
    const hashedIp = hashIp(cleanIp);

    // ── 5. Parse Referrer ───────────────────────────────────────────────────
    const referrer = req.headers['referer'] || req.headers['referrer'] || 'Direct';

    // ── 6. Determine Device Type ────────────────────────────────────────────
    const device = detectDevice(uaResult);

    // ── 7. Create Click Document ────────────────────────────────────────────
    await Click.create({
      urlId: urlDoc._id,
      shortCode: urlDoc.shortCode,
      ip: hashedIp,
      country,
      city,
      referrer,
      userAgent: userAgentString,
      browser: uaResult.browser?.name || 'Unknown',
      os: uaResult.os?.name || 'Unknown',
      device,
      isBot,
      clickedAt: new Date(),
    });

    // ── 8. Increment denormalized counter ───────────────────────────────────
    // $inc is an atomic MongoDB operation — safe for concurrent updates
    // Much faster than findById then doc.clicks++ then doc.save()
    await Url.findByIdAndUpdate(urlDoc._id, { $inc: { clicks: 1 } });

  } catch (error) {
    // Log but don't throw — analytics failure should NOT break redirects
    console.error('Analytics recording failed:', error.message);
  }
};

module.exports = { recordClick };
