import { query, toVectorLiteral } from '../db.js';
import { embedTexts } from './embed.js';
import { config } from '../config.js';

export type RetrievedChunk = {
  content: string;
  source: string | null;
  section: string | null;
  sim: number;
  id: string;
};

// Query expansion and normalization
function expandQuery(query: string): string[] {
  const normalized = query.toLowerCase().trim();
  
  // Create multiple query variations for better matching
  const variations = [normalized];
  
  // Add synonyms and related terms
  const synonyms: Record<string, string[]> = {
    'budget': ['cost', 'spend', 'money', 'price', 'fee', 'allocation'],
    'campaign': ['ad campaign', 'advertising campaign', 'marketing campaign'],
    'create': ['make', 'build', 'set up', 'establish', 'start', 'launch'],
    'login': ['sign in', 'access', 'enter', 'authenticate'],
    'portal': ['platform', 'dashboard', 'interface', 'system'],
    'requirements': ['specs', 'specifications', 'needs', 'criteria', 'rules'],
    'image': ['picture', 'photo', 'graphic', 'visual', 'media'],
    'video': ['clip', 'movie', 'media', 'content'],
    'minimum': ['min', 'least', 'smallest', 'lowest'],
    'maximum': ['max', 'most', 'largest', 'highest'],
    'report': ['reporting', 'analytics', 'metrics', 'data', 'stats'],
    'optimize': ['improve', 'enhance', 'boost', 'optimization'],
    'audience': ['target', 'users', 'customers', 'demographics'],
    'ad': ['advertisement', 'advertising', 'promotion', 'marketing']
  };
  
  // Generate expanded queries
  let expandedQuery = normalized;
  for (const [key, values] of Object.entries(synonyms)) {
    if (normalized.includes(key)) {
      for (const synonym of values) {
        expandedQuery += ` ${synonym}`;
      }
    }
  }
  
  variations.push(expandedQuery);
  
  // Add query without common words for broader matching
  const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'how', 'what', 'where', 'when', 'why'];
  const words = normalized.split(' ').filter(word => !stopWords.includes(word));
  if (words.length > 0) {
    variations.push(words.join(' '));
  }
  
  return variations;
}

export async function retrieve(tenantId: string, q: string) {
  // Expand the query for better matching
  const queryVariations = expandQuery(q);
  
  // Get embeddings for all query variations
  const allEmbeddings = await embedTexts(queryVariations);
  
  // Use the best embedding (first one) for retrieval
  const qVec = allEmbeddings[0];
  const qLit = toVectorLiteral(qVec);
  
  // Increase topK and use lower threshold for more results
  const sql = `
    SELECT id::text, content, source, section,
           (1 - (embedding <=> $1::vector)) AS sim
    FROM kb_docs
    WHERE tenant_id = $2
    ORDER BY embedding <=> $1::vector
    LIMIT $3
  `;
  
  // Use more results and lower threshold
  const { rows } = await query<RetrievedChunk>(sql, [qLit, tenantId, Math.max(config.topK * 2, 10)]);
  
  // Also try keyword matching for better recall
  const keywordMatches = await query<RetrievedChunk>(`
    SELECT id::text, content, source, section, 0.5 as sim
    FROM kb_docs
    WHERE tenant_id = $1
    AND (
      LOWER(content) LIKE '%' || LOWER($2) || '%'
      OR LOWER(source) LIKE '%' || LOWER($2) || '%'
      OR LOWER(section) LIKE '%' || LOWER($2) || '%'
    )
    LIMIT 5
  `, [tenantId, q]);
  
  // Combine and deduplicate results
  const allResults = [...rows, ...keywordMatches.rows];
  const uniqueResults = new Map();
  
  for (const result of allResults) {
    if (!uniqueResults.has(result.id)) {
      uniqueResults.set(result.id, result);
    } else {
      // Keep the higher similarity score
      const existing = uniqueResults.get(result.id);
      if (result.sim > existing.sim) {
        uniqueResults.set(result.id, result);
      }
    }
  }
  
  // Sort by similarity and return top results
  return Array.from(uniqueResults.values())
    .sort((a, b) => b.sim - a.sim)
    .slice(0, config.topK);
}
