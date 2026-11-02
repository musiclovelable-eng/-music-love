import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { artists, adminPermissions } from '@/db/schema';
import { eq, or, desc } from 'drizzle-orm';
import { getSessionFromRequest } from '@/lib/auth';
import bcrypt from 'bcrypt';

export const DEFAULT_PERMISSIONS = {
  canAccessDashboard: true,
  canAccessArtists: true,
  canAccessReleases: true,
  canAccessWallets: false,
  canAccessNews: true,
  canAccessFaq: true,
  canAccessTickets: true,
  canAccessPendingUsers: true,
  canAccessLyrics: true,
  canAccessStaff: false,
  canEditReleases: true,
  canDeleteReleases: false,
  canDownloadFiles: true,
  canApproveReleases: true,
  canEditArtists: true,
  canDeleteArtists: false,
  canManagePayouts: false,
  canManageUsers: true,
};

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session || !session.isAdmin) {
      return NextResponse.json({ error: 'Admin authentication required' }, { status: 401 });
    }

    // Only super-admin (isAdmin && !managerId and not a sub-admin) can list admins
    // We identify super-admin as the admin who created others
    const allAdmins = await db
      .select()
      .from(artists)
      .where(eq(artists.isAdmin, true))
      .orderBy(desc(artists.createdAt));

    const adminsWithPerms = await Promise.all(
      allAdmins.map(async (admin) => {
        const [perms] = await db
          .select()
          .from(adminPermissions)
          .where(eq(adminPermissions.adminId, admin.id))
          .limit(1);

        const { password: _, ...adminWithoutPassword } = admin;
        return {
          ...adminWithoutPassword,
          permissions: perms || null,
          isSuperAdmin: !perms, // super-admin has no permission row (full access)
        };
      })
    );

    return NextResponse.json({ admins: adminsWithPerms });
  } catch (error) {
    console.error('GET admins error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session || !session.isAdmin) {
      return NextResponse.json({ error: 'Admin authentication required' }, { status: 401 });
    }

    // Check if current admin is super-admin (no permissions row means full access)
    const [currentAdminPerms] = await db
      .select()
      .from(adminPermissions)
      .where(eq(adminPermissions.adminId, session.userId))
      .limit(1);

    if (currentAdminPerms && !currentAdminPerms.canAccessStaff) {
      return NextResponse.json({ error: 'У вас нет прав для создания администраторов' }, { status: 403 });
    }

    const body = await request.json();
    const { name, email, password, permissions } = body;

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Имя, email и пароль обязательны' }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existing = await db.select().from(artists).where(eq(artists.email, normalizedEmail)).limit(1);
    if (existing.length > 0) {
      return NextResponse.json({ error: 'Email уже используется' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const uid = `admin-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    const now = new Date().toISOString();

    const [newAdmin] = await db.insert(artists).values({
      uid,
      email: normalizedEmail,
      password: hashedPassword,
      name: name.trim(),
      plan: 'basic',
      isAdmin: true,
      isManager: false,
      isApproved: true,
      emailVerified: true,
      isFrozen: false,
      isBlocked: false,
      isDeactivated: false,
      theme: 'light',
      showSnowflakes: false,
      showGarland: false,
      label: 'Music Love',
      createdAt: now,
    }).returning();

    // Create permissions for this sub-admin
    const perms = { ...DEFAULT_PERMISSIONS, ...(permissions || {}) };
    await db.insert(adminPermissions).values({
      adminId: newAdmin.id,
      ...perms,
      createdAt: now,
      updatedAt: now,
    });

    const { password: _, ...adminWithoutPassword } = newAdmin;
    return NextResponse.json({ admin: adminWithoutPassword }, { status: 201 });
  } catch (error) {
    console.error('POST admin error:', error);
    return NextResponse.json({ error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown') }, { status: 500 });
  }
}
