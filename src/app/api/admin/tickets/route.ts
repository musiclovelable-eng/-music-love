import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { db } from '@/db';
import { tickets, artists } from '@/db/schema';
import { desc, eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    // Get session and validate authentication
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'AUTHENTICATION_REQUIRED' },
        { status: 401 }
      );
    }

    // Check if user is admin
    if (!session.isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required', code: 'ADMIN_ACCESS_REQUIRED' },
        { status: 403 }
      );
    }

    // Query all tickets with artist information
    const allTickets = await db
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
      .orderBy(desc(tickets.createdAt));

    return NextResponse.json({ tickets: allTickets }, { status: 200 });
  } catch (error) {
    console.error('GET /api/admin/tickets error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error'),
        code: 'INTERNAL_SERVER_ERROR',
      },
      { status: 500 }
    );
  }
}