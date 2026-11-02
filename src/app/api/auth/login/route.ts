import { NextRequest, NextResponse } from 'next/server';
import { verifyCredentials, createSession } from '@/lib/auth';
import { db } from '@/db';
import { botSettings, adminPermissions } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email и пароль обязательны' },
        { status: 400 }
      );
    }

    try {
      const user = await verifyCredentials(email, password);

      if (!user) {
        return NextResponse.json(
          { error: 'Неверный email или пароль' },
          { status: 401 }
        );
      }

      // Check maintenance mode (block everyone except super admin)
      if (user.isAdmin) {
        const [perms] = await db
          .select()
          .from(adminPermissions)
          .where(eq(adminPermissions.adminId, user.userId))
          .limit(1);
        const isSuperAdmin = !perms;

        if (!isSuperAdmin) {
          const [maintRow] = await db
            .select()
            .from(botSettings)
            .where(eq(botSettings.key, 'maintenance_enabled'))
            .limit(1);
          if (maintRow?.value === 'true') {
            const [reasonRow] = await db
              .select()
              .from(botSettings)
              .where(eq(botSettings.key, 'maintenance_reason'))
              .limit(1);
            return NextResponse.json(
              { error: 'TECHNICAL_BREAK', reason: reasonRow?.value || '' },
              { status: 503 }
            );
          }
        }
      } else {
        // Non-admin: check maintenance
        const [maintRow] = await db
          .select()
          .from(botSettings)
          .where(eq(botSettings.key, 'maintenance_enabled'))
          .limit(1);
        if (maintRow?.value === 'true') {
          const [reasonRow] = await db
            .select()
            .from(botSettings)
            .where(eq(botSettings.key, 'maintenance_reason'))
            .limit(1);
          return NextResponse.json(
            { error: 'TECHNICAL_BREAK', reason: reasonRow?.value || '' },
            { status: 503 }
          );
        }
      }

      const token = await createSession(user);

        return NextResponse.json({
          success: true,
          token,
          user: {
            email: user.email,
            name: user.name,
            isAdmin: user.isAdmin,
            isManager: user.isManager,
            isFrozen: user.isFrozen,
            uid: user.uid,
            plan: user.plan,
            isApproved: user.isApproved,
            emailVerified: user.emailVerified,
          },
        });

    } catch (error) {
      if (error instanceof Error && error.message === 'BLOCKED') {
        return NextResponse.json(
          { error: 'Доступ к учётной записи временно ограничен администратором Music Love' },
          { status: 403 }
        );
      }
      if (error instanceof Error && error.message === 'EMAIL_NOT_VERIFIED') {
        return NextResponse.json(
          { error: 'EMAIL_NOT_VERIFIED' },
          { status: 403 }
        );
      }
      if (error instanceof Error && error.message === 'PENDING_APPROVAL') {
        return NextResponse.json(
          { error: 'PENDING_APPROVAL' },
          { status: 403 }
        );
      }
      if (error instanceof Error && error.message === 'FROZEN') {
        return NextResponse.json(
          { error: 'Ваш аккаунт заморожен администратором. Обратитесь в поддержку.' },
          { status: 403 }
        );
      }
      throw error;
    }
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Ошибка авторизации' },
      { status: 500 }
    );
  }
}