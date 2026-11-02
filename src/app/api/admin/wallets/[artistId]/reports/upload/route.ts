import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { uploadToStorage } from '@/lib/storage';

export const runtime = 'nodejs';
export const maxDuration = 120;

const ALLOWED_EXTENSIONS = new Set([
  'pdf', 'png', 'jpg', 'jpeg', 'webp', 'xls', 'xlsx', 'csv',
  'doc', 'docx', 'txt', 'zip',
]);

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ artistId: string }> }
) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session?.isAdmin) {
      return NextResponse.json({ error: 'Требуется доступ администратора' }, { status: 401 });
    }

    const { artistId: rawArtistId } = await params;
    const artistId = Number(rawArtistId);
    if (!Number.isInteger(artistId) || artistId <= 0) {
      return NextResponse.json({ error: 'Некорректный артист' }, { status: 400 });
    }

    const formData = await request.formData();
    const file = formData.get('file');
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Файл не найден' }, { status: 400 });
    }

    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json({ error: 'Максимальный размер файла: 50 МБ' }, { status: 400 });
    }

    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const extension = safeName.split('.').pop()?.toLowerCase() || '';
    if (!ALLOWED_EXTENSIONS.has(extension)) {
      return NextResponse.json(
        { error: 'Допустимы PDF, изображения, документы, таблицы, TXT и ZIP' },
        { status: 400 }
      );
    }

    const randomPart = Math.random().toString(36).slice(2, 8);
    const key = `${artistId}/${Date.now()}-${randomPart}-${safeName}`;
    const { url } = await uploadToStorage('reports', key, file);

    return NextResponse.json({ success: true, url, fileName: file.name });
  } catch (error) {
    console.error('Report upload error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Ошибка загрузки файла' },
      { status: 500 }
    );
  }
}
