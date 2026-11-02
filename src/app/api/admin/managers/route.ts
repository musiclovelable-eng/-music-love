import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { artists } from '@/db/schema';
import { eq, or, desc, and, sql } from 'drizzle-orm';
import { getSessionFromRequest } from '@/lib/auth';
import bcrypt from 'bcrypt';

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session || !session.isAdmin) {
      return NextResponse.json(
        { error: 'Admin authentication required', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { email, name, password } = body;

    if (!email || !name || !password) {
      return NextResponse.json(
        { 
          error: 'Email, name, and password are required', 
          code: 'MISSING_REQUIRED_FIELDS' 
        },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format', code: 'INVALID_EMAIL' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const trimmedName = name.trim();

    const existingUser = await db.select()
      .from(artists)
      .where(eq(artists.email, normalizedEmail))
      .limit(1);

    if (existingUser.length > 0) {
      return NextResponse.json(
        { error: 'Email already exists', code: 'EMAIL_EXISTS' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { 
          error: 'Password must be at least 6 characters long', 
          code: 'WEAK_PASSWORD' 
        },
        { status: 400 }
      );
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const uid = `manager-${timestamp}-${random}`;

    const newManager = await db.insert(artists)
      .values({
        uid,
        email: normalizedEmail,
        password: hashedPassword,
        name: trimmedName,
        plan: 'basic',
        isManager: true,
        isAdmin: false,
        isApproved: true,
        emailVerified: true,
        isFrozen: false,
        isBlocked: false,
        isDeactivated: false,
        managerId: null,
        theme: 'light',
        showSnowflakes: false,
        showGarland: false,
        label: 'Music Love',
        createdAt: new Date().toISOString(),
      })
      .returning();

    const { password: _, ...managerWithoutPassword } = newManager[0];

    return NextResponse.json(managerWithoutPassword, { status: 201 });

  } catch (error) {
    console.error('POST manager error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session || !session.isAdmin) {
      return NextResponse.json(
        { error: 'Admin authentication required', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const managersAndAdmins = await db.select()
      .from(artists)
      .where(or(eq(artists.isManager, true), eq(artists.isAdmin, true)))
      .orderBy(desc(artists.createdAt));

    const managersWithStats = await Promise.all(
      managersAndAdmins.map(async (manager) => {
        const artistCountResult = await db.select({
          count: sql<number>`count(*)`.as('count')
        })
          .from(artists)
          .where(eq(artists.managerId, manager.id));

        const artistCount = Number(artistCountResult[0]?.count || 0);

        const { password: _, ...managerWithoutPassword } = manager;

        return {
          ...managerWithoutPassword,
          artistCount,
        };
      })
    );

    return NextResponse.json({ managers: managersWithStats }, { status: 200 });

  } catch (error) {
    console.error('GET managers error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}