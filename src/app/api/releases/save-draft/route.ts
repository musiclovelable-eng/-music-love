import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { db } from '@/db';
import { releases, tracks, artists } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

// POST /api/releases/save-draft
// Creates or updates a draft release with partial data (no validation required).
// Body: { draftId?: number, ...partialReleaseFields, tracks?: TrackPartial[] }
// Returns: { draftId: number }

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { draftId, ...fields } = body;

    // Fetch artist label default
    const [artist] = await db
      .select()
      .from(artists)
      .where(eq(artists.id, session.userId))
      .limit(1);

    const now = new Date().toISOString();

    if (draftId) {
      // Verify ownership and that it's still a draft
      const [existing] = await db
        .select()
        .from(releases)
        .where(and(eq(releases.id, draftId), eq(releases.artistId, session.userId)))
        .limit(1);

      if (!existing) {
        return NextResponse.json({ error: 'Черновик не найден' }, { status: 404 });
      }
      if (existing.status !== 'draft') {
        return NextResponse.json({ error: 'Релиз уже отправлен на модерацию' }, { status: 400 });
      }

      // Update draft
      await db
        .update(releases)
        .set({
          type: fields.type ?? existing.type,
          title: fields.title ?? existing.title,
          subtitle: fields.subtitle !== undefined ? fields.subtitle : existing.subtitle,
          coverUrl: fields.coverUrl ?? existing.coverUrl,
          releaseDate: fields.releaseDate !== undefined ? fields.releaseDate : existing.releaseDate,
          isAsap: fields.isAsap ?? existing.isAsap,
          mainArtist: fields.mainArtist ?? existing.mainArtist,
          additionalArtists: fields.additionalArtists ?? existing.additionalArtists,
          genre: fields.genre ?? existing.genre,
          subgenre: fields.subgenre ?? existing.subgenre,
          label: fields.label ?? existing.label,
          artistComment: fields.artistComment ?? existing.artistComment,
          platforms: fields.platforms ? JSON.stringify(fields.platforms) : existing.platforms,
          territories: fields.territories ? JSON.stringify(fields.territories) : existing.territories,
          persons: fields.persons ? JSON.stringify(fields.persons) : existing.persons,
          metadataLang: fields.metadataLang !== undefined ? fields.metadataLang : existing.metadataLang,
          partnerCode: fields.partnerCode !== undefined ? fields.partnerCode : existing.partnerCode,
          rightsYear: fields.rightsYear !== undefined ? fields.rightsYear : existing.rightsYear,
          earlyRussia: fields.earlyRussia !== undefined ? fields.earlyRussia : existing.earlyRussia,
          realtimeDelivery: fields.realtimeDelivery !== undefined ? fields.realtimeDelivery : existing.realtimeDelivery,
          updatedAt: now,
        })
        .where(eq(releases.id, draftId));

      // Update tracks if provided
      if (Array.isArray(fields.tracks)) {
        await db.delete(tracks).where(eq(tracks.releaseId, draftId));
        const validTracks = fields.tracks.filter((t: any) => t.title || t.url);
        if (validTracks.length > 0) {
          await db.insert(tracks).values(
            validTracks.map((t: any, i: number) => ({
              releaseId: draftId,
              trackNumber: t.trackNumber ?? i + 1,
              title: t.title || '',
              subtitle: t.subtitle || null,
              url: t.url || '',
              artists: t.artists || '',
              musicAuthor: t.musicAuthor || null,
              lyricsAuthor: t.lyricsAuthor || null,
              producer: t.producer || null,
              composer: t.composer || null,
              lyrics: t.lyrics || null,
              language: t.language || null,
              explicit: t.explicit || false,
              isLive: t.isLive || false,
              isCover: t.isCover || false,
              isRemix: t.isRemix || false,
              isInstrumental: t.isInstrumental || false,
              previewStart: t.previewStart || null,
              isrc: t.isrc || null,
              copyrightShare: t.copyrightShare || null,
              relatedRightsShare: t.relatedRightsShare || null,
              personsJson: t.personsJson || null,
              createdAt: now,
            }))
          );
        }
      }

      return NextResponse.json({ draftId });
    } else {
      // Create a new draft
      const [newRelease] = await db
        .insert(releases)
        .values({
          artistId: session.userId,
          type: fields.type || '',
          title: fields.title || '',
          subtitle: fields.subtitle || null,
          coverUrl: fields.coverUrl || '',
          releaseDate: fields.releaseDate || null,
          isAsap: fields.isAsap || false,
          mainArtist: fields.mainArtist || '',
          additionalArtists: fields.additionalArtists || '',
          genre: fields.genre || '',
          subgenre: fields.subgenre || null,
          label: fields.label || artist?.label || 'Music Love',
          artistComment: fields.artistComment || null,
          platforms: fields.platforms ? JSON.stringify(fields.platforms) : null,
          territories: fields.territories ? JSON.stringify(fields.territories) : null,
          persons: fields.persons ? JSON.stringify(fields.persons) : null,
          metadataLang: fields.metadataLang || null,
          partnerCode: fields.partnerCode || null,
          rightsYear: fields.rightsYear || null,
          earlyRussia: fields.earlyRussia || false,
          realtimeDelivery: fields.realtimeDelivery || false,
          status: 'draft',
          createdAt: now,
          updatedAt: now,
        })
        .returning({ id: releases.id });

      const createdId = newRelease.id;

      if (Array.isArray(fields.tracks)) {
        const validTracks = fields.tracks.filter((t: any) => t.title || t.url);
        if (validTracks.length > 0) {
          await db.insert(tracks).values(
            validTracks.map((t: any, i: number) => ({
              releaseId: createdId,
              trackNumber: t.trackNumber ?? i + 1,
              title: t.title || '',
              subtitle: t.subtitle || null,
              url: t.url || '',
              artists: t.artists || '',
              musicAuthor: t.musicAuthor || null,
              lyricsAuthor: t.lyricsAuthor || null,
              producer: t.producer || null,
              composer: t.composer || null,
              lyrics: t.lyrics || null,
              language: t.language || null,
              explicit: t.explicit || false,
              isLive: t.isLive || false,
              isCover: t.isCover || false,
              isRemix: t.isRemix || false,
              isInstrumental: t.isInstrumental || false,
              previewStart: t.previewStart || null,
              isrc: t.isrc || null,
              copyrightShare: t.copyrightShare || null,
              relatedRightsShare: t.relatedRightsShare || null,
              personsJson: t.personsJson || null,
              createdAt: now,
            }))
          );
        }
      }

      return NextResponse.json({ draftId: createdId });
    }
  } catch (error) {
    console.error('Error saving draft:', error);
    return NextResponse.json({ error: 'Ошибка при сохранении черновика' }, { status: 500 });
  }
}
