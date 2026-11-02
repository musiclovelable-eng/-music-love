import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { db } from '@/db';
import { releases, releaseHistory, tracks, artists, lyricsSubmissions, pitchings } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { sendTelegramMessage, buildReleaseNotification } from '@/lib/telegram';
import { deleteFromStorage } from '@/lib/storage';

// ─── Helper: send Telegram notification if artist has linked Telegram ─────────

async function notifyArtistOnStatusChange(
  artistId: number,
  releaseTitle: string,
  newStatus: string,
  moderatorComment?: string | null
) {
  try {
    const [artist] = await db
      .select({ telegramChatId: artists.telegramChatId })
      .from(artists)
      .where(eq(artists.id, artistId))
      .limit(1);

    const chatId = artist?.telegramChatId;
    if (!chatId) return; // Artist hasn't linked Telegram

    const message = buildReleaseNotification(newStatus, releaseTitle, moderatorComment);
    if (!message) return;

    await sendTelegramMessage(chatId, message);
  } catch (err) {
    // Don't let notification failure break the main response
    console.error('Telegram notification error:', err);
  }
}

// ─── PATCH — quick status/comment/upc update from the list modal ─────────────

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSessionFromRequest(request);

    if (!session || !session.isAdmin) {
      return NextResponse.json(
        { error: 'Требуется авторизация администратора' },
        { status: 401 }
      );
    }

    const releaseId = parseInt(params.id);
    const { status, moderatorComment, upc } = await request.json();

    // Fetch current release to compare status and get artistId + title
    const [existing] = await db
      .select({
        status: releases.status,
        title: releases.title,
        artistId: releases.artistId,
        moderatorComment: releases.moderatorComment,
      })
      .from(releases)
      .where(eq(releases.id, releaseId))
      .limit(1);

    await db
      .update(releases)
      .set({
        status,
        moderatorComment,
        upc,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(releases.id, releaseId));

    // Send Telegram notification if status changed
    if (existing && status && status !== existing.status) {
      await notifyArtistOnStatusChange(
        existing.artistId,
        existing.title,
        status,
        moderatorComment ?? existing.moderatorComment
      );
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

// ─── PUT — full release update from the detail page ──────────────────────────

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSessionFromRequest(request);

    if (!session || !session.isAdmin) {
      return NextResponse.json(
        { error: 'Требуется авторизация администратора' },
        { status: 401 }
      );
    }

    const releaseId = parseInt(params.id);
    const data = await request.json();

    // Получаем текущее состояние релиза для сравнения
    const [existingRelease] = await db
      .select()
      .from(releases)
      .where(eq(releases.id, releaseId))
      .limit(1);

    if (!existingRelease) {
      return NextResponse.json(
        { error: 'Релиз не найден' },
        { status: 404 }
      );
    }

    // Функция для создания записи в истории
    const createHistoryEntry = async (
      field: string,
      oldValue: any,
      newValue: any,
      action: string,
      description?: string
    ) => {
      if (oldValue !== newValue) {
        await db.insert(releaseHistory).values({
          releaseId,
          action,
          field,
          oldValue: oldValue != null ? String(oldValue) : null,
          newValue: newValue != null ? String(newValue) : null,
          performedBy: session.email || 'Unknown Admin',
          performedAt: new Date().toISOString(),
          description: description || `Changed ${field} from "${oldValue}" to "${newValue}"`,
        });
      }
    };

    // Отслеживаем изменения полей
    if (data.type !== undefined) {
      await createHistoryEntry('type', existingRelease.type, data.type, 'metadata_updated', `Release type changed from "${existingRelease.type}" to "${data.type}"`);
    }
    if (data.title !== undefined) {
      await createHistoryEntry('title', existingRelease.title, data.title, 'metadata_updated', `Title changed from "${existingRelease.title}" to "${data.title}"`);
    }
    if (data.coverUrl !== undefined) {
      await createHistoryEntry('coverUrl', existingRelease.coverUrl, data.coverUrl, 'cover_updated', 'Cover artwork updated');
    }
    if (data.releaseDate !== undefined) {
      await createHistoryEntry('releaseDate', existingRelease.releaseDate, data.releaseDate, 'metadata_updated', `Release date changed from "${existingRelease.releaseDate}" to "${data.releaseDate}"`);
    }
    if (data.isAsap !== undefined) {
      await createHistoryEntry('isAsap', existingRelease.isAsap, data.isAsap, 'metadata_updated', `ASAP status changed to ${data.isAsap ? 'enabled' : 'disabled'}`);
    }
    if (data.mainArtist !== undefined) {
      await createHistoryEntry('mainArtist', existingRelease.mainArtist, data.mainArtist, 'metadata_updated', `Main artist changed from "${existingRelease.mainArtist}" to "${data.mainArtist}"`);
    }

    const newAdditionalArtists = data.featuredArtists !== undefined ? data.featuredArtists : data.additionalArtists;
    if (newAdditionalArtists !== undefined) {
      await createHistoryEntry('additionalArtists', existingRelease.additionalArtists, newAdditionalArtists, 'metadata_updated', `Additional artists changed`);
    }

    if (data.genre !== undefined) {
      await createHistoryEntry('genre', existingRelease.genre, data.genre, 'metadata_updated', `Genre changed from "${existingRelease.genre}" to "${data.genre}"`);
    }
    if (data.subgenre !== undefined) {
      await createHistoryEntry('subgenre', existingRelease.subgenre, data.subgenre, 'metadata_updated', `Subgenre changed from "${existingRelease.subgenre}" to "${data.subgenre}"`);
    }
    if (data.label !== undefined) {
      await createHistoryEntry('label', existingRelease.label, data.label, 'metadata_updated', `Label changed from "${existingRelease.label}" to "${data.label}"`);
    }

    const newPromoText = data.promoInfo !== undefined ? data.promoInfo : data.promoText;
    if (newPromoText !== undefined) {
      await createHistoryEntry('promoText', existingRelease.promoText, newPromoText, 'metadata_updated', 'Promo info updated');
    }

    const newUseEditorialPromo = data.promoByNightvolt !== undefined ? data.promoByNightvolt : data.useEditorialPromo;
    if (newUseEditorialPromo !== undefined) {
      await createHistoryEntry('useEditorialPromo', existingRelease.useEditorialPromo, newUseEditorialPromo, 'metadata_updated', `Editorial promo changed to ${newUseEditorialPromo ? 'enabled' : 'disabled'}`);
    }

    const statusChanged = data.status !== undefined && data.status !== existingRelease.status;
    if (statusChanged) {
      await createHistoryEntry('status', existingRelease.status, data.status, 'status_changed', `Status changed from "${existingRelease.status}" to "${data.status}"`);
    }
    if (data.upc !== undefined && data.upc !== existingRelease.upc) {
      await createHistoryEntry('upc', existingRelease.upc, data.upc, 'upc_added', `UPC code ${existingRelease.upc ? 'updated' : 'added'}: ${data.upc}`);
    }
    if (data.moderatorComment !== undefined && data.moderatorComment !== existingRelease.moderatorComment) {
      await createHistoryEntry('moderatorComment', existingRelease.moderatorComment, data.moderatorComment, 'comment_added', 'Moderator comment updated');
    }

    // Обновляем треки отдельно если они были переданы
    if (data.tracks !== undefined && Array.isArray(data.tracks)) {
      await db.delete(tracks).where(eq(tracks.releaseId, releaseId));

      if (data.tracks.length > 0) {
        const trackValues = data.tracks.map((track: any, index: number) => ({
          releaseId: releaseId,
          trackNumber: index + 1,
          title: track.title || '',
          url: track.url || '',
          artists: track.performers || track.artists || '',
          musicAuthor: track.musicAuthor || null,
          lyricsAuthor: track.lyricsAuthor || null,
          producer: track.producer || null,
          lyrics: track.lyrics || null,
          createdAt: new Date().toISOString(),
        }));

        await db.insert(tracks).values(trackValues);
      }

      await db.insert(releaseHistory).values({
        releaseId,
        action: 'tracks_updated',
        field: 'tracks',
        oldValue: null,
        newValue: null,
        performedBy: session.email || 'Unknown Admin',
        performedAt: new Date().toISOString(),
        description: 'Track list updated',
      });
    }

    // Обновляем релиз
    await db
      .update(releases)
      .set({
        type: data.type,
        title: data.title,
        coverUrl: data.coverUrl,
        releaseDate: data.releaseDate,
        isAsap: data.isAsap,
        mainArtist: data.mainArtist,
        additionalArtists: newAdditionalArtists,
        genre: data.genre,
        subgenre: data.subgenre,
        label: data.label,
        promoText: newPromoText,
        useEditorialPromo: newUseEditorialPromo,
        status: data.status,
        upc: data.upc,
        moderatorComment: data.moderatorComment,
        artistComment: data.artistComment,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(releases.id, releaseId));

    // Send Telegram notification if status changed
    if (statusChanged) {
      const releaseTitle = data.title ?? existingRelease.title;
      const comment = data.moderatorComment ?? existingRelease.moderatorComment;
      await notifyArtistOnStatusChange(existingRelease.artistId, releaseTitle, data.status, comment);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating release:', error);
    return NextResponse.json(
      { error: 'Ошибка при обновлении релиза: ' + (error instanceof Error ? error.message : 'Неизвестная ошибка') },
      { status: 500 }
    );
  }
}

// ─── DELETE — full release removal including Supabase files ──────────────────

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSessionFromRequest(request);

    if (!session || !session.isAdmin) {
      return NextResponse.json(
        { error: 'Требуется авторизация администратора' },
        { status: 401 }
      );
    }

    const releaseId = parseInt(params.id);
    if (isNaN(releaseId)) {
      return NextResponse.json({ error: 'Некорректный ID релиза' }, { status: 400 });
    }

    // Fetch release to get file URLs before deletion
    const [release] = await db
      .select({ coverUrl: releases.coverUrl, id: releases.id, title: releases.title })
      .from(releases)
      .where(eq(releases.id, releaseId))
      .limit(1);

    if (!release) {
      return NextResponse.json({ error: 'Релиз не найден' }, { status: 404 });
    }

    // Fetch track URLs for Supabase cleanup
    const releaseTracks = await db
      .select({ url: tracks.url })
      .from(tracks)
      .where(eq(tracks.releaseId, releaseId));

    // ── Delete all DB rows in dependency order ────────────────────────────────
    await db.delete(releaseHistory).where(eq(releaseHistory.releaseId, releaseId));
    await db.delete(lyricsSubmissions).where(eq(lyricsSubmissions.releaseId, releaseId));
    await db.delete(pitchings).where(eq(pitchings.releaseId, releaseId));
    await db.delete(tracks).where(eq(tracks.releaseId, releaseId));
    await db.delete(releases).where(eq(releases.id, releaseId));

    // ── Delete files from the configured storage (best-effort) ───────────────
    const fileCleanupPromises: Promise<boolean>[] = [];

    if (release.coverUrl) {
      fileCleanupPromises.push(deleteFromStorage('release-covers', release.coverUrl));
    }

    for (const track of releaseTracks) {
      if (track.url) {
        fileCleanupPromises.push(deleteFromStorage('release-tracks', track.url));
      }
    }

    await Promise.allSettled(fileCleanupPromises);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting release:', error);
    return NextResponse.json(
      { error: 'Ошибка при удалении релиза: ' + (error instanceof Error ? error.message : 'Неизвестная ошибка') },
      { status: 500 }
    );
  }
}
