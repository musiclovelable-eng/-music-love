import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { artists } from '@/db/schema';
import { isNotNull } from 'drizzle-orm';
import { getSessionFromRequest } from '@/lib/auth';
import {
  sendTelegramMessage,
  isBotEnabled,
  setBotEnabled,
  getTelegramWebhookInfo,
} from '@/lib/telegram';

// ─── GET — fetch connected users + bot status ──────────────────────────────

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const connectedArtists = await db
    .select({
      id: artists.id,
      name: artists.name,
      surname: artists.surname,
      artistName: artists.artistName,
      email: artists.email,
      telegramChatId: artists.telegramChatId,
    })
    .from(artists)
    .where(isNotNull(artists.telegramChatId));

  const botEnabled = await isBotEnabled();
  const webhookInfo = await getTelegramWebhookInfo();

  return NextResponse.json({
    connectedArtists,
    botEnabled,
    webhookInfo: webhookInfo?.result ?? null,
  });
}

// ─── POST — broadcast or toggle bot ───────────────────────────────────────────

export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { action } = body;

  // Toggle bot enabled/disabled
  if (action === 'toggle_bot') {
    const { enabled } = body as { enabled: boolean };
    await setBotEnabled(enabled);
    return NextResponse.json({ ok: true, botEnabled: enabled });
  }

  // Broadcast to all connected artists
  if (action === 'broadcast_all') {
    const { message } = body as { message: string };
    if (!message?.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const connected = await db
      .select({ telegramChatId: artists.telegramChatId })
      .from(artists)
      .where(isNotNull(artists.telegramChatId));

    let successCount = 0;
    let failCount = 0;

    for (const a of connected) {
      if (!a.telegramChatId) continue;
      const ok = await sendTelegramMessage(a.telegramChatId, message);
      if (ok) successCount++;
      else failCount++;
    }

    return NextResponse.json({ ok: true, successCount, failCount });
  }

  // Broadcast to specific artists
  if (action === 'broadcast_selected') {
    const { artistIds, message } = body as { artistIds: number[]; message: string };
    if (!message?.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }
    if (!artistIds?.length) {
      return NextResponse.json({ error: 'No artists selected' }, { status: 400 });
    }

    const connected = await db
      .select({ id: artists.id, telegramChatId: artists.telegramChatId })
      .from(artists)
      .where(isNotNull(artists.telegramChatId));

    const targets = connected.filter((a) => artistIds.includes(a.id));
    let successCount = 0;
    let failCount = 0;

    for (const a of targets) {
      if (!a.telegramChatId) continue;
      const ok = await sendTelegramMessage(a.telegramChatId, message);
      if (ok) successCount++;
      else failCount++;
    }

    return NextResponse.json({ ok: true, successCount, failCount });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
