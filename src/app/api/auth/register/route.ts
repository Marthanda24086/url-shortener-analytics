import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { hashPassword, signToken, AUTH_COOKIE_NAME } from '@/lib/auth';
import { queryRow, executeSql } from '@/lib/db';
import { checkRateLimit } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  try {
    const rateCheck = checkRateLimit(req, 10, 60000);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { success: false, error: 'Registration rate limit exceeded. Please wait a moment.' },
        { status: 429, headers: { 'Retry-After': String(rateCheck.retryAfterSeconds) } }
      );
    }
    const body = await req.json();
    const { name, email, password } = body;

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return NextResponse.json({ success: false, error: 'Full name must be at least 2 characters.' }, { status: 400 });
    }

    if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return NextResponse.json({ success: false, error: 'A valid email address is required.' }, { status: 400 });
    }

    if (!password || typeof password !== 'string' || password.length < 8) {
      return NextResponse.json({ success: false, error: 'Password must be at least 8 characters long.' }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check if user already exists
    const existing = await queryRow<{ id: string }>(
      'SELECT id FROM users WHERE email = ?',
      [normalizedEmail]
    );

    if (existing) {
      return NextResponse.json({ success: false, error: 'An account with this email address already exists.' }, { status: 409 });
    }

    const userId = `usr_${crypto.randomUUID()}`;
    const passwordHash = await hashPassword(password);
    const now = new Date().toISOString();

    await executeSql(
      'INSERT INTO users (id, name, email, password_hash, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, name.trim(), normalizedEmail, passwordHash, now, now]
    );

    const token = signToken({
      userId,
      email: normalizedEmail,
      name: name.trim(),
    });

    const res = NextResponse.json({
      success: true,
      user: {
        id: userId,
        name: name.trim(),
        email: normalizedEmail,
      },
    }, { status: 201 });

    // Set secure HTTP-only cookie
    res.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return res;
  } catch (err: any) {
    console.error('Registration error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error processing registration.' }, { status: 500 });
  }
}
