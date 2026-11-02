import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { db } from '@/db';
import { pitchings, releases, artists } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

// GET: list all pitchings for admin
export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const list = await db
      .select({
        id: pitchings.id,
        artistId: pitchings.artistId,
        releaseId: pitchings.releaseId,
        promoText: pitchings.promoText,
        status: pitchings.status,
        adminNote: pitchings.adminNote,
        createdAt: pitchings.createdAt,
        releaseTitle: releases.title,
        releaseCover: releases.coverUrl,
        releaseType: releases.type,
        releaseMainArtist: releases.mainArtist,
        artistName: artists.artistName,
        artistEmail: artists.email,
      })
      .from(pitchings)
      .leftJoin(releases, eq(pitchings.releaseId, releases.id))
      .leftJoin(artists, eq(pitchings.artistId, artists.id))
      .orderBy(desc(pitchings.createdAt));

    return NextResponse.json({ pitchings: list });
  } catch (error) {
    console.error('Error fetching pitchings:', error);
    return NextResponse.json({ error: 'Ошибка при загрузке питчингов' }, { status: 500 });
  }
}
