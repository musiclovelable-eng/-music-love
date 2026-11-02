import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db } from '@/db';
import { artists, passwordHistory } from '@/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';

export async function GET() {
  try {
    const session = await getSession();

    if (!session || !session.isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const allArtists = await db
      .select()
      .from(artists)
      .where(eq(artists.isAdmin, false))
      .orderBy(artists.createdAt);

    // Добавляем статус активности для каждого артиста
    const artistsWithStatus = allArtists.map(artist => {
      const isOnline = artist.lastActiveAt 
        ? (Date.now() - new Date(artist.lastActiveAt).getTime()) < 120000 // 2 минуты
        : false;
      
      return {
        ...artist,
        isOnline,
      };
    });

    return NextResponse.json({ artists: artistsWithStatus });
  } catch (error) {
    console.error('Error fetching artists:', error);
    return NextResponse.json(
      { error: 'Ошибка при загрузке артистов' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session || !session.isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { email, name, plan, password } = await request.json();

    if (!email || !name || !password) {
      return NextResponse.json(
        { error: 'Необходимо заполнить все поля' },
        { status: 400 }
      );
    }

    // Проверяем существование email
    const [existingArtist] = await db
      .select()
      .from(artists)
      .where(eq(artists.email, email))
      .limit(1);

    if (existingArtist) {
      return NextResponse.json(
        { error: 'Артист с таким email уже существует' },
        { status: 400 }
      );
    }

    // Генерируем UID
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    const uid = `artist-${timestamp}-${random}`;

    // Хешируем пароль
    const hashedPassword = bcrypt.hashSync(password, 10);

    // Создаём артиста
    const [newArtist] = await db.insert(artists).values({
      uid,
      email,
      password: hashedPassword,
      name,
      plan: plan || 'basic',
      isApproved: true,
      emailVerified: true,
      isBlocked: false,
      isAdmin: false,
      theme: 'light',
      showSnowflakes: false,
      avatarUrl: null,
      label: 'Music Love',
      createdAt: new Date().toISOString(),
    }).returning();

    // Сохраняем пароль в истории
    await db.insert(passwordHistory).values({
      artistId: newArtist.id,
      password: hashedPassword,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, artist: newArtist });
  } catch (error) {
    console.error('Error creating artist:', error);
    return NextResponse.json(
      { error: 'Ошибка при создании артиста' },
      { status: 500 }
    );
  }
}