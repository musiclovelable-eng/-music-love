import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { db } from '@/db';
import { releaseHistory, releases, artists } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authentication check - используем bearer token
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json(
        { error: 'Требуется авторизация', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    // Admin check
    if (!session.isAdmin) {
      return NextResponse.json(
        { error: 'Требуются права администратора', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    // Validate release ID
    const releaseId = parseInt(params.id);
    if (isNaN(releaseId)) {
      return NextResponse.json(
        { error: 'Некорректный ID релиза', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    // Check if release exists
    const [release] = await db
      .select()
      .from(releases)
      .where(eq(releases.id, releaseId))
      .limit(1);

    if (!release) {
      return NextResponse.json(
        { error: 'Релиз не найден', code: 'RELEASE_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Fetch history with release and artist information
    const history = await db
      .select({
        id: releaseHistory.id,
        releaseId: releaseHistory.releaseId,
        action: releaseHistory.action,
        field: releaseHistory.field,
        oldValue: releaseHistory.oldValue,
        newValue: releaseHistory.newValue,
        performedBy: releaseHistory.performedBy,
        performedAt: releaseHistory.performedAt,
        description: releaseHistory.description,
        releaseTitle: releases.title,
        artistName: artists.name,
      })
      .from(releaseHistory)
      .leftJoin(releases, eq(releaseHistory.releaseId, releases.id))
      .leftJoin(artists, eq(releases.artistId, artists.id))
      .where(eq(releaseHistory.releaseId, releaseId))
      .orderBy(desc(releaseHistory.performedAt));

    return NextResponse.json({ history });
  } catch (error) {
    console.error('GET history error:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authentication check - используем bearer token
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json(
        { error: 'Требуется авторизация', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    // Admin check
    if (!session.isAdmin) {
      return NextResponse.json(
        { error: 'Требуются права администратора', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    // Validate release ID
    const releaseId = parseInt(params.id);
    if (isNaN(releaseId)) {
      return NextResponse.json(
        { error: 'Некорректный ID релиза', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    // Check if release exists
    const [release] = await db
      .select()
      .from(releases)
      .where(eq(releases.id, releaseId))
      .limit(1);

    if (!release) {
      return NextResponse.json(
        { error: 'Релиз не найден', code: 'RELEASE_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { action, field, oldValue, newValue, performedBy, description } = body;

    // Validate required fields
    if (!action) {
      return NextResponse.json(
        { error: 'Action is required', code: 'MISSING_ACTION' },
        { status: 400 }
      );
    }

    if (!performedBy) {
      return NextResponse.json(
        { error: 'PerformedBy is required', code: 'MISSING_PERFORMED_BY' },
        { status: 400 }
      );
    }

    // Sanitize inputs
    const sanitizedAction = action.trim();
    const sanitizedPerformedBy = performedBy.trim();
    const sanitizedField = field ? field.trim() : null;
    const sanitizedOldValue = oldValue ? oldValue.trim() : null;
    const sanitizedNewValue = newValue ? newValue.trim() : null;
    const sanitizedDescription = description ? description.trim() : null;

    // Create history entry
    const [newHistory] = await db
      .insert(releaseHistory)
      .values({
        releaseId,
        action: sanitizedAction,
        field: sanitizedField,
        oldValue: sanitizedOldValue,
        newValue: sanitizedNewValue,
        performedBy: sanitizedPerformedBy,
        performedAt: new Date().toISOString(),
        description: sanitizedDescription,
      })
      .returning();

    return NextResponse.json(newHistory, { status: 201 });
  } catch (error) {
    console.error('POST history error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}