import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { db } from '@/db';
import { tickets, ticketNotes, artists } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const ticketId = parseInt(id);
    if (isNaN(ticketId)) {
      return NextResponse.json(
        { error: 'Valid ticket ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    if (!session.isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    const ticket = await db
      .select()
      .from(tickets)
      .where(eq(tickets.id, ticketId))
      .limit(1);

    if (ticket.length === 0) {
      return NextResponse.json(
        { error: 'Ticket not found', code: 'TICKET_NOT_FOUND' },
        { status: 404 }
      );
    }

    const notes = await db
      .select()
      .from(ticketNotes)
      .where(eq(ticketNotes.ticketId, ticketId))
      .orderBy(desc(ticketNotes.createdAt));

    return NextResponse.json({ notes });
  } catch (error) {
    console.error('GET ticket notes error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const ticketId = parseInt(id);
    if (isNaN(ticketId)) {
      return NextResponse.json(
        { error: 'Valid ticket ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    if (!session.isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { note } = body;

    if (!note || typeof note !== 'string' || note.trim().length === 0) {
      return NextResponse.json(
        { error: 'Note is required and must not be empty', code: 'MISSING_NOTE' },
        { status: 400 }
      );
    }

    const ticket = await db
      .select()
      .from(tickets)
      .where(eq(tickets.id, ticketId))
      .limit(1);

    if (ticket.length === 0) {
      return NextResponse.json(
        { error: 'Ticket not found', code: 'TICKET_NOT_FOUND' },
        { status: 404 }
      );
    }

    const admin = await db
      .select()
      .from(artists)
      .where(eq(artists.id, session.userId))
      .limit(1);

    if (admin.length === 0) {
      return NextResponse.json(
        { error: 'Admin user not found', code: 'ADMIN_NOT_FOUND' },
        { status: 404 }
      );
    }

    const newNote = await db
      .insert(ticketNotes)
      .values({
        ticketId,
        note: note.trim(),
        createdAt: new Date().toISOString(),
        createdBy: admin[0].name,
        createdById: session.userId,
      })
      .returning();

    return NextResponse.json(
      { success: true, note: newNote[0] },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST ticket note error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}