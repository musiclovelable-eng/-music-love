import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db } from '@/db';
import { artistAnalytics, artists } from '@/db/schema';
import { eq, and, asc } from 'drizzle-orm';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || !session.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const artistId = parseInt(id);
    const stats = await db
      .select()
      .from(artistAnalytics)
      .where(eq(artistAnalytics.artistId, artistId))
      .orderBy(asc(artistAnalytics.date));

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Fetch analytics error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || !session.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const artistId = parseInt(id);
    const body = await request.json();
    const { date, totalStreams, streamsOver30s, uniqueListeners, subscribers } = body;

    if (!date) {
      return NextResponse.json({ error: 'Date is required' }, { status: 400 });
    }

    const now = new Date().toISOString();

    // Check if entry for this date already exists
    const existing = await db
      .select()
      .from(artistAnalytics)
      .where(
        and(
          eq(artistAnalytics.artistId, artistId),
          eq(artistAnalytics.date, date)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(artistAnalytics)
        .set({
          totalStreams: totalStreams ?? 0,
          streamsOver30s: streamsOver30s ?? 0,
          uniqueListeners: uniqueListeners ?? 0,
          subscribers: subscribers ?? 0,
          updatedAt: now,
        })
        .where(eq(artistAnalytics.id, existing[0].id));
    } else {
      await db.insert(artistAnalytics).values({
        artistId,
        date,
        totalStreams: totalStreams ?? 0,
        streamsOver30s: streamsOver30s ?? 0,
        uniqueListeners: uniqueListeners ?? 0,
        subscribers: subscribers ?? 0,
        createdAt: now,
        updatedAt: now,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update analytics error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
