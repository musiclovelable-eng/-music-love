import { NextResponse } from 'next/server';
import { db } from '@/db';
import { sql } from 'drizzle-orm';

export async function GET() {
  try {
    await db.run(sql`ALTER TABLE artists ADD COLUMN telegram_chat_id TEXT`);
  } catch {
    // Column may already exist
  }

  return NextResponse.json({ success: true, message: 'Telegram migration done' });
}
