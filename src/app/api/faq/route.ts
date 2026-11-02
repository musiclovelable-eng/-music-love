import { NextResponse } from 'next/server';
import { db } from '@/db';
import { faq } from '@/db/schema';
import { asc } from 'drizzle-orm';

export async function GET() {
  try {
    const allFaq = await db
      .select()
      .from(faq)
      .orderBy(asc(faq.orderIndex));

    return NextResponse.json({ faq: allFaq });
  } catch (error) {
    console.error('Error fetching FAQ:', error);
    return NextResponse.json(
      { error: 'Ошибка при загрузке FAQ' },
      { status: 500 }
    );
  }
}
