import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db } from '@/db';
import { artists, passwordHistory, releases } from '@/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();

    if (!session || !session.isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const artistId = parseInt(id);

    // Получаем артиста
    const [artist] = await db
      .select()
      .from(artists)
      .where(eq(artists.id, artistId))
      .limit(1);

    if (!artist) {
      return NextResponse.json(
        { error: 'Артист не найден' },
        { status: 404 }
      );
    }

    // Получаем историю паролей
    const passwords = await db
      .select()
      .from(passwordHistory)
      .where(eq(passwordHistory.artistId, artistId))
      .orderBy(passwordHistory.createdAt);

    // Получаем релизы артиста
    const artistReleases = await db
      .select()
      .from(releases)
      .where(eq(releases.artistId, artistId))
      .orderBy(releases.createdAt);

    return NextResponse.json({
      artist,
      passwordHistory: passwords,
      releases: artistReleases,
    });
  } catch (error) {
    console.error('Error fetching artist:', error);
    return NextResponse.json(
      { error: 'Ошибка при загрузке артиста' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();

    if (!session || !session.isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const artistId = parseInt(id);
    const data = await request.json();

    const updateData: any = {};

    if (data.name !== undefined) {
      updateData.name = data.name;
    }

    if (data.email !== undefined) {
      updateData.email = data.email;
    }

    if (data.isBlocked !== undefined) {
      updateData.isBlocked = data.isBlocked;
    }

    if (data.isDeactivated !== undefined) {
      updateData.isDeactivated = data.isDeactivated;
    }

    if (data.deactivationReason !== undefined) {
      updateData.deactivationReason = data.deactivationReason;
    }

    if (data.plan) {
      updateData.plan = data.plan;
    }

    if (data.role !== undefined) {
      // Validate role value
      const validRoles = [null, 'basic', 'advanced', 'label'];
      if (data.role !== null && !validRoles.includes(data.role)) {
        return NextResponse.json(
          { error: 'Invalid role value. Must be one of: null, "basic", "advanced", "label"' },
          { status: 400 }
        );
      }
      updateData.role = data.role;
    }

    if (data.label) {
      updateData.label = data.label;
      
      // Обновляем лейбл во всех релизах артиста
      await db
        .update(releases)
        .set({ label: data.label })
        .where(eq(releases.artistId, artistId));
    }

    if (data.contractSigned !== undefined) {
      updateData.contractSigned = data.contractSigned;
    }

    if (data.password) {
      const hashedPassword = bcrypt.hashSync(data.password, 10);
      updateData.password = hashedPassword;

      // Сохраняем в историю паролей
      await db.insert(passwordHistory).values({
        artistId,
        password: hashedPassword,
        createdAt: new Date().toISOString(),
      });
    }

    await db
      .update(artists)
      .set(updateData)
      .where(eq(artists.id, artistId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating artist:', error);
    return NextResponse.json(
      { error: 'Ошибка при обновлении артиста' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();

    if (!session || !session.isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const artistId = parseInt(id);

    await db.delete(artists).where(eq(artists.id, artistId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting artist:', error);
    return NextResponse.json(
      { error: 'Ошибка при удалении артиста' },
      { status: 500 }
    );
  }
}