// Runs once when the Next.js server starts (Node.js runtime only).
// Registers the Telegram webhook on the production domain.
export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (!token || !appUrl) return;

  // Only re-register webhook from the canonical production domain.
  // This prevents a local/sandbox restart from clobbering the permanent URL.
  const isProd = appUrl.includes('account.nightvolt.ru') || appUrl.includes('vercel.app') || appUrl.includes('nightvolt-portal');

  if (isProd) {
    const webhookUrl = `${appUrl}/api/telegram/webhook`;
    try {
      const res = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: webhookUrl,
          allowed_updates: ['message'],
          drop_pending_updates: false,
        }),
      });
      const data = await res.json() as { ok: boolean; description?: string };
      if (data.ok) {
        console.log(`[Telegram] Webhook registered: ${webhookUrl}`);
      } else {
        console.error('[Telegram] Failed to set webhook:', data.description);
      }
    } catch (err) {
      console.error('[Telegram] Webhook registration error:', err);
    }
  } else {
    console.log('[Telegram] Dev environment — skipping webhook registration (permanent URL preserved)');
  }
}
