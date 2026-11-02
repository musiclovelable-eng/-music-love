import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db } from '@/db';
import { newLyricsSubmissions, artists } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

export async function GET() {
  try {
    const session = await getSession();

    if (!session || !session.isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const submissions = await db
      .select({
        id: newLyricsSubmissions.id,
        artistId: newLyricsSubmissions.artistId,
        trackLink: newLyricsSubmissions.trackLink,
        status: newLyricsSubmissions.status,
        rejectionReason: newLyricsSubmissions.rejectionReason,
        submittedAt: newLyricsSubmissions.submittedAt,
        reviewedAt: newLyricsSubmissions.reviewedAt,
        artistName: artists.name,
        artistEmail: artists.email,
      })
      .from(newLyricsSubmissions)
      .leftJoin(artists, eq(newLyricsSubmissions.artistId, artists.id))
      .orderBy(desc(newLyricsSubmissions.submittedAt));

    return NextResponse.json({ submissions });
  } catch (error) {
    console.error('Error fetching lyrics submissions:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error },
      { status: 500 }
    );
  }
}