import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'kairo_default_super_secret_key_change_me_2026';
export const AUTH_COOKIE_NAME = 'kairo_token';

export interface TokenPayload {
  userId: string;
  email: string;
  name: string;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch {
    return null;
  }
}

/**
 * Extracts the authenticated user payload from either HTTP-only cookie or Authorization header.
 */
export function getAuthenticatedUser(req: NextRequest): TokenPayload | null {
  // Check cookie first
  const cookie = req.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (cookie) {
    const verified = verifyToken(cookie);
    if (verified) return verified;
  }

  // Check Authorization header fallback
  const authHeader = req.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim();
    return verifyToken(token);
  }

  return null;
}
