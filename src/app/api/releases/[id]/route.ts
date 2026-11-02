import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { db } from '@/db';
import { releases, tracks, artists, releaseHistory } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionFromRequest(request);

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const releaseId = parseInt(id);

    // Получаем релиз
    const [release] = await db
      .select()
      .from(releases)
      .where(
        and(
          eq(releases.id, releaseId),
          eq(releases.artistId, session.userId)
        )
      )
      .limit(1);

    if (!release) {
      return NextResponse.json(
        { error: 'Релиз не найден' },
        { status: 404 }
      );
    }

    // Получаем треки
    const releaseTracks = await db
      .select()
      .from(tracks)
      .where(eq(tracks.releaseId, releaseId))
      .orderBy(tracks.trackNumber);

    return NextResponse.json({ release, tracks: releaseTracks });
  } catch (error) {
    console.error('Error fetching release:', error);
    return NextResponse.json(
      { error: 'Ошибка при загрузке релиза' },
      { status: 500 }
    );
  }
}

// ─── POST — деактивация релиза артистом ─────────────────────────────────────
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const releaseId = parseInt(id);
    const body = await request.json();
    const { action, reason } = body;

    if (action !== 'deactivate') {
      return NextResponse.json({ error: 'Неизвестное действие' }, { status: 400 });
    }

    if (!reason || !reason.trim()) {
      return NextResponse.json({ error: 'Укажите причину деактивации' }, { status: 400 });
    }

    // Проверяем владение релизом
    const [existing] = await db
      .select()
      .from(releases)
      .where(and(eq(releases.id, releaseId), eq(releases.artistId, session.userId)))
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: 'Релиз не найден' }, { status: 404 });
    }

    // Нельзя деактивировать уже деактивированный или черновик
    if (existing.status === 'deactivated') {
      return NextResponse.json({ error: 'Релиз уже деактивирован' }, { status: 400 });
    }
    if (existing.status === 'draft') {
      return NextResponse.json({ error: 'Черновик нельзя деактивировать' }, { status: 400 });
    }

    const now = new Date().toISOString();

    await db
      .update(releases)
      .set({
        status: 'deactivated',
        deactivationReason: reason.trim(),
        deactivatedAt: now,
        updatedAt: now,
      })
      .where(eq(releases.id, releaseId));

    // Записываем в историю
    await db.insert(releaseHistory).values({
      releaseId,
      action: 'deactivated',
      field: 'status',
      oldValue: existing.status,
      newValue: 'deactivated',
      performedBy: session.email || 'Unknown Artist',
      performedAt: now,
      description: `Релиз деактивирован артистом. Причина: ${reason.trim()}`,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deactivating release:', error);
    return NextResponse.json(
      { error: 'Ошибка при деактивации релиза' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionFromRequest(request);

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const releaseId = parseInt(id);

    const body = await request.json();

    // Получаем данные артиста для проверки роли
    const [artist] = await db
      .select()
      .from(artists)
      .where(eq(artists.id, session.userId))
      .limit(1);

    if (!artist) {
      return NextResponse.json(
        { error: 'Artist not found' },
        { status: 404 }
      );
    }

    // Проверяем существование релиза и права доступа
    const [existingRelease] = await db
      .select()
      .from(releases)
      .where(
        and(
          eq(releases.id, releaseId),
          eq(releases.artistId, session.userId)
        )
      )
      .limit(1);

    if (!existingRelease) {
      return NextResponse.json(
        { error: 'Релиз не найден' },
        { status: 404 }
      );
    }

    const now = new Date().toISOString();

    // ─── Режим 1: Редактирование одобренного/опубликованного релиза ────────
    // Если релиз approved или published — разрешаем редактировать, но после
    // сохранения меняем статус на re_moderation (повторная модерация)
    if (existingRelease.status === 'approved' || existingRelease.status === 'published') {
      const newStatus = body.status === 're_moderation' ? 're_moderation' : 're_moderation';

      // Функция для записи истории изменений
      const trackFieldChange = async (field: string, oldVal: any, newVal: any) => {
        if (oldVal !== newVal) {
          await db.insert(releaseHistory).values({
            releaseId,
            action: 'artist_edit',
            field,
            oldValue: oldVal != null ? String(oldVal) : null,
            newValue: newVal != null ? String(newVal) : null,
            performedBy: session.email || 'Unknown Artist',
            performedAt: now,
            description: `Артист изменил поле «${field}»: "${oldVal ?? '—'}" → "${newVal ?? '—'}"`,
          });
        }
      };

      // Отслеживаем ключевые изменения
      await trackFieldChange('title', existingRelease.title, body.title);
      await trackFieldChange('type', existingRelease.type, body.type);
      await trackFieldChange('coverUrl', existingRelease.coverUrl, body.coverUrl);
      await trackFieldChange('genre', existingRelease.genre, body.genre);
      await trackFieldChange('subgenre', existingRelease.subgenre, body.subgenre);
      await trackFieldChange('mainArtist', existingRelease.mainArtist, body.mainArtist);
      await trackFieldChange('additionalArtists', existingRelease.additionalArtists, body.additionalArtists);
      await trackFieldChange('label', existingRelease.label, body.label);
      await trackFieldChange('releaseDate', existingRelease.releaseDate, body.releaseDate);

      // Общая запись об отправке на повторную модерацию
      await db.insert(releaseHistory).values({
        releaseId,
        action: 're_moderation',
        field: 'status',
        oldValue: existingRelease.status,
        newValue: 're_moderation',
        performedBy: session.email || 'Unknown Artist',
        performedAt: now,
        description: 'Артист отредактировал одобренный релиз. Отправлен на повторную модерацию.',
      });

      // Обновляем релиз
      await db
        .update(releases)
        .set({
          type: body.type ?? existingRelease.type,
          title: body.title ?? existingRelease.title,
          subtitle: body.subtitle !== undefined ? body.subtitle : existingRelease.subtitle,
          coverUrl: body.coverUrl ?? existingRelease.coverUrl,
          releaseDate: body.releaseDate !== undefined ? body.releaseDate : existingRelease.releaseDate,
          isAsap: body.isAsap ?? existingRelease.isAsap,
          mainArtist: body.mainArtist ?? existingRelease.mainArtist,
          additionalArtists: body.additionalArtists ?? existingRelease.additionalArtists,
          genre: body.genre ?? existingRelease.genre,
          subgenre: body.subgenre ?? existingRelease.subgenre,
          label: body.label ?? existingRelease.label,
          artistComment: body.artistComment ?? existingRelease.artistComment,
          platforms: body.platforms ? JSON.stringify(body.platforms) : existingRelease.platforms,
          territories: body.territories ? JSON.stringify(body.territories) : existingRelease.territories,
          persons: body.persons ? JSON.stringify(body.persons) : existingRelease.persons,
          metadataLang: body.metadataLang !== undefined ? body.metadataLang : existingRelease.metadataLang,
          partnerCode: body.partnerCode !== undefined ? body.partnerCode : existingRelease.partnerCode,
          rightsYear: body.rightsYear !== undefined ? body.rightsYear : existingRelease.rightsYear,
          earlyRussia: body.earlyRussia !== undefined ? body.earlyRussia : existingRelease.earlyRussia,
          realtimeDelivery: body.realtimeDelivery !== undefined ? body.realtimeDelivery : existingRelease.realtimeDelivery,
          upc: body.upc !== undefined ? body.upc : existingRelease.upc,
          status: newStatus,
          updatedAt: now,
        })
        .where(eq(releases.id, releaseId));

      // Обновляем треки если переданы
      if (Array.isArray(body.tracks)) {
        await db.delete(tracks).where(eq(tracks.releaseId, releaseId));
        const validTracks = body.tracks.filter((t: any) => t.title || t.url);
        if (validTracks.length > 0) {
          await db.insert(tracks).values(
            validTracks.map((t: any, i: number) => ({
              releaseId,
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
              createdAt: now,
            }))
          );
        }

        await db.insert(releaseHistory).values({
          releaseId,
          action: 'artist_edit',
          field: 'tracks',
          oldValue: null,
          newValue: null,
          performedBy: session.email || 'Unknown Artist',
          performedAt: now,
          description: 'Артист обновил трек-лист релиза',
        });
      }

      return NextResponse.json({ success: true });
    }

    // ─── Режим 2: Обычное редактирование (draft или requires_changes) ──────
    // Проверяем можно ли редактировать
    if (existingRelease.status !== 'draft' && existingRelease.status !== 'requires_changes') {
      return NextResponse.json(
        { error: 'Редактирование недоступно для релизов в этом статусе' },
        { status: 403 }
      );
    }

    // Определяем лейбл для релиза
    let releaseLabel = artist.label;

    if (artist.role === 'label' && body.label && body.label !== artist.label) {
      await db
        .update(artists)
        .set({ label: body.label })
        .where(eq(artists.id, session.userId));
      releaseLabel = body.label;
    }

    // Обновляем релиз
    await db
      .update(releases)
      .set({
        type: body.type,
        title: body.title,
        subtitle: body.subtitle !== undefined ? body.subtitle : existingRelease.subtitle,
        coverUrl: body.coverUrl,
        releaseDate: body.releaseDate,
        isAsap: body.isAsap || false,
        mainArtist: body.mainArtist,
        additionalArtists: body.additionalArtists,
        genre: body.genre,
        subgenre: body.subgenre,
        promoText: body.promoText,
        useEditorialPromo: body.useEditorialPromo || false,
        artistComment: body.artistComment,
        label: releaseLabel,
        platforms: body.platforms ? JSON.stringify(body.platforms) : existingRelease.platforms,
        territories: body.territories ? JSON.stringify(body.territories) : existingRelease.territories,
        persons: body.persons ? JSON.stringify(body.persons) : existingRelease.persons,
        metadataLang: body.metadataLang !== undefined ? body.metadataLang : existingRelease.metadataLang,
        partnerCode: body.partnerCode !== undefined ? body.partnerCode : existingRelease.partnerCode,
        rightsYear: body.rightsYear !== undefined ? body.rightsYear : existingRelease.rightsYear,
        earlyRussia: body.earlyRussia !== undefined ? body.earlyRussia : existingRelease.earlyRussia,
        realtimeDelivery: body.realtimeDelivery !== undefined ? body.realtimeDelivery : existingRelease.realtimeDelivery,
        upc: body.upc !== undefined ? body.upc : existingRelease.upc,
        status: body.status || existingRelease.status,
        updatedAt: now,
      })
      .where(eq(releases.id, releaseId));

    // Удаляем старые треки и создаём новые
    await db.delete(tracks).where(eq(tracks.releaseId, releaseId));

    if (body.tracks && body.tracks.length > 0) {
      const trackValues = body.tracks.map((track: any, i: number) => ({
        releaseId: releaseId,
        trackNumber: track.trackNumber ?? i + 1,
        title: track.title,
        subtitle: track.subtitle || null,
        url: track.url,
        artists: track.artists || '',
        musicAuthor: track.musicAuthor,
        lyricsAuthor: track.lyricsAuthor,
        producer: track.producer,
        composer: track.composer || null,
        lyrics: track.lyrics,
        language: track.language || null,
        explicit: track.explicit || false,
        isLive: track.isLive || false,
        isCover: track.isCover || false,
        isRemix: track.isRemix || false,
        isInstrumental: track.isInstrumental || false,
        previewStart: track.previewStart || null,
        copyrightShare: track.copyrightShare || null,
        relatedRightsShare: track.relatedRightsShare || null,
        personsJson: track.personsJson || null,
        createdAt: now,
      }));

      await db.insert(tracks).values(trackValues);
    }

    // Если статус меняется на on_moderation — записываем в историю
    if (body.status && body.status !== existingRelease.status) {
      await db.insert(releaseHistory).values({
        releaseId,
        action: 'status_changed',
        field: 'status',
        oldValue: existingRelease.status,
        newValue: body.status,
        performedBy: session.email || 'Unknown Artist',
        performedAt: now,
        description: `Статус изменён: ${existingRelease.status} → ${body.status}`,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating release:', error);
    return NextResponse.json(
      { error: 'Ошибка при обновлении релиза' },
      { status: 500 }
    );
  }
}
