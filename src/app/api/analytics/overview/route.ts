import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { queryRow, queryRows } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const auth = getAuthenticatedUser(req);
    if (!auth) {
      return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const range = searchParams.get('range') || '7d';

    // Calculate timestamp cutoff
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

    // 1. Overall Summary Metrics
    const summaryRow = await queryRow<any>(
      `SELECT 
        COUNT(CASE WHEN c.is_bot = 0 THEN 1 END) as total_clicks,
        COUNT(DISTINCT CASE WHEN c.is_bot = 0 THEN c.visitor_hash END) as unique_visitors,
        COUNT(CASE WHEN c.is_bot = 1 THEN 1 END) as bot_clicks,
        COUNT(CASE WHEN c.is_bot = 0 AND c.timestamp >= ? THEN 1 END) as clicks_today
       FROM click_events c
       JOIN links l ON c.link_id = l.id
       WHERE l.user_id = ? AND c.timestamp >= ?`,
      [todayStartIso, auth.userId, cutoffIso]
    );

    const activeLinksRow = await queryRow<any>(
      `SELECT COUNT(*) as active_links FROM links WHERE user_id = ? AND is_active = 1`,
      [auth.userId]
    );

    // 2. Time Series Bucketing
    let timeSeriesSql = '';
    if (isHourly) {
      timeSeriesSql = `
        SELECT 
          strftime('%Y-%m-%d %H:00', c.timestamp) as date_bucket,
          COUNT(*) as clicks,
          COUNT(DISTINCT c.visitor_hash) as unique_clicks
        FROM click_events c
        JOIN links l ON c.link_id = l.id
        WHERE l.user_id = ? AND c.is_bot = 0 AND c.timestamp >= ?
        GROUP BY date_bucket
        ORDER BY date_bucket ASC
      `;
    } else {
      timeSeriesSql = `
        SELECT 
          strftime('%Y-%m-%d', c.timestamp) as date_bucket,
          COUNT(*) as clicks,
          COUNT(DISTINCT c.visitor_hash) as unique_clicks
        FROM click_events c
        JOIN links l ON c.link_id = l.id
        WHERE l.user_id = ? AND c.is_bot = 0 AND c.timestamp >= ?
        GROUP BY date_bucket
        ORDER BY date_bucket ASC
      `;
    }

    const timeSeriesRows = await queryRows<any>(timeSeriesSql, [auth.userId, cutoffIso]);
    const timeSeries = timeSeriesRows.map((r) => ({
      date: r.date_bucket,
      clicks: Number(r.clicks || 0),
      unique: Number(r.unique_clicks || 0),
    }));

    // 3. Device Breakdown
    const deviceRows = await queryRows<any>(
      `SELECT c.device_type as name, COUNT(*) as value
       FROM click_events c
       JOIN links l ON c.link_id = l.id
       WHERE l.user_id = ? AND c.is_bot = 0 AND c.timestamp >= ?
       GROUP BY c.device_type
       ORDER BY value DESC`,
      [auth.userId, cutoffIso]
    );

    // 4. Browser Breakdown
    const browserRows = await queryRows<any>(
      `SELECT c.browser as name, COUNT(*) as value
       FROM click_events c
       JOIN links l ON c.link_id = l.id
       WHERE l.user_id = ? AND c.is_bot = 0 AND c.timestamp >= ?
       GROUP BY c.browser
       ORDER BY value DESC`,
      [auth.userId, cutoffIso]
    );

    // 5. Operating System Breakdown
    const osRows = await queryRows<any>(
      `SELECT c.os as name, COUNT(*) as value
       FROM click_events c
       JOIN links l ON c.link_id = l.id
       WHERE l.user_id = ? AND c.is_bot = 0 AND c.timestamp >= ?
       GROUP BY c.os
       ORDER BY value DESC`,
      [auth.userId, cutoffIso]
    );

    // 6. Referrer Breakdown
    const referrerRows = await queryRows<any>(
      `SELECT c.referrer_domain as name, COUNT(*) as value
       FROM click_events c
       JOIN links l ON c.link_id = l.id
       WHERE l.user_id = ? AND c.is_bot = 0 AND c.timestamp >= ?
       GROUP BY c.referrer_domain
       ORDER BY value DESC
       LIMIT 10`,
      [auth.userId, cutoffIso]
    );

    // 7. Recent Click Activity Stream
    const recentActivityRows = await queryRows<any>(
      `SELECT 
        c.id,
        c.timestamp,
        c.referrer_domain as referrerDomain,
        c.browser,
        c.os,
        c.device_type as deviceType,
        l.short_code as shortCode,
        l.title as linkTitle
       FROM click_events c
       JOIN links l ON c.link_id = l.id
       WHERE l.user_id = ? AND c.is_bot = 0
       ORDER BY c.timestamp DESC
       LIMIT 10`,
      [auth.userId]
    );

    return NextResponse.json({
      success: true,
      range,
      metrics: {
        totalClicks: Number(summaryRow?.total_clicks || 0),
        clicksToday: Number(summaryRow?.clicks_today || 0),
        uniqueVisitors: Number(summaryRow?.unique_visitors || 0),
        activeLinks: Number(activeLinksRow?.active_links || 0),
        botClicksFiltered: Number(summaryRow?.bot_clicks || 0),
      },
      timeSeries,
      devices: deviceRows.map((r) => ({ name: r.name, value: Number(r.value) })),
      browsers: browserRows.map((r) => ({ name: r.name, value: Number(r.value) })),
      operatingSystems: osRows.map((r) => ({ name: r.name, value: Number(r.value) })),
      referrers: referrerRows.map((r) => ({ name: r.name, value: Number(r.value) })),
      recentActivity: recentActivityRows,
    });
  } catch (err: any) {
    console.error('Analytics overview error:', err);
    return NextResponse.json({ success: false, error: 'Failed to retrieve analytics overview.' }, { status: 500 });
  }
}
