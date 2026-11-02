import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { uploadToStorage } from '@/lib/storage';

export const runtime = 'nodejs';
export const maxDuration = 300;

// Disable default body parser limit for this route
export const config = {
  api: {
    bodyParser: false,
  },
};

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

    // Расширенная валидация аудио-форматов
    const allowedTypes = [
      'audio/mpeg',
      'audio/mp3',
      'audio/wav',
      'audio/wave',
      'audio/x-wav',
      'audio/flac',
      'audio/x-flac',
      'audio/aac',
      'audio/aacp',
      'audio/ogg',
      'audio/mp4',
      'audio/m4a',
    ];
    
    const fileType = file.type.toLowerCase();
    
    // Дополнительная проверка по расширению, если тип не определен
    const ext = file.name.split('.').pop()?.toLowerCase();
    const allowedExtensions = ['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a'];
    
    if (!allowedTypes.includes(fileType) && !allowedExtensions.includes(ext || '')) {
      return NextResponse.json(
        { error: 'Неверный формат файла. Допустимые форматы: MP3, WAV, FLAC, AAC, OGG, M4A' },
        { status: 400 }
      );
    }

    if (file.size > 500 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Размер файла превышает лимит 500 МБ' },
        { status: 400 }
      );
    }

    // Очищаем имя файла
    const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileExt = originalName.split('.').pop()?.toLowerCase() || ext || 'mp3';
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const fileName = `${session.userId}/${timestamp}-${randomString}.${fileExt}`;

    console.log(`Uploading track: ${fileName}, size: ${file.size}, type: ${file.type}, ext: ${fileExt}`);
    const { url } = await uploadToStorage('release-tracks', fileName, file);
    console.log(`Track uploaded successfully: ${url}`);

    return NextResponse.json({
      success: true,
      url,
      fileName: originalName,
      size: file.size,
    });
  } catch (error: any) {
    console.error('Upload track error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Внутренняя ошибка сервера: ' + (error?.message || 'Unknown error')
      },
      { status: 500 }
    );
  }
}
