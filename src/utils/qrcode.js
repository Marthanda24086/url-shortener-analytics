// ============================================================
// src/utils/qrcode.js
// PURPOSE: Generate QR codes for short URLs.
// WHY: QR codes make links shareable in physical world (posters, cards).
// HOW: Uses the 'qrcode' npm package to render PNG as base64.
// ============================================================

const QRCode = require('qrcode');

/**
 * generateQRCode(url)
 *
 * Generates a QR code as a Base64-encoded PNG data URL.
 * Result format: "data:image/png;base64,iVBORw0KGgo..."
 * This can be directly set as the `src` of an <img> tag.
 *
 * Options explained:
 *  - errorCorrectionLevel: 'H' = High (30% data restoration)
 *    Even if 30% of the QR code is obscured, it still scans.
 *    Options: L(7%), M(15%), Q(25%), H(30%)
 *  - margin: White border around QR code (in modules)
 *  - width: Image width in pixels
 *  - color: Custom colors for dark/light modules
 *
 * @param {string} url - The full short URL to encode
 * @returns {Promise<string>} - Base64 data URL
 */
const generateQRCode = async (url) => {
  try {
    const options = {
      errorCorrectionLevel: 'H',
      margin: 2,
      width: 300,
      color: {
        dark: '#6366f1',  // Indigo dots — matches our brand
        light: '#ffffff', // White background
      },
    };

    // QRCode.toDataURL returns a Promise<string>
    const dataUrl = await QRCode.toDataURL(url, options);
    return dataUrl;
  } catch (error) {
    console.error('QR Code generation failed:', error);
    return null;
  }
};

/**
 * generateQRCodeBuffer(url)
 *
 * Returns the QR code as a raw PNG Buffer.
 * Use this when you want to stream the image directly as an HTTP response
 * (e.g., GET /api/qr/:code → Content-Type: image/png)
 *
 * @param {string} url
 * @returns {Promise<Buffer>}
 */
const generateQRCodeBuffer = async (url) => {
  return await QRCode.toBuffer(url, {
    errorCorrectionLevel: 'H',
    margin: 2,
    width: 300,
  });
};

module.exports = { generateQRCode, generateQRCodeBuffer };
