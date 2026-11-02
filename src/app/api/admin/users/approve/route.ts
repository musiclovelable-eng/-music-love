import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db } from '@/db';
import { artists } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.isAdmin) {
      return NextResponse.json({ error: 'Неавторизован' }, { status: 401 });
    }

    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'ID пользователя обязателен' }, { status: 400 });
    }

    await db
      .update(artists)
      .set({
        isApproved: true,
        plan: 'basic', // Автоматически назначается «Базовый план»
      })
      .where(eq(artists.id, userId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Approve user error:', error);
    return NextResponse.json({ error: 'Ошибка при подтверждении пользователя' }, { status: 500 });
  }
}
