export interface ParsedUserAgent {
  browser: string;
  os: string;
  deviceType: 'Desktop' | 'Mobile' | 'Tablet' | 'Other';
  isBot: boolean;
}

const BOT_PATTERNS = [
  /bot/i,
  /crawler/i,
  /spider/i,
  /googlebot/i,
  /bingbot/i,
  /yandex/i,
  /duckduckbot/i,
  /baiduspider/i,
  /slurp/i,
  /facebookexternalhit/i,
  /twitterbot/i,
  /whatsapp/i,
  /linkedinbot/i,
  /slackbot/i,
  /telegrambot/i,
  /discordbot/i,
  /curl/i,
  /wget/i,
  /python-requests/i,
  /postman/i,
  /headlesschrome/i,
  /lighthouse/i,
];

export function parseUserAgent(ua: string = ''): ParsedUserAgent {
  const isBot = BOT_PATTERNS.some((pattern) => pattern.test(ua));

  // Determine Device Type
  let deviceType: 'Desktop' | 'Mobile' | 'Tablet' | 'Other' = 'Desktop';
  if (/tablet|ipad|playbook|silk/i.test(ua)) {
    deviceType = 'Tablet';
  } else if (/mobile|iphone|ipod|android.*mobile|blackberry|iemobile|opera mini/i.test(ua)) {
    deviceType = 'Mobile';
  }

  // Determine Operating System
  let os = 'Other';
  if (/windows nt 10/i.test(ua)) os = 'Windows 10/11';
  else if (/windows nt/i.test(ua)) os = 'Windows';
  else if (/macintosh|mac os x/i.test(ua)) os = 'macOS';
  else if (/iphone|ipad|ipod/i.test(ua)) os = 'iOS';
  else if (/android/i.test(ua)) os = 'Android';
  else if (/linux/i.test(ua)) os = 'Linux';
  else if (/cros/i.test(ua)) os = 'ChromeOS';

  // Determine Browser
  let browser = 'Other';
  if (/edg\//i.test(ua)) browser = 'Edge';
  else if (/opr\/|opera/i.test(ua)) browser = 'Opera';
  else if (/chrome|crios/i.test(ua)) browser = 'Chrome';
  else if (/firefox|fxios/i.test(ua)) browser = 'Firefox';
  else if (/safari/i.test(ua) && !/chrome|crios/i.test(ua)) browser = 'Safari';

  return { browser, os, deviceType, isBot };
}

/**
 * Extracts and canonicalizes referrer domain.
 */
export function extractReferrerDomain(referrer: string = ''): string {
  if (!referrer || referrer.trim() === '') return 'Direct';
  try {
    const url = new URL(referrer);
    let hostname = url.hostname.toLowerCase();
    if (hostname.startsWith('www.')) hostname = hostname.slice(4);
    if (hostname.includes('google.')) return 'Google';
    if (hostname.includes('twitter.com') || hostname.includes('x.com') || hostname.includes('t.co')) return 'X / Twitter';
    if (hostname.includes('linkedin.com') || hostname.includes('lnkd.in')) return 'LinkedIn';
    if (hostname.includes('facebook.com') || hostname.includes('fb.me')) return 'Facebook';
    if (hostname.includes('instagram.com')) return 'Instagram';
    if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) return 'YouTube';
    if (hostname.includes('github.com')) return 'GitHub';
    if (hostname.includes('reddit.com')) return 'Reddit';
    return hostname;
  } catch {
    return 'Other';
  }
}
