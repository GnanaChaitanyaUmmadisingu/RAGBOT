import express from 'express';
import cors from 'cors';
import { config } from './config.js';
import { query } from './db.js';
import chatRoute from './routes/chat.js';
import ingestRoute from './routes/ingest.js';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));

// migrate on start
(async () => {
  const sql = readFileSync(resolve('migrations/001_init.sql'), 'utf8');
  await query(sql);
  console.log('DB migrated at startup ✅');
})().catch(console.error);

// health
app.get('/healthz', (_req, res) => res.json({ ok: true }));

// OpenAPI spec (static)
app.get('/openapi.yaml', (_req, res) => {
  const y = readFileSync(resolve('openapi.yaml'), 'utf8');
  res.type('text/yaml').send(y);
});

app.use(chatRoute);
app.use(ingestRoute);

app.listen(config.port, () => {
  console.log(`Backend listening on :${config.port}`);
});
