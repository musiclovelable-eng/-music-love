import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { createClient } from '@libsql/client';

function getClient() {
  return createClient({ url: process.env.TURSO_CONNECTION_URL!, authToken: process.env.TURSO_AUTH_TOKEN! });
}

// POST — submit verification for review
export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const client = getClient();
  const now = new Date().toISOString();

  const existing = await client.execute({
    sql: 'SELECT id, status FROM verifications WHERE artist_id = ? ORDER BY id DESC LIMIT 1',
    args: [session.userId],
  });

  const row = existing.rows[0] as any;
  if (!row) return NextResponse.json({ error: 'Черновик не найден' }, { status: 404 });
  if (row.status === 'submitted') return NextResponse.json({ error: 'Уже отправлено' }, { status: 400 });

  await client.execute({
    sql: `UPDATE verifications SET
      role = ?, contract_type = ?, country = ?, step = 4,
      passport_data = ?, address_data = ?, bank_data = ?,
      npd_confirmed = ?, final_confirmed = ?,
      status = 'submitted', submitted_at = ?, updated_at = ?
      WHERE id = ?`,
    args: [
      body.role, body.contractType || null, body.country || null,
      body.passportData ? JSON.stringify(body.passportData) : null,
      body.addressData ? JSON.stringify(body.addressData) : null,
      body.bankData ? JSON.stringify(body.bankData) : null,
      body.npdConfirmed ? 1 : 0, body.finalConfirmed ? 1 : 0,
      now, now, row.id,
    ],
  });

  return NextResponse.json({ success: true });
}
