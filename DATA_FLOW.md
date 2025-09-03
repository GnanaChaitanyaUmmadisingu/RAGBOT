# RAGBOT2026 - Data Flow Documentation

## Overview

This document details the data flow patterns, system interactions, and processing pipelines within the RAGBOT2026 system. It covers document ingestion, query processing, and real-time chat interactions.

## System Data Flow Architecture

### 1. Document Ingestion Pipeline

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   JSON Input    │───►│   Chunking      │───►│   Embedding     │
│   (docs array)  │    │   (~1500 chars) │    │   (OpenAI API)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Validation    │    │   Metadata      │    │   Vector        │
│   (Zod Schema)  │    │   Extraction    │    │   Generation    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Error         │    │   Content       │    │   Database      │
│   Handling      │    │   Processing    │    │   Storage       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

#### Detailed Ingestion Flow

1. **Input Validation**
   ```typescript
   const IngestReq = z.object({ 
     docs: z.array(Doc).min(1) 
   });
   ```

2. **Content Chunking**
   ```typescript
   const toChunks = (s: string) => {
     const size = 1500;
     const parts = [];
     for (let i = 0; i < s.length; i += size) 
       parts.push(s.slice(i, i + size));
     return parts;
   };
   ```

3. **Embedding Generation**
   ```typescript
   const embeddings = await embedTexts(rows.map(r => r.content));
   ```

4. **Database Storage**
   ```sql
   INSERT INTO kb_docs (tenant_id, source, section, doc_type, version, content, embedding, tokens)
   VALUES ($1,$2,$3,$4,$5,$6,$7::vector,$8)
   ```

### 2. Query Processing Pipeline

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   User Query    │───►│   Query         │───►│   Embedding     │
│   (text input)  │    │   Expansion     │    │   Generation    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Greeting      │    │   Synonyms &    │    │   OpenAI API    │
│   Detection     │    │   Variations    │    │   Call          │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Direct        │    │   Enhanced      │    │   Vector        │
│   Response      │    │   Query Set     │    │   Search        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

#### Query Expansion Process

```typescript
function expandQuery(query: string): string[] {
  const normalized = query.toLowerCase().trim();
  const variations = [normalized];
  
  // Add synonyms and related terms
  const synonyms: Record<string, string[]> = {
    'budget': ['cost', 'spend', 'money', 'price', 'fee', 'allocation'],
    'campaign': ['ad campaign', 'advertising campaign', 'marketing campaign'],
    'create': ['make', 'build', 'set up', 'establish', 'start', 'launch'],
    // ... more synonyms
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
  return variations;
}
```

### 3. Vector Retrieval Process

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Query Vector  │───►│   Vector        │───►│   Similarity    │
│   (1536 dims)   │    │   Search        │    │   Scoring       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   pgvector      │    │   Cosine        │    │   Threshold     │
│   Index         │    │   Distance      │    │   Filtering     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Top-K         │    │   Keyword       │    │   Result        │
│   Selection     │    │   Matching      │    │   Deduplication │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

#### Vector Search SQL

```sql
SELECT id::text, content, source, section,
       (1 - (embedding <=> $1::vector)) AS sim
FROM kb_docs
WHERE tenant_id = $2
ORDER BY embedding <=> $1::vector
LIMIT $3
```

#### Hybrid Search Implementation

```typescript
// Vector similarity search
const { rows } = await query<RetrievedChunk>(sql, [qLit, tenantId, Math.max(config.topK * 2, 10)]);

// Keyword matching for better recall
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
```

### 4. LLM Response Generation

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Retrieved     │───►│   Context       │───►│   System        │
│   Chunks        │    │   Assembly      │    │   Prompt        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Similarity    │    │   User Profile  │    │   OpenAI        │
│   Filtering     │    │   Integration   │    │   API Call      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Threshold     │    │   JSON          │    │   Response      │
│   Application   │    │   Formatting    │    │   Processing    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

#### Context Assembly

```typescript
const provided = kept.map((c, i) => 
  `[${i + 1}] ${c.content} — ${c.source ?? ''} ${c.section ?? ''}`
).join('\n\n');

const userPrompt = `User: ${message}\n\nUser Profile (tone only): ${JSON.stringify({ role: user.role, plan: user.plan })}\n\nProvided Context:\n${provided}\n\nPlease respond in JSON format with an "answer" field.`;
```

#### LLM Configuration

```typescript
const completion = await openai.chat.completions.create({
  model: config.chatModel,
  messages: [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: userPrompt }
  ],
  temperature: 0,
  response_format: { type: "json_object" }
});
```

### 5. Real-time Chat Flow

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │───►│   Backend       │───►│   RAG Pipeline  │
│   (React)       │    │   (Express)     │    │   Processing    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   User Input    │    │   Request       │    │   Vector        │
│   Validation    │    │   Validation    │    │   Retrieval     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Typing        │    │   Greeting      │    │   Context       │
│   Effect        │    │   Detection     │    │   Assembly      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Response      │    │   Direct        │    │   LLM           │
│   Display       │    │   Response      │    │   Generation    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

#### Frontend State Management

```typescript
type Msg = { 
  role: 'user'|'bot'; 
  text: string; 
  timestamp?: Date; 
  isTyping?: boolean; 
  greeting?: boolean 
};

const [messages, setMessages] = useState<Msg[]>([]);
const [busy, setBusy] = useState(false);
const [typingMessageId, setTypingMessageId] = useState<number | null>(null);
```

#### Typing Effect Implementation

```typescript
const TypingEffect = ({ text, onComplete }: { text: string; onComplete: () => void }) => {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, 30); // 30ms per character
      return () => clearTimeout(timeout);
    } else {
      onComplete();
    }
  }, [currentIndex, text, onComplete]);
};
```

## Data Models

### Document Model

```typescript
interface Document {
  tenant_id: string;        // Multi-tenant isolation
  source?: string;          // Document source
  section?: string;         // Document section
  doc_type?: string;        // Document type
  version?: string;         // Document version
  content: string;          // Document content
}
```

### Retrieved Chunk Model

```typescript
interface RetrievedChunk {
  content: string;          // Chunk content
  source: string | null;    // Source document
  section: string | null;   // Section within document
  sim: number;              // Similarity score (0-1)
  id: string;               // Unique identifier
}
```

### Chat Request Model

```typescript
interface ChatRequest {
  message: string;          // User message
  user: {
    tenant_id: string;      // Tenant identifier
    role?: string;          // User role
    plan?: string;          // User plan
  };
}
```

### Chat Response Model

```typescript
interface ChatResponse {
  answer: string;           // Generated response
  refusal: boolean;         // Whether response was refused
  citations: number[];      // Citation indices
  chunks_used: string[];    // Chunk IDs used
  greeting?: boolean;       // Whether this is a greeting response
}
```

## Performance Characteristics

### Latency Breakdown

1. **Query Processing**: ~50-100ms
   - Query expansion: ~5ms
   - Embedding generation: ~200-500ms (OpenAI API)
   - Vector search: ~10-50ms
   - Context assembly: ~5ms

2. **LLM Generation**: ~1-3 seconds
   - API call to OpenAI: ~1-3s
   - Response parsing: ~5ms

3. **Frontend Rendering**: ~100-200ms
   - Typing effect: ~30ms per character
   - UI updates: ~16ms (60fps)

### Throughput Metrics

- **Concurrent Users**: 100+ (limited by OpenAI API)
- **Queries per Second**: 10-20 (with rate limiting)
- **Document Ingestion**: 100+ docs/minute
- **Vector Search**: 1000+ queries/second

### Memory Usage

- **Backend**: ~100-200MB base + ~10MB per 1000 documents
- **Database**: ~1MB per 1000 document chunks
- **Frontend**: ~50-100MB (browser)

## Error Handling and Recovery

### Ingestion Errors

```typescript
try {
  const embeddings = await embedTexts(rows.map(r => r.content));
  // Process embeddings...
} catch (error) {
  console.error('Embedding generation failed:', error);
  return res.status(500).json({ error: 'Failed to generate embeddings' });
}
```

### Query Processing Errors

```typescript
try {
  const chunks = await retrieve(user.tenant_id, message);
  // Process chunks...
} catch (error) {
  console.error('Retrieval failed:', error);
  return res.json({ 
    answer: "I'm having trouble accessing the information right now. Please try again.", 
    refusal: true, 
    citations: [], 
    chunks_used: [] 
  });
}
```

### Fallback Strategies

1. **No Relevant Chunks**: Return "I don't have that information"
2. **Low Similarity**: Use lower threshold (0.5, then 0.3)
3. **API Failures**: Graceful degradation with error messages
4. **Network Issues**: Retry logic with exponential backoff

## Monitoring and Observability

### Key Metrics

1. **Query Performance**
   - Average response time
   - 95th percentile latency
   - Error rate

2. **Retrieval Quality**
   - Similarity score distribution
   - Chunk utilization rate
   - Refusal rate

3. **System Health**
   - Database connection status
   - OpenAI API health
   - Memory usage

### Logging Strategy

```typescript
// Request logging
console.log(`Chat request: ${message.substring(0, 100)}...`);

// Performance logging
console.log(`Retrieval took ${Date.now() - start}ms`);

// Error logging
console.error('Vector search failed:', error);
```

---

*This document provides detailed insights into the data flow patterns and system interactions within RAGBOT2026. For implementation details, refer to the source code and API documentation.*
