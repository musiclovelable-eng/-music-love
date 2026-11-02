import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { setTelegramWebhook, deleteTelegramWebhook, getTelegramWebhookInfo } from '@/lib/telegram';

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session?.isAdmin) {
      return NextResponse.json({ error: 'Admin required' }, { status: 403 });
    }

    const { action, url } = await request.json();

    if (action === 'set') {
      const appUrl = url || process.env.NEXT_PUBLIC_APP_URL;
      if (!appUrl) {
        return NextResponse.json({ error: 'APP_URL not configured' }, { status: 400 });
      }
      const webhookUrl = `${appUrl}/api/telegram/webhook`;
      const result = await setTelegramWebhook(webhookUrl);
      return NextResponse.json({ result, webhookUrl });
    }

    if (action === 'delete') {
      const result = await deleteTelegramWebhook();
      return NextResponse.json({ result });
    }

    if (action === 'info') {
      const result = await getTelegramWebhookInfo();
      return NextResponse.json({ result });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Error: ' + (error instanceof Error ? error.message : 'Unknown') },
      { status: 500 }
    );
  }
}

// Auto-setup via GET (for easy triggering from browser while developing)
export async function GET(request: NextRequest) {
  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (!appUrl) {
      return NextResponse.json({ error: 'NEXT_PUBLIC_APP_URL not set in .env' }, { status: 400 });
    }

    const webhookUrl = `${appUrl}/api/telegram/webhook`;
    const result = await setTelegramWebhook(webhookUrl);

    return NextResponse.json({ ok: true, result, webhookUrl });
  } catch (error) {
    return NextResponse.json(
      { error: 'Error: ' + (error instanceof Error ? error.message : 'Unknown') },
      { status: 500 }
    );
  }
}
