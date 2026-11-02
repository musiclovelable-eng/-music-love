import { NextResponse } from 'next/server';
import { createClient } from '@libsql/client';

export async function GET() {
  try {
    const client = createClient({
      url: process.env.TURSO_CONNECTION_URL!,
      authToken: process.env.TURSO_AUTH_TOKEN!,
    });

    await client.execute(`
      CREATE TABLE IF NOT EXISTS artist_wallets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        artist_id INTEGER NOT NULL UNIQUE REFERENCES artists(id),
        balance_rub TEXT NOT NULL DEFAULT '0',
        balance_usd TEXT NOT NULL DEFAULT '0',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `);

    await client.execute(`
      CREATE TABLE IF NOT EXISTS financial_reports (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        artist_id INTEGER NOT NULL REFERENCES artists(id),
        title TEXT NOT NULL,
        period_start TEXT NOT NULL,
        period_end TEXT NOT NULL,
        quarter INTEGER,
        year INTEGER NOT NULL,
        amount_rub TEXT NOT NULL DEFAULT '0',
        amount_usd TEXT NOT NULL DEFAULT '0',
        status TEXT NOT NULL DEFAULT 'pending',
        file_url TEXT,
        file_name TEXT,
        details TEXT,
        agreed_at TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `);

      await client.execute(`
        CREATE TABLE IF NOT EXISTS wallet_transactions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          artist_id INTEGER NOT NULL REFERENCES artists(id),
          type TEXT NOT NULL,
          amount_rub TEXT NOT NULL DEFAULT '0',
          amount_usd TEXT NOT NULL DEFAULT '0',
          description TEXT,
          report_id INTEGER REFERENCES financial_reports(id),
          status TEXT NOT NULL DEFAULT 'completed',
          created_at TEXT NOT NULL
        )
      `);

      await client.execute(`
        CREATE TABLE IF NOT EXISTS artist_payment_details (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          artist_id INTEGER NOT NULL UNIQUE REFERENCES artists(id),
          full_name TEXT NOT NULL,
          card_number TEXT NOT NULL,
          bank_name TEXT NOT NULL,
          kbe TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        )
      `);

      return NextResponse.json({ success: true, message: 'Wallet tables created' });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
