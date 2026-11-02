import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db } from '@/db';
import { lyricsSubmissions, artists } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { trackName, lyricLink, platform, releaseId } = await request.json();

    // Validate required fields
    if (!trackName || !trackName.trim()) {
      return NextResponse.json(
        { error: 'Track name is required', code: 'MISSING_TRACK_NAME' },
        { status: 400 }
      );
    }

    if (!lyricLink || !lyricLink.trim()) {
      return NextResponse.json(
        { error: 'Lyric link is required', code: 'MISSING_LYRIC_LINK' },
        { status: 400 }
      );
    }

    if (!platform || !platform.trim()) {
      return NextResponse.json(
        { error: 'Platform is required', code: 'MISSING_PLATFORM' },
        { status: 400 }
      );
    }

    const [submission] = await db
      .insert(lyricsSubmissions)
      .values({
        artistId: session.userId,
        releaseId: releaseId || null,
        trackName: trackName.trim(),
        lyricLink: lyricLink.trim(),
        platform: platform.trim(),
        status: 'sent',
        rejectionReason: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .returning();

    return NextResponse.json(submission, { status: 201 });
  } catch (error) {
    console.error('Error creating lyrics submission:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    let submissions;

    if (session.isAdmin) {
      // Admin: get all submissions with artist info
      submissions = await db
        .select({
          id: lyricsSubmissions.id,
          artistId: lyricsSubmissions.artistId,
          releaseId: lyricsSubmissions.releaseId,
          trackName: lyricsSubmissions.trackName,
          lyricLink: lyricsSubmissions.lyricLink,
          platform: lyricsSubmissions.platform,
          status: lyricsSubmissions.status,
          rejectionReason: lyricsSubmissions.rejectionReason,
          createdAt: lyricsSubmissions.createdAt,
          updatedAt: lyricsSubmissions.updatedAt,
          artistName: artists.name,
          artistEmail: artists.email,
        })
        .from(lyricsSubmissions)
        .leftJoin(artists, eq(lyricsSubmissions.artistId, artists.id))
        .orderBy(desc(lyricsSubmissions.createdAt));
    } else {
      // Regular artist: get only their submissions
      submissions = await db
        .select()
        .from(lyricsSubmissions)
        .where(eq(lyricsSubmissions.artistId, session.userId))
        .orderBy(desc(lyricsSubmissions.createdAt));
    }

    return NextResponse.json({ submissions });
  } catch (error) {
    console.error('Error fetching lyrics submissions:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error },
      { status: 500 }
    );
  }
}