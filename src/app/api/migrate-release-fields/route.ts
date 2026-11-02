import { NextResponse } from 'next/server';
import { db } from '@/db';
import { sql } from 'drizzle-orm';

export async function GET() {
  try {
    // Add platforms column if it doesn't exist
    await db.run(sql`ALTER TABLE releases ADD COLUMN platforms TEXT`);
  } catch {
    // Column may already exist
  }
  try {
    await db.run(sql`ALTER TABLE releases ADD COLUMN territories TEXT`);
  } catch {
    // Column may already exist
  }
  try {
    await db.run(sql`ALTER TABLE releases ADD COLUMN persons TEXT`);
  } catch {
    // Column may already exist
  }

  return NextResponse.json({ success: true, message: 'Release fields migration done' });
}
