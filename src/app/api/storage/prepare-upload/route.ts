import { randomUUID } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { tickets } from '@/db/schema';
import { getSessionFromRequest } from '@/lib/auth';
import {
  createSupabaseUploadUrl,
  isLocalStorage,
  STORAGE_BUCKETS,
  type StorageBucket,
} from '@/lib/storage';

export const runtime = 'nodejs';

const MB = 1024 * 1024;
const AUDIO_TYPES = new Set([
  'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/wave', 'audio/x-wav',
  'audio/flac', 'audio/x-flac', 'audio/aac', 'audio/aacp', 'audio/ogg',
  'audio/mp4', 'audio/m4a', 'application/octet-stream', '',
]);
const AUDIO_EXTENSIONS = new Set(['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a']);
const REPORT_EXTENSIONS = new Set([
  'pdf', 'png', 'jpg', 'jpeg', 'webp', 'xls', 'xlsx', 'csv',
  'doc', 'docx', 'txt', 'zip',
]);

function error(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status });
}

function safeExtension(name: string) {
  const extension = name.split('.').pop()?.toLowerCase() || '';
  return /^[a-z0-9]{1,10}$/.test(extension) ? extension : '';
}

export async function POST(request: NextRequest) {
  try {
    if (isLocalStorage()) {
      return error('Прямая облачная загрузка не включена', 409);
    }

    const session = await getSessionFromRequest(request);
    if (!session) return error('Требуется авторизация', 401);

    const body = await request.json();
    const bucket = String(body.bucket || '') as StorageBucket;
    if (!STORAGE_BUCKETS.includes(bucket)) return error('Некорректное хранилище');

    const originalName = String(body.fileName || '').trim().slice(0, 255);
    const fileType = String(body.fileType || '').toLowerCase();
    const fileSize = Number(body.fileSize);
    if (!originalName) return error('Имя файла обязательно');
    if (!Number.isSafeInteger(fileSize) || fileSize <= 0) {
      return error('Некорректный размер файла');
    }

    const safeName = originalName.replace(/[^a-zA-Z0-9.-]/g, '_').slice(-180);
    const extension = safeExtension(safeName);
    const timestamp = Date.now();
    const randomPart = randomUUID().slice(0, 8);
    let key: string;

    switch (bucket) {
      case 'release-covers': {
        if (!['image/jpeg', 'image/png', 'image/webp', 'image/jpg'].includes(fileType)) {
          return error('Допустимые форматы: JPEG, PNG, WebP');
        }
        if (fileSize > 50 * MB) return error('Максимальный размер: 50 МБ');
        key = `${session.userId}/${timestamp}-${randomPart}.${extension || 'jpg'}`;
        break;
      }
      case 'release-tracks': {
        if (!AUDIO_TYPES.has(fileType) && !AUDIO_EXTENSIONS.has(extension)) {
          return error('Допустимые форматы: MP3, WAV, FLAC, AAC, OGG, M4A');
        }
        if (!AUDIO_EXTENSIONS.has(extension)) {
          return error('Допустимые форматы: MP3, WAV, FLAC, AAC, OGG, M4A');
        }
        // Supabase Free accepts objects up to 50 MB. The browser uploads
        // directly, so Netlify's smaller function payload limit is bypassed.
        if (fileSize > 50 * MB) {
          return error('На бесплатном хранилище максимальный размер трека: 50 МБ');
        }
        key = `${session.userId}/${timestamp}-${randomPart}.${extension}`;
        break;
      }
      case 'avatars': {
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(fileType)) {
          return error('Допустимые форматы: JPG, PNG, WebP');
        }
        if (fileSize > 5 * MB) return error('Максимальный размер: 5 МБ');
        key = `${session.userId}/${timestamp}-${randomPart}.${extension || 'jpg'}`;
        break;
      }
      case 'ticket-attachments': {
        const ticketId = Number(body.ticketId);
        if (!Number.isInteger(ticketId) || ticketId <= 0) return error('Некорректный тикет');
        if (fileSize > 10 * MB) return error('Максимальный размер: 10 МБ');

        const [ticket] = await db.select().from(tickets).where(eq(tickets.id, ticketId)).limit(1);
        if (!ticket) return error('Тикет не найден', 404);
        if (!session.isAdmin && ticket.artistId !== session.userId) {
          return error('Нет доступа к тикету', 403);
        }
        if (ticket.status === 'Решено' || ticket.status === 'Закрыто') {
          return error('Нельзя загружать файлы в закрытый тикет');
        }
        key = `ticket-${ticketId}/${timestamp}-${safeName}`;
        break;
      }
      case 'reports': {
        if (!session.isAdmin) return error('Требуется доступ администратора', 403);
        const artistId = Number(body.artistId);
        if (!Number.isInteger(artistId) || artistId <= 0) return error('Некорректный артист');
        if (!REPORT_EXTENSIONS.has(extension)) {
          return error('Допустимы PDF, изображения, документы, таблицы, TXT и ZIP');
        }
        if (fileSize > 50 * MB) return error('Максимальный размер: 50 МБ');
        key = `${artistId}/${timestamp}-${randomPart}-${safeName}`;
        break;
      }
      default:
        return error('Некорректное хранилище');
    }

    const upload = await createSupabaseUploadUrl(bucket, key);
    return NextResponse.json({
      success: true,
      ...upload,
      fileName: originalName,
      size: fileSize,
      fileType,
    });
  } catch (cause) {
    console.error('Prepare cloud upload error:', cause);
    return error(
      cause instanceof Error ? cause.message : 'Не удалось подготовить загрузку',
      500
    );
  }
}
