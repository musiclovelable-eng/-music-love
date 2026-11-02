import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { db } from '@/db';
import { botSettings } from '@/db/schema';
import { eq } from 'drizzle-orm';

async function isSuperAdmin(request: NextRequest): Promise<boolean> {
  const session = await getSessionFromRequest(request);
  if (!session || !session.isAdmin) return false;
  // Super admin = no permissions row OR has adminPermissions
  // We need to check: super admin is the one WITHOUT adminPermissions entry
  const { adminPermissions } = await import('@/db/schema');
  const [perms] = await db
    .select()
    .from(adminPermissions)
    .where(eq(adminPermissions.adminId, session.userId))
    .limit(1);
  // If no permissions row exists → super admin
  return !perms;
}

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session || !session.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

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
}

export async function PUT(request: NextRequest) {
  try {
    const isSuper = await isSuperAdmin(request);
    if (!isSuper) {
      return NextResponse.json(
        { error: 'Доступ только для супер-администратора' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { enabled, reason } = body;
    const now = new Date().toISOString();

    if (enabled !== undefined) {
      const val = enabled ? 'true' : 'false';
      const [existing] = await db
        .select()
        .from(botSettings)
        .where(eq(botSettings.key, 'maintenance_enabled'))
        .limit(1);

      if (existing) {
        await db
          .update(botSettings)
          .set({ value: val, updatedAt: now })
          .where(eq(botSettings.key, 'maintenance_enabled'));
      } else {
        await db.insert(botSettings).values({
          key: 'maintenance_enabled',
          value: val,
          updatedAt: now,
        });
      }
    }

    if (reason !== undefined) {
      const [existingReason] = await db
        .select()
        .from(botSettings)
        .where(eq(botSettings.key, 'maintenance_reason'))
        .limit(1);

      if (existingReason) {
        await db
          .update(botSettings)
          .set({ value: reason, updatedAt: now })
          .where(eq(botSettings.key, 'maintenance_reason'));
      } else {
        await db.insert(botSettings).values({
          key: 'maintenance_reason',
          value: reason,
          updatedAt: now,
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Maintenance update error:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
