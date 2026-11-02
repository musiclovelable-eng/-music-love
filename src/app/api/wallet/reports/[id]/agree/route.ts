import { NextResponse } from "next/server";
import { db } from "@/db";
import { artists, financialReports, artistPaymentDetails } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getSession } from "@/lib/auth";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const body = await request.json().catch(() => ({}));
    const { fullName, cardNumber, bankName, kbe } = body;

    if (!fullName || !cardNumber || !bankName) {
      return NextResponse.json(
        { error: "Необходимо заполнить ФИО, номер карты и название банка" },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    const existingDetails = await db.query.artistPaymentDetails.findFirst({
      where: eq(artistPaymentDetails.artistId, artist.id),
    });

    if (existingDetails) {
      await db
        .update(artistPaymentDetails)
        .set({
          fullName,
          cardNumber,
          bankName,
          kbe: kbe || null,
          updatedAt: now,
        })
        .where(eq(artistPaymentDetails.artistId, artist.id));
    } else {
      await db.insert(artistPaymentDetails).values({
        artistId: artist.id,
        fullName,
        cardNumber,
        bankName,
        kbe: kbe || null,
        createdAt: now,
        updatedAt: now,
      });
    }

    const { id } = await params;
    const reportId = parseInt(id);

    const report = await db.query.financialReports.findFirst({
      where: and(
        eq(financialReports.id, reportId),
        eq(financialReports.artistId, artist.id)
      ),
    });

    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    if (report.status === "agreed") {
      return NextResponse.json({ error: "Report already agreed" }, { status: 400 });
    }

    await db.update(financialReports)
      .set({
        status: "agreed",
        agreedAt: now,
        updatedAt: now,
      })
      .where(eq(financialReports.id, reportId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error agreeing report:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
