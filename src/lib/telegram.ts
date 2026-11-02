import { db } from '@/db';
import { botSettings } from '@/db/schema';
import { eq } from 'drizzle-orm';

const TELEGRAM_API = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;

// ─── Check if the bot is enabled ──────────────────────────────────────────────

export async function isBotEnabled(): Promise<boolean> {
  try {
    const [row] = await db
      .select()
      .from(botSettings)
      .where(eq(botSettings.key, 'telegram_enabled'))
      .limit(1);
    return row?.value === 'true';
  } catch {
    return true; // Default to enabled on error
  }
}

export async function setBotEnabled(enabled: boolean): Promise<void> {
  const now = new Date().toISOString();
  const existing = await db
    .select()
    .from(botSettings)
    .where(eq(botSettings.key, 'telegram_enabled'))
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(botSettings)
      .set({ value: enabled ? 'true' : 'false', updatedAt: now })
      .where(eq(botSettings.key, 'telegram_enabled'));
  } else {
    await db.insert(botSettings).values({
      key: 'telegram_enabled',
      value: enabled ? 'true' : 'false',
      updatedAt: now,
    });
  }
}

// ─── Core API call ─────────────────────────────────────────────────────────────

async function callTelegram(method: string, body: object): Promise<any> {
  const res = await fetch(`${TELEGRAM_API}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return res.json();
}

// ─── Send a message to a chat ─────────────────────────────────────────────────

export async function sendTelegramMessage(chatId: string, text: string): Promise<boolean> {
  try {
    // Respect bot enabled/disabled flag
    const enabled = await isBotEnabled();
    if (!enabled) return false;

    const result = await callTelegram('sendMessage', {
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
    });
    return result.ok === true;
  } catch (error) {
    console.error('Telegram sendMessage error:', error);
    return false;
  }
}

// ─── Send a message ignoring the enabled flag (for system messages) ──────────

export async function sendTelegramMessageRaw(chatId: string, text: string): Promise<boolean> {
  try {
    const result = await callTelegram('sendMessage', {
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
    });
    return result.ok === true;
  } catch (error) {
    console.error('Telegram sendMessage error:', error);
    return false;
  }
}

// ─── Register webhook ─────────────────────────────────────────────────────────

export async function setTelegramWebhook(url: string): Promise<any> {
  return callTelegram('setWebhook', {
    url,
    allowed_updates: ['message'],
    drop_pending_updates: true,
  });
}

export async function deleteTelegramWebhook(): Promise<any> {
  return callTelegram('deleteWebhook', { drop_pending_updates: true });
}

export async function getTelegramWebhookInfo(): Promise<any> {
  const res = await fetch(`${TELEGRAM_API}/getWebhookInfo`);
  return res.json();
}

// ─── Notification formatters ──────────────────────────────────────────────────

export function buildReleaseNotification(
  status: string,
  releaseTitle: string,
  moderatorComment?: string | null
): string | null {
  const title = `<b>${releaseTitle}</b>`;

  switch (status) {
    case 'approved':
      return `✅ Ваш релиз ${title} прошёл модерацию!\n\nОн будет опубликован в указанную дату на всех выбранных площадках.`;

    case 'published':
      return `🎉 Ваш релиз ${title} опубликован!\n\nОн доступен на площадках.`;

    case 'rejected':
      return (
        `❌ Ваш релиз ${title} отклонён.` +
        (moderatorComment ? `\n\n<b>Причина:</b> ${moderatorComment}` : '')
      );

    case 'requires_changes':
      return (
        `⚠️ Ваш релиз ${title} требует доработки.` +
        (moderatorComment ? `\n\n<b>Комментарий администратора:</b> ${moderatorComment}` : '')
      );

    case 'on_moderation':
      return `🔄 Ваш релиз ${title} принят на модерацию.\n\nМы уведомим вас о результате.`;

    default:
      return null;
  }
}
