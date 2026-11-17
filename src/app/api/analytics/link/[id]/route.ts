import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { queryRow, queryRows } from '@/lib/db';
import { getBaseUrl } from '@/lib/utils';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: { id: string };
}

export async function GET(req: NextRequest, { params }: RouteContext) {
  try {
    const auth = getAuthenticatedUser(req);
    if (!auth) {
      return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const range = searchParams.get('range') || '7d';

    // Verify ownership of the link
    const link = await queryRow<any>(
      `SELECT 
        l.id,
        l.user_id as userId,
        l.original_url as originalUrl,
        l.short_code as shortCode,
        l.title,
        l.is_active as isActive,
        l.expires_at as expiresAt,
        l.created_at as createdAt,
        l.updated_at as updatedAt
       FROM links l
       WHERE l.id = ? AND l.user_id = ?`,
      [params.id, auth.userId]
    );

    if (!link) {
      return NextResponse.json({ success: false, error: 'Link not found or access denied.' }, { status: 404 });
    }

    // Cutoff date
    const now = new Date();
    let cutoffDate = new Date();
    let isHourly = false;

    if (range === '24h') {
      cutoffDate.setHours(cutoffDate.getHours() - 24);
      isHourly = true;
    } else if (range === '7d') {
      cutoffDate.setDate(cutoffDate.getDate() - 7);
    } else if (range === '30d') {
      cutoffDate.setDate(cutoffDate.getDate() - 30);
    } else if (range === '90d') {
      cutoffDate.setDate(cutoffDate.getDate() - 90);
    } else {
      cutoffDate = new Date('2020-01-01');
    }

    const cutoffIso = cutoffDate.toISOString().replace('T', ' ').slice(0, 19);
    const todayStartIso = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      .toISOString()
      .replace('T', ' ')
      .slice(0, 19);

    // Link Summary
    const summaryRow = await queryRow<any>(
      `SELECT 
        COUNT(CASE WHEN is_bot = 0 THEN 1 END) as total_clicks,
        COUNT(DISTINCT CASE WHEN is_bot = 0 THEN visitor_hash END) as unique_visitors,
        COUNT(CASE WHEN is_bot = 1 THEN 1 END) as bot_clicks,
        COUNT(CASE WHEN is_bot = 0 AND timestamp >= ? THEN 1 END) as clicks_today
       FROM click_events
       WHERE link_id = ? AND timestamp >= ?`,
      [todayStartIso, params.id, cutoffIso]
    );

    // Time Series
    let timeSeriesSql = '';
    if (isHourly) {
      timeSeriesSql = `
        SELECT 
          strftime('%Y-%m-%d %H:00', timestamp) as date_bucket,
          COUNT(*) as clicks,
          COUNT(DISTINCT visitor_hash) as unique_clicks
        FROM click_events
        WHERE link_id = ? AND is_bot = 0 AND timestamp >= ?
        GROUP BY date_bucket
        ORDER BY date_bucket ASC
      `;
    } else {
      timeSeriesSql = `
        SELECT 
          strftime('%Y-%m-%d', timestamp) as date_bucket,
          COUNT(*) as clicks,
          COUNT(DISTINCT visitor_hash) as unique_clicks
        FROM click_events
        WHERE link_id = ? AND is_bot = 0 AND timestamp >= ?
        GROUP BY date_bucket
        ORDER BY date_bucket ASC
      `;
    }

    const timeSeriesRows = await queryRows<any>(timeSeriesSql, [params.id, cutoffIso]);

    // Hourly Distribution (0 to 23 hours)
    const hourlyRows = await queryRows<any>(
      `SELECT 
        CAST(strftime('%H', timestamp) AS INTEGER) as hour_num,
        COUNT(*) as clicks
       FROM click_events
       WHERE link_id = ? AND is_bot = 0 AND timestamp >= ?
       GROUP BY hour_num
       ORDER BY hour_num ASC`,
      [params.id, cutoffIso]
    );

    const hourlyActivity = Array.from({ length: 24 }, (_, i) => {
      const match = hourlyRows.find((r) => Number(r.hour_num) === i);
      const hourStr = i.toString().padStart(2, '0') + ':00';
      return {
        hour: i,
        formattedHour: hourStr,
        clicks: match ? Number(match.clicks) : 0,
      };
    });

    // Devices
    const deviceRows = await queryRows<any>(
      `SELECT device_type as name, COUNT(*) as value
       FROM click_events
       WHERE link_id = ? AND is_bot = 0 AND timestamp >= ?
       GROUP BY device_type
       ORDER BY value DESC`,
      [params.id, cutoffIso]
    );

    // Browsers
    const browserRows = await queryRows<any>(
      `SELECT browser as name, COUNT(*) as value
       FROM click_events
       WHERE link_id = ? AND is_bot = 0 AND timestamp >= ?
       GROUP BY browser
       ORDER BY value DESC`,
      [params.id, cutoffIso]
    );

    // Operating Systems
    const osRows = await queryRows<any>(
      `SELECT os as name, COUNT(*) as value
       FROM click_events
       WHERE link_id = ? AND is_bot = 0 AND timestamp >= ?
       GROUP BY os
       ORDER BY value DESC`,
      [params.id, cutoffIso]
    );

    // Referrers
    const referrerRows = await queryRows<any>(
      `SELECT referrer_domain as name, COUNT(*) as value
       FROM click_events
       WHERE link_id = ? AND is_bot = 0 AND timestamp >= ?
       GROUP BY referrer_domain
       ORDER BY value DESC
       LIMIT 10`,
      [params.id, cutoffIso]
    );

    // Recent Clicks
    const recentClicks = await queryRows<any>(
      `SELECT id, timestamp, referrer_domain as referrerDomain, browser, os, device_type as deviceType
       FROM click_events
       WHERE link_id = ? AND is_bot = 0
       ORDER BY timestamp DESC
       LIMIT 15`,
      [params.id]
    );

    const appUrl = getBaseUrl(req);

    return NextResponse.json({
      success: true,
      range,
      link: {
        id: link.id,
        userId: link.userId,
        originalUrl: link.originalUrl,
        shortCode: link.shortCode,
        shortUrl: `${appUrl}/r/${link.shortCode}`,
        title: link.title || 'Untitled Link',
        isActive: Boolean(link.isActive),
        expiresAt: link.expiresAt,
        createdAt: link.createdAt,
        updatedAt: link.updatedAt,
      },
      metrics: {
        totalClicks: Number(summaryRow?.total_clicks || 0),
        clicksToday: Number(summaryRow?.clicks_today || 0),
        uniqueVisitors: Number(summaryRow?.unique_visitors || 0),
        activeLinks: link.isActive ? 1 : 0,
        botClicksFiltered: Number(summaryRow?.bot_clicks || 0),
      },
      timeSeries: timeSeriesRows.map((r) => ({
        date: r.date_bucket,
        clicks: Number(r.clicks || 0),
        unique: Number(r.unique_clicks || 0),
      })),
      hourlyActivity,
      devices: deviceRows.map((r) => ({ name: r.name, value: Number(r.value) })),
      browsers: browserRows.map((r) => ({ name: r.name, value: Number(r.value) })),
      operatingSystems: osRows.map((r) => ({ name: r.name, value: Number(r.value) })),
      referrers: referrerRows.map((r) => ({ name: r.name, value: Number(r.value) })),
      recentClicks,
    });
  } catch (err: any) {
    console.error('Link analytics error:', err);
    return NextResponse.json({ success: false, error: 'Failed to retrieve link analytics.' }, { status: 500 });
  }
}
