import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db } from '@/db';
import { releases, tracks, artists } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();

    const [artist] = await db
      .select()
      .from(artists)
      .where(eq(artists.id, session.userId))
      .limit(1);

    if (!artist) {
      return NextResponse.json({ error: 'Artist not found' }, { status: 404 });
    }

    let releaseLabel = artist.label;

    if (artist.role === 'label' && data.label && data.label !== artist.label) {
      await db.update(artists).set({ label: data.label }).where(eq(artists.id, session.userId));
      releaseLabel = data.label;
    }

    const [release] = await db.insert(releases).values({
      artistId: session.userId,
      type: data.type,
      title: data.title,
      subtitle: data.subtitle || null,
      coverUrl: data.coverUrl,
      releaseDate: data.releaseDate,
      startDate: data.startDate || null,
      preorderDate: data.preorderDate || null,
      isAsap: data.isAsap || false,
      mainArtist: data.mainArtist,
      additionalArtists: data.additionalArtists,
      genre: data.genre,
      subgenre: data.subgenre,
      promoText: data.promoText,
      useEditorialPromo: data.useEditorialPromo || false,
      label: releaseLabel,
      artistComment: data.artistComment,
      moderatorComment: null,
      status: data.status || 'draft',
      upc: null,
      metadataLang: data.metadataLang || null,
      partnerCode: data.partnerCode || null,
      rightsYear: data.rightsYear || null,
      earlyRussia: data.earlyRussia || false,
      realtimeDelivery: data.realtimeDelivery || false,
      platforms: data.platforms ? JSON.stringify(data.platforms) : null,
      territories: data.territories ? JSON.stringify(data.territories) : null,
      persons: data.persons ? JSON.stringify(data.persons) : null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }).returning();

    // Создаём треки со всеми полями
    if (data.tracks && data.tracks.length > 0) {
      const now = new Date().toISOString();
      const trackValues = data.tracks.map((track: any) => ({
        releaseId: release.id,
        trackNumber: track.trackNumber,
        title: track.title,
        subtitle: track.subtitle || null,
        url: track.url,
        artists: track.artists || '',
        musicAuthor: track.musicAuthor || null,
        lyricsAuthor: track.lyricsAuthor || null,
        producer: track.producer || null,
        composer: track.composer || null,
        lyrics: track.lyrics || null,
        language: track.language || null,
        explicit: track.explicit || false,
        isLive: track.isLive || false,
        isCover: track.isCover || false,
        isRemix: track.isRemix || false,
        isInstrumental: track.isInstrumental || false,
        isrc: track.isrc || null,
        previewStart: track.previewStart || null,
        copyrightShare: track.copyrightShare || null,
        relatedRightsShare: track.relatedRightsShare || null,
        personsJson: track.personsJson || null,
        createdAt: now,
      }));

      await db.insert(tracks).values(trackValues);
    }

    return NextResponse.json({ success: true, releaseId: release.id });
  } catch (error) {
    console.error('Error creating release:', error);
    return NextResponse.json(
      { error: 'Ошибка при создании релиза' },
      { status: 500 }
    );
  }
}
