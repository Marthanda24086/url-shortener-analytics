import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import crypto from 'crypto';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const RESERVED_SLUGS = new Set([
  'api',
  'login',
  'register',
  'dashboard',
  'links',
  'analytics',
  'settings',
  'admin',
  'r',
  'u',
  'auth',
  'logout',
  'terms',
  'privacy',
  'docs',
  'about',
  'features',
  'favicon.ico',
  'robots.txt',
  'sitemap.xml',
]);

const BASE62_ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

/**
 * Generates a collision-resistant cryptographically secure base62 short slug.
 */
export function generateShortCode(length: number = 7): string {
  const bytes = crypto.randomBytes(length);
  let result = '';
  for (let i = 0; i < length; i++) {
    result += BASE62_ALPHABET[bytes[i] % BASE62_ALPHABET.length];
  }
  return result;
}

/**
 * Validates that an alias contains only safe URL characters (alphanumeric, hyphens, underscores).
 */
export function isValidSlug(slug: string): boolean {
  if (!slug || slug.length < 3 || slug.length > 32) return false;
  return /^[a-zA-Z0-9-_]+$/.test(slug);
}

export function isReservedSlug(slug: string): boolean {
  return RESERVED_SLUGS.has(slug.toLowerCase());
}

/**
 * Validates destination URLs strictly against http and https protocols.
 * Blocks javascript:, data:, file:, and internal loopback addresses.
 */
export function validateDestinationUrl(urlStr: string): { valid: boolean; normalized?: string; error?: string } {
  if (!urlStr || urlStr.trim() === '') {
    return { valid: false, error: 'Destination URL is required.' };
  }

  let formatted = urlStr.trim();
  if (!/^https?:\/\//i.test(formatted)) {
    formatted = 'https://' + formatted;
  }

  try {
    const parsed = new URL(formatted);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return { valid: false, error: 'Only HTTP and HTTPS protocols are permitted.' };
    }

    const host = parsed.hostname.toLowerCase();

    // Check for loopback / private IP SSRF destinations
    if (
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host === '0.0.0.0' ||
      host === '::1' ||
      host.endsWith('.local')
    ) {
      return { valid: false, error: 'Internal and loopback addresses cannot be shortened.' };
    }

    return { valid: true, normalized: parsed.toString() };
  } catch {
    return { valid: false, error: 'Malformed or invalid URL format.' };
  }
}

export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return '—';
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch {
    return dateString;
  }
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num);
}

/**
 * Dynamically resolves the base application URL from headers or environment.
 * Prevents hardcoded localhost dependency in production deployments.
 */
export function getBaseUrl(req?: { headers: { get: (name: string) => string | null } }): string {
  if (process.env.NEXT_PUBLIC_APP_URL && !process.env.NEXT_PUBLIC_APP_URL.includes('localhost')) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '');
  }

  if (req) {
    const forwardedHost = req.headers.get('x-forwarded-host');
    const host = forwardedHost || req.headers.get('host');
    const proto = req.headers.get('x-forwarded-proto') || 'https';
    if (host) {
      const protocol = host.includes('localhost') ? 'http' : proto;
      return `${protocol}://${host}`;
    }
  }

  return (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, '');
}
