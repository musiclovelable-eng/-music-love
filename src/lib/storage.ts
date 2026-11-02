import { randomUUID } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { Pool } from 'pg';
import { createWriteStream } from 'node:fs';
import { access, mkdir, rename, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';

export const STORAGE_BUCKETS = [
  'release-covers',
  'release-tracks',
  'avatars',
  'reports',
  'ticket-attachments',
] as const;

export type StorageBucket = (typeof STORAGE_BUCKETS)[number];

const PUBLIC_STORAGE_BUCKETS = new Set<StorageBucket>([
  'release-covers',
  'release-tracks',
  'avatars',
]);

export function isPublicStorageBucket(bucket: StorageBucket) {
  return PUBLIC_STORAGE_BUCKETS.has(bucket);
}

export function isPostgresStorage() {
  return process.env.STORAGE_DRIVER?.trim().toLowerCase() === 'postgres';
}

export function isLocalStorage() {
  const driver = process.env.STORAGE_DRIVER?.trim().toLowerCase();
  return driver === 'local' || driver === 'postgres';
}

export function getLocalStorageRoot() {
  return path.resolve(
    process.env.LOCAL_STORAGE_DIR || path.join(process.cwd(), 'data', 'storage')
  );
}

export function normalizeStorageKey(key: string) {
  if (!key || key.includes('\\') || key.includes('\0')) {
    throw new Error('Некорректный путь к файлу');
  }

  const segments = key.split('/');
  if (
    segments.some(
      (segment) => !segment || segment === '.' || segment === '..' || segment.includes('\0')
    )
  ) {
    throw new Error('Некорректный путь к файлу');
  }

  return segments.join('/');
}

export function getLocalObjectPath(bucket: StorageBucket, key: string) {
  const normalizedKey = normalizeStorageKey(key);
  const bucketRoot = path.resolve(getLocalStorageRoot(), bucket);
  const objectPath = path.resolve(bucketRoot, ...normalizedKey.split('/'));

  if (objectPath !== bucketRoot && !objectPath.startsWith(`${bucketRoot}${path.sep}`)) {
    throw new Error('Некорректный путь к файлу');
  }

  return objectPath;
}

function encodeObjectPath(key: string) {
  return normalizeStorageKey(key)
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');
}

export function getLocalFileUrl(bucket: StorageBucket, key: string) {
  return `/api/files/${bucket}/${encodeObjectPath(key)}`;
}

const globalForStorage = globalThis as unknown as {
  _musicLoveStoragePool: Pool | undefined;
  _musicLoveStorageTable: Promise<void> | undefined;
};

function getPostgresPool() {
  if (!globalForStorage._musicLoveStoragePool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) throw new Error('DATABASE_URL is not configured');
    globalForStorage._musicLoveStoragePool = new Pool({
      connectionString,
      max: 3,
      connectionTimeoutMillis: 10000,
      idleTimeoutMillis: 30000,
      ssl: process.env.DATABASE_SSL === 'disable'
        ? undefined
        : { rejectUnauthorized: false },
    });
  }
  return globalForStorage._musicLoveStoragePool;
}

async function ensurePostgresStorageTable() {
  if (!globalForStorage._musicLoveStorageTable) {
    globalForStorage._musicLoveStorageTable = getPostgresPool().query(`
      CREATE TABLE IF NOT EXISTS music_love_storage (
        bucket text NOT NULL,
        object_key text NOT NULL,
        data bytea NOT NULL,
        mime_type text NOT NULL,
        size_bytes bigint NOT NULL,
        created_at text NOT NULL,
        PRIMARY KEY (bucket, object_key)
      )
    `).then(() => undefined).catch((error) => {
      globalForStorage._musicLoveStorageTable = undefined;
      throw error;
    });
  }
  return globalForStorage._musicLoveStorageTable;
}

async function writeObjectCache(bucket: StorageBucket, key: string, data: Buffer) {
  const destination = getLocalObjectPath(bucket, key);
  await mkdir(path.dirname(destination), { recursive: true });
  const temporary = `${destination}.${randomUUID()}.tmp`;
  try {
    await writeFile(temporary, data, { flag: 'wx' });
    await rename(temporary, destination);
  } catch (error) {
    await unlink(temporary).catch(() => undefined);
    throw error;
  }
  return destination;
}

async function uploadToPostgres(bucket: StorageBucket, key: string, file: File) {
  await ensurePostgresStorageTable();
  const data = Buffer.from(await file.arrayBuffer());
  await getPostgresPool().query(
    `INSERT INTO music_love_storage
      (bucket, object_key, data, mime_type, size_bytes, created_at)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (bucket, object_key) DO UPDATE SET
      data = EXCLUDED.data,
      mime_type = EXCLUDED.mime_type,
      size_bytes = EXCLUDED.size_bytes`,
    [bucket, key, data, file.type || 'application/octet-stream', data.byteLength, new Date().toISOString()]
  );
  await writeObjectCache(bucket, key, data);
  return getLocalFileUrl(bucket, key);
}

export async function ensurePostgresObjectCached(bucket: StorageBucket, key: string) {
  if (!isPostgresStorage()) return null;
  const normalizedKey = normalizeStorageKey(key);
  const destination = getLocalObjectPath(bucket, normalizedKey);
  try {
    await access(destination);
    return destination;
  } catch {
    // The ephemeral cache may be empty after a free-instance restart.
  }

  await ensurePostgresStorageTable();
  const result = await getPostgresPool().query(
    'SELECT data FROM music_love_storage WHERE bucket = $1 AND object_key = $2 LIMIT 1',
    [bucket, normalizedKey]
  );
  const data = result.rows[0]?.data as Buffer | undefined;
  if (!data) return null;
  return writeObjectCache(bucket, normalizedKey, data);
}

function getSupabaseBaseUrl() {
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '');
  if (!baseUrl || baseUrl.includes('placeholder.supabase.co')) {
    throw new Error('Файловое хранилище не настроено');
  }
  return baseUrl;
}

function getSupabaseServiceClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey || serviceKey === 'placeholder') {
    throw new Error('Файловое хранилище не настроено');
  }
  return createClient(getSupabaseBaseUrl(), serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function getStorageFileUrl(bucket: StorageBucket, key: string) {
  const normalizedKey = normalizeStorageKey(key);
  if (isLocalStorage() || !isPublicStorageBucket(bucket)) {
    return getLocalFileUrl(bucket, normalizedKey);
  }
  return `${getSupabaseBaseUrl()}/storage/v1/object/public/${bucket}/${encodeObjectPath(normalizedKey)}`;
}

export async function createSupabaseUploadUrl(bucket: StorageBucket, key: string) {
  const normalizedKey = normalizeStorageKey(key);
  const { data, error } = await getSupabaseServiceClient()
    .storage
    .from(bucket)
    .createSignedUploadUrl(normalizedKey);
  if (error || !data) {
    throw new Error(`Не удалось подготовить загрузку: ${error?.message || 'unknown error'}`);
  }
  return { ...data, url: getStorageFileUrl(bucket, normalizedKey), key: normalizedKey };
}

export async function getSupabaseDownloadUrl(bucket: StorageBucket, key: string) {
  const normalizedKey = normalizeStorageKey(key);
  if (isPublicStorageBucket(bucket)) {
    return getStorageFileUrl(bucket, normalizedKey);
  }
  const { data, error } = await getSupabaseServiceClient()
    .storage
    .from(bucket)
    .createSignedUrl(normalizedKey, 60);
  if (error || !data?.signedUrl) {
    throw new Error(`Не удалось открыть файл: ${error?.message || 'unknown error'}`);
  }
  return data.signedUrl;
}

async function uploadToLocalStorage(
  bucket: StorageBucket,
  key: string,
  file: File
) {
  const destination = getLocalObjectPath(bucket, key);
  const temporary = `${destination}.${randomUUID()}.tmp`;
  await mkdir(path.dirname(destination), { recursive: true });

  try {
    await pipeline(
      Readable.fromWeb(file.stream() as any),
      createWriteStream(temporary, { flags: 'wx' })
    );
    await rename(temporary, destination);
  } catch (error) {
    await unlink(temporary).catch(() => undefined);
    throw error;
  }

  return getLocalFileUrl(bucket, key);
}

async function uploadToSupabase(
  bucket: StorageBucket,
  key: string,
  file: File
) {
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '');
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (
    !baseUrl ||
    !serviceKey ||
    baseUrl.includes('placeholder.supabase.co') ||
    serviceKey === 'placeholder'
  ) {
    throw new Error('Файловое хранилище не настроено');
  }

  const encodedPath = encodeObjectPath(key);
  const response = await fetch(`${baseUrl}/storage/v1/object/${bucket}/${encodedPath}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': file.type || 'application/octet-stream',
      'x-upsert': 'false',
    },
    body: await file.arrayBuffer(),
  });

  if (!response.ok) {
    const details = (await response.text()).slice(0, 1000);
    throw new Error(`Ошибка загрузки в Supabase: ${details}`);
  }

  return getStorageFileUrl(bucket, key);
}

export async function uploadToStorage(
  bucket: StorageBucket,
  key: string,
  file: File
) {
  const normalizedKey = normalizeStorageKey(key);
  const url = isPostgresStorage()
    ? await uploadToPostgres(bucket, normalizedKey, file)
    : isLocalStorage()
      ? await uploadToLocalStorage(bucket, normalizedKey, file)
      : await uploadToSupabase(bucket, normalizedKey, file);

  return { url, key: normalizedKey };
}

function extractLocalKeyFromUrl(bucket: StorageBucket, value: string) {
  let pathname = value;
  try {
    pathname = new URL(value, 'http://localhost').pathname;
  } catch {
    return null;
  }

  const marker = `/api/files/${bucket}/`;
  if (!pathname.startsWith(marker)) return null;

  try {
    return normalizeStorageKey(
      pathname
        .slice(marker.length)
        .split('/')
        .map((segment) => decodeURIComponent(segment))
        .join('/')
    );
  } catch {
    return null;
  }
}

function extractSupabaseKeyFromUrl(bucket: StorageBucket, value: string) {
  const marker = `/object/public/${bucket}/`;
  const index = value.indexOf(marker);
  if (index === -1) return null;
  return value.slice(index + marker.length);
}

export async function deleteFromStorage(bucket: StorageBucket, urlOrKey: string) {
  try {
    if (isPostgresStorage()) {
      const key = extractLocalKeyFromUrl(bucket, urlOrKey);
      if (!key) return false;
      await ensurePostgresStorageTable();
      const result = await getPostgresPool().query(
        'DELETE FROM music_love_storage WHERE bucket = $1 AND object_key = $2',
        [bucket, key]
      );
      await unlink(getLocalObjectPath(bucket, key)).catch(() => undefined);
      return (result.rowCount || 0) > 0;
    }

    if (isLocalStorage()) {
      const key = extractLocalKeyFromUrl(bucket, urlOrKey);
      if (!key) return false;
      await unlink(getLocalObjectPath(bucket, key));
      return true;
    }

    const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '');
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const key = extractSupabaseKeyFromUrl(bucket, urlOrKey)
      || extractLocalKeyFromUrl(bucket, urlOrKey);
    if (!baseUrl || !serviceKey || !key) return false;

    const response = await fetch(`${baseUrl}/storage/v1/object/${bucket}/${key}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${serviceKey}` },
    });
    return response.ok;
  } catch {
    return false;
  }
}
