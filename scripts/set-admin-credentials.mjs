import { createClient } from '@libsql/client';
import bcrypt from 'bcrypt';

const LOGIN = process.env.ADMIN_LOGIN;
const ADMIN_NAME = process.env.ADMIN_NAME || 'Music Love Admin';
const PASSWORD = process.env.ADMIN_PASSWORD;

const url = process.env.TURSO_CONNECTION_URL;
if (!url || !LOGIN || !PASSWORD) {
  console.error('TURSO_CONNECTION_URL, ADMIN_LOGIN and ADMIN_PASSWORD are required.');
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
  const result = await client.execute({
    sql: 'SELECT id, password FROM artists WHERE email = ? LIMIT 1',
    args: [LOGIN],
  });

  let adminId;
  let previousPassword = null;

  if (result.rows.length > 0) {
    adminId = Number(result.rows[0].id);
    previousPassword = result.rows[0].password;
    await client.execute({
      sql: `UPDATE artists
            SET password = ?, name = ?, plan = 'advanced',
                is_admin = 1, is_manager = 0, is_approved = 1,
                requires_approval = 0, email_verified = 1,
                is_blocked = 0, is_deactivated = 0, is_frozen = 0
            WHERE id = ?`,
      args: [PASSWORD_HASH, ADMIN_NAME, adminId],
    });
  } else {
    const inserted = await client.execute({
      sql: `INSERT INTO artists (
              uid, email, password, name, plan,
              is_admin, is_manager, is_approved, requires_approval,
              email_verified, is_blocked, is_deactivated, is_frozen,
              theme, label, created_at
            ) VALUES (?, ?, ?, ?, 'advanced', 1, 0, 1, 0, 1, 0, 0, 0, 'light', 'Music Love', ?)
            RETURNING id`,
      args: [
        `admin-music-love-${Date.now()}`,
        LOGIN,
        PASSWORD_HASH,
        ADMIN_NAME,
        new Date().toISOString(),
      ],
    });
    adminId = Number(inserted.rows[0].id);
  }

  // No permissions row means full super-admin access in this application.
  await client.execute({
    sql: 'DELETE FROM admin_permissions WHERE admin_id = ?',
    args: [adminId],
  });

  if (previousPassword !== PASSWORD_HASH) {
    await client.execute({
      sql: `INSERT INTO password_history (artist_id, password, created_at)
            VALUES (?, ?, ?)`,
      args: [adminId, PASSWORD_HASH, new Date().toISOString()],
    });
  }

  console.log(`Admin credentials applied. Login: ${LOGIN}. Super-admin access enabled.`);
} catch (error) {
  console.error('Failed to apply admin credentials:', error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  client.close();
}
