import { NextResponse } from 'next/server';
import { db } from '@/db';
import { news } from '@/db/schema';
import { desc, eq } from 'drizzle-orm';

export async function GET() {
  try {
    const allNews = await db
      .select()
      .from(news)
      .where(eq(news.published, true))
      .orderBy(desc(news.createdAt));

    return NextResponse.json({ news: allNews });
  } catch (error) {
    console.error('Error fetching news:', error);
    return NextResponse.json(
      { error: 'Ошибка при загрузке новостей' },
      { status: 500 }
    );
  }
}
