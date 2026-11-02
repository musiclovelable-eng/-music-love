import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { artists } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { verifyCredentials } from '@/lib/auth';
import { sendTelegramMessageRaw } from '@/lib/telegram';

// ─── In-memory auth session store ─────────────────────────────────────────────
// Tracks which step each chat is in during the login flow.
// step: 'await_email' | 'await_password'
type AuthState = { step: 'await_email' } | { step: 'await_password'; email: string };
const pendingAuth = new Map<string, AuthState>();

// ─── Helper ───────────────────────────────────────────────────────────────────
// Bot command responses always go through raw (bypass enabled/disabled flag)
// so that /start, /logout, etc. always work regardless of admin broadcast setting.
async function reply(chatId: string, text: string) {
  return sendTelegramMessageRaw(chatId, text);
}

async function getArtistByChatId(chatId: string) {
  const [artist] = await db
    .select()
    .from(artists)
    .where(eq(artists.telegramChatId, chatId))
    .limit(1);
  return artist || null;
}

// ─── Route ────────────────────────────────────────────────────────────────────

// Telegram sends POST requests to the webhook
export async function POST(request: NextRequest) {
  try {
    const update = await request.json();
    const message = update?.message;

    if (!message) {
      return NextResponse.json({ ok: true });
    }

    const chatId = String(message.chat.id);
    const text: string = (message.text || '').trim();

    // ── /start ──────────────────────────────────────────────────────────────
    if (text === '/start') {
      const linked = await getArtistByChatId(chatId);
      if (linked) {
        await reply(
          chatId,
          `👋 Вы уже авторизованы как <b>${linked.name}</b>.\n\nВы будете получать уведомления по своим релизам автоматически.\n\nЧтобы отвязать аккаунт — отправьте /logout`
        );
      } else {
        pendingAuth.set(chatId, { step: 'await_email' });
        await reply(
          chatId,
          `👋 Добро пожаловать в <b>Music Love</b>!\n\nЧтобы получать уведомления о статусах ваших релизов, необходимо войти в аккаунт.\n\n📧 Введите ваш <b>email</b> (логин) от личного кабинета:`
        );
      }
      return NextResponse.json({ ok: true });
    }

    // ── /logout ──────────────────────────────────────────────────────────────
    if (text === '/logout') {
      pendingAuth.delete(chatId);
      const linked = await getArtistByChatId(chatId);
      if (!linked) {
        await reply(chatId, '⚠️ Вы не авторизованы.');
        return NextResponse.json({ ok: true });
      }
      await db
        .update(artists)
        .set({ telegramChatId: null })
        .where(eq(artists.id, linked.id));
      await reply(
        chatId,
        `✅ Аккаунт <b>${linked.name}</b> отвязан от Telegram.\n\nВы больше не будете получать уведомления.\n\nЧтобы подключиться снова — отправьте /start`
      );
      return NextResponse.json({ ok: true });
    }

    // ── /status ──────────────────────────────────────────────────────────────
    if (text === '/status') {
      const linked = await getArtistByChatId(chatId);
      if (linked) {
        await reply(
          chatId,
          `✅ Вы авторизованы как <b>${linked.name}</b> (${linked.email}).\n\nУведомления о релизах активны.\n\nКоманды:\n/logout — отвязать аккаунт`
        );
      } else {
        await reply(
          chatId,
          '❌ Аккаунт не привязан.\n\nОтправьте /start для авторизации.'
        );
      }
      return NextResponse.json({ ok: true });
    }

    // ── Auth flow ─────────────────────────────────────────────────────────────
    const state = pendingAuth.get(chatId);

    if (!state) {
      // Not in auth flow and not a known command
      const linked = await getArtistByChatId(chatId);
      if (!linked) {
        await reply(
          chatId,
          'Отправьте /start для авторизации или /status для проверки статуса.'
        );
      } else {
        await reply(
          chatId,
          `Вы авторизованы как <b>${linked.name}</b>.\n\nКоманды:\n/status — статус аккаунта\n/logout — отвязать аккаунт`
        );
      }
      return NextResponse.json({ ok: true });
    }

    // Step 1 — waiting for email
    if (state.step === 'await_email') {
      const email = text.toLowerCase();
      // Basic email check
      if (!email.includes('@')) {
        await reply(chatId, '❌ Некорректный email. Попробуйте ещё раз:');
        return NextResponse.json({ ok: true });
      }
      pendingAuth.set(chatId, { step: 'await_password', email });
      await reply(chatId, `🔑 Введите ваш <b>пароль</b>:`);
      return NextResponse.json({ ok: true });
    }

    // Step 2 — waiting for password
    if (state.step === 'await_password') {
      const { email } = state;
      const password = text;

      try {
        const session = await verifyCredentials(email, password);

        if (!session) {
          // Wrong credentials — stay in await_email step so they start fresh
          pendingAuth.set(chatId, { step: 'await_email' });
          await reply(
            chatId,
            '❌ Неверный email или пароль.\n\nПопробуйте ещё раз. Введите ваш <b>email</b>:'
          );
          return NextResponse.json({ ok: true });
        }

        // Check if this artist's account is already linked to another Telegram chat
        const [existingArtist] = await db
          .select()
          .from(artists)
          .where(eq(artists.id, session.userId))
          .limit(1);

        if (existingArtist?.telegramChatId && existingArtist.telegramChatId !== chatId) {
          // Unlink the old chat silently, link new one
        }

        // Link this chatId to the artist
        await db
          .update(artists)
          .set({ telegramChatId: chatId })
          .where(eq(artists.id, session.userId));

        pendingAuth.delete(chatId);

        await reply(
          chatId,
          `🎉 Авторизация успешна!\n\nАккаунт <b>${session.name}</b> привязан к Telegram.\n\nТеперь вы будете получать уведомления о статусах ваших релизов мгновенно.\n\nКоманды:\n/status — проверить статус\n/logout — отвязать аккаунт`
        );
      } catch (err: any) {
        pendingAuth.delete(chatId);
        if (err.message === 'BLOCKED') {
          await reply(chatId, '🚫 Ваш аккаунт заблокирован. Обратитесь в поддержку.');
        } else if (err.message === 'PENDING_APPROVAL') {
          await reply(chatId, '⏳ Ваш аккаунт ожидает одобрения администратора. Попробуйте позже.');
        } else if (err.message === 'FROZEN') {
          await reply(chatId, '🔒 Ваш аккаунт временно заморожен. Обратитесь в поддержку.');
        } else {
          await reply(chatId, '❌ Ошибка авторизации. Попробуйте позже или напишите /start.');
        }
      }

      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Telegram webhook error:', error);
    return NextResponse.json({ ok: true }); // Always 200 to Telegram
  }
}

// Telegram also sends GET for webhook verification check (optional)
export async function GET() {
  return NextResponse.json({ ok: true, service: 'Music Love Telegram Bot' });
}
