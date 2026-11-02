import { randomUUID } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { createWriteStream } from 'node:fs';
import { mkdir, rename, unlink } from 'node:fs/promises';
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

export function isLocalStorage() {
  return process.env.STORAGE_DRIVER?.trim().toLowerCase() === 'local';
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
  const url = isLocalStorage()
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
