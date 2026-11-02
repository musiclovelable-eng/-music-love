import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db } from '@/db';
import { faq } from '@/db/schema';
import { asc } from 'drizzle-orm';

export async function GET() {
  try {
    const session = await getSession();

    if (!session || !session.isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

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

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session || !session.isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { question, answer, orderIndex } = await request.json();

    if (!question || !answer) {
      return NextResponse.json(
        { error: 'Необходимо заполнить все поля' },
        { status: 400 }
      );
    }

    await db.insert(faq).values({
      question,
      answer,
      orderIndex: orderIndex || 0,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error creating FAQ:', error);
    return NextResponse.json(
      { error: 'Ошибка при создании вопроса' },
      { status: 500 }
    );
  }
}
