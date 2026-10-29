// ============================================================
// src/utils/hash.js
// PURPOSE: All hashing and encoding logic lives here.
// WHY: Separation of concerns — controllers stay clean.
// HOW: Uses nanoid for randomness + base62 for compactness.
// ============================================================

const crypto = require('crypto'); // Node.js built-in — no install needed
const { nanoid } = require('nanoid');

// ── Base62 Alphabet ───────────────────────────────────────────────────────────
// Why Base62? URLs are case-sensitive but we want to avoid confusing chars.
// 0-9 (10) + a-z (26) + A-Z (26) = 62 characters
// With 6 characters: 62^6 = 56,800,235,584 possible codes (~56 billion)
const BASE62_ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

/**
 * generateShortCode(length=6)
 *
 * STRATEGY: Use nanoid with a custom alphabet.
 * nanoid uses a cryptographically secure random number generator (CSPRNG)
 * internally (crypto.getRandomValues in browser, crypto.randomFillSync in Node).
 *
 * WHY NOT Math.random()? Math.random() is NOT cryptographically secure.
 * Predictable → attackers could enumerate your short codes.
 *
 * @param {number} length - Length of the short code (default 6)
 * @returns {string} - e.g. "aB3kZ9"
 */
const generateShortCode = (length = 6) => {
  // nanoid(length) with default alphabet [A-Za-z0-9_-]
  // We pass our BASE62 to avoid hyphens and underscores
  const generate = require('nanoid').customAlphabet(BASE62_ALPHABET, length);
  return generate();
};

/**
 * hashUrl(url)
 *
 * PURPOSE: Create a deterministic fingerprint of a URL.
 * USE CASE: Detect if the same URL was already shortened.
 *
 * Algorithm: SHA-256 (Secure Hash Algorithm 256-bit)
 * - Always produces same output for same input (deterministic)
 * - One-way: cannot reverse hash → original URL
 * - 256-bit output = 32 bytes = 64 hex chars
 *
 * WHY SHA-256 and not MD5? MD5 has known collision vulnerabilities.
 * For URL deduplication, SHA-256 is collision-resistant for practical use.
 *
 * @param {string} url - Original URL
 * @returns {string} - 64-character hex string
 */
const hashUrl = (url) => {
  return crypto
    .createHash('sha256') // create a SHA-256 hasher
    .update(url)          // feed the URL string into it
    .digest('hex');       // output as hexadecimal string
};

/**
 * hashIp(ip)
 *
 * PURPOSE: Anonymize IP addresses for GDPR compliance.
 * We need IPs for unique visitor counting but MUST NOT store raw IPs.
 *
 * We add a SALT (from env) so the hash can't be reverse-rainbow-tabled.
 *
 * @param {string} ip - Raw IP address "192.168.1.1"
 * @returns {string} - Hashed and salted IP
 */
const hashIp = (ip) => {
  const salt = process.env.IP_HASH_SALT || 'default-salt-change-me';
  return crypto
    .createHash('sha256')
    .update(ip + salt) // HMAC-like: salt prevents rainbow table attacks
    .digest('hex')
    .substring(0, 16); // First 16 chars is enough for uniqueness
};

/**
 * encodeBase62(num)
 *
 * PURPOSE: Convert a large integer to a short base62 string.
 * USE CASE: If you use auto-incrementing IDs (like a counter),
 * you can encode them to get short, predictable codes.
 *
 * Example: encodeBase62(125) → "cb" (125 in base62)
 * Example: encodeBase62(1000000) → "4C92"
 *
 * This is the same algorithm Twitter/Bitly use for sequential IDs.
 *
 * @param {number} num - Positive integer
 * @returns {string} - Base62 encoded string
 */
const encodeBase62 = (num) => {
  if (num === 0) return BASE62_ALPHABET[0];

  let result = '';
  let n = num;

  while (n > 0) {
    // Modulo gives us the remainder — maps to a base62 character
    result = BASE62_ALPHABET[n % 62] + result;
    // Integer division moves to the next "digit"
    n = Math.floor(n / 62);
  }

  return result;
};

/**
 * decodeBase62(str)
 *
 * PURPOSE: Reverse of encodeBase62 — convert base62 string back to integer.
 * Useful if you need to look up by sequential ID.
 *
 * @param {string} str - Base62 encoded string
 * @returns {number} - Decoded integer
 */
const decodeBase62 = (str) => {
  let result = 0;

  for (let i = 0; i < str.length; i++) {
    // Each character's position in alphabet = its digit value
    const charValue = BASE62_ALPHABET.indexOf(str[i]);
    if (charValue === -1) throw new Error(`Invalid base62 character: ${str[i]}`);
    // Horner's method: result = result * 62 + digit
    result = result * 62 + charValue;
  }

  return result;
};

/**
 * generateApiKey()
 *
 * PURPOSE: Create a secure random API key for users.
 * Uses crypto.randomBytes — CSPRNG, NOT predictable.
 * 32 bytes → 64 hex chars, but we take first 32 for usability.
 *
 * @returns {string} - e.g. "sk_a1b2c3d4e5f6..."
 */
const generateApiKey = () => {
  const randomBytes = crypto.randomBytes(32).toString('hex');
  return `sk_${randomBytes}`;
};

module.exports = {
  generateShortCode,
  hashUrl,
  hashIp,
  encodeBase62,
  decodeBase62,
  generateApiKey,
};
