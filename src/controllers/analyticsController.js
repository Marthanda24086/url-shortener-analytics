// ============================================================
// src/controllers/analyticsController.js
// PURPOSE: Analytics query logic — aggregations, time-series, stats.
// WHY: Heavy MongoDB aggregation pipelines belong in controllers.
// HOW: Uses MongoDB's Aggregation Pipeline for all analytics.
// ============================================================

const Click = require('../models/Click');
const Url = require('../models/Url');

/**
 * WHAT IS AN AGGREGATION PIPELINE?
 *
 * MongoDB's aggregation pipeline is like Unix pipes for data.
 * Each stage transforms the data:
 *   collection → [$match] → [$group] → [$sort] → result
 *
 * Common stages:
 *  $match  → like WHERE in SQL — filter documents
 *  $group  → like GROUP BY — aggregate documents
 *  $sort   → sort results
 *  $limit  → limit number of results
 *  $count  → count documents
 *  $lookup → like JOIN — combine collections
 *  $project → like SELECT — choose/reshape fields
 */

// ── getClickStats ─────────────────────────────────────────────────────────────
/**
 * GET /api/analytics/:code
 * Returns comprehensive analytics for a short URL.
 */
const getClickStats = async (req, res) => {
  try {
    const { code } = req.params;
    const days = parseInt(req.query.days) || 30; // Default: last 30 days

    // Find the URL document
    const urlDoc = await Url.findByCode(code);
    if (!urlDoc) {
      return res.status(404).json({ success: false, error: 'URL not found' });
    }

    // Authorization: only the URL owner can see analytics
    if (urlDoc.apiKey !== req.apiKey) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    // Date boundary: "days" days ago from now
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // ── Base match stage (used in all sub-queries) ────────────────────────────
    const baseMatch = {
      shortCode: urlDoc.shortCode,
      clickedAt: { $gte: startDate },
    };

    // ── Run all aggregations in parallel (Promise.all) ────────────────────────
    // Promise.all([p1, p2, p3]) fires all three queries simultaneously
    // Much faster than sequential await
    const [
      totalClicks,
      uniqueVisitors,
      clicksByDay,
      clicksByCountry,
      clicksByBrowser,
      clicksByOs,
      clicksByDevice,
      clicksByReferrer,
      clicksByHour,
    ] = await Promise.all([

      // 1. Total clicks in period
      Click.countDocuments(baseMatch),

      // 2. Unique visitors (distinct hashed IPs)
      Click.distinct('ip', baseMatch).then((ips) => ips.length),

      // 3. Clicks per day (time-series for line chart)
      Click.aggregate([
        { $match: baseMatch },
        {
          $group: {
            _id: {
              // $dateToString formats the date; truncate to day
              date: { $dateToString: { format: '%Y-%m-%d', date: '$clickedAt' } },
            },
            count: { $sum: 1 }, // $sum:1 counts documents in each group
          },
        },
        { $sort: { '_id.date': 1 } }, // Chronological order
        { $project: { _id: 0, date: '$_id.date', count: 1 } },
      ]),

      // 4. Clicks by country (for map/bar chart)
      Click.aggregate([
        { $match: baseMatch },
        { $group: { _id: '$country', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
        { $project: { _id: 0, country: '$_id', count: 1 } },
      ]),

      // 5. Clicks by browser
      Click.aggregate([
        { $match: baseMatch },
        { $group: { _id: '$browser', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
        { $project: { _id: 0, browser: '$_id', count: 1 } },
      ]),

      // 6. Clicks by OS
      Click.aggregate([
        { $match: baseMatch },
        { $group: { _id: '$os', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
        { $project: { _id: 0, os: '$_id', count: 1 } },
      ]),

      // 7. Clicks by device type
      Click.aggregate([
        { $match: baseMatch },
        { $group: { _id: '$device', count: { $sum: 1 } } },
        { $project: { _id: 0, device: '$_id', count: 1 } },
      ]),

      // 8. Clicks by referrer
      Click.aggregate([
        { $match: baseMatch },
        { $group: { _id: '$referrer', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
        { $project: { _id: 0, referrer: '$_id', count: 1 } },
      ]),

      // 9. Clicks by hour of day (0-23) — best time to post
      Click.aggregate([
        { $match: baseMatch },
        {
          $group: {
            _id: { $hour: '$clickedAt' }, // $hour extracts hour from Date
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
        { $project: { _id: 0, hour: '$_id', count: 1 } },
      ]),
    ]);

    return res.json({
      success: true,
      data: {
        url: {
          shortCode: urlDoc.shortCode,
          customAlias: urlDoc.customAlias,
          originalUrl: urlDoc.originalUrl,
          totalClicks: urlDoc.clicks, // All-time count
          createdAt: urlDoc.createdAt,
        },
        period: {
          days,
          totalClicks,
          uniqueVisitors,
          botClicks: await Click.countDocuments({ ...baseMatch, isBot: true }),
        },
        charts: {
          clicksByDay,
          clicksByCountry,
          clicksByBrowser,
          clicksByOs,
          clicksByDevice,
          clicksByReferrer,
          clicksByHour,
        },
      },
    });

  } catch (err) {
    console.error('getClickStats error:', err);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

// ── getDashboardStats ─────────────────────────────────────────────────────────
/**
 * GET /api/analytics/dashboard
 * High-level stats for the dashboard overview.
 */
const getDashboardStats = async (req, res) => {
  try {
    const [totalUrls, totalClicks, topUrls, recentClicks] = await Promise.all([

      // Total active URLs for this API key
      Url.countDocuments({ apiKey: req.apiKey, isActive: true }),

      // Sum all clicks for this API key's URLs
      Url.aggregate([
        { $match: { apiKey: req.apiKey, isActive: true } },
        { $group: { _id: null, total: { $sum: '$clicks' } } },
      ]).then((r) => r[0]?.total || 0),

      // Top 5 performing URLs
      Url.find({ apiKey: req.apiKey, isActive: true })
        .sort({ clicks: -1 })
        .limit(5)
        .select('shortCode customAlias originalUrl clicks title'),

      // Recent 10 click events
      Click.find({ })
        .sort({ clickedAt: -1 })
        .limit(10)
        .select('shortCode browser country device clickedAt'),
    ]);

    return res.json({
      success: true,
      data: {
        totalUrls,
        totalClicks,
        topUrls,
        recentClicks,
      },
    });

  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

module.exports = { getClickStats, getDashboardStats };
