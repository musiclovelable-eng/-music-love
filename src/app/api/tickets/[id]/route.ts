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

    const ticketResult = await db
      .select()
      .from(tickets)
      .where(eq(tickets.id, ticketId))
      .limit(1);

    if (ticketResult.length === 0) {
      return NextResponse.json(
        { error: 'Ticket not found', code: 'TICKET_NOT_FOUND' },
        { status: 404 }
      );
    }

    const ticket = ticketResult[0];

    if (ticket.artistId !== session.userId) {
      return NextResponse.json(
        { error: 'Not authorized to view this ticket', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    const artistResult = await db
      .select({
        name: artists.name,
        email: artists.email,
      })
      .from(artists)
      .where(eq(artists.id, ticket.artistId))
      .limit(1);

    const artistInfo = artistResult[0] || { name: 'Unknown', email: '' };

    const messages = await db
      .select()
      .from(ticketMessages)
      .where(eq(ticketMessages.ticketId, ticketId))
      .orderBy(asc(ticketMessages.createdAt));

    return NextResponse.json({
      ticket: {
        ...ticket,
        artistName: artistInfo.name,
        artistEmail: artistInfo.email,
      },
      messages,
    });
  } catch (error) {
    console.error('GET ticket error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function PUT(
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

    const ticketResult = await db
      .select()
      .from(tickets)
      .where(eq(tickets.id, ticketId))
      .limit(1);

    if (ticketResult.length === 0) {
      return NextResponse.json(
        { error: 'Ticket not found', code: 'TICKET_NOT_FOUND' },
        { status: 404 }
      );
    }

    const ticket = ticketResult[0];

    if (ticket.artistId !== session.userId) {
      return NextResponse.json(
        { error: 'Not authorized to close this ticket', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    if (ticket.status === 'Решено') {
      return NextResponse.json(
        { error: 'Ticket is already closed', code: 'ALREADY_CLOSED' },
        { status: 400 }
      );
    }

    const updatedTicket = await db
      .update(tickets)
      .set({
        status: 'Решено',
        closedAt: new Date().toISOString(),
        closedBy: 'artist',
      })
      .where(eq(tickets.id, ticketId))
      .returning();

    return NextResponse.json({
      success: true,
      ticket: updatedTicket[0],
    });
  } catch (error) {
    console.error('PUT ticket error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}