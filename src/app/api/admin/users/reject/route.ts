import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db } from '@/db';
import { artists } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

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

    const [user] = await db.select().from(artists).where(eq(artists.id, userId)).limit(1);
    
    if (!user) {
      return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 });
    }

    if (!user.requiresApproval) {
      return NextResponse.json({ 
        error: 'Нельзя отклонить существующего активного пользователя' 
      }, { status: 400 });
    }

    await db.delete(artists).where(
      and(
        eq(artists.id, userId),
        eq(artists.requiresApproval, true)
      )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Reject user error:', error);
    return NextResponse.json({ error: 'Ошибка при отклонении пользователя' }, { status: 500 });
  }
}
