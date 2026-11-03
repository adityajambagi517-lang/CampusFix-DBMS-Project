import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';
import { UserSession } from '@/types';

const JWT_SECRET = process.env.JWT_SECRET || 'campusfix_super_secure_jwt_token_pes_university_2026_level3';

export async function hashPassword(plain: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plain, salt);
}

export async function comparePassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export function signToken(payload: UserSession): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): UserSession | null {
  try {
    return jwt.verify(token, JWT_SECRET) as UserSession;
  } catch {
    return null;
  }
}

export function getUserFromRequest(req: NextRequest): UserSession | null {
  // Check Authorization Bearer header
  const authHeader = req.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const user = verifyToken(token);
    if (user) return user;
  }

  // Check Cookie
  const tokenCookie = req.cookies.get('campusfix_token');
  if (tokenCookie?.value) {
    return verifyToken(tokenCookie.value);
  }

  return null;
}

