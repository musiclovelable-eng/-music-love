import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db } from '@/db';
import { newLyricsSubmissions } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();

    if (!session || !session.isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const submissionId = parseInt(params.id);
    const { status, rejectionReason } = await request.json();

    // Validate status
    const validStatuses = ['submitted', 'approved', 'rejected'];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be one of: submitted, approved, rejected' },
        { status: 400 }
      );
    }

    const updateData: any = {
      status,
      reviewedAt: new Date().toISOString(),
    };

    if (rejectionReason !== undefined) {
      updateData.rejectionReason = rejectionReason;
    }

    const [updatedSubmission] = await db
      .update(newLyricsSubmissions)
      .set(updateData)
      .where(eq(newLyricsSubmissions.id, submissionId))
      .returning();

    if (!updatedSubmission) {
      return NextResponse.json(
        { error: 'Lyrics submission not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedSubmission);
  } catch (error) {
    console.error('Error updating lyrics submission:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error },
      { status: 500 }
    );
  }
}