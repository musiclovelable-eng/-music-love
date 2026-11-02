import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { db } from '@/db';
import { tickets, ticketMessages, artists } from '@/db/schema';
import { eq, asc } from 'drizzle-orm';

const VALID_STATUSES = ['В работе', 'Ожидает ответа', 'Решено', 'Закрыто'];

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const ticketId = parseInt(id);
    if (!ticketId || isNaN(ticketId)) {
      return NextResponse.json(
        { error: 'Valid ticket ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    // Get session and validate authentication
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    // Check if user is admin
    if (!session.isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    // Query ticket with artist information
    const ticketResult = await db
      .select({
        id: tickets.id,
        artistId: tickets.artistId,
        subject: tickets.subject,
        initialMessage: tickets.initialMessage,
        status: tickets.status,
        createdAt: tickets.createdAt,
        closedAt: tickets.closedAt,
        closedBy: tickets.closedBy,
        lastResponseAt: tickets.lastResponseAt,
        lastResponseBy: tickets.lastResponseBy,
        artistName: artists.name,
        artistEmail: artists.email,
      })
      .from(tickets)
      .leftJoin(artists, eq(tickets.artistId, artists.id))
      .where(eq(tickets.id, ticketId))
      .limit(1);

    // Check if ticket exists
    if (ticketResult.length === 0) {
      return NextResponse.json(
        { error: 'Ticket not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const ticket = ticketResult[0];

    // Query all messages for this ticket
    const messages = await db
      .select()
      .from(ticketMessages)
      .where(eq(ticketMessages.ticketId, ticketId))
      .orderBy(asc(ticketMessages.createdAt));

    return NextResponse.json({
      ticket: {
        id: ticket.id,
        artistId: ticket.artistId,
        subject: ticket.subject,
        initialMessage: ticket.initialMessage,
        status: ticket.status,
        createdAt: ticket.createdAt,
        closedAt: ticket.closedAt,
        closedBy: ticket.closedBy,
        lastResponseAt: ticket.lastResponseAt,
        lastResponseBy: ticket.lastResponseBy,
        artistName: ticket.artistName,
        artistEmail: ticket.artistEmail,
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
    if (!ticketId || isNaN(ticketId)) {
      return NextResponse.json(
        { error: 'Valid ticket ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    // Get session and validate authentication
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    // Check if user is admin
    if (!session.isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { status, close } = body;

    // Check if ticket exists
    const existingTicket = await db
      .select()
      .from(tickets)
      .where(eq(tickets.id, ticketId))
      .limit(1);

    if (existingTicket.length === 0) {
      return NextResponse.json(
        { error: 'Ticket not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Build update object
    const updateData: any = {};

    // Validate and add status if provided
    if (status !== undefined) {
      if (!VALID_STATUSES.includes(status)) {
        return NextResponse.json(
          {
            error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`,
            code: 'INVALID_STATUS',
          },
          { status: 400 }
        );
      }
      updateData.status = status;
    }

    // Handle close action
    if (close === true) {
      updateData.closedAt = new Date().toISOString();
      updateData.closedBy = 'admin';
      updateData.status = 'Закрыто';
    }

    // If no updates provided
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No valid updates provided', code: 'NO_UPDATES' },
        { status: 400 }
      );
    }

    // Update ticket
    const updatedTicket = await db
      .update(tickets)
      .set(updateData)
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