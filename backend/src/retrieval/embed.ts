import { openai } from '../openaiClient.js';
import { config } from '../config.js';

export async function embedTexts(inputs: string[]) {
  const res = await openai.embeddings.create({
    model: config.embedModel,
    input: inputs
  });
  return res.data.map(d => d.embedding as number[]);
}
