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

// GET — list all verifications (with filters)
export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session || !session.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const statusFilter = searchParams.get('status');
  const client = getClient();

  let sql = `SELECT v.*, a.name as artist_name, a.email as artist_email, a.artist_name as artist_pseudonym, a.avatar_url
             FROM verifications v
             LEFT JOIN artists a ON v.artist_id = a.id`;
  const args: any[] = [];

  if (statusFilter && statusFilter !== 'all') {
    sql += ` WHERE v.status = ?`;
    args.push(statusFilter);
  }

  sql += ` ORDER BY v.submitted_at DESC NULLS LAST, v.updated_at DESC`;

  const res = await client.execute({ sql, args });
  const rows = res.rows.map((r: any) => ({
    ...r,
    passportData: safeParse(r.passport_data),
    addressData: safeParse(r.address_data),
    bankData: safeParse(r.bank_data),
  }));

  return NextResponse.json({ verifications: rows });
}
