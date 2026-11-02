import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { artists } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const { email, code } = await request.json();

    if (!email || !code) {
      return NextResponse.json(
        { error: 'Email и код обязательны' },
        { status: 400 }
      );
    }

    // Ищем пользователя
    const [user] = await db
      .select()
      .from(artists)
      .where(eq(artists.email, email.toLowerCase()))
      .limit(1);

    if (!user) {
      return NextResponse.json(
        { error: 'Пользователь не найден' },
        { status: 404 }
      );
    }

    if (user.emailVerified) {
      return NextResponse.json(
        { error: 'Email уже подтверждён' },
        { status: 400 }
      );
    }

    // Проверяем код
    if (user.verificationCode !== code.trim()) {
      return NextResponse.json(
        { error: 'Неверный код подтверждения' },
        { status: 400 }
      );
    }

    // Подтверждаем email + активируем аккаунт (без одобрения админа)
    await db
      .update(artists)
      .set({
        emailVerified: true,
        isApproved: true,
        verificationCode: null,
      })
      .where(eq(artists.id, user.id));

    return NextResponse.json({
      success: true,
      message: 'Email подтверждён. Аккаунт активирован.',
    });
  } catch (error) {
    console.error('Verification error:', error);
    return NextResponse.json(
      { error: 'Ошибка при верификации' },
      { status: 500 }
    );
  }
}
