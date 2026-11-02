import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db } from '@/db';
import * as schema from '@/db/schema';
const { artistAnalytics } = schema;
import { eq, asc } from 'drizzle-orm';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const artistId = session.userId;
    const stats = await db
      .select()
      .from(artistAnalytics)
      .where(eq(artistAnalytics.artistId, artistId))
      .orderBy(asc(artistAnalytics.date));

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Fetch artist analytics error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
