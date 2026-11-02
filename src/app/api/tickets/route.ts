import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { db } from '@/db';
import { tickets, ticketMessages, artists } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const session = await getSessionFromRequest(request);
    if (!session || !session.userId) {
      return NextResponse.json({ 
        error: 'Authentication required',
        code: 'AUTHENTICATION_REQUIRED' 
      }, { status: 401 });
    }

    // Get and validate request body
    const body = await request.json();
    const { subject, message } = body;

    // Validate required fields
    if (!subject || typeof subject !== 'string' || subject.trim().length === 0) {
      return NextResponse.json({ 
        error: 'Subject is required and must not be empty',
        code: 'SUBJECT_REQUIRED' 
      }, { status: 400 });
    }

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json({ 
        error: 'Message is required and must not be empty',
        code: 'MESSAGE_REQUIRED' 
      }, { status: 400 });
    }

    // Get artist info from database
    const artist = await db.select()
      .from(artists)
      .where(eq(artists.id, session.userId))
      .limit(1);

    if (artist.length === 0) {
      return NextResponse.json({ 
        error: 'Artist not found',
        code: 'ARTIST_NOT_FOUND' 
      }, { status: 404 });
    }

    const currentTimestamp = new Date().toISOString();

    // Create ticket
    const newTicket = await db.insert(tickets)
      .values({
        artistId: session.userId,
        subject: subject.trim(),
        initialMessage: message.trim(),
        status: 'В работе',
        createdAt: currentTimestamp,
        lastResponseAt: currentTimestamp,
        lastResponseBy: 'artist'
      })
      .returning();

    if (newTicket.length === 0) {
      return NextResponse.json({ 
        error: 'Failed to create ticket',
        code: 'TICKET_CREATION_FAILED' 
      }, { status: 500 });
    }

    // Create first message in ticket_messages
    await db.insert(ticketMessages)
      .values({
        ticketId: newTicket[0].id,
        senderId: session.userId,
        senderType: 'artist',
        senderName: artist[0].name,
        message: message.trim(),
        createdAt: currentTimestamp
      });

    return NextResponse.json(newTicket[0], { status: 201 });

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error'),
      code: 'INTERNAL_SERVER_ERROR'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    // Authentication check
    const session = await getSessionFromRequest(request);
    if (!session || !session.userId) {
      return NextResponse.json({ 
        error: 'Authentication required',
        code: 'AUTHENTICATION_REQUIRED' 
      }, { status: 401 });
    }

    // Get all tickets for the logged-in artist with artist name
    const artistTickets = await db.select({
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
      artistName: artists.name
    })
      .from(tickets)
      .leftJoin(artists, eq(tickets.artistId, artists.id))
      .where(eq(tickets.artistId, session.userId))
      .orderBy(desc(tickets.createdAt));

    return NextResponse.json({ tickets: artistTickets }, { status: 200 });

  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error'),
      code: 'INTERNAL_SERVER_ERROR'
    }, { status: 500 });
  }
}