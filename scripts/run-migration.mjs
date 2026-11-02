import { createClient } from '@libsql/client';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const client = createClient({
  url: process.env.TURSO_CONNECTION_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

const sql = readFileSync(join(__dirname, '../drizzle/0003_telegram_bot_settings.sql'), 'utf-8');

const statements = sql.split(';').map(s => s.trim()).filter(Boolean);

for (const stmt of statements) {
  try {
    await client.execute(stmt);
    console.log('OK:', stmt.slice(0, 60));
  } catch (err) {
    console.error('ERR:', err.message, '\nSQL:', stmt.slice(0, 80));
  }
}

console.log('Migration complete.');
process.exit(0);
