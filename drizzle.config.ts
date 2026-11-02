import { defineConfig } from 'drizzle-kit';
import type { Config } from 'drizzle-kit';

const dbConfig: Config = defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle-pg',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL || 'postgresql://placeholder:placeholder@localhost:5432/placeholder',
    ssl: process.env.DATABASE_SSL === 'disable'
      ? false
      : { rejectUnauthorized: false },
  },
});

export default dbConfig;
