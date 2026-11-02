import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { db } from '@/db';
import { tickets, ticketMessages, artists } from '@/db/schema';
import { eq, asc } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: ticketId } = await params;

    if (!ticketId || isNaN(parseInt(ticketId))) {
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

    const ticket = await db
      .select()
      .from(tickets)
      .where(eq(tickets.id, parseInt(ticketId)))
      .limit(1);

    if (ticket.length === 0) {
      return NextResponse.json(
        { error: 'Ticket not found', code: 'TICKET_NOT_FOUND' },
        { status: 404 }
      );
    }

    if (ticket[0].artistId !== session.userId) {
      return NextResponse.json(
        { error: 'Not authorized to view this ticket', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    const messages = await db
      .select()
      .from(ticketMessages)
      .where(eq(ticketMessages.ticketId, parseInt(ticketId)))
      .orderBy(asc(ticketMessages.createdAt));

    return NextResponse.json({ messages });
  } catch (error) {
    console.error('GET /api/tickets/[id]/messages error:', error);
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
    const { id: ticketId } = await params;

    if (!ticketId || isNaN(parseInt(ticketId))) {
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

    const body = await request.json();
    const { message } = body;

    if (!message || typeof message !== 'string' || message.trim() === '') {
      return NextResponse.json(
        { error: 'Message is required and cannot be empty', code: 'INVALID_MESSAGE' },
        { status: 400 }
      );
    }

    const ticket = await db
      .select()
      .from(tickets)
      .where(eq(tickets.id, parseInt(ticketId)))
      .limit(1);

    if (ticket.length === 0) {
      return NextResponse.json(
        { error: 'Ticket not found', code: 'TICKET_NOT_FOUND' },
        { status: 404 }
      );
    }

    if (ticket[0].artistId !== session.userId) {
      return NextResponse.json(
        { error: 'Not authorized to send messages to this ticket', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    if (ticket[0].status === 'Решено' || ticket[0].status === 'Закрыто') {
      return NextResponse.json(
        { error: 'Cannot send messages to closed ticket', code: 'TICKET_CLOSED' },
        { status: 400 }
      );
    }

    const artist = await db
      .select()
      .from(artists)
      .where(eq(artists.id, session.userId))
      .limit(1);

    if (artist.length === 0) {
      return NextResponse.json(
        { error: 'Artist not found', code: 'ARTIST_NOT_FOUND' },
        { status: 404 }
      );
    }

    const currentTimestamp = new Date().toISOString();

    const newMessage = await db
      .insert(ticketMessages)
      .values({
        ticketId: parseInt(ticketId),
        senderId: session.userId,
        senderType: 'artist',
        senderName: artist[0].name,
        message: message.trim(),
        createdAt: currentTimestamp,
      })
      .returning();

    await db
      .update(tickets)
      .set({
        lastResponseAt: currentTimestamp,
        lastResponseBy: 'artist',
      })
      .where(eq(tickets.id, parseInt(ticketId)));

    return NextResponse.json(
      { success: true, message: newMessage[0] },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/tickets/[id]/messages error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}