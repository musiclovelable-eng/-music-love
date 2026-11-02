import { NextResponse } from "next/server";
import { db } from "@/db";
import { financialReports, artistWallets } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getSession } from "@/lib/auth";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ artistId: string; reportId: string }> }
) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!session.isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { artistId, reportId } = await params;
    const targetArtistId = parseInt(artistId);
    const targetReportId = parseInt(reportId);
    const body = await request.json();

    const existingReport = await db.query.financialReports.findFirst({
      where: and(
        eq(financialReports.id, targetReportId),
        eq(financialReports.artistId, targetArtistId)
      ),
    });

    if (!existingReport) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    const now = new Date().toISOString();

    const oldAmountRub = parseFloat(existingReport.amountRub);
    const oldAmountUsd = parseFloat(existingReport.amountUsd);
    const newAmountRub = parseFloat(body.amountRub || existingReport.amountRub);
    const newAmountUsd = parseFloat(body.amountUsd || existingReport.amountUsd);

    await db.update(financialReports)
      .set({
        title: body.title || existingReport.title,
        periodStart: body.periodStart || existingReport.periodStart,
        periodEnd: body.periodEnd || existingReport.periodEnd,
        quarter: body.quarter !== undefined ? body.quarter : existingReport.quarter,
        year: body.year || existingReport.year,
        amountRub: body.amountRub || existingReport.amountRub,
        amountUsd: body.amountUsd || existingReport.amountUsd,
        status: body.status || existingReport.status,
        fileUrl: body.fileUrl !== undefined ? body.fileUrl : existingReport.fileUrl,
        fileName: body.fileName !== undefined ? body.fileName : existingReport.fileName,
        details: body.details !== undefined ? body.details : existingReport.details,
        isRoyalty: body.isRoyalty !== undefined ? body.isRoyalty : existingReport.isRoyalty,
        updatedAt: now,
      })
      .where(eq(financialReports.id, targetReportId));

    if (oldAmountRub !== newAmountRub || oldAmountUsd !== newAmountUsd) {
      const wallet = await db.query.artistWallets.findFirst({
        where: eq(artistWallets.artistId, targetArtistId),
      });

      if (wallet) {
        const diffRub = newAmountRub - oldAmountRub;
        const diffUsd = newAmountUsd - oldAmountUsd;
        const updatedBalanceRub = (parseFloat(wallet.balanceRub) + diffRub).toFixed(2);
        const updatedBalanceUsd = (parseFloat(wallet.balanceUsd) + diffUsd).toFixed(2);

        await db.update(artistWallets)
          .set({
            balanceRub: updatedBalanceRub,
            balanceUsd: updatedBalanceUsd,
            updatedAt: now,
          })
          .where(eq(artistWallets.artistId, targetArtistId));
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating report:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ artistId: string; reportId: string }> }
) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!session.isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { artistId, reportId } = await params;
    const targetArtistId = parseInt(artistId);
    const targetReportId = parseInt(reportId);

    const existingReport = await db.query.financialReports.findFirst({
      where: and(
        eq(financialReports.id, targetReportId),
        eq(financialReports.artistId, targetArtistId)
      ),
    });

    if (!existingReport) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    const now = new Date().toISOString();
    const wallet = await db.query.artistWallets.findFirst({
      where: eq(artistWallets.artistId, targetArtistId),
    });

    if (wallet) {
      const updatedBalanceRub = (parseFloat(wallet.balanceRub) - parseFloat(existingReport.amountRub)).toFixed(2);
      const updatedBalanceUsd = (parseFloat(wallet.balanceUsd) - parseFloat(existingReport.amountUsd)).toFixed(2);

      await db.update(artistWallets)
        .set({
          balanceRub: updatedBalanceRub,
          balanceUsd: updatedBalanceUsd,
          updatedAt: now,
        })
        .where(eq(artistWallets.artistId, targetArtistId));
    }

    await db.delete(financialReports).where(eq(financialReports.id, targetReportId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting report:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
