import { NextResponse } from "next/server";
import { db } from "@/db";
import { artists, artistWallets, financialReports, walletTransactions } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const artist = await db.query.artists.findFirst({
      where: eq(artists.uid, session.uid),
    });

    if (!artist) {
      return NextResponse.json({ error: "Artist not found" }, { status: 404 });
    }

    let wallet = await db.query.artistWallets.findFirst({
      where: eq(artistWallets.artistId, artist.id),
    });

    if (!wallet) {
      const now = new Date().toISOString();
      const [newWallet] = await db.insert(artistWallets).values({
        artistId: artist.id,
        balanceRub: "0",
        balanceUsd: "0",
        createdAt: now,
        updatedAt: now,
      }).returning();
      wallet = newWallet;
    }

    const reports = await db.query.financialReports.findMany({
      where: eq(financialReports.artistId, artist.id),
      orderBy: [desc(financialReports.year), desc(financialReports.quarter)],
    });

    const transactions = await db.query.walletTransactions.findMany({
      where: eq(walletTransactions.artistId, artist.id),
      orderBy: [desc(walletTransactions.createdAt)],
    });

    return NextResponse.json({
      wallet,
      reports,
      transactions,
    });
  } catch (error) {
    console.error("Error fetching wallet:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
