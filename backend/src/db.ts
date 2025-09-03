import { Pool } from 'pg';
import { config } from './config.js';

export const pool = new Pool({ connectionString: config.dbUrl });

export async function query<T = any>(text: string, params?: any[]) {
  const client = await pool.connect();
  try {
    const res = await client.query<T>(text, params);
    return res;
  } finally {
    client.release();
  }
}

// helper to turn number[] into pgvector literal
export function toVectorLiteral(v: number[]) {
  return `[${v.join(',')}]`;
}
