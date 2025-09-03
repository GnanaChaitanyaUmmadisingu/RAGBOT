import { query } from '../db.js';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import '../config.js'; // env
import { embedTexts } from '../retrieval/embed.js';
import { toVectorLiteral } from '../db.js';

async function main() {
  // ensure schema
  const sql = readFileSync(resolve('migrations/001_init.sql'), 'utf8');
  await query(sql);

  const tenant = 'adhub';
  const docs = [
    {
      tenant_id: tenant,
      source: 'Getting Started',
      section: 'Campaigns',
      doc_type: 'guide',
      version: 'v1',
      content:
`To add a new campaign, go to the Campaigns tab and click "New Campaign".
Fill in name, budget, and schedule. Click Save to create the campaign.`
    },
    {
      tenant_id: tenant,
      source: 'Permissions',
      section: 'Roles',
      doc_type: 'policy',
      version: 'v1',
      content:
`Only Admins and Managers can create campaigns. Editors can edit but not create.`
    }
  ];

  const chunks = docs; // already small
  const embs = await embedTexts(chunks.map(d => d.content));

  const insert = `
    INSERT INTO kb_docs (tenant_id, source, section, doc_type, version, content, embedding, tokens)
    VALUES ($1,$2,$3,$4,$5,$6,$7::vector,$8)
  `;
  for (let i = 0; i < chunks.length; i++) {
    const d = chunks[i];
    const v = toVectorLiteral(embs[i]);
    await query(insert, [d.tenant_id, d.source, d.section, d.doc_type, d.version, d.content, v, d.content.length]);
  }

  console.log('Seeded sample docs ✅');
  process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); });
