import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { artists, adminPermissions } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { getSessionFromRequest } from '@/lib/auth';
import bcrypt from 'bcrypt';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session || !session.isAdmin) {
      return NextResponse.json({ error: 'Admin authentication required' }, { status: 401 });
    }

    const adminId = parseInt(params.id);
    const [admin] = await db.select().from(artists).where(and(eq(artists.id, adminId), eq(artists.isAdmin, true))).limit(1);

    if (!admin) return NextResponse.json({ error: 'Admin not found' }, { status: 404 });

    const [perms] = await db.select().from(adminPermissions).where(eq(adminPermissions.adminId, adminId)).limit(1);

    const { password: _, ...adminWithoutPassword } = admin;
    return NextResponse.json({ admin: adminWithoutPassword, permissions: perms || null });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session || !session.isAdmin) {
      return NextResponse.json({ error: 'Admin authentication required' }, { status: 401 });
    }

    const adminId = parseInt(params.id);

    // Prevent modifying self
    if (adminId === session.userId) {
      return NextResponse.json({ error: 'Нельзя изменять собственный аккаунт' }, { status: 400 });
    }

    const [admin] = await db.select().from(artists).where(and(eq(artists.id, adminId), eq(artists.isAdmin, true))).limit(1);
    if (!admin) return NextResponse.json({ error: 'Admin not found' }, { status: 404 });

    const body = await request.json();
    const now = new Date().toISOString();

    // Update admin basic info
    const adminUpdates: Record<string, unknown> = {};
    if ('name' in body) adminUpdates.name = body.name.trim();
    if ('isFrozen' in body) adminUpdates.isFrozen = body.isFrozen;
    if ('password' in body && body.password) {
      adminUpdates.password = await bcrypt.hash(body.password, 10);
    }

    if (Object.keys(adminUpdates).length > 0) {
      await db.update(artists).set(adminUpdates).where(eq(artists.id, adminId));
    }

    // Update permissions if provided
    if ('permissions' in body) {
      const perms = body.permissions;
      const [existing] = await db.select().from(adminPermissions).where(eq(adminPermissions.adminId, adminId)).limit(1);

      if (existing) {
        await db.update(adminPermissions).set({ ...perms, updatedAt: now }).where(eq(adminPermissions.adminId, adminId));
      } else {
        await db.insert(adminPermissions).values({ adminId, ...perms, createdAt: now, updatedAt: now });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('PATCH admin error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session || !session.isAdmin) {
      return NextResponse.json({ error: 'Admin authentication required' }, { status: 401 });
    }

    const adminId = parseInt(params.id);

    if (adminId === session.userId) {
      return NextResponse.json({ error: 'Нельзя удалить собственный аккаунт' }, { status: 400 });
    }

    const [admin] = await db.select().from(artists).where(and(eq(artists.id, adminId), eq(artists.isAdmin, true))).limit(1);
    if (!admin) return NextResponse.json({ error: 'Admin not found' }, { status: 404 });

    // Remove permissions first (FK)
    await db.delete(adminPermissions).where(eq(adminPermissions.adminId, adminId));

    // Delete admin account
    await db.delete(artists).where(eq(artists.id, adminId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE admin error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
