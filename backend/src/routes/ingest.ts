import { Router } from 'express';
import { z } from 'zod';
import { query, toVectorLiteral } from '../db.js';
import { embedTexts } from '../retrieval/embed.js';

const router = Router();

const Doc = z.object({
  tenant_id: z.string().min(1),
  source: z.string().optional(),
  section: z.string().optional(),
  doc_type: z.string().optional(),
  version: z.string().optional(),
  content: z.string().min(1)
});
const IngestReq = z.object({ docs: z.array(Doc).min(1) });

router.post('/v1/ingest', async (req, res) => {
  const parsed = IngestReq.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { docs } = parsed.data;

  // naive chunking by ~1500 chars
  const toChunks = (s: string) => {
    const size = 1500;
    const parts = [];
    for (let i = 0; i < s.length; i += size) parts.push(s.slice(i, i + size));
    return parts;
  };

  const rows = docs.flatMap(d => toChunks(d.content).map(c => ({ ...d, content: c })));
  const embeddings = await embedTexts(rows.map(r => r.content));

  const insertSQL = `
    INSERT INTO kb_docs (tenant_id, source, section, doc_type, version, content, embedding, tokens)
    VALUES ($1,$2,$3,$4,$5,$6,$7::vector,$8)
  `;
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const vec = toVectorLiteral(embeddings[i]);
    await query(insertSQL, [r.tenant_id, r.source ?? null, r.section ?? null, r.doc_type ?? null, r.version ?? null, r.content, vec, r.content.length]);
  }

  res.json({ ok: true, inserted: rows.length });
});

export default router;
