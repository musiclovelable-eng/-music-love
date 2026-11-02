import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db } from '@/db';
import { news } from '@/db/schema';
import { desc } from 'drizzle-orm';

export async function GET() {
  try {
    const session = await getSession();

    if (!session || !session.isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const allNews = await db
      .select()
      .from(news)
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

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session || !session.isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { title, content, links } = await request.json();

    if (!title || !content) {
      return NextResponse.json(
        { error: 'Необходимо заполнить все поля' },
        { status: 400 }
      );
    }

    await db.insert(news).values({
      title,
      content,
      links,
      createdBy: session.userId,
      createdAt: new Date().toISOString(),
      published: true,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error creating news:', error);
    return NextResponse.json(
      { error: 'Ошибка при создании новости' },
      { status: 500 }
    );
  }
}
