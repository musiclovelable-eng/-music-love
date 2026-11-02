import { NextResponse } from 'next/server';
import { db } from '@/db';
import { botSettings } from '@/db/schema';
import { eq } from 'drizzle-orm';

// GET /api/maintenance — public endpoint, returns maintenance status
export async function GET() {
  try {
    const [enabledRow] = await db
      .select()
      .from(botSettings)
      .where(eq(botSettings.key, 'maintenance_enabled'))
      .limit(1);

    const [reasonRow] = await db
      .select()
      .from(botSettings)
      .where(eq(botSettings.key, 'maintenance_reason'))
      .limit(1);

    return NextResponse.json({
      enabled: enabledRow?.value === 'true',
      reason: reasonRow?.value || '',
    });
  } catch {
    return NextResponse.json({ enabled: false, reason: '' });
  }
}
