CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS kb_docs (
  id BIGSERIAL PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  source TEXT,
  section TEXT,
  doc_type TEXT,
  version TEXT,
  content TEXT NOT NULL,
  embedding VECTOR(1536),
  tokens INT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS kb_embedding_idx
  ON kb_docs USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

CREATE INDEX IF NOT EXISTS kb_tenant_idx ON kb_docs(tenant_id);
