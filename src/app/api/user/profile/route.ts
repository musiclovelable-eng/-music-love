import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db } from '@/db';
import { artists } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, surname, email, socialNetwork, bio } = body;

    const updateData: any = {};

    // Имя и фамилия — можно редактировать
    if (name !== undefined) {
      if (!name.trim()) return NextResponse.json({ error: 'Имя не может быть пустым' }, { status: 400 });
      updateData.name = name.trim();
    }
    if (surname !== undefined) {
      updateData.surname = surname.trim() || null;
    }

    // Email — можно менять, но проверяем уникальность
    if (email !== undefined) {
      const trimmedEmail = email.trim().toLowerCase();
      if (!trimmedEmail.includes('@')) {
        return NextResponse.json({ error: 'Некорректный email' }, { status: 400 });
      }
      // Проверяем, не занят ли email другим пользователем
      const [existing] = await db
        .select({ id: artists.id })
        .from(artists)
        .where(eq(artists.email, trimmedEmail))
        .limit(1);
      if (existing && existing.id !== session.userId) {
        return NextResponse.json({ error: 'Этот email уже используется' }, { status: 400 });
      }
      updateData.email = trimmedEmail;
    }

    // Соцсети
    if (socialNetwork !== undefined) {
      updateData.socialNetwork = socialNetwork.trim() || null;
    }

    // Биография
    if (bio !== undefined) {
      updateData.bio = bio.trim().slice(0, 5000) || null;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'Нет данных для обновления' }, { status: 400 });
    }

    const [updated] = await db
      .update(artists)
      .set(updateData)
      .where(eq(artists.id, session.userId))
      .returning();

    return NextResponse.json({
      success: true,
      user: {
        name: updated.name,
        surname: updated.surname,
        artistName: updated.artistName,
        email: updated.email,
        socialNetwork: updated.socialNetwork,
        bio: updated.bio,
      },
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json({ error: 'Ошибка при обновлении профиля' }, { status: 500 });
  }
}
