import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { artists } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getSessionFromRequest } from '@/lib/auth';

// POST /api/admin/telegram/unlink — admin unlinks a user's Telegram account
export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { artistId } = await request.json();
  if (!artistId) {
    return NextResponse.json({ error: 'artistId is required' }, { status: 400 });
  }

  await db
    .update(artists)
    .set({ telegramChatId: null })
    .where(eq(artists.id, artistId));

  return NextResponse.json({ ok: true });
}
