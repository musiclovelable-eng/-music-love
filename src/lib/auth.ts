import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { db } from '@/db';
import { artists } from '@/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import { NextRequest } from 'next/server';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'nightvolt-secret-key-2025'
);
const SESSION_COOKIE = 'music_love_session';

export interface SessionData {
  userId: number;
  email: string;
  isAdmin: boolean;
  isManager: boolean;
  isFrozen: boolean;
  uid: string;
  name: string;
  plan: string;
    isApproved: boolean;
    requiresApproval: boolean;
    emailVerified: boolean;
  }


export async function createSession(data: SessionData) {
  const token = await new SignJWT(data as any)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET);

  const cookieStore = await cookies();
  const isProduction = process.env.NODE_ENV === 'production';
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: isProduction,
    // The live preview is embedded on another site. None + Partitioned lets
    // the session survive the redirect inside that preview without weakening
    // the HttpOnly protection of the cookie.
    sameSite: isProduction ? 'none' : 'lax',
    partitioned: isProduction,
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  });

  return token;
}

export async function getSession(): Promise<SessionData | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as SessionData;
  } catch {
    return null;
  }
}

export async function getSessionFromRequest(request: NextRequest): Promise<SessionData | null> {
  try {
    // Сначала пробуем получить из Authorization header
    const authHeader = request.headers.get('authorization');
    let token: string | null = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }

    // Если нет в header, пробуем из cookies
    if (!token) {
      token = request.cookies.get(SESSION_COOKIE)?.value || null;
    }

    if (!token) return null;

    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as SessionData;
  } catch (error) {
    console.error('Session verification error:', error);
    return null;
  }
}

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function verifyCredentials(email: string, password: string) {
  const [artist] = await db
    .select()
    .from(artists)
    .where(eq(artists.email, email))
    .limit(1);

  if (!artist) {
    return null;
  }

  if (artist.isBlocked) {
    throw new Error('BLOCKED');
  }

  if (!artist.emailVerified) {
    throw new Error('EMAIL_NOT_VERIFIED');
  }

  if (artist.requiresApproval && !artist.isApproved) {
    throw new Error('PENDING_APPROVAL');
  }

  if (artist.isFrozen && artist.isManager) {
    throw new Error('FROZEN');
  }

  const isValid = await bcrypt.compare(password, artist.password);

  if (!isValid) {
    return null;
  }

    return {
      userId: artist.id,
      email: artist.email,
      isAdmin: artist.isAdmin || false,
      isManager: artist.isManager || false,
      isFrozen: artist.isFrozen || false,
      uid: artist.uid,
      name: artist.name,
      plan: artist.plan,
      isApproved: !!artist.isApproved,
      requiresApproval: !!artist.requiresApproval,
      emailVerified: !!artist.emailVerified,
    };

}