import { NextResponse } from "next/server";
import { db } from "@/db";
import { artists, artistWallets, financialReports } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!session.isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const allArtists = await db.query.artists.findMany({
      orderBy: [desc(artists.createdAt)],
    });

    const artistsWithWallets = await Promise.all(
      allArtists.map(async (artist) => {
        let wallet = await db.query.artistWallets.findFirst({
          where: eq(artistWallets.artistId, artist.id),
        });

        const reports = await db.query.financialReports.findMany({
          where: eq(financialReports.artistId, artist.id),
          orderBy: [desc(financialReports.year), desc(financialReports.quarter)],
        });

        return {
          ...artist,
          wallet,
          reportsCount: reports.length,
          pendingReports: reports.filter(r => r.status === "pending").length,
        };
      })
    );

    return NextResponse.json({ artists: artistsWithWallets });
  } catch (error) {
    console.error("Error fetching wallets:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
