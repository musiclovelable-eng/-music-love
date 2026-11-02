import { NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { db } from '@/db';
import { releases } from '@/db/schema';
import { eq, desc, and } from 'drizzle-orm';

export async function GET(request: Request) {
  try {
    const session = await getSessionFromRequest(request);

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Проверяем параметр статуса из query string
    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get('status');

    let query = db
      .select()
      .from(releases)
      .where(eq(releases.artistId, session.userId));

    // Если указан статус, фильтруем по нему
    if (statusFilter) {
      query = db
        .select()
        .from(releases)
        .where(
          and(
            eq(releases.artistId, session.userId),
            eq(releases.status, statusFilter)
          )
        );
    }

    const userReleases = await query.orderBy(desc(releases.createdAt));

    return NextResponse.json({ releases: userReleases });
  } catch (error) {
    console.error('Error fetching releases:', error);
    return NextResponse.json(
      { error: 'Ошибка при загрузке релизов' },
      { status: 500 }
    );
  }
}