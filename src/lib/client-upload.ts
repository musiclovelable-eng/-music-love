'use client';

export const isDirectCloudStorage =
  process.env.NEXT_PUBLIC_STORAGE_DRIVER === 'supabase-direct';

export type CloudStorageBucket =
  | 'release-covers'
  | 'release-tracks'
  | 'avatars'
  | 'reports'
  | 'ticket-attachments';

export interface CloudUploadResult {
  success: true;
  url: string;
  key: string;
  fileName: string;
  size: number;
  fileType: string;
}

interface Options {
  bucket: CloudStorageBucket;
  file: File;
  ticketId?: string | number;
  artistId?: string | number;
  onProgress?: (percent: number) => void;
}

export async function uploadFileToCloud({
  bucket,
  file,
  ticketId,
  artistId,
  onProgress,
}: Options): Promise<CloudUploadResult> {
  const extension = file.name.split('.').pop()?.toLowerCase() || '';
  const inferredTypes: Record<string, string> = {
    mp3: 'audio/mpeg', wav: 'audio/wav', m4a: 'audio/mp4', aac: 'audio/aac',
    flac: 'audio/flac', ogg: 'audio/ogg', jpg: 'image/jpeg', jpeg: 'image/jpeg',
    png: 'image/png', webp: 'image/webp', pdf: 'application/pdf',
  };
  const contentType = file.type || inferredTypes[extension] || 'application/octet-stream';
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const bearer = window.localStorage.getItem('bearer_token');
  if (bearer) headers.Authorization = `Bearer ${bearer}`;

  const response = await fetch('/api/storage/prepare-upload', {
    method: 'POST',
    headers,
    credentials: 'same-origin',
    body: JSON.stringify({
      bucket,
      fileName: file.name,
      fileType: contentType,
      fileSize: file.size,
      ticketId,
      artistId,
    }),
  });
  const prepared = await response.json();
  if (!response.ok || !prepared.success) {
    throw new Error(prepared.error || 'Не удалось подготовить загрузку');
  }

  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', prepared.signedUrl, true);
    xhr.timeout = 600000;

    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (anonKey) xhr.setRequestHeader('apikey', anonKey);
    xhr.setRequestHeader('x-upsert', 'false');

    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    });
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress?.(100);
        resolve();
        return;
      }
      let message = `Ошибка загрузки в хранилище (${xhr.status})`;
      try {
        const details = JSON.parse(xhr.responseText);
        message = details.message || details.error || message;
      } catch {
        if (xhr.responseText) message = xhr.responseText.slice(0, 300);
      }
      reject(new Error(message));
    };
    xhr.onerror = () => reject(new Error('Ошибка соединения с файловым хранилищем'));
    xhr.ontimeout = () => reject(new Error('Время загрузки файла истекло'));
    xhr.onabort = () => reject(new Error('Загрузка файла отменена'));

    const form = new FormData();
    form.append('cacheControl', '3600');
    const uploadBody = file.type ? file : file.slice(0, file.size, contentType);
    form.append('', uploadBody, file.name);
    xhr.send(form);
  });

  return {
    success: true,
    url: prepared.url,
    key: prepared.key,
    fileName: file.name,
    size: file.size,
    fileType: contentType,
  };
}
