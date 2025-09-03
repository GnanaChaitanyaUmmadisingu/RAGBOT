import { Router } from 'express';
import { z } from 'zod';
import { retrieve } from '../retrieval/retrieve.js';
import { SYSTEM_PROMPT } from '../guardrails/prompt.js';
import { detectGreeting, getGreetingResponse, isGreeting } from '../guardrails/greetings.js';
import { openai } from '../openaiClient.js';
import { config } from '../config.js';

const router = Router();

const ChatReq = z.object({
  message: z.string().min(1),
  user: z.object({
    tenant_id: z.string().min(1),
    role: z.string().optional(),
    plan: z.string().optional()
  })
});
type ChatReq = z.infer<typeof ChatReq>;

router.post('/v1/chat', async (req, res) => {
  const parsed = ChatReq.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { message, user } = parsed.data;

  // Check for greetings first
  const greetingType = detectGreeting(message);
  if (greetingType !== 'none') {
    const greetingResponse = getGreetingResponse(greetingType, user.role);
    return res.json({
      answer: greetingResponse,
      refusal: false,
      citations: [],
      chunks_used: [],
      greeting: true
    });
  }

  const chunks = await retrieve(user.tenant_id, message);
  
  // Use more lenient threshold and try to find relevant content
  let kept = chunks.filter(c => c.sim >= config.threshold);
  
  // If no high-confidence matches, try with lower threshold
  if (kept.length === 0) {
    kept = chunks.filter(c => c.sim >= 0.5);
  }
  
  // If still no matches, try with even lower threshold for any relevant content
  if (kept.length === 0) {
    kept = chunks.filter(c => c.sim >= 0.3);
  }
  
  // If we have some content, even with low confidence, try to answer
  if (kept.length === 0) {
    return res.json({ answer: "I don't have that information.", refusal: true, citations: [], chunks_used: [] });
  }

  const provided = kept.map((c, i) => `[${i + 1}] ${c.content} — ${c.source ?? ''} ${c.section ?? ''}` ).join('\n\n');
  const userPrompt =
    `User: ${message}\n\nUser Profile (tone only): ${JSON.stringify({ role: user.role, plan: user.plan })}\n\nProvided Context:\n${provided}\n\nPlease respond in JSON format with an "answer" field.`;

  const completion = await openai.chat.completions.create({
    model: config.chatModel,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userPrompt }
    ],
    temperature: 0,
    response_format: { type: "json_object" }
  });

  const text = completion.choices[0].message.content || '{}';
  let parsedOut: any;
  try { parsedOut = JSON.parse(text); } catch { parsedOut = {}; }

  // Fallback if the model didn't return JSON
  const answer = parsedOut.answer || completion.choices[0].message.content || "I don't have that information.";
  const refusal = /I don't have that information\./i.test(answer);

  res.json({
    answer,
    refusal,
    citations: kept.map((_, i) => i + 1),
    chunks_used: kept.map(k => k.id)
  });
});

export default router;
