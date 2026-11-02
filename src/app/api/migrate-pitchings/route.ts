import { NextResponse } from 'next/server';
import { createClient } from '@libsql/client';

export async function GET() {
  try {
    const client = createClient({
      url: process.env.TURSO_CONNECTION_URL!,
      authToken: process.env.TURSO_AUTH_TOKEN!,
    });

    await client.execute(`
      CREATE TABLE IF NOT EXISTS pitchings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        artist_id INTEGER NOT NULL REFERENCES artists(id),
        release_id INTEGER NOT NULL REFERENCES releases(id),
        promo_text TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        admin_note TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `);

    return NextResponse.json({ success: true, message: 'Pitchings table created' });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
