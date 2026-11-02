import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db } from '@/db';
import { artists } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Неавторизован' }, { status: 401 });
    }

    const { message } = await request.json();

    if (!message) {
      return NextResponse.json({ error: 'Сообщение обязательно' }, { status: 400 });
    }

    await db
      .update(artists)
      .set({
        accessRequestMessage: message,
      })
      .where(eq(artists.id, session.userId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Request access error:', error);
    return NextResponse.json({ error: 'Ошибка при отправке запроса' }, { status: 500 });
  }
}
