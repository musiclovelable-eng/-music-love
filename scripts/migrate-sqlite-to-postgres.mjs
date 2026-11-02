import { createClient } from '@libsql/client';
import { Client } from 'pg';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

console.log('Starting PostgreSQL migration...');
const localUrl = process.env.LOCAL_DATABASE_URL || 'file:./data/music-love.db';
const databaseUrl = process.env.DATABASE_URL;
if (!localUrl.startsWith('file:') || !databaseUrl) {
  console.error('LOCAL_DATABASE_URL=file:... and DATABASE_URL=postgresql://... are required.');
  process.exit(1);
}

const local = createClient({ url: localUrl });
const pg = new Client({
  connectionString: databaseUrl,
  ssl: process.env.DATABASE_SSL === 'disable' ? undefined : { rejectUnauthorized: false },
});
const quote = (value) => `"${String(value).replaceAll('"', '""')}"`;
const booleanColumns = new Set();
const schemaSource = await readFile(new URL('../src/db/schema.ts', import.meta.url), 'utf8');
for (const match of schemaSource.matchAll(/boolean\('([^']+)'\)/g)) {
  booleanColumns.add(match[1]);
}

const MIME = {
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp',
  '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.flac': 'audio/flac', '.aac': 'audio/aac',
  '.ogg': 'audio/ogg', '.m4a': 'audio/mp4', '.pdf': 'application/pdf', '.txt': 'text/plain',
  '.csv': 'text/csv', '.zip': 'application/zip',
};

async function* walk(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) yield* walk(absolute);
    else if (entry.isFile()) yield absolute;
  }
}

try {
  console.log('Connecting to PostgreSQL...');
  await pg.connect();
  console.log('Connected. Checking source database...');
  const integrity = await local.execute('PRAGMA integrity_check');
  if (integrity.rows[0]?.integrity_check !== 'ok') {
    throw new Error('Local SQLite integrity check failed.');
  }

  const existing = await pg.query("SELECT tablename FROM pg_tables WHERE schemaname = 'public'");
  if (existing.rows.length > 0) {
    throw new Error('Target PostgreSQL database is not empty. Refusing to overwrite it.');
  }

  const migrationDir = new URL('../drizzle-pg/', import.meta.url);
  const migrationFiles = (await readdir(migrationDir)).filter((name) => name.endsWith('.sql')).sort();
  if (migrationFiles.length === 0) throw new Error('Run drizzle-kit generate first.');
  const schemaSql = await readFile(new URL(`../drizzle-pg/${migrationFiles[0]}`, import.meta.url), 'utf8');

  const tables = await local.execute(
    "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
  );
  const tableNames = tables.rows.map((table) => String(table.name));
  const dependencies = new Map();
  for (const tableName of tableNames) {
    const foreignKeys = await local.execute(`PRAGMA foreign_key_list(${quote(tableName)})`);
    dependencies.set(
      tableName,
      foreignKeys.rows.map((row) => String(row.table)).filter((name) => name !== tableName)
    );
  }
  const orderedTables = [];
  const visited = new Set();
  const visiting = new Set();
  function visit(tableName) {
    if (visited.has(tableName)) return;
    if (visiting.has(tableName)) throw new Error(`Circular table dependency at ${tableName}`);
    visiting.add(tableName);
    for (const dependency of dependencies.get(tableName) || []) {
      if (tableNames.includes(dependency)) visit(dependency);
    }
    visiting.delete(tableName);
    visited.add(tableName);
    orderedTables.push(tableName);
  }
  tableNames.forEach(visit);

  await pg.query('BEGIN');
  await pg.query(schemaSql);
  let copiedRows = 0;
  for (const tableName of orderedTables) {
    const quotedTable = quote(tableName);
    const columnsResult = await local.execute(`PRAGMA table_info(${quotedTable})`);
    const columns = columnsResult.rows.map((column) => String(column.name));
    const rows = await local.execute(`SELECT * FROM ${quotedTable}`);
    let maxId = 0;

    for (const row of rows.rows) {
      const values = columns.map((column) => {
        const value = row[column];
        if (value === null || value === undefined) return null;
        if (booleanColumns.has(column)) return Boolean(value);
        return value;
      });
      const placeholders = columns.map((_, index) => `$${index + 1}`).join(', ');
      await pg.query(
        `INSERT INTO ${quotedTable} (${columns.map(quote).join(', ')}) VALUES (${placeholders})`,
        values
      );
      copiedRows += 1;
      if (Number(row.id) > maxId) maxId = Number(row.id);
    }
    if (maxId > 0) {
      await pg.query("SELECT setval(pg_get_serial_sequence($1, 'id'), $2, true)", [tableName, maxId]);
    }
    if (rows.rows.length > 0) console.log(`${tableName}: ${rows.rows.length} rows`);
  }

  await pg.query(`
    CREATE TABLE music_love_storage (
      bucket text NOT NULL,
      object_key text NOT NULL,
      data bytea NOT NULL,
      mime_type text NOT NULL,
      size_bytes bigint NOT NULL,
      created_at text NOT NULL,
      PRIMARY KEY (bucket, object_key)
    )
  `);

  const storageRoot = path.resolve(process.env.LOCAL_STORAGE_DIR || path.join(process.cwd(), 'data', 'storage'));
  let uploadedFiles = 0;
  let uploadedBytes = 0;
  for (const bucket of ['release-covers', 'release-tracks', 'avatars', 'reports', 'ticket-attachments']) {
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
      const data = await readFile(absolute);
      const contentType = MIME[path.extname(key).toLowerCase()] || 'application/octet-stream';
      await pg.query(
        `INSERT INTO music_love_storage
          (bucket, object_key, data, mime_type, size_bytes, created_at)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [bucket, key, data, contentType, data.byteLength, new Date().toISOString()]
      );
      uploadedFiles += 1;
      uploadedBytes += data.byteLength;
      console.log(`storage ${bucket}/${key}: ${data.byteLength} bytes`);
    }
  }

  await pg.query('COMMIT');

  for (const tableName of orderedTables) {
    const quotedTable = quote(tableName);
    const sourceCount = await local.execute(`SELECT COUNT(*) AS count FROM ${quotedTable}`);
    const remoteCount = await pg.query(`SELECT COUNT(*) AS count FROM ${quotedTable}`);
    if (Number(sourceCount.rows[0].count) !== Number(remoteCount.rows[0].count)) {
      throw new Error(`Row count mismatch in ${tableName}.`);
    }
  }
  const storageCount = await pg.query(
    'SELECT COUNT(*) AS count, COALESCE(SUM(size_bytes), 0) AS bytes FROM music_love_storage'
  );
  if (Number(storageCount.rows[0].count) !== uploadedFiles || Number(storageCount.rows[0].bytes) !== uploadedBytes) {
    throw new Error('Storage count or byte-size mismatch.');
  }

  console.log(`PostgreSQL migration complete: ${copiedRows} rows, ${uploadedFiles} files, ${uploadedBytes} bytes verified.`);
} catch (error) {
  await pg.query('ROLLBACK').catch(() => undefined);
  console.error('Migration failed:', error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  local.close();
  await pg.end().catch(() => undefined);
}
