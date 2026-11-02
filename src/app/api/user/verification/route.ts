import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { createClient } from '@libsql/client';

function getClient() {
  return createClient({
    url: process.env.TURSO_CONNECTION_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN!,
  });
}

// GET — load current verification draft
export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const client = getClient();
  const res = await client.execute({
    sql: 'SELECT * FROM verifications WHERE artist_id = ? ORDER BY id DESC LIMIT 1',
    args: [session.userId],
  });

  if (res.rows.length === 0) {
    return NextResponse.json({ verification: null });
  }

  const row = res.rows[0] as any;
  return NextResponse.json({
    verification: {
      ...row,
      passportData: row.passport_data ? safeParse(row.passport_data) : null,
      addressData: row.address_data ? safeParse(row.address_data) : null,
      bankData: row.bank_data ? safeParse(row.bank_data) : null,
    },
  });
}

// POST — create or update draft
export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const client = getClient();
  const now = new Date().toISOString();

  // Check existing draft
  const existing = await client.execute({
    sql: 'SELECT id, status FROM verifications WHERE artist_id = ? ORDER BY id DESC LIMIT 1',
    args: [session.userId],
  });

  const existingRow = existing.rows[0] as any;

  // If already submitted, don't allow editing
  if (existingRow && existingRow.status === 'submitted') {
    return NextResponse.json({ error: 'Верификация уже отправлена' }, { status: 400 });
  }

  if (existingRow) {
    // Update existing draft
    await client.execute({
      sql: `UPDATE verifications SET
        role = ?, contract_type = ?, country = ?, step = ?,
        passport_data = ?, address_data = ?, bank_data = ?,
        npd_confirmed = ?, updated_at = ?
        WHERE id = ?`,
      args: [
        body.role || 'artist',
        body.contractType || null,
        body.country || null,
        body.step || 0,
        body.passportData ? JSON.stringify(body.passportData) : null,
        body.addressData ? JSON.stringify(body.addressData) : null,
        body.bankData ? JSON.stringify(body.bankData) : null,
        body.npdConfirmed ? 1 : 0,
        now,
        existingRow.id,
      ],
    });
    return NextResponse.json({ success: true, id: existingRow.id });
  }

  // Create new draft
  const res = await client.execute({
    sql: `INSERT INTO verifications
      (artist_id, role, contract_type, country, step, passport_data, address_data, bank_data, npd_confirmed, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft', ?, ?)`,
    args: [
      session.userId,
      body.role || 'artist',
      body.contractType || null,
      body.country || null,
      body.step || 0,
      body.passportData ? JSON.stringify(body.passportData) : null,
      body.addressData ? JSON.stringify(body.addressData) : null,
      body.bankData ? JSON.stringify(body.bankData) : null,
      body.npdConfirmed ? 1 : 0,
      now, now,
    ],
  });

  return NextResponse.json({ success: true, id: Number(res.lastInsertRowid) });
}

function safeParse(str: string): any {
  try { return JSON.parse(str); } catch { return null; }
}
