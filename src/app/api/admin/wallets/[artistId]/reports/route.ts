import { NextResponse } from "next/server";
import { db } from "@/db";
import { financialReports, artistWallets } from "@/db/schema";
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

    const reports = await db.query.financialReports.findMany({
      where: eq(financialReports.artistId, targetArtistId),
      orderBy: [desc(financialReports.year), desc(financialReports.quarter)],
    });

    return NextResponse.json({ reports });
  } catch (error) {
    console.error("Error fetching reports:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(
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

    if (!body.fileUrl || !body.fileName) {
      return NextResponse.json({ error: "Document is required" }, { status: 400 });
    }

    const now = new Date().toISOString();

    const [report] = await db.insert(financialReports).values({
      artistId: targetArtistId,
      title: body.title,
      periodStart: body.periodStart,
      periodEnd: body.periodEnd,
      quarter: body.quarter || null,
      year: body.year,
      amountRub: body.amountRub || "0",
      amountUsd: body.amountUsd || "0",
      status: body.status || "pending",
      fileUrl: body.fileUrl,
      fileName: body.fileName,
      details: body.details || null,
      isRoyalty: body.isRoyalty !== false,
      createdAt: now,
      updatedAt: now,
    }).returning();

    const wallet = await db.query.artistWallets.findFirst({
      where: eq(artistWallets.artistId, targetArtistId),
    });

    if (wallet) {
      const newBalanceRub = (parseFloat(wallet.balanceRub) + parseFloat(body.amountRub || "0")).toFixed(2);
      const newBalanceUsd = (parseFloat(wallet.balanceUsd) + parseFloat(body.amountUsd || "0")).toFixed(2);
      
      await db.update(artistWallets)
        .set({
          balanceRub: newBalanceRub,
          balanceUsd: newBalanceUsd,
          updatedAt: now,
        })
        .where(eq(artistWallets.artistId, targetArtistId));
    } else {
      await db.insert(artistWallets).values({
        artistId: targetArtistId,
        balanceRub: body.amountRub || "0",
        balanceUsd: body.amountUsd || "0",
        createdAt: now,
        updatedAt: now,
      });
    }

    return NextResponse.json({ report });
  } catch (error) {
    console.error("Error creating report:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
