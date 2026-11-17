import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { queryRow, executeSql } from '@/lib/db';
import { validateDestinationUrl, isValidSlug, isReservedSlug, getBaseUrl } from '@/lib/utils';

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
        l.updated_at as updatedAt,
        COUNT(c.id) as total_clicks
       FROM links l
       LEFT JOIN click_events c ON l.id = c.link_id AND c.is_bot = 0
       WHERE l.id = ? AND l.user_id = ?
       GROUP BY l.id`,
      [params.id, auth.userId]
    );

    if (!link) {
      return NextResponse.json({ success: false, error: 'Link not found or access denied.' }, { status: 404 });
    }

    const appUrl = getBaseUrl(req);

    return NextResponse.json({
      success: true,
      link: {
        id: link.id,
        userId: link.userId,
        originalUrl: link.originalUrl,
        shortCode: link.shortCode,
        shortUrl: `${appUrl}/r/${link.shortCode}`,
        title: link.title,
        isActive: Boolean(link.isActive),
        expiresAt: link.expiresAt,
        createdAt: link.createdAt,
        updatedAt: link.updatedAt,
        totalClicks: Number(link.total_clicks || 0),
      },
    });
  } catch (err: any) {
    console.error('Fetch link error:', err);
    return NextResponse.json({ success: false, error: 'Failed to retrieve link.' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  try {
    const auth = getAuthenticatedUser(req);
    if (!auth) {
      return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
    }

    const existing = await queryRow<any>(
      'SELECT id, short_code, original_url, title, is_active, expires_at FROM links WHERE id = ? AND user_id = ?',
      [params.id, auth.userId]
    );

    if (!existing) {
      return NextResponse.json({ success: false, error: 'Link not found or unauthorized.' }, { status: 404 });
    }

    const body = await req.json();
    let updatedOriginalUrl = existing.original_url;
    let updatedTitle = existing.title;
    let updatedShortCode = existing.short_code;
    let updatedIsActive = existing.is_active;
    let updatedExpiresAt = existing.expires_at;

    if (body.originalUrl !== undefined) {
      const val = validateDestinationUrl(body.originalUrl);
      if (!val.valid || !val.normalized) {
        return NextResponse.json({ success: false, error: val.error || 'Invalid destination URL.' }, { status: 400 });
      }
      updatedOriginalUrl = val.normalized;
    }

    if (body.title !== undefined) {
      updatedTitle = body.title ? body.title.trim() : updatedOriginalUrl;
    }

    if (body.isActive !== undefined) {
      updatedIsActive = body.isActive ? 1 : 0;
    }

    if (body.expiresAt !== undefined) {
      if (body.expiresAt === null || body.expiresAt === '') {
        updatedExpiresAt = null;
      } else {
        const exp = new Date(body.expiresAt);
        if (isNaN(exp.getTime())) {
          return NextResponse.json({ success: false, error: 'Invalid expiration date.' }, { status: 400 });
        }
        updatedExpiresAt = exp.toISOString();
      }
    }

    if (body.customAlias !== undefined && body.customAlias.trim() !== existing.short_code) {
      const slug = body.customAlias.trim();
      if (!isValidSlug(slug)) {
        return NextResponse.json({
          success: false,
          error: 'Alias must be 3-32 characters long and contain only letters, numbers, hyphens, and underscores.',
        }, { status: 400 });
      }

      if (isReservedSlug(slug)) {
        return NextResponse.json({ success: false, error: `Alias "${slug}" is reserved.` }, { status: 400 });
      }

      const duplicate = await queryRow<{ id: string }>(
        'SELECT id FROM links WHERE short_code = ? AND id != ?',
        [slug, params.id]
      );
      if (duplicate) {
        return NextResponse.json({ success: false, error: `Alias "${slug}" is already taken.` }, { status: 409 });
      }
      updatedShortCode = slug;
    }

    const now = new Date().toISOString();
    await executeSql(
      `UPDATE links 
       SET original_url = ?, title = ?, short_code = ?, is_active = ?, expires_at = ?, updated_at = ?
       WHERE id = ? AND user_id = ?`,
      [updatedOriginalUrl, updatedTitle, updatedShortCode, updatedIsActive, updatedExpiresAt, now, params.id, auth.userId]
    );

    const appUrl = getBaseUrl(req);

    return NextResponse.json({
      success: true,
      link: {
        id: params.id,
        userId: auth.userId,
        originalUrl: updatedOriginalUrl,
        shortCode: updatedShortCode,
        shortUrl: `${appUrl}/r/${updatedShortCode}`,
        title: updatedTitle,
        isActive: Boolean(updatedIsActive),
        expiresAt: updatedExpiresAt,
        updatedAt: now,
      },
    });
  } catch (err: any) {
    console.error('Update link error:', err);
    return NextResponse.json({ success: false, error: 'Failed to update link.' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: RouteContext) {
  try {
    const auth = getAuthenticatedUser(req);
    if (!auth) {
      return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
    }

    const existing = await queryRow<{ id: string }>(
      'SELECT id FROM links WHERE id = ? AND user_id = ?',
      [params.id, auth.userId]
    );

    if (!existing) {
      return NextResponse.json({ success: false, error: 'Link not found or unauthorized.' }, { status: 404 });
    }

    // Cascade delete click_events first, then link
    await executeSql('DELETE FROM click_events WHERE link_id = ?', [params.id]);
    await executeSql('DELETE FROM links WHERE id = ? AND user_id = ?', [params.id, auth.userId]);

    return NextResponse.json({ success: true, message: 'Link successfully deleted.' });
  } catch (err: any) {
    console.error('Delete link error:', err);
    return NextResponse.json({ success: false, error: 'Failed to delete link.' }, { status: 500 });
  }
}
