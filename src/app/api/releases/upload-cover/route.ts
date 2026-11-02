import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { uploadToStorage } from '@/lib/storage';

export const runtime = 'nodejs';
export const maxDuration = 120;

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Расширенная валидация типов файлов
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    const fileType = file.type.toLowerCase();
    
    if (!allowedTypes.includes(fileType)) {
      return NextResponse.json(
        { error: 'Неверный формат файла. Допустимые форматы: JPEG, PNG, WebP' },
        { status: 400 }
      );
    }

    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Размер файла превышает лимит 50 МБ' },
        { status: 400 }
      );
    }

    // Очищаем имя файла и определяем расширение
    const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const ext = originalName.split('.').pop()?.toLowerCase() || 'jpg';
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const fileName = `${session.userId}/${timestamp}-${randomString}.${ext}`;

    console.log(`Uploading cover: ${fileName}, size: ${file.size}, type: ${file.type}`);
    const { url } = await uploadToStorage('release-covers', fileName, file);
    console.log(`Cover uploaded successfully: ${url}`);

    return NextResponse.json({
      success: true,
      url,
      fileName: originalName,
      size: file.size,
    });
  } catch (error: any) {
    console.error('Upload cover error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Внутренняя ошибка сервера: ' + (error?.message || 'Unknown error')
      },
      { status: 500 }
    );
  }
}
