import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { db } from '@/db';
import { tickets, ticketAttachments } from '@/db/schema';
import { eq, asc } from 'drizzle-orm';
import { uploadToStorage } from '@/lib/storage';

async function uploadAttachment(file: File, ticketId: string): Promise<string> {
  const timestamp = Date.now();
  const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const filePath = `ticket-${ticketId}/${timestamp}-${safeName}`;
  const { url } = await uploadToStorage('ticket-attachments', filePath, file);
  return url;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: ticketId } = await params;

    if (!ticketId || isNaN(parseInt(ticketId))) {
      return NextResponse.json(
        { error: 'Valid ticket ID is required' },
        { status: 400 }
      );
    }

    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (!session.isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const ticket = await db
      .select()
      .from(tickets)
      .where(eq(tickets.id, parseInt(ticketId)))
      .limit(1);

    if (ticket.length === 0) {
      return NextResponse.json(
        { error: 'Ticket not found' },
        { status: 404 }
      );
    }

    const attachments = await db
      .select()
      .from(ticketAttachments)
      .where(eq(ticketAttachments.ticketId, parseInt(ticketId)))
      .orderBy(asc(ticketAttachments.createdAt));

    return NextResponse.json({ attachments });
  } catch (error) {
    console.error('GET /api/admin/tickets/[id]/attachments error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: ticketId } = await params;

    if (!ticketId || isNaN(parseInt(ticketId))) {
      return NextResponse.json(
        { error: 'Valid ticket ID is required' },
        { status: 400 }
      );
    }

    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (!session.isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const ticket = await db
      .select()
      .from(tickets)
      .where(eq(tickets.id, parseInt(ticketId)))
      .limit(1);

    if (ticket.length === 0) {
      return NextResponse.json(
        { error: 'Ticket not found' },
        { status: 404 }
      );
    }

    if (ticket[0].status === 'Решено' || ticket[0].status === 'Закрыто') {
      return NextResponse.json(
        { error: 'Cannot upload files to closed ticket' },
        { status: 400 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const messageId = formData.get('messageId') as string | null;

    if (!file) {
      return NextResponse.json(
        { error: 'File is required' },
        { status: 400 }
      );
    }

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size exceeds 10MB limit' },
        { status: 400 }
      );
    }

    const fileUrl = await uploadAttachment(file, ticketId);

    const currentTimestamp = new Date().toISOString();

    const newAttachment = await db
      .insert(ticketAttachments)
      .values({
        ticketId: parseInt(ticketId),
        messageId: messageId ? parseInt(messageId) : null,
        fileName: file.name,
        fileUrl: fileUrl,
        fileSize: file.size,
        fileType: file.type,
        uploadedBy: session.userId,
        uploadedByType: 'admin',
        createdAt: currentTimestamp,
      })
      .returning();

    return NextResponse.json(
      { success: true, attachment: newAttachment[0] },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/admin/tickets/[id]/attachments error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
