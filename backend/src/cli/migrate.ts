import { readFileSync } from 'fs';
import { resolve } from 'path';
import { query } from '../db.js';

async function main() {
  const sql = readFileSync(resolve('migrations/001_init.sql'), 'utf8');
  await query(sql);
  console.log('DB migrated ✅');
  process.exit(0);
}
main().catch(err => { console.error(err); process.exit(1); });
