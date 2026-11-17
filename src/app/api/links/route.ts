import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getAuthenticatedUser } from '@/lib/auth';
import { queryRows, queryRow, executeSql } from '@/lib/db';
import {
  validateDestinationUrl,
  generateShortCode,
  isValidSlug,
  isReservedSlug,
  getBaseUrl,
} from '@/lib/utils';
import { checkRateLimit } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const auth = getAuthenticatedUser(req);
    if (!auth) {
      return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search')?.trim() || '';
    const status = searchParams.get('status') || 'all'; // all | active | paused | expired
    const sortBy = searchParams.get('sortBy') || 'createdAt'; // createdAt | clicks | title
    const sortOrder = searchParams.get('sortOrder')?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get('limit') || '10', 10)));
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE l.user_id = ?';
    const args: any[] = [auth.userId];

    if (search) {
      whereClause += ' AND (l.title LIKE ? OR l.short_code LIKE ? OR l.original_url LIKE ?)';
      const queryPattern = `%${search}%`;
      args.push(queryPattern, queryPattern, queryPattern);
    }

    const nowIso = new Date().toISOString();
    if (status === 'active') {
      whereClause += ' AND l.is_active = 1 AND (l.expires_at IS NULL OR l.expires_at > ?)';
      args.push(nowIso);
    } else if (status === 'paused') {
      whereClause += ' AND l.is_active = 0';
    } else if (status === 'expired') {
      whereClause += ' AND l.expires_at IS NOT NULL AND l.expires_at <= ?';
      args.push(nowIso);
    }

    // Count total matching
    const countSql = `SELECT COUNT(*) as total FROM links l ${whereClause}`;
    const countResult = await queryRow<{ total: number }>(countSql, args);
    const total = Number(countResult?.total || 0);

    // Sort column mapping
    let orderColumn = 'l.created_at';
    if (sortBy === 'clicks') orderColumn = 'total_clicks';
    else if (sortBy === 'title') orderColumn = 'l.title';

    const listSql = `
      SELECT 
        l.id,
        l.user_id as userId,
        l.original_url as originalUrl,
        l.short_code as shortCode,
        l.title,
        l.is_active as isActive,
        l.expires_at as expiresAt,
        l.created_at as createdAt,
        l.updated_at as updatedAt,
        COUNT(c.id) as total_clicks
      FROM links l
      LEFT JOIN click_events c ON l.id = c.link_id AND c.is_bot = 0
      ${whereClause}
      GROUP BY l.id
      ORDER BY ${orderColumn} ${sortOrder}
      LIMIT ? OFFSET ?
    `;

    const listArgs = [...args, limit, offset];
    const rows = await queryRows<any>(listSql, listArgs);

    const formattedLinks = rows.map((r) => ({
      id: r.id,
      userId: r.userId,
      originalUrl: r.originalUrl,
      shortCode: r.shortCode,
      title: r.title || 'Untitled Link',
      isActive: Boolean(r.isActive),
      expiresAt: r.expiresAt,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      totalClicks: Number(r.total_clicks || 0),
    }));

    return NextResponse.json({
      success: true,
      links: formattedLinks,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (err: any) {
    console.error('Fetch links error:', err);
    return NextResponse.json({ success: false, error: 'Failed to retrieve links.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const rateCheck = checkRateLimit(req, 40, 60000);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { success: false, error: 'Link creation rate limit reached. Please wait a moment.' },
        { status: 429, headers: { 'Retry-After': String(rateCheck.retryAfterSeconds) } }
      );
    }
    const auth = getAuthenticatedUser(req);
    if (!auth) {
      return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
    }

    const body = await req.json();
    const { originalUrl, customAlias, title, expiresAt } = body;

    const validation = validateDestinationUrl(originalUrl);
    if (!validation.valid || !validation.normalized) {
      return NextResponse.json({ success: false, error: validation.error || 'Invalid destination URL.' }, { status: 400 });
    }

    let finalShortCode = '';

    if (customAlias && customAlias.trim() !== '') {
      const slug = customAlias.trim();
      if (!isValidSlug(slug)) {
        return NextResponse.json({
          success: false,
          error: 'Custom alias must be 3-32 characters long and contain only letters, numbers, hyphens, and underscores.',
        }, { status: 400 });
      }

      if (isReservedSlug(slug)) {
        return NextResponse.json({
          success: false,
          error: `The alias "${slug}" is reserved for system routes. Please choose a different alias.`,
        }, { status: 400 });
      }

      const existing = await queryRow<{ id: string }>(
        'SELECT id FROM links WHERE short_code = ?',
        [slug]
      );

      if (existing) {
        return NextResponse.json({
          success: false,
          error: `The alias "${slug}" is already in use. Please select a unique alias.`,
        }, { status: 409 });
      }

      finalShortCode = slug;
    } else {
      // Generate unique short code with collision loop retry
      let attempts = 0;
      let generated = '';
      while (attempts < 5) {
        generated = generateShortCode(6);
        if (isReservedSlug(generated)) {
          attempts++;
          continue;
        }
        const existing = await queryRow<{ id: string }>(
          'SELECT id FROM links WHERE short_code = ?',
          [generated]
        );
        if (!existing) {
          finalShortCode = generated;
          break;
        }
        attempts++;
      }

      if (!finalShortCode) {
        finalShortCode = generateShortCode(8);
      }
    }

    // Expiration date validation
    let validExpiresAt: string | null = null;
    if (expiresAt) {
      const expDate = new Date(expiresAt);
      if (isNaN(expDate.getTime())) {
        return NextResponse.json({ success: false, error: 'Invalid expiration date format.' }, { status: 400 });
      }
      if (expDate <= new Date()) {
        return NextResponse.json({ success: false, error: 'Expiration date must be in the future.' }, { status: 400 });
      }
      validExpiresAt = expDate.toISOString();
    }

    const linkId = `lnk_${crypto.randomUUID()}`;
    const now = new Date().toISOString();
    const finalTitle = title && title.trim() ? title.trim() : validation.normalized;

    await executeSql(
      `INSERT INTO links (id, user_id, original_url, short_code, title, is_active, expires_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?)`,
      [linkId, auth.userId, validation.normalized, finalShortCode, finalTitle, validExpiresAt, now, now]
    );

    const appUrl = getBaseUrl(req);
    const shortUrl = `${appUrl}/r/${finalShortCode}`;

    return NextResponse.json({
      success: true,
      link: {
        id: linkId,
        userId: auth.userId,
        originalUrl: validation.normalized,
        shortCode: finalShortCode,
        shortUrl,
        title: finalTitle,
        isActive: true,
        expiresAt: validExpiresAt,
        createdAt: now,
        updatedAt: now,
        totalClicks: 0,
      },
    }, { status: 201 });
  } catch (err: any) {
    console.error('Create link error:', err);
    return NextResponse.json({ success: false, error: 'Failed to create short link.' }, { status: 500 });
  }
}
