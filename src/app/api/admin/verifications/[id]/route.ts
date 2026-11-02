import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { createClient } from '@libsql/client';

function getClient() {
  return createClient({ url: process.env.TURSO_CONNECTION_URL!, authToken: process.env.TURSO_AUTH_TOKEN! });
}

function safeParse(str: string | null): any {
  if (!str) return null;
  try { return JSON.parse(str); } catch { return null; }
}

// GET — single verification detail
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSessionFromRequest(request);
  if (!session || !session.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const id = parseInt(params.id);
  const client = getClient();

  const res = await client.execute({
    sql: `SELECT v.*, a.name as artist_name, a.email as artist_email, a.artist_name as artist_pseudonym, a.avatar_url
          FROM verifications v LEFT JOIN artists a ON v.artist_id = a.id WHERE v.id = ?`,
    args: [id],
  });

  if (res.rows.length === 0) return NextResponse.json({ error: 'Не найдено' }, { status: 404 });

  const row = res.rows[0] as any;
  return NextResponse.json({
    verification: {
      ...row,
      passportData: safeParse(row.passport_data),
      addressData: safeParse(row.address_data),
      bankData: safeParse(row.bank_data),
    },
  });
}

// PATCH — approve / reject
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSessionFromRequest(request);
  if (!session || !session.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const id = parseInt(params.id);
  const { status, adminComment } = await request.json();
  const client = getClient();
  const now = new Date().toISOString();

  await client.execute({
    sql: `UPDATE verifications SET status = ?, admin_comment = ?, reviewed_at = ?, reviewed_by = ? WHERE id = ?`,
    args: [status, adminComment || null, now, session.email || 'Admin', id],
  });

  // If approved — update artist's contractSigned to true
  if (status === 'approved') {
    const ver = await client.execute({ sql: 'SELECT artist_id FROM verifications WHERE id = ?', args: [id] });
    const artistId = (ver.rows[0] as any)?.artist_id;
    if (artistId) {
      await client.execute({ sql: 'UPDATE artists SET contract_signed = 1 WHERE id = ?', args: [artistId] });
    }
  }

  return NextResponse.json({ success: true });
}
