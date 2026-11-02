import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db } from '@/db';
import { artists } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.isAdmin) {
      return NextResponse.json({ error: 'Неавторизован' }, { status: 401 });
    }

    const pendingUsers = await db
      .select({
        id: artists.id,
        email: artists.email,
        name: artists.name,
        surname: artists.surname,
        artistName: artists.artistName,
        emailVerified: artists.emailVerified,
        isApproved: artists.isApproved,
        accessRequestMessage: artists.accessRequestMessage,
        socialNetwork: artists.socialNetwork,
        howDidYouHear: artists.howDidYouHear,
        password: artists.password,
        createdAt: artists.createdAt,
      })
      .from(artists)
      .where(and(
        eq(artists.isApproved, false),
        eq(artists.requiresApproval, true)
      ))
      .all();

    return NextResponse.json({ users: pendingUsers });
  } catch (error) {
    console.error('Fetch pending users error:', error);
    return NextResponse.json({ error: 'Ошибка при получении списка заявок' }, { status: 500 });
  }
}
