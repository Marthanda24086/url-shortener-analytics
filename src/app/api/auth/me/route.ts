import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { queryRow } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const auth = getAuthenticatedUser(req);
    if (!auth) {
      return NextResponse.json({ success: false, error: 'Unauthorized session.' }, { status: 401 });
    }

    const user = await queryRow<{ id: string; name: string; email: string; created_at: string }>(
      'SELECT id, name, email, created_at FROM users WHERE id = ?',
      [auth.userId]
    );

    if (!user) {
      return NextResponse.json({ success: false, error: 'User record not found.' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.created_at,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: 'Failed to verify session.' }, { status: 500 });
  }
}
