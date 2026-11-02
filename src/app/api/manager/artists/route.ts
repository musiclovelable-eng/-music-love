import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { artists, managerActions, passwordHistory } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import { getSessionFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    
    if (!session) {
      return NextResponse.json({ 
        error: 'Authentication required',
        code: 'AUTH_REQUIRED' 
      }, { status: 401 });
    }

    // Get fresh manager data from database
    const [manager] = await db.select()
      .from(artists)
      .where(eq(artists.id, session.userId))
      .limit(1);

    if (!manager || !manager.isManager) {
      return NextResponse.json({ 
        error: 'Manager authentication required',
        code: 'MANAGER_AUTH_REQUIRED' 
      }, { status: 401 });
    }

    if (manager.isFrozen) {
      return NextResponse.json({ 
        error: 'Manager account is frozen',
        code: 'MANAGER_FROZEN' 
      }, { status: 403 });
    }

    const artistsList = await db.select()
      .from(artists)
      .where(
        and(
          eq(artists.managerId, session.userId),
          eq(artists.isManager, false),
          eq(artists.isAdmin, false)
        )
      )
      .orderBy(desc(artists.createdAt));

    return NextResponse.json({ artists: artistsList }, { status: 200 });

  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    
    if (!session) {
      return NextResponse.json({ 
        error: 'Authentication required',
        code: 'AUTH_REQUIRED' 
      }, { status: 401 });
    }

    // Get fresh manager data from database
    const [manager] = await db.select()
      .from(artists)
      .where(eq(artists.id, session.userId))
      .limit(1);

    if (!manager || !manager.isManager) {
      return NextResponse.json({ 
        error: 'Manager authentication required',
        code: 'MANAGER_AUTH_REQUIRED' 
      }, { status: 401 });
    }

    if (manager.isFrozen) {
      return NextResponse.json({ 
        error: 'Manager account is frozen',
        code: 'MANAGER_FROZEN' 
      }, { status: 403 });
    }

    const body = await request.json();
    const { email, name, password, plan = 'basic' } = body;

    if (!email || !name || !password) {
      return NextResponse.json({ 
        error: 'Required fields missing: email, name, password',
        code: 'MISSING_REQUIRED_FIELDS' 
      }, { status: 400 });
    }

    const sanitizedEmail = email.trim().toLowerCase();
    const sanitizedName = name.trim();

    const existingArtist = await db.select()
      .from(artists)
      .where(eq(artists.email, sanitizedEmail))
      .limit(1);

    if (existingArtist.length > 0) {
      return NextResponse.json({ 
        error: 'Email already exists',
        code: 'EMAIL_EXISTS' 
      }, { status: 400 });
    }

    const uid = `artist-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    
    const hashedPassword = await bcrypt.hash(password, 10);

    const newArtist = await db.insert(artists)
      .values({
        uid,
        email: sanitizedEmail,
        password: hashedPassword,
        name: sanitizedName,
        plan,
        isManager: false,
        isAdmin: false,
        isApproved: true,
        emailVerified: true,
        managerId: session.userId,
        isFrozen: false,
        theme: 'light',
        showSnowflakes: false,
        showGarland: false,
        label: 'Music Love',
        isBlocked: false,
        isDeactivated: false,
        createdAt: new Date().toISOString()
      })
      .returning();

    await db.insert(managerActions)
      .values({
        managerId: session.userId,
        action: 'create_artist',
        targetId: newArtist[0].id,
        details: JSON.stringify({ email: sanitizedEmail, name: sanitizedName, plan }),
        createdAt: new Date().toISOString()
      });

    await db.insert(passwordHistory)
      .values({
        artistId: newArtist[0].id,
        password: hashedPassword,
        createdAt: new Date().toISOString()
      });

    return NextResponse.json(newArtist[0], { status: 201 });

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
    }, { status: 500 });
  }
}