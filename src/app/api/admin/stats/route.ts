import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db } from '@/db';
import { artists, releases } from '@/db/schema';
import { eq, count } from 'drizzle-orm';

export async function GET() {
  try {
    const session = await getSession();

    if (!session || !session.isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Подсчитываем статистику
    const [totalArtistsResult] = await db
      .select({ count: count() })
      .from(artists)
      .where(eq(artists.isAdmin, false));

    const [totalReleasesResult] = await db
      .select({ count: count() })
      .from(releases);

    const [pendingReleasesResult] = await db
      .select({ count: count() })
      .from(releases)
      .where(eq(releases.status, 'on_moderation'));

    const [approvedReleasesResult] = await db
      .select({ count: count() })
      .from(releases)
      .where(eq(releases.status, 'approved'));

    const [rejectedReleasesResult] = await db
      .select({ count: count() })
      .from(releases)
      .where(eq(releases.status, 'rejected'));

    return NextResponse.json({
      stats: {
        totalArtists: totalArtistsResult?.count || 0,
        totalReleases: totalReleasesResult?.count || 0,
        pendingReleases: pendingReleasesResult?.count || 0,
        approvedReleases: approvedReleasesResult?.count || 0,
        rejectedReleases: rejectedReleasesResult?.count || 0,
      },
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { error: 'Ошибка при загрузке статистики' },
      { status: 500 }
    );
  }
}
