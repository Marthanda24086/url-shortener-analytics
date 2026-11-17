import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { queryRow, executeSql } from '@/lib/db';
import { parseUserAgent, extractReferrerDomain } from '@/lib/user-agent';
import { getPrivacyVisitorHash } from '@/lib/anonymizer';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: { code: string };
}

export async function GET(req: NextRequest, { params }: RouteContext) {
  const code = params.code?.trim();

  if (!code) {
    return notFoundResponse('Missing Short Code', 'The short link provided was empty or invalid.');
  }

  try {
    const link = await queryRow<any>(
      `SELECT id, original_url, is_active, expires_at FROM links WHERE short_code = ? COLLATE NOCASE`,
      [code]
    );

    if (!link) {
      return notFoundResponse('Link Not Found', `No active link matches the short code "${code}". It may have been deleted or never existed.`);
    }

    // Check paused state
    if (!link.is_active) {
      return statusResponse(
        'Link Is Currently Paused',
        'The creator of this short link has temporarily paused incoming redirects.',
        403,
        '#D97706'
      );
    }

    // Check expiration
    if (link.expires_at) {
      const expDate = new Date(link.expires_at);
      if (expDate <= new Date()) {
        return statusResponse(
          'Link Has Expired',
          `This short link expired on ${expDate.toUTCString()} and is no longer accessible.`,
          410,
          '#DC2626'
        );
      }
    }

    // Capture telemetry asynchronously
    const rawIp = req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
                  req.headers.get('x-real-ip') ||
                  '127.0.0.1';
    const userAgent = req.headers.get('user-agent') || '';
    const rawReferrer = req.headers.get('referer') || '';

    const parsedUa = parseUserAgent(userAgent);
    const referrerDomain = extractReferrerDomain(rawReferrer);
    const visitorHash = getPrivacyVisitorHash(rawIp, userAgent);

    const clickId = `clk_${crypto.randomUUID()}`;
    const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 19);

    // Insert click event (fire and await or swallow potential telemetry errors)
    try {
      await executeSql(
        `INSERT INTO click_events (id, link_id, timestamp, referrer_domain, browser, os, device_type, country_code, visitor_hash, is_bot)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'US', ?, ?)`,
        [
          clickId,
          link.id,
          timestamp,
          referrerDomain,
          parsedUa.browser,
          parsedUa.os,
          parsedUa.deviceType,
          visitorHash,
          parsedUa.isBot ? 1 : 0,
        ]
      );
    } catch (ingestErr) {
      console.error('Click ingestion error:', ingestErr);
    }

    // Redirect to destination with HTTP 302 and anti-cache headers
    return NextResponse.redirect(link.original_url, {
      status: 302,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (err: any) {
    console.error('Redirect handler error:', err);
    return notFoundResponse('Redirection Error', 'An unexpected error occurred while resolving this link.');
  }
}

function notFoundResponse(title: string, message: string) {
  return statusResponse(title, message, 404, '#FF6B2C');
}

function statusResponse(title: string, message: string, status: number, accentColor: string) {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title} — Kairo</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: #090909;
      color: #F5F5F5;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
    }
    .card {
      background: #151515;
      border: 1px solid #303030;
      border-radius: 16px;
      padding: 40px;
      max-width: 480px;
      width: 100%;
      text-align: center;
      box-shadow: 0 10px 30px rgba(0,0,0,0.5);
    }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 12px;
      border-radius: 9999px;
      font-size: 12px;
      font-weight: 600;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      margin-bottom: 20px;
      background: #1D1D1D;
      color: #A1A1AA;
      border: 1px solid #303030;
    }
    .dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: ${accentColor};
    }
    h1 {
      font-size: 24px;
      font-weight: 700;
      letter-spacing: -0.02em;
      margin-bottom: 12px;
      color: #F5F5F5;
    }
    p {
      color: #A1A1AA;
      font-size: 15px;
      line-height: 1.5;
      margin-bottom: 28px;
    }
    a.btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background: #FF6B2C;
      color: #FFFFFF;
      text-decoration: none;
      padding: 10px 20px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      transition: background 0.2s;
    }
    a.btn:hover { background: #E55A1F; }
    .footer {
      margin-top: 32px;
      font-size: 12px;
      color: #A1A1AA;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">
      <span class="dot"></span>
      HTTP ${status}
    </div>
    <h1>${title}</h1>
    <p>${message}</p>
    <a href="/" class="btn">Return to Kairo Home</a>
    <div class="footer">Powered by Kairo Precision Link Infrastructure</div>
  </div>
</body>
</html>`;

  return new NextResponse(html, {
    status,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}
