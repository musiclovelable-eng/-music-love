import { createClient } from '@libsql/client';

const localUrl = process.env.LOCAL_DATABASE_URL || 'file:./data/music-love.db';
const remoteUrl = process.env.TURSO_CONNECTION_URL;
const remoteToken = process.env.TURSO_AUTH_TOKEN;

if (!localUrl.startsWith('file:')) {
  console.error('LOCAL_DATABASE_URL must point to a local SQLite file.');
  process.exit(1);
}
if (!remoteUrl || remoteUrl.startsWith('file:') || !remoteToken) {
  console.error('Remote TURSO_CONNECTION_URL (libsql:// or https://) and TURSO_AUTH_TOKEN are required.');
  process.exit(1);
}

const local = createClient({ url: localUrl });
const remote = createClient({ url: remoteUrl, authToken: remoteToken });
const quote = (value) => `"${String(value).replaceAll('"', '""')}"`;

try {
  const integrity = await local.execute('PRAGMA integrity_check');
  if (integrity.rows[0]?.integrity_check !== 'ok') {
    throw new Error('Local SQLite integrity check failed.');
  }

  const remoteTables = await remote.execute(
    "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
  );
  if (remoteTables.rows.length > 0) {
    throw new Error('Remote database is not empty. Refusing to overwrite it.');
  }

  const schema = await local.execute(`
    SELECT type, name, sql
    FROM sqlite_master
    WHERE sql IS NOT NULL
      AND name NOT LIKE 'sqlite_%'
      AND type IN ('table', 'index', 'trigger', 'view')
    ORDER BY CASE type WHEN 'table' THEN 0 WHEN 'index' THEN 1 WHEN 'trigger' THEN 2 ELSE 3 END
  `);

  for (const object of schema.rows) {
    await remote.execute(String(object.sql));
  }

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

  let copiedRows = 0;
  for (const tableName of orderedTables) {
    const quotedTable = quote(tableName);
    const columnsResult = await local.execute(`PRAGMA table_info(${quotedTable})`);
    const columns = columnsResult.rows.map((column) => String(column.name));
    const rows = await local.execute(`SELECT * FROM ${quotedTable}`);
    if (rows.rows.length === 0) continue;

    const columnSql = columns.map(quote).join(', ');
    const placeholders = columns.map(() => '?').join(', ');
    for (const row of rows.rows) {
      await remote.execute({
        sql: `INSERT INTO ${quotedTable} (${columnSql}) VALUES (${placeholders})`,
        args: columns.map((column) => row[column] ?? null),
      });
      copiedRows += 1;
    }
    console.log(`${tableName}: ${rows.rows.length} rows`);
  }

  const foreignKeyIssues = await remote.execute('PRAGMA foreign_key_check');
  if (foreignKeyIssues.rows.length > 0) {
    throw new Error(`Foreign key check failed for ${foreignKeyIssues.rows.length} rows.`);
  }
  for (const tableName of orderedTables) {
    const quotedTable = quote(tableName);
    const sourceCount = await local.execute(`SELECT COUNT(*) AS count FROM ${quotedTable}`);
    const remoteCount = await remote.execute(`SELECT COUNT(*) AS count FROM ${quotedTable}`);
    if (Number(sourceCount.rows[0].count) !== Number(remoteCount.rows[0].count)) {
      throw new Error(`Row count mismatch in ${tableName}.`);
    }
  }

  console.log(`Turso migration complete: ${tables.rows.length} tables, ${copiedRows} rows verified.`);
} catch (error) {
  console.error('Migration failed:', error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  local.close();
  remote.close();
}
