import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import path from 'node:path';
import { Readable } from 'node:stream';
import { eq } from 'drizzle-orm';
import { NextRequest } from 'next/server';
import { db } from '@/db';
import { financialReports, tickets } from '@/db/schema';
import { getSessionFromRequest } from '@/lib/auth';
import {
  getLocalFileUrl,
  getLocalObjectPath,
  getSupabaseDownloadUrl,
  isLocalStorage,
  normalizeStorageKey,
  STORAGE_BUCKETS,
  type StorageBucket,
} from '@/lib/storage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const PUBLIC_BUCKETS = new Set<StorageBucket>([
  'release-covers',
  'release-tracks',
  'avatars',
]);

const MIME_TYPES: Record<string, string> = {
  aac: 'audio/aac',
  csv: 'text/csv; charset=utf-8',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  flac: 'audio/flac',
  jpeg: 'image/jpeg',
  jpg: 'image/jpeg',
  m4a: 'audio/mp4',
  mp3: 'audio/mpeg',
  ogg: 'audio/ogg',
  pdf: 'application/pdf',
  png: 'image/png',
  txt: 'text/plain; charset=utf-8',
  wav: 'audio/wav',
  webp: 'image/webp',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  zip: 'application/zip',
};

function responseError(message: string, status: number) {
  return new Response(message, { status });
}

async function authorizePrivateFile(
  request: NextRequest,
  bucket: StorageBucket,
  key: string
) {
  const session = await getSessionFromRequest(request);
  if (!session) return responseError('Требуется авторизация', 401);

  if (bucket === 'reports') {
    if (session.isAdmin) return null;

    const fileUrl = getLocalFileUrl(bucket, key);
    const [report] = await db
      .select({ artistId: financialReports.artistId })
      .from(financialReports)
      .where(eq(financialReports.fileUrl, fileUrl))
      .limit(1);

    if (!report || report.artistId !== session.userId) {
      return responseError('Нет доступа к файлу', 403);
    }
    return null;
  }

  if (bucket === 'ticket-attachments') {
    const match = key.match(/^ticket-(\d+)\//);
    if (!match) return responseError('Файл не найден', 404);

    const [ticket] = await db
      .select({ artistId: tickets.artistId })
      .from(tickets)
      .where(eq(tickets.id, Number(match[1])))
      .limit(1);

    if (!ticket) return responseError('Файл не найден', 404);
    if (!session.isAdmin && ticket.artistId !== session.userId) {
      return responseError('Нет доступа к файлу', 403);
    }
    return null;
  }

  return responseError('Файл не найден', 404);
}

function parseRange(header: string | null, size: number) {
  if (!header) return null;
  const match = /^bytes=(\d*)-(\d*)$/.exec(header.trim());
  if (!match || (!match[1] && !match[2])) return 'invalid' as const;

  let start: number;
  let end: number;
  if (!match[1]) {
    const suffixLength = Number(match[2]);
    if (!Number.isFinite(suffixLength) || suffixLength <= 0) return 'invalid' as const;
    start = Math.max(0, size - suffixLength);
    end = size - 1;
  } else {
    start = Number(match[1]);
    end = match[2] ? Math.min(Number(match[2]), size - 1) : size - 1;
  }

  if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start < 0 || start >= size || end < start) {
    return 'invalid' as const;
  }
  return { start, end };
}

async function serveFile(
  request: NextRequest,
  params: Promise<{ path: string[] }>,
  headOnly = false
) {
  try {
    const { path: segments } = await params;
    const [bucketName, ...keySegments] = segments || [];
    if (!STORAGE_BUCKETS.includes(bucketName as StorageBucket) || keySegments.length === 0) {
      return responseError('Файл не найден', 404);
    }

    const bucket = bucketName as StorageBucket;
    const key = normalizeStorageKey(keySegments.join('/'));

    if (!PUBLIC_BUCKETS.has(bucket)) {
      const denied = await authorizePrivateFile(request, bucket, key);
      if (denied) return denied;
    }

    if (!isLocalStorage()) {
      // Keep existing /api/files links working after migration. Public objects
      // redirect to their CDN URL; private objects use a short-lived signed URL
      // only after the authorization check above. Large files never pass
      // through the serverless function response limit.
      const downloadUrl = await getSupabaseDownloadUrl(bucket, key);
      return new Response(null, {
        status: 307,
        headers: {
          Location: downloadUrl,
          'Cache-Control': PUBLIC_BUCKETS.has(bucket)
            ? 'public, max-age=60'
            : 'private, no-store',
        },
      });
    }

    const filePath = getLocalObjectPath(bucket, key);
    const fileStat = await stat(filePath);
    if (!fileStat.isFile()) return responseError('Файл не найден', 404);

    const extension = path.extname(filePath).slice(1).toLowerCase();
    const contentType = MIME_TYPES[extension] || 'application/octet-stream';
    const isPublic = PUBLIC_BUCKETS.has(bucket);
    const headers = new Headers({
      'Accept-Ranges': 'bytes',
      'Cache-Control': isPublic ? 'public, max-age=3600' : 'private, no-store',
      'Content-Type': contentType,
      'X-Content-Type-Options': 'nosniff',
    });

    if (!isPublic) {
      const safeName = path.basename(filePath).replace(/[^a-zA-Z0-9._-]/g, '_');
      headers.set('Content-Disposition', `attachment; filename="${safeName}"`);
    }

    const range = headOnly ? null : parseRange(request.headers.get('range'), fileStat.size);
    if (range === 'invalid') {
      headers.set('Content-Range', `bytes */${fileStat.size}`);
      return new Response(null, { status: 416, headers });
    }

    const start = range?.start ?? 0;
    const end = range?.end ?? Math.max(0, fileStat.size - 1);
    const contentLength = fileStat.size === 0 ? 0 : end - start + 1;
    headers.set('Content-Length', String(contentLength));

    if (range) {
      headers.set('Content-Range', `bytes ${start}-${end}/${fileStat.size}`);
    }

    if (headOnly || fileStat.size === 0) {
      return new Response(null, { status: range ? 206 : 200, headers });
    }

    const stream = createReadStream(filePath, { start, end });
    const body = Readable.toWeb(stream) as ReadableStream<Uint8Array>;
    return new Response(body as BodyInit, { status: range ? 206 : 200, headers });
  } catch (error: any) {
    if (error?.code === 'ENOENT') return responseError('Файл не найден', 404);
    console.error('File serving error:', error);
    return responseError('Ошибка при чтении файла', 500);
  }
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  return serveFile(request, context.params);
}

export async function HEAD(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  return serveFile(request, context.params, true);
}
