import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { db } from '@/db';
import { tickets, ticketAttachments } from '@/db/schema';
import { eq, asc } from 'drizzle-orm';
import {
  getStorageFileUrl,
  isLocalStorage,
  normalizeStorageKey,
  uploadToStorage,
} from '@/lib/storage';

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

    if (ticket[0].artistId !== session.userId) {
      return NextResponse.json(
        { error: 'Not authorized' },
        { status: 403 }
      );
    }

    const attachments = await db
      .select()
      .from(ticketAttachments)
      .where(eq(ticketAttachments.ticketId, parseInt(ticketId)))
      .orderBy(asc(ticketAttachments.createdAt));

    return NextResponse.json({ attachments });
  } catch (error) {
    console.error('GET /api/tickets/[id]/attachments error:', error);
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

    if (ticket[0].artistId !== session.userId) {
      return NextResponse.json(
        { error: 'Not authorized' },
        { status: 403 }
      );
    }

    if (ticket[0].status === 'Решено' || ticket[0].status === 'Закрыто') {
      return NextResponse.json(
        { error: 'Cannot upload files to closed ticket' },
        { status: 400 }
      );
    }

    const maxSize = 10 * 1024 * 1024;
    let fileUrl: string;
    let fileName: string;
    let fileSize: number;
    let fileType: string;
    let messageId: string | null;

    if (request.headers.get('content-type')?.includes('application/json')) {
      if (isLocalStorage()) {
        return NextResponse.json({ error: 'Облачная загрузка не включена' }, { status: 409 });
      }
      const body = await request.json();
      const key = normalizeStorageKey(String(body.key || ''));
      fileName = String(body.fileName || '').trim().slice(0, 255);
      fileSize = Number(body.fileSize);
      fileType = String(body.fileType || '');
      messageId = body.messageId ? String(body.messageId) : null;
      if (!key.startsWith(`ticket-${ticketId}/`) || !fileName) {
        return NextResponse.json({ error: 'Некорректный файл' }, { status: 400 });
      }
      if (!Number.isSafeInteger(fileSize) || fileSize <= 0 || fileSize > maxSize) {
        return NextResponse.json({ error: 'File size exceeds 10MB limit' }, { status: 400 });
      }
      fileUrl = getStorageFileUrl('ticket-attachments', key);
    } else {
      const formData = await request.formData();
      const file = formData.get('file') as File;
      messageId = formData.get('messageId') as string | null;
      if (!file) {
        return NextResponse.json({ error: 'File is required' }, { status: 400 });
      }
      if (file.size > maxSize) {
        return NextResponse.json({ error: 'File size exceeds 10MB limit' }, { status: 400 });
      }
      fileUrl = await uploadAttachment(file, ticketId);
      fileName = file.name;
      fileSize = file.size;
      fileType = file.type;
    }

    const currentTimestamp = new Date().toISOString();

    const newAttachment = await db
      .insert(ticketAttachments)
      .values({
        ticketId: parseInt(ticketId),
        messageId: messageId ? parseInt(messageId) : null,
        fileName,
        fileUrl,
        fileSize,
        fileType,
        uploadedBy: session.userId,
        uploadedByType: 'artist',
        createdAt: currentTimestamp,
      })
      .returning();

    return NextResponse.json(
      { success: true, attachment: newAttachment[0] },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/tickets/[id]/attachments error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
