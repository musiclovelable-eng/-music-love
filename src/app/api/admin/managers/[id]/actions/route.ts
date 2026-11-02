import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { managerActions, artists } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { getSessionFromRequest } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'UNAUTHENTICATED' },
        { status: 401 }
      );
    }

    if (!session.isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required', code: 'FORBIDDEN' },
        { status: 401 }
      );
    }

    const managerId = parseInt(params.id);

    if (isNaN(managerId)) {
      return NextResponse.json(
        { error: 'Valid manager ID is required', code: 'INVALID_MANAGER_ID' },
        { status: 400 }
      );
    }

    const managerIdInt = managerId;

    // Verify manager exists and is actually a manager
    const manager = await db
      .select()
      .from(artists)
      .where(eq(artists.id, managerIdInt))
      .limit(1);

    if (manager.length === 0 || !manager[0].isManager) {
      return NextResponse.json(
        { error: 'Manager not found', code: 'MANAGER_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Query actions with target artist information
    const actions = await db
      .select({
        id: managerActions.id,
        managerId: managerActions.managerId,
        action: managerActions.action,
        targetId: managerActions.targetId,
        details: managerActions.details,
        createdAt: managerActions.createdAt,
        targetName: artists.name,
        targetEmail: artists.email,
      })
      .from(managerActions)
      .leftJoin(artists, eq(managerActions.targetId, artists.id))
      .where(eq(managerActions.managerId, managerIdInt))
      .orderBy(desc(managerActions.createdAt));

    return NextResponse.json({ actions }, { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}