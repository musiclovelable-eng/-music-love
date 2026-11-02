
import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from '@/db/schema';

// Singleton pattern — prevents connection accumulation on each request in Next.js
const globalForDb = globalThis as unknown as {
  _tursoClient: ReturnType<typeof createClient> | undefined;
  _drizzleDb: ReturnType<typeof drizzle> | undefined;
};

function getClient() {
  if (!globalForDb._tursoClient) {
    globalForDb._tursoClient = createClient({
      url: process.env.TURSO_CONNECTION_URL!,
      authToken: process.env.TURSO_AUTH_TOKEN!,
    });
  }
  return globalForDb._tursoClient;
}

function getDb() {
  if (!globalForDb._drizzleDb) {
    globalForDb._drizzleDb = drizzle(getClient(), { schema });
  }
  return globalForDb._drizzleDb;
}

export const db = getDb();

export type Database = typeof db;
