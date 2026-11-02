import { NextResponse } from "next/server";
import { db } from "@/db";
import { artists, artistPaymentDetails } from "@/db/schema";
import { eq } from "drizzle-orm";
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

    const paymentDetails = await db.query.artistPaymentDetails.findFirst({
      where: eq(artistPaymentDetails.artistId, artist.id),
    });

    return NextResponse.json({ paymentDetails });
  } catch (error) {
    console.error("Error fetching payment details:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
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

    const body = await request.json();
    const { fullName, cardNumber, bankName, kbe } = body;

    if (!fullName || !cardNumber || !bankName) {
      return NextResponse.json(
        { error: "ФИО, номер карты и название банка обязательны" },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    const existing = await db.query.artistPaymentDetails.findFirst({
      where: eq(artistPaymentDetails.artistId, artist.id),
    });

    if (existing) {
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

    const updated = await db.query.artistPaymentDetails.findFirst({
      where: eq(artistPaymentDetails.artistId, artist.id),
    });

    return NextResponse.json({ paymentDetails: updated });
  } catch (error) {
    console.error("Error saving payment details:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
