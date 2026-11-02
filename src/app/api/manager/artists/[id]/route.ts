import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { artists, managerActions, passwordHistory } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import { getSessionFromRequest } from '@/lib/auth';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Get fresh manager data from database
    const [manager] = await db.select()
      .from(artists)
      .where(eq(artists.id, session.userId))
      .limit(1);

    if (!manager || !manager.isManager) {
      return NextResponse.json({ error: 'Manager access required' }, { status: 403 });
    }

    if (manager.isFrozen) {
      return NextResponse.json({ error: 'Manager account is frozen' }, { status: 403 });
    }

    const artistId = parseInt(params.id);

    if (isNaN(artistId)) {
      return NextResponse.json({ 
        error: 'Valid artist ID is required',
        code: 'INVALID_ID' 
      }, { status: 400 });
    }

    const artist = await db.select()
      .from(artists)
      .where(and(
        eq(artists.id, artistId),
        eq(artists.managerId, session.userId)
      ))
      .limit(1);

    if (artist.length === 0) {
      return NextResponse.json({ error: 'Artist not found' }, { status: 404 });
    }

    const body = await request.json();
    const allowedFields = ['name', 'email', 'password', 'plan', 'isBlocked', 'isDeactivated', 'deactivationReason', 'label'];
    
    const updates: Record<string, any> = {};
    const updatedFieldNames: string[] = [];

    for (const [key, value] of Object.entries(body)) {
      if (allowedFields.includes(key)) {
        if (key === 'password' && value) {
          const hashedPassword = await bcrypt.hash(value as string, 10);
          updates.password = hashedPassword;
          updatedFieldNames.push('password');

          await db.insert(passwordHistory).values({
            artistId: artistId,
            password: hashedPassword,
            createdAt: new Date().toISOString()
          });
        } else if (key === 'email' && value !== artist[0].email) {
          const normalizedEmail = (value as string).toLowerCase().trim();
          
          const existingUser = await db.select()
            .from(artists)
            .where(eq(artists.email, normalizedEmail))
            .limit(1);

          if (existingUser.length > 0 && existingUser[0].id !== artistId) {
            return NextResponse.json({ 
              error: 'Email already in use',
              code: 'EMAIL_EXISTS' 
            }, { status: 400 });
          }

          updates.email = normalizedEmail;
          updatedFieldNames.push('email');
        } else if (key === 'isBlocked' || key === 'isDeactivated') {
          updates[key] = value ? 1 : 0;
          updatedFieldNames.push(key);
        } else if (value !== undefined && value !== null) {
          updates[key] = value;
          updatedFieldNames.push(key);
        }
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ 
        error: 'No valid fields to update',
        code: 'NO_UPDATES' 
      }, { status: 400 });
    }

    await db.update(artists)
      .set(updates)
      .where(eq(artists.id, artistId));

    await db.insert(managerActions).values({
      managerId: session.userId,
      action: 'edit_artist',
      targetId: artistId,
      details: JSON.stringify({ updatedFields: updatedFieldNames }),
      createdAt: new Date().toISOString()
    });

    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error) {
    console.error('PATCH error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Get fresh manager data from database
    const [manager] = await db.select()
      .from(artists)
      .where(eq(artists.id, session.userId))
      .limit(1);

    if (!manager || !manager.isManager) {
      return NextResponse.json({ error: 'Manager access required' }, { status: 403 });
    }

    if (manager.isFrozen) {
      return NextResponse.json({ error: 'Manager account is frozen' }, { status: 403 });
    }

    const artistId = parseInt(params.id);

    if (isNaN(artistId)) {
      return NextResponse.json({ 
        error: 'Valid artist ID is required',
        code: 'INVALID_ID' 
      }, { status: 400 });
    }

    const artist = await db.select()
      .from(artists)
      .where(and(
        eq(artists.id, artistId),
        eq(artists.managerId, session.userId)
      ))
      .limit(1);

    if (artist.length === 0) {
      return NextResponse.json({ error: 'Artist not found' }, { status: 404 });
    }

    await db.insert(managerActions).values({
      managerId: session.userId,
      action: 'delete_artist',
      targetId: artistId,
      details: JSON.stringify({ 
        email: artist[0].email, 
        name: artist[0].name 
      }),
      createdAt: new Date().toISOString()
    });

    await db.delete(artists)
      .where(eq(artists.id, artistId));

    return NextResponse.json({ 
      success: true, 
      message: 'Artist deleted' 
    }, { status: 200 });

  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}