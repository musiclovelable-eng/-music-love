import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db } from '@/db';
import { artists } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { uploadToStorage } from '@/lib/storage';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    if (!file) {
      return NextResponse.json({ error: 'Файл не найден' }, { status: 400 });
    }

    // Validate file type
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      return NextResponse.json({ error: 'Допустимые форматы: JPG, PNG, WebP' }, { status: 400 });
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'Максимальный размер: 5 МБ' }, { status: 400 });
    }

    // Generate unique filename
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `${session.userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const { url: publicUrl } = await uploadToStorage('avatars', fileName, file);

    // Update artist avatar in DB
    await db
      .update(artists)
      .set({ avatarUrl: publicUrl })
      .where(eq(artists.id, session.userId));

    return NextResponse.json({ success: true, avatarUrl: publicUrl });
  } catch (error) {
    console.error('Error uploading avatar:', error);
    return NextResponse.json({ error: 'Ошибка при загрузке аватара' }, { status: 500 });
  }
}
