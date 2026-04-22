import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import { prisma } from './prisma';
import type { Role } from '@prisma/client';

const SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET || 'dev-secret-change-me-in-production-please-min32'
);
const COOKIE_NAME = 'hc_session';
const MAX_AGE = 60 * 60 * 24 * 7; // 7 ngày

export type SessionPayload = {
  sub: string;         // user.id
  email: string;
  role: Role;
  fullName: string;
};

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export async function createSession(payload: SessionPayload) {
  const token = await new SignJWT(payload as any)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(SECRET);

  cookies().set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: MAX_AGE,
  });
}

export async function destroySession() {
  cookies().delete(COOKIE_NAME);
}

export async function getSession(): Promise<SessionPayload | null> {
  const token = cookies().get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function requireAuth(allowed?: Role[]): Promise<SessionPayload> {
  const s = await getSession();
  if (!s) throw new Error('UNAUTHORIZED');
  if (allowed && !allowed.includes(s.role)) throw new Error('FORBIDDEN');
  return s;
}

export async function getCurrentUser() {
  const s = await getSession();
  if (!s) return null;
  return prisma.user.findUnique({
    where: { id: s.sub },
    include: { department: true },
  });
}
