import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { db } from '@/db';
import { lyricsSubmissions, artists, releases } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authentication check - используем bearer token
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json(
        { error: 'Требуется авторизация', code: 'AUTHENTICATION_REQUIRED' },
        { status: 401 }
      );
    }

    // Admin authorization check
    if (!session.isAdmin) {
      return NextResponse.json(
        { error: 'Требуются права администратора', code: 'ADMIN_ACCESS_REQUIRED' },
        { status: 403 }
      );
    }

    // Validate release ID
    const releaseId = params.id;
    if (!releaseId || isNaN(parseInt(releaseId))) {
      return NextResponse.json(
        { error: 'Некорректный ID релиза', code: 'INVALID_RELEASE_ID' },
        { status: 400 }
      );
    }

    const parsedReleaseId = parseInt(releaseId);

    // Check if release exists
    const release = await db
      .select()
      .from(releases)
      .where(eq(releases.id, parsedReleaseId))
      .limit(1);

    if (release.length === 0) {
      return NextResponse.json(
        { error: 'Релиз не найден', code: 'RELEASE_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Query lyrics submissions with artist information
    const submissions = await db
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
      .where(eq(lyricsSubmissions.releaseId, parsedReleaseId))
      .orderBy(desc(lyricsSubmissions.createdAt));

    return NextResponse.json({ submissions }, { status: 200 });
  } catch (error) {
    console.error('GET lyrics submissions error:', error);
    return NextResponse.json(
      {
        error: 'Внутренняя ошибка сервера: ' + (error instanceof Error ? error.message : 'Неизвестная ошибка'),
        code: 'INTERNAL_SERVER_ERROR',
      },
      { status: 500 }
    );
  }
}