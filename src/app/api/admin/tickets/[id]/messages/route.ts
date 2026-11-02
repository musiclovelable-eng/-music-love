import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { db } from '@/db';
import { tickets, ticketMessages, artists } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Validate ticket ID
    const ticketId = parseInt(params.id);
    if (isNaN(ticketId)) {
      return NextResponse.json(
        { error: 'Valid ticket ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    // Get and validate session
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

    // Parse and validate request body
    const body = await request.json();
    const { message } = body;

    if (!message || typeof message !== 'string' || message.trim() === '') {
      return NextResponse.json(
        { error: 'Message is required and cannot be empty', code: 'MISSING_MESSAGE' },
        { status: 400 }
      );
    }

    const trimmedMessage = message.trim();

    // Check if ticket exists
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

    // Check if ticket is closed
    if (ticket[0].status === 'Решено' || ticket[0].status === 'Закрыто') {
      return NextResponse.json(
        { error: 'Cannot send messages to closed ticket', code: 'TICKET_CLOSED' },
        { status: 400 }
      );
    }

    // Get admin info
    const admin = await db
      .select()
      .from(artists)
      .where(eq(artists.id, session.userId))
      .limit(1);

    if (admin.length === 0) {
      return NextResponse.json(
        { error: 'Admin not found', code: 'ADMIN_NOT_FOUND' },
        { status: 404 }
      );
    }

    const currentTimestamp = new Date().toISOString();

    // Create message
    const newMessage = await db
      .insert(ticketMessages)
      .values({
        ticketId,
        senderId: session.userId,
        senderType: 'admin',
        senderName: admin[0].name,
        message: trimmedMessage,
        createdAt: currentTimestamp,
      })
      .returning();

    // Update ticket
    await db
      .update(tickets)
      .set({
        lastResponseAt: currentTimestamp,
        lastResponseBy: 'admin',
        status: 'Ожидает ответа',
      })
      .where(eq(tickets.id, ticketId));

    return NextResponse.json(
      {
        success: true,
        message: newMessage[0],
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/admin/tickets/[id]/messages error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error'),
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}