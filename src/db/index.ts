import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from '@/db/schema';

const globalForDb = globalThis as unknown as {
  _pgPool: Pool | undefined;
  _drizzleDb: ReturnType<typeof drizzle> | undefined;
};

function getPool() {
  if (!globalForDb._pgPool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) throw new Error('DATABASE_URL is not configured');

    globalForDb._pgPool = new Pool({
      connectionString,
      max: 5,
      connectionTimeoutMillis: 10000,
      idleTimeoutMillis: 30000,
      ssl: process.env.DATABASE_SSL === 'disable'
        ? undefined
        : { rejectUnauthorized: false },
    });
  }
  return globalForDb._pgPool;
}

function getDb() {
  if (!globalForDb._drizzleDb) {
    globalForDb._drizzleDb = drizzle(getPool(), { schema });
  }
  return globalForDb._drizzleDb;
}

export const db = getDb();
export type Database = typeof db;
