import { createClient } from '@libsql/client';
import bcrypt from 'bcrypt';

const LOGIN = process.env.ARTIST_LOGIN;
const ARTIST_NAME = process.env.ARTIST_NAME || 'Kurmur';
const PASSWORD = process.env.ARTIST_PASSWORD;

const url = process.env.TURSO_CONNECTION_URL;
if (!url || !LOGIN || !PASSWORD) {
  console.error('TURSO_CONNECTION_URL, ARTIST_LOGIN and ARTIST_PASSWORD are required.');
  process.exit(1);
}

// Credentials are supplied only through the runtime environment. Neither the
// plaintext password nor a reusable password hash is stored in the repository.
const PASSWORD_HASH = await bcrypt.hash(PASSWORD, 12);

const client = createClient({
  url,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

try {
  let result = await client.execute({
    sql: 'SELECT id, password FROM artists WHERE email = ? LIMIT 1',
    args: [LOGIN],
  });

  if (result.rows.length === 0) {
    result = await client.execute({
      sql: `SELECT id, password FROM artists
            WHERE artist_name = ? OR name = ?
            ORDER BY CASE WHEN artist_name = ? THEN 0 ELSE 1 END
            LIMIT 1`,
      args: [ARTIST_NAME, ARTIST_NAME, ARTIST_NAME],
    });
  }

  let artistId;
  let previousPassword = null;

  if (result.rows.length > 0) {
    artistId = Number(result.rows[0].id);
    previousPassword = result.rows[0].password;
    await client.execute({
      sql: `UPDATE artists
            SET email = ?, password = ?, name = ?, artist_name = ?,
                is_approved = 1, requires_approval = 0, email_verified = 1
            WHERE id = ?`,
      args: [LOGIN, PASSWORD_HASH, ARTIST_NAME, ARTIST_NAME, artistId],
    });
  } else {
    const inserted = await client.execute({
      sql: `INSERT INTO artists (
              uid, email, password, name, artist_name, plan,
              is_approved, requires_approval, email_verified,
              is_admin, is_manager, theme, label, created_at
            ) VALUES (?, ?, ?, ?, ?, 'basic', 1, 0, 1, 0, 0, 'light', 'Music Love', ?)
            RETURNING id`,
      args: [
        `artist-kurmur-${Date.now()}`,
        LOGIN,
        PASSWORD_HASH,
        ARTIST_NAME,
        ARTIST_NAME,
        new Date().toISOString(),
      ],
    });
    artistId = Number(inserted.rows[0].id);
  }

  if (previousPassword !== PASSWORD_HASH) {
    await client.execute({
      sql: `INSERT INTO password_history (artist_id, password, created_at)
            VALUES (?, ?, ?)`,
      args: [artistId, PASSWORD_HASH, new Date().toISOString()],
    });
  }

  console.log(`Credentials applied for ${ARTIST_NAME}. Login: ${LOGIN}`);
} catch (error) {
  console.error('Failed to apply Kurmur credentials:', error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  client.close();
}
