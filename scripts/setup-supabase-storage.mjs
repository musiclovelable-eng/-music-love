import { createClient } from '@supabase/supabase-js';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const MB = 1024 * 1024;
const BUCKETS = {
  'release-covers': {
    public: true,
    fileSizeLimit: 50 * MB,
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'],
  },
  'release-tracks': {
    public: true,
    fileSizeLimit: 50 * MB,
    allowedMimeTypes: ['audio/*', 'application/octet-stream'],
  },
  avatars: {
    public: true,
    fileSizeLimit: 5 * MB,
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
  },
  reports: { public: false, fileSizeLimit: 50 * MB, allowedMimeTypes: null },
  'ticket-attachments': { public: false, fileSizeLimit: 10 * MB, allowedMimeTypes: null },
};

const MIME = {
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp',
  '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.flac': 'audio/flac', '.aac': 'audio/aac',
  '.ogg': 'audio/ogg', '.m4a': 'audio/mp4', '.pdf': 'application/pdf', '.txt': 'text/plain',
  '.csv': 'text/csv', '.zip': 'application/zip',
};

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.');
  process.exit(1);
}

const client = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const setupOnly = process.argv.includes('--setup-only');

async function ensureBucket(bucket, options) {
  const { data: existing, error: lookupError } = await client.storage.getBucket(bucket);
  if (existing) {
    const { error } = await client.storage.updateBucket(bucket, options);
    if (error) throw new Error(`Cannot update bucket ${bucket}: ${error.message}`);
    return 'updated';
  }
  if (lookupError && !/not found|does not exist/i.test(lookupError.message)) {
    throw new Error(`Cannot inspect bucket ${bucket}: ${lookupError.message}`);
  }
  const { error } = await client.storage.createBucket(bucket, options);
  if (error) throw new Error(`Cannot create bucket ${bucket}: ${error.message}`);
  return 'created';
}

async function* walk(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) yield* walk(absolute);
    else if (entry.isFile()) yield absolute;
  }
}

for (const [bucket, options] of Object.entries(BUCKETS)) {
  const result = await ensureBucket(bucket, options);
  console.log(`${bucket}: ${result} (${options.public ? 'public' : 'private'})`);
}

if (setupOnly) {
  console.log('Storage buckets are configured; migration skipped.');
  process.exit(0);
}

const storageRoot = path.resolve(process.env.LOCAL_STORAGE_DIR || path.join(process.cwd(), 'data', 'storage'));
let uploaded = 0;
let skipped = 0;
for (const bucket of Object.keys(BUCKETS)) {
  const bucketRoot = path.join(storageRoot, bucket);
  let files = [];
  try {
    for await (const file of walk(bucketRoot)) files.push(file);
  } catch (error) {
    if (error?.code === 'ENOENT') continue;
    throw error;
  }

  for (const absolute of files) {
    const key = path.relative(bucketRoot, absolute).split(path.sep).join('/');
    if (!key || key.startsWith('../') || key.includes('/../')) {
      throw new Error(`Unsafe storage key: ${key}`);
    }
    const contents = await readFile(absolute);
    if (contents.byteLength > BUCKETS[bucket].fileSizeLimit) {
      skipped += 1;
      console.error(`SKIPPED over bucket limit: ${bucket}/${key} (${contents.byteLength} bytes)`);
      continue;
    }
    const contentType = MIME[path.extname(key).toLowerCase()] || 'application/octet-stream';
    const { error } = await client.storage.from(bucket).upload(key, contents, {
      contentType,
      upsert: true,
    });
    if (error) throw new Error(`Cannot upload ${bucket}/${key}: ${error.message}`);
    uploaded += 1;
    console.log(`Uploaded ${bucket}/${key}`);
  }
}

console.log(`Storage migration complete: ${uploaded} uploaded, ${skipped} skipped.`);
if (skipped) process.exitCode = 2;
