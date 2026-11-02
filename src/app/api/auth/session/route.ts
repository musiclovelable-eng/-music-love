import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db } from '@/db';
import { artists, adminPermissions } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ user: null });
    }

    // Проверяем актуальность данных пользователя
    const [artist] = await db
      .select()
      .from(artists)
      .where(eq(artists.id, session.userId))
      .limit(1);

    if (!artist || artist.isBlocked) {
      return NextResponse.json({ user: null });
    }

    // Проверяем заморозку для менеджеров
    if (artist.isManager && artist.isFrozen) {
      return NextResponse.json({ user: null });
    }

    // Проверяем заморозку для администраторов
    if (artist.isAdmin && artist.isFrozen) {
      return NextResponse.json({ user: null });
    }

    // Load permissions for sub-admins
    let permissions = null;
    let isSuperAdmin = false;
    if (artist.isAdmin) {
      const [perms] = await db
        .select()
        .from(adminPermissions)
        .where(eq(adminPermissions.adminId, artist.id))
        .limit(1);
      
      if (perms) {
        permissions = perms;
        isSuperAdmin = false;
      } else {
        // No permissions row = super-admin with full access
        isSuperAdmin = true;
      }
    }

    return NextResponse.json({
      user: {
        id: artist.id,
        email: artist.email,
        name: artist.name,
        surname: artist.surname,
        artistName: artist.artistName,
        bio: artist.bio,
        contractSigned: artist.contractSigned,
        socialNetwork: artist.socialNetwork,
        isAdmin: artist.isAdmin,
        isManager: artist.isManager,
        isFrozen: artist.isFrozen,
        uid: artist.uid,
        plan: artist.plan,
        role: artist.role,
        theme: artist.theme,
        showSnowflakes: artist.showSnowflakes,
        showGarland: artist.showGarland,
        avatarUrl: artist.avatarUrl,
        label: artist.label,
        createdAt: artist.createdAt,
        telegramChatId: artist.telegramChatId,
        isApproved: artist.isApproved,
        emailVerified: true,
        accessRequestMessage: artist.accessRequestMessage,
        isSuperAdmin,
        adminPermissions: permissions,
      },
    });
  } catch (error) {
    console.error('Session API error:', error);
    return NextResponse.json({ user: null }, { status: 500 });
  }
}
