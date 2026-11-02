import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { artists, passwordHistory, managerActions } from '@/db/schema';
import { eq, and, count } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import { getSessionFromRequest } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session || !session.isAdmin) {
      return NextResponse.json({ 
        error: 'Admin authentication required',
        code: 'ADMIN_AUTH_REQUIRED' 
      }, { status: 401 });
    }

    const managerId = parseInt(params.id);

    const managerRecord = await db.select()
      .from(artists)
      .where(and(
        eq(artists.id, managerId),
        eq(artists.isManager, true)
      ))
      .limit(1);

    if (managerRecord.length === 0) {
      return NextResponse.json({ 
        error: 'Manager not found',
        code: 'MANAGER_NOT_FOUND' 
      }, { status: 404 });
    }

    const manager = managerRecord[0];

    const artistCountResult = await db.select({ count: count() })
      .from(artists)
      .where(eq(artists.managerId, managerId));

    const artistCount = artistCountResult[0]?.count || 0;

    const artistsList = await db.select({
      id: artists.id,
      name: artists.name,
      email: artists.email,
      plan: artists.plan
    })
      .from(artists)
      .where(eq(artists.managerId, managerId));

    return NextResponse.json({
      manager: {
        ...manager,
        artistCount,
        artists: artistsList
      }
    }, { status: 200 });

  } catch (error) {
    console.error('GET manager error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
    }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session || !session.isAdmin) {
      return NextResponse.json({ 
        error: 'Admin authentication required',
        code: 'ADMIN_AUTH_REQUIRED' 
      }, { status: 401 });
    }

    const managerId = parseInt(params.id);

    const managerRecord = await db.select()
      .from(artists)
      .where(and(
        eq(artists.id, managerId),
        eq(artists.isManager, true)
      ))
      .limit(1);

    if (managerRecord.length === 0) {
      return NextResponse.json({ 
        error: 'Manager not found',
        code: 'MANAGER_NOT_FOUND' 
      }, { status: 404 });
    }

    const currentManager = managerRecord[0];
    const body = await request.json();

    const allowedFields = ['name', 'email', 'isFrozen', 'isBlocked', 'password', 'plan'];
    const updates: any = {};

    for (const field of allowedFields) {
      if (field in body) {
        if (field === 'email') {
          const newEmail = body.email.trim().toLowerCase();
          if (newEmail !== currentManager.email) {
            const existingEmail = await db.select()
              .from(artists)
              .where(eq(artists.email, newEmail))
              .limit(1);

            if (existingEmail.length > 0) {
              return NextResponse.json({ 
                error: 'Email already exists',
                code: 'EMAIL_EXISTS' 
              }, { status: 400 });
            }
            updates.email = newEmail;
          }
        } else if (field === 'password') {
          const hashedPassword = await bcrypt.hash(body.password, 10);
          updates.password = hashedPassword;

          await db.insert(passwordHistory).values({
            artistId: managerId,
            password: hashedPassword,
            createdAt: new Date().toISOString()
          });
        } else if (field === 'isFrozen') {
          const newFrozenState = body.isFrozen;
          if (newFrozenState !== currentManager.isFrozen) {
            updates.isFrozen = newFrozenState;

            await db.insert(managerActions).values({
              managerId: session.userId,
              action: newFrozenState ? 'freeze_manager' : 'unfreeze_manager',
              targetId: managerId,
              details: JSON.stringify({
                managerName: currentManager.name,
                managerEmail: currentManager.email,
                previousState: currentManager.isFrozen,
                newState: newFrozenState
              }),
              createdAt: new Date().toISOString()
            });
          }
        } else if (field === 'name') {
          updates.name = body.name.trim();
        } else {
          updates[field] = body[field];
        }
      }
    }

    if (Object.keys(updates).length > 0) {
      await db.update(artists)
        .set(updates)
        .where(eq(artists.id, managerId));
    }

    return NextResponse.json({ 
      success: true 
    }, { status: 200 });

  } catch (error) {
    console.error('PATCH manager error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
    }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session || !session.isAdmin) {
      return NextResponse.json({ 
        error: 'Admin authentication required',
        code: 'ADMIN_AUTH_REQUIRED' 
      }, { status: 401 });
    }

    const managerId = parseInt(params.id);

    const managerRecord = await db.select()
      .from(artists)
      .where(and(
        eq(artists.id, managerId),
        eq(artists.isManager, true)
      ))
      .limit(1);

    if (managerRecord.length === 0) {
      return NextResponse.json({ 
        error: 'Manager not found',
        code: 'MANAGER_NOT_FOUND' 
      }, { status: 404 });
    }

    const assignedArtistsCount = await db.select({ count: count() })
      .from(artists)
      .where(eq(artists.managerId, managerId));

    const artistCount = assignedArtistsCount[0]?.count || 0;

    if (artistCount > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete manager with assigned artists. Reassign or delete artists first.',
        code: 'MANAGER_HAS_ARTISTS',
        artistCount 
      }, { status: 400 });
    }

    await db.delete(artists)
      .where(eq(artists.id, managerId));

    return NextResponse.json({ 
      success: true,
      message: 'Manager deleted'
    }, { status: 200 });

  } catch (error) {
    console.error('DELETE manager error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
    }, { status: 500 });
  }
}