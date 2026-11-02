import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { db } from '@/db';
import { pitchings } from '@/db/schema';
import { eq } from 'drizzle-orm';

// PATCH: update pitching status/note
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { status, adminNote } = await request.json();
    const id = parseInt(params.id);

    await db.update(pitchings)
      .set({ status, adminNote, updatedAt: new Date().toISOString() })
      .where(eq(pitchings.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating pitching:', error);
    return NextResponse.json({ error: 'Ошибка при обновлении' }, { status: 500 });
  }
}
