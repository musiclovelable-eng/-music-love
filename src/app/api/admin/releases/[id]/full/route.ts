import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@libsql/client';
import { getSessionFromRequest } from '@/lib/auth';

function safeJsonParse(str: string | null): any {
  if (!str) return null;
  try { return JSON.parse(str); } catch { return null; }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'Требуется авторизация' }, { status: 401 });
    }
    if (!session.isAdmin) {
      return NextResponse.json({ error: 'Требуются права администратора' }, { status: 403 });
    }

    const releaseId = parseInt(params.id);
    if (!releaseId || isNaN(releaseId)) {
      return NextResponse.json({ error: 'Некорректный ID' }, { status: 400 });
    }

    const client = createClient({
      url: process.env.TURSO_CONNECTION_URL!,
      authToken: process.env.TURSO_AUTH_TOKEN!,
    });

    // Raw SQL — get ALL columns including those not in Drizzle schema
    const releaseResult = await client.execute({
      sql: `SELECT r.*, a.name as artist_name, a.email as artist_email, a.label as artist_label, a.plan as artist_plan
            FROM releases r
            LEFT JOIN artists a ON r.artist_id = a.id
            WHERE r.id = ?`,
      args: [releaseId],
    });

    if (releaseResult.rows.length === 0) {
      return NextResponse.json({ error: 'Релиз не найден' }, { status: 404 });
    }

    const row = releaseResult.rows[0] as any;

    // Get tracks with ALL columns
    const tracksResult = await client.execute({
      sql: `SELECT * FROM tracks WHERE release_id = ? ORDER BY track_number`,
      args: [releaseId],
    });

    const formattedRelease = {
      id: row.id,
      type: row.type,
      title: row.title,
      subtitle: row.subtitle || '',
      coverUrl: row.cover_url,
      releaseDate: row.release_date,
      startDate: row.start_date || null,
      preorderDate: row.pre_order_date || row.preorder_date || null,
      isAsap: !!row.is_asap,
      mainArtist: row.main_artist,
      additionalArtists: row.additional_artists || '',
      featuredArtists: row.additional_artists || '',
      genre: row.genre,
      subgenre: row.subgenre || '',
      label: row.label,
      promoText: row.promo_text || '',
      promoInfo: row.promo_text || '',
      useEditorialPromo: !!row.use_editorial_promo,
      promoByNightvolt: !!row.use_editorial_promo,
      status: row.status,
      upc: row.upc || '',
      artistComment: row.artist_comment || '',
      moderatorComment: row.moderator_comment || '',
      metadataLang: row.metadata_language || '',
      partnerCode: row.partner_code || '',
      rightsYear: row.copyright_year || '',
      earlyRussia: !!row.early_russia || !!row.early_release_russia,
      realtimeDelivery: !!row.realtime_delivery,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      artistId: row.artist_id,
      artistName: row.artist_name,
      artistEmail: row.artist_email,
      artistLabel: row.artist_label,
      artistPlan: row.artist_plan,
      platformsList: safeJsonParse(row.platforms),
      territoriesList: safeJsonParse(row.territories),
      personsList: safeJsonParse(row.persons),
      deactivationReason: row.deactivation_reason || null,
      deactivatedAt: row.deactivated_at || null,
      tracks: tracksResult.rows.map((t: any) => ({
        id: t.id.toString(),
        title: t.title,
        subtitle: t.subtitle || '',
        url: t.url || '',
        performers: t.artists || '',
        artists: t.artists || '',
        musicAuthor: t.music_author || '',
        lyricsAuthor: t.lyrics_author || '',
        producer: t.producer || '',
        composer: t.composer || '',
        lyrics: t.lyrics || '',
        isrc: t.isrc || '',
        language: t.language || '',
        explicit: !!t.explicit,
        isLive: !!t.is_live,
        isCover: !!t.is_cover,
        isRemix: !!t.is_remix,
        isInstrumental: !!t.is_instrumental,
        previewStart: t.preview_start || '',
      })),
      editableFields: [],
    };

    return NextResponse.json({ release: formattedRelease }, { status: 200 });
  } catch (error) {
    console.error('GET release details error:', error);
    return NextResponse.json(
      { error: 'Ошибка сервера: ' + (error instanceof Error ? error.message : '') },
      { status: 500 }
    );
  }
}
