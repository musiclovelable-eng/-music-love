import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { db } from '@/db';
import { artists } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    // Get current session - use getSessionFromRequest for bearer token auth
    const session = await getSessionFromRequest(request);
    
    // Check authentication
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get current timestamp
    const timestamp = new Date().toISOString();

    // Update lastActiveAt for the current user
    await db.update(artists)
      .set({ lastActiveAt: timestamp })
      .where(eq(artists.id, session.userId));

    // Return success response
    return NextResponse.json(
      { 
        success: true, 
        lastActiveAt: timestamp 
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}