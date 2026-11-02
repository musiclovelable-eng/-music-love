import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { db } from '@/db';
import { releases, artists } from '@/db/schema';
import { eq, desc, count, like, or, and, ne } from 'drizzle-orm';

const PAGE_SIZE = 20;

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);

    if (!session) {
      return NextResponse.json(
        { error: 'Требуется авторизация', code: 'AUTHENTICATION_REQUIRED' },
        { status: 401 }
      );
    }

    if (!session.isAdmin) {
      return NextResponse.json(
        { error: 'Требуются права администратора', code: 'ADMIN_ACCESS_REQUIRED' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const search = searchParams.get('search') || '';
    const statusFilter = searchParams.get('status') || '';
    const offset = (page - 1) * PAGE_SIZE;

    // Build search condition
    const searchCondition = search
      ? or(
          like(releases.title, `%${search}%`),
          like(releases.mainArtist, `%${search}%`),
          like(releases.upc, `%${search}%`),
          like(releases.label, `%${search}%`)
        )
      : undefined;

    // ЧЕРНОВИКИ НИКОГДА не показываются в админке
    // Если выбран конкретный статус — фильтруем по нему (кроме draft)
    // Если статус не выбран — показываем всё кроме draft
    let statusCondition;
    if (statusFilter && statusFilter !== 'draft') {
      statusCondition = eq(releases.status, statusFilter);
    } else {
      // По умолчанию исключаем только черновики
      statusCondition = ne(releases.status, 'draft');
    }

    // Combine conditions
    const combinedCondition = searchCondition
      ? and(searchCondition, statusCondition)
      : statusCondition;

    // Get total count for pagination
    const [{ total }] = await db
      .select({ total: count() })
      .from(releases)
      .where(combinedCondition);

    // Get paginated releases
    const allReleases = await db
      .select({
        id: releases.id,
        type: releases.type,
        title: releases.title,
        coverUrl: releases.coverUrl,
        releaseDate: releases.releaseDate,
        isAsap: releases.isAsap,
        mainArtist: releases.mainArtist,
        status: releases.status,
        upc: releases.upc,
        artistComment: releases.artistComment,
        moderatorComment: releases.moderatorComment,
        deactivationReason: releases.deactivationReason,
        deactivatedAt: releases.deactivatedAt,
        metadataLang: releases.metadataLang,
        earlyRussia: releases.earlyRussia,
        realtimeDelivery: releases.realtimeDelivery,
        createdAt: releases.createdAt,
        artistId: releases.artistId,
        artistName: artists.name,
        label: releases.label,
        genre: releases.genre,
      })
      .from(releases)
      .leftJoin(artists, eq(releases.artistId, artists.id))
      .where(combinedCondition)
      .orderBy(desc(releases.createdAt))
      .limit(PAGE_SIZE)
      .offset(offset);

    return NextResponse.json({
      releases: allReleases,
      pagination: {
        page,
        pageSize: PAGE_SIZE,
        total,
        totalPages: Math.ceil(total / PAGE_SIZE),
      },
    });
  } catch (error) {
    console.error('Error fetching releases:', error);
    return NextResponse.json(
      { error: 'Ошибка при загрузке релизов: ' + (error instanceof Error ? error.message : 'Неизвестная ошибка') },
      { status: 500 }
    );
  }
}
