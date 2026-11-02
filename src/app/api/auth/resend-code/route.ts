import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { artists } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { sendVerificationEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email обязателен' }, { status: 400 });
    }

    const [user] = await db
      .select()
      .from(artists)
      .where(eq(artists.email, email.toLowerCase()))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 });
    }

    if (user.emailVerified) {
      return NextResponse.json({ error: 'Email уже подтверждён' }, { status: 400 });
    }

    // Генерируем новый код
    const newCode = Math.floor(100000 + Math.random() * 900000).toString();

    await db
      .update(artists)
      .set({ verificationCode: newCode })
      .where(eq(artists.id, user.id));

    const result = await sendVerificationEmail(email.toLowerCase(), newCode);

    if (!result.success) {
      return NextResponse.json({ error: 'Ошибка отправки письма' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Код отправлен повторно' });
  } catch (error) {
    console.error('Resend code error:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
