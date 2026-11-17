import crypto from 'crypto';

const SALT = process.env.ANONYMIZER_SALT || 'kairo_privacy_preserving_salt_default';

/**
 * Computes a privacy-preserving one-way visitor hash.
 * Combines IP address (first 3 octets for IPv4 or /48 for IPv6) + User-Agent + rotating salt.
 * Ensures zero storage of personal identifiers while allowing daily unique visitor counting.
 */
export function getPrivacyVisitorHash(ip: string = '127.0.0.1', userAgent: string = ''): string {
  // Anonymize IP subnet
  let anonymizedIp = ip;
  if (ip.includes('.')) {
    // IPv4: mask last octet (e.g. 192.168.1.0)
    const parts = ip.split('.');
    if (parts.length === 4) {
      anonymizedIp = `${parts[0]}.${parts[1]}.${parts[2]}.0`;
    }
  } else if (ip.includes(':')) {
    // IPv6: keep first 3 groups
    const parts = ip.split(':');
    anonymizedIp = parts.slice(0, 3).join(':') + '::';
  }

  // Daily epoch bucket (e.g. 2026-11-12)
  const dayBucket = new Date().toISOString().slice(0, 10);

  return crypto
    .createHmac('sha256', `${SALT}_${dayBucket}`)
    .update(`${anonymizedIp}::${userAgent}`)
    .digest('hex')
    .slice(0, 24);
}
