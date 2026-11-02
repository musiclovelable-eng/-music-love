import { NextResponse } from "next/server";
import { db } from "@/db";
import { artists, artistWallets, financialReports, walletTransactions, artistPaymentDetails } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { getSession } from "@/lib/auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ artistId: string }> }
) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!session.isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { artistId } = await params;
    const targetArtistId = parseInt(artistId);

    const artist = await db.query.artists.findFirst({
      where: eq(artists.id, targetArtistId),
    });

    if (!artist) {
      return NextResponse.json({ error: "Artist not found" }, { status: 404 });
    }

    let wallet = await db.query.artistWallets.findFirst({
      where: eq(artistWallets.artistId, targetArtistId),
    });

    if (!wallet) {
      const now = new Date().toISOString();
      const [newWallet] = await db.insert(artistWallets).values({
        artistId: targetArtistId,
        balanceRub: "0",
        balanceUsd: "0",
        createdAt: now,
        updatedAt: now,
      }).returning();
      wallet = newWallet;
    }

    const reports = await db.query.financialReports.findMany({
      where: eq(financialReports.artistId, targetArtistId),
      orderBy: [desc(financialReports.year), desc(financialReports.quarter)],
    });

    const transactions = await db.query.walletTransactions.findMany({
      where: eq(walletTransactions.artistId, targetArtistId),
      orderBy: [desc(walletTransactions.createdAt)],
    });

    const paymentDetails = await db.query.artistPaymentDetails.findFirst({
      where: eq(artistPaymentDetails.artistId, targetArtistId),
    });

    return NextResponse.json({
      artist,
      wallet,
      reports,
      transactions,
      paymentDetails,
    });
  } catch (error) {
    console.error("Error fetching artist wallet:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ artistId: string }> }
) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!session.isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { artistId } = await params;
    const targetArtistId = parseInt(artistId);
    const body = await request.json();

    const now = new Date().toISOString();

    let wallet = await db.query.artistWallets.findFirst({
      where: eq(artistWallets.artistId, targetArtistId),
    });

    if (!wallet) {
      const [newWallet] = await db.insert(artistWallets).values({
        artistId: targetArtistId,
        balanceRub: body.balanceRub || "0",
        balanceUsd: body.balanceUsd || "0",
        createdAt: now,
        updatedAt: now,
      }).returning();
      wallet = newWallet;
    } else {
      await db.update(artistWallets)
        .set({
          balanceRub: body.balanceRub || wallet.balanceRub,
          balanceUsd: body.balanceUsd || wallet.balanceUsd,
          updatedAt: now,
        })
        .where(eq(artistWallets.artistId, targetArtistId));
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating wallet:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
