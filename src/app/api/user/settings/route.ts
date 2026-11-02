import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db } from '@/db';
import { artists } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const [artist] = await db
      .select()
      .from(artists)
      .where(eq(artists.id, session.userId))
      .limit(1);

    if (!artist) {
      return NextResponse.json({
        theme: 'light',
        showSnowflakes: false,
        showGarland: false,
      });
    }

    return NextResponse.json({
      theme: artist.theme,
      showSnowflakes: artist.showSnowflakes,
      showGarland: artist.showGarland,
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { theme, snowflakesEnabled, garlandEnabled } = await request.json();

    // Validate theme if provided
    if (theme && theme !== 'light' && theme !== 'dark') {
      return NextResponse.json(
        { error: 'Theme must be either "light" or "dark"' },
        { status: 400 }
      );
    }

    const updateData: any = {};
    
    if (theme !== undefined) {
      updateData.theme = theme;
    }
    
    if (snowflakesEnabled !== undefined) {
      updateData.showSnowflakes = snowflakesEnabled;
    }
    
    if (garlandEnabled !== undefined) {
      updateData.showGarland = garlandEnabled;
    }

    const [result] = await db
      .update(artists)
      .set(updateData)
      .where(eq(artists.id, session.userId))
      .returning();

    return NextResponse.json({
      theme: result.theme,
      showSnowflakes: result.showSnowflakes,
      showGarland: result.showGarland,
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { theme, showSnowflakes, showGarland } = await request.json();

    // Validate theme if provided
    if (theme && theme !== 'light' && theme !== 'dark') {
      return NextResponse.json(
        { error: 'Theme must be either "light" or "dark"' },
        { status: 400 }
      );
    }

    const updateData: any = {};
    
    if (theme !== undefined) {
      updateData.theme = theme;
    }
    
    if (showSnowflakes !== undefined) {
      updateData.showSnowflakes = showSnowflakes;
    }
    
    if (showGarland !== undefined) {
      updateData.showGarland = showGarland;
    }

    const [result] = await db
      .update(artists)
      .set(updateData)
      .where(eq(artists.id, session.userId))
      .returning();

    return NextResponse.json({
      theme: result.theme,
      showSnowflakes: result.showSnowflakes,
      showGarland: result.showGarland,
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error },
      { status: 500 }
    );
  }
}