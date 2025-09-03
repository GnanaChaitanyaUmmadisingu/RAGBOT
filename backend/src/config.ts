import 'dotenv/config';

export const config = {
  port: Number(process.env.PORT ?? 8080),
  dbUrl: process.env.DATABASE_URL!,
  openaiKey: process.env.OPENAI_API_KEY!,
  chatModel: process.env.OPENAI_CHAT_MODEL ?? 'gpt-4o-mini', // or 'gpt-5-nano' if available
  embedModel: process.env.OPENAI_EMBED_MODEL ?? 'text-embedding-3-small',
  topK: Number(process.env.RAG_TOP_K ?? 8),
  threshold: Number(process.env.RAG_THRESHOLD ?? 0.65),
};
if (!config.dbUrl) throw new Error('DATABASE_URL is required');
if (!config.openaiKey) throw new Error('OPENAI_API_KEY is required');
