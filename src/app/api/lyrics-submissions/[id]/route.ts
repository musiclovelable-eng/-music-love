import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { lyricsSubmissions, artists } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getSession } from '@/lib/auth';

const VALID_STATUSES = ['sent', 'approved', 'rejected'] as const;

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authentication check
    const session = await getSession(request);
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    // Admin privilege check
    if (!session.isAdmin) {
      return NextResponse.json(
        { error: 'Admin privileges required', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    // Validate ID
    const submissionId = parseInt(params.id);
    if (!submissionId || isNaN(submissionId)) {
      return NextResponse.json(
        { error: 'Valid submission ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { status, rejectionReason } = body;

    // Validate required fields
    if (!status) {
      return NextResponse.json(
        { error: 'Status is required', code: 'MISSING_STATUS' },
        { status: 400 }
      );
    }

    // Validate status value
    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        {
          error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`,
          code: 'INVALID_STATUS',
        },
        { status: 400 }
      );
    }

    // Update submission
    const updated = await db
      .update(lyricsSubmissions)
      .set({
        status,
        rejectionReason: rejectionReason || null,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(lyricsSubmissions.id, submissionId))
      .returning();

    // Check if submission exists
    if (updated.length === 0) {
      return NextResponse.json(
        { error: 'Submission not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    return NextResponse.json(updated[0], { status: 200 });
  } catch (error) {
    console.error('PATCH error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authentication check
    const session = await getSession(request);
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    // Validate ID
    const submissionId = parseInt(params.id);
    if (!submissionId || isNaN(submissionId)) {
      return NextResponse.json(
        { error: 'Valid submission ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    // Fetch submission to check ownership
    const submission = await db
      .select()
      .from(lyricsSubmissions)
      .where(eq(lyricsSubmissions.id, submissionId))
      .limit(1);

    // Check if submission exists
    if (submission.length === 0) {
      return NextResponse.json(
        { error: 'Submission not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Check permissions: admin can delete any, artist can only delete their own
    if (!session.isAdmin && submission[0].artistId !== session.userId) {
      return NextResponse.json(
        { error: 'You can only delete your own submissions', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    // Delete submission
    await db
      .delete(lyricsSubmissions)
      .where(eq(lyricsSubmissions.id, submissionId));

    return NextResponse.json(
      {
        success: true,
        message: 'Submission deleted',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authentication check
    const session = await getSession(request);
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    // Validate ID
    const submissionId = parseInt(params.id);
    if (!submissionId || isNaN(submissionId)) {
      return NextResponse.json(
        { error: 'Valid submission ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    // Fetch submission with artist info
    const result = await db
      .select({
        id: lyricsSubmissions.id,
        artistId: lyricsSubmissions.artistId,
        releaseId: lyricsSubmissions.releaseId,
        trackName: lyricsSubmissions.trackName,
        lyricLink: lyricsSubmissions.lyricLink,
        platform: lyricsSubmissions.platform,
        status: lyricsSubmissions.status,
        rejectionReason: lyricsSubmissions.rejectionReason,
        createdAt: lyricsSubmissions.createdAt,
        updatedAt: lyricsSubmissions.updatedAt,
        artist: {
          name: artists.name,
          email: artists.email,
        },
      })
      .from(lyricsSubmissions)
      .leftJoin(artists, eq(lyricsSubmissions.artistId, artists.id))
      .where(eq(lyricsSubmissions.id, submissionId))
      .limit(1);

    // Check if submission exists
    if (result.length === 0) {
      return NextResponse.json(
        { error: 'Submission not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const submission = result[0];

    // Check permissions: admin can view any, artist can only view their own
    if (!session.isAdmin && submission.artistId !== session.userId) {
      return NextResponse.json(
        { error: 'You can only view your own submissions', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    return NextResponse.json(submission, { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}