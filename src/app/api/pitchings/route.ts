import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { db } from '@/db';
import { pitchings, releases, artists } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

// GET: list artist's pitchings
export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const list = await db
      .select({
        id: pitchings.id,
        releaseId: pitchings.releaseId,
        promoText: pitchings.promoText,
        status: pitchings.status,
        adminNote: pitchings.adminNote,
        createdAt: pitchings.createdAt,
        releaseTitle: releases.title,
        releaseCover: releases.coverUrl,
        releaseType: releases.type,
        releaseMainArtist: releases.mainArtist,
      })
      .from(pitchings)
      .leftJoin(releases, eq(pitchings.releaseId, releases.id))
      .where(eq(pitchings.artistId, session.userId))
      .orderBy(desc(pitchings.createdAt));

    return NextResponse.json({ pitchings: list });
  } catch (error) {
    console.error('Error fetching pitchings:', error);
    return NextResponse.json({ error: 'Ошибка при загрузке питчингов' }, { status: 500 });
  }
}

// POST: submit a pitching
export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { releaseId, promoText } = await request.json();
    if (!releaseId || !promoText?.trim()) {
      return NextResponse.json({ error: 'Укажите релиз и промо-информацию' }, { status: 400 });
    }

    // Verify release belongs to artist
    const [release] = await db.select().from(releases).where(eq(releases.id, releaseId)).limit(1);
    if (!release || release.artistId !== session.userId) {
      return NextResponse.json({ error: 'Релиз не найден' }, { status: 404 });
    }

    const [pitching] = await db.insert(pitchings).values({
      artistId: session.userId,
      releaseId,
      promoText: promoText.trim(),
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }).returning();

    return NextResponse.json({ success: true, pitching });
  } catch (error) {
    console.error('Error creating pitching:', error);
    return NextResponse.json({ error: 'Ошибка при создании питчинга' }, { status: 500 });
  }
}
