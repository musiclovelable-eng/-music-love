import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { artists } from '@/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import { sendVerificationEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const { email, password, firstName, lastName, artistName, socialNetwork, howDidYouHear } = await request.json();

    if (!email || !password || !firstName || !artistName || !socialNetwork) {
      return NextResponse.json(
        { error: 'Заполните все обязательные поля' },
        { status: 400 }
      );
    }

    // Проверяем — нет ли уже пользователя с таким email
    const [existingUser] = await db
      .select()
      .from(artists)
      .where(eq(artists.email, email.toLowerCase()))
      .limit(1);

    if (existingUser) {
      return NextResponse.json(
        { error: 'Пользователь с таким email уже существует' },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const uid = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

    // Генерируем 6-значный код
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Создаём аккаунт — НЕ подтверждён, НЕ одобрен
    await db.insert(artists).values({
      uid,
      email: email.toLowerCase(),
      password: hashedPassword,
      name: firstName,
      surname: lastName || '',
      artistName,
      plan: 'none',
      emailVerified: false,
      isApproved: false,
      requiresApproval: false, // Не требует одобрения админа — только подтверждение почты
      verificationCode,
      accessRequestMessage: null,
      socialNetwork: socialNetwork || null,
      howDidYouHear: howDidYouHear || null,
      createdAt: new Date().toISOString(),
    });

    // Отправляем код на почту через SMTP
    const emailResult = await sendVerificationEmail(email.toLowerCase(), verificationCode);

    if (!emailResult.success) {
      console.error('Failed to send verification email:', emailResult.error);
      // Всё равно возвращаем успех — аккаунт создан, код в БД есть
      // Артист сможет запросить повторную отправку
    }

    return NextResponse.json({
      success: true,
      email: email.toLowerCase(),
      message: 'Аккаунт создан. Проверьте почту для ввода кода подтверждения.',
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Ошибка при регистрации' },
      { status: 500 }
    );
  }
}
