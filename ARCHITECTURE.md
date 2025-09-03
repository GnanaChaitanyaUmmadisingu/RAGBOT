# RAGBOT2026 - Architectural Documentation

## Overview

RAGBOT2026 is a Retrieval-Augmented Generation (RAG) chatbot system designed for Adhub, providing intelligent assistance for campaign management, ad optimization, billing, and platform support. The system combines modern web technologies with AI capabilities to deliver contextual, accurate responses based on comprehensive documentation.

## System Architecture

### High-Level Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   Database      │
│   (React/Vite)  │◄──►│  (Node/Express) │◄──►│ (PostgreSQL +   │
│   Port: 3000    │    │   Port: 8080    │    │   pgvector)     │
│                 │    │                 │    │   Port: 5433    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Nginx         │    │   OpenAI API    │    │   Vector Store  │
│   (Static Files)│    │ (Embeddings +   │    │  (Embeddings)   │
│                 │    │   Chat Complet.)│    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Core Components

1. **Frontend (React + Vite)**
   - Modern React 18 with TypeScript
   - Material-UI (MUI) for components
   - Real-time chat interface with typing effects
   - Responsive design with dark theme

2. **Backend (Node.js + Express)**
   - RESTful API with OpenAPI specification
   - RAG pipeline for document retrieval
   - OpenAI integration for embeddings and chat
   - Multi-tenant support

3. **Database (PostgreSQL + pgvector)**
   - Vector similarity search with pgvector extension
   - Document storage with metadata
   - Optimized indexes for performance

4. **AI Services (OpenAI)**
   - Text embeddings (text-embedding-3-small)
   - Chat completions (gpt-4o-mini)
   - Semantic search capabilities

## Tech Stack

### Frontend Stack
- **React 18.3.1** - UI framework
- **TypeScript 5.5.4** - Type safety
- **Vite 5.2.0** - Build tool and dev server
- **Material-UI 5.15.0** - Component library
- **Emotion** - CSS-in-JS styling

### Backend Stack
- **Node.js** - Runtime environment
- **Express 4.19.2** - Web framework
- **TypeScript 5.5.4** - Type safety
- **Zod 3.23.8** - Schema validation
- **CORS 2.8.5** - Cross-origin resource sharing

### Database Stack
- **PostgreSQL 16** - Primary database
- **pgvector** - Vector similarity search
- **Connection pooling** - Performance optimization

### AI/ML Stack
- **OpenAI API 4.52.0** - AI services
- **text-embedding-3-small** - Text embeddings
- **gpt-4o-mini** - Chat completions

### DevOps Stack
- **Docker & Docker Compose** - Containerization
- **Nginx** - Reverse proxy and static file serving
- **Bash scripts** - Management automation

## Data Flow

### 1. Document Ingestion Flow

```
Document Input → Chunking → Embedding → Vector Storage
     │              │           │            │
     ▼              ▼           ▼            ▼
JSON Format → 1500 char → OpenAI API → PostgreSQL
             chunks      embeddings   with pgvector
```

**Process:**
1. Documents received via `/v1/ingest` endpoint
2. Content chunked into ~1500 character segments
3. Each chunk embedded using OpenAI's embedding model
4. Vectors stored in PostgreSQL with metadata
5. Indexes created for efficient similarity search

### 2. Query Processing Flow

```
User Query → Query Expansion → Embedding → Vector Search → Context Retrieval → LLM Response
     │             │              │            │              │                │
     ▼             ▼              ▼            ▼              ▼                ▼
Chat Input → Synonyms + → OpenAI API → pgvector → Top-K → GPT-4o-mini
           Variations   embeddings   similarity  chunks   with context
```

**Process:**
1. User query received via `/v1/chat` endpoint
2. Query expanded with synonyms and variations
3. Query embedded using OpenAI's embedding model
4. Vector similarity search against knowledge base
5. Top-K most relevant chunks retrieved
6. Context provided to LLM for response generation
7. Response returned with citations and metadata

### 3. Real-time Chat Flow

```
Frontend → Backend API → RAG Pipeline → OpenAI → Response → Frontend
    │           │            │            │         │          │
    ▼           ▼            ▼            ▼         ▼          ▼
User Input → Express → Retrieve + → GPT-4o-mini → JSON → Typing Effect
           Routes    Embed        Chat API      Response   Display
```

## Folder Structure

```
RAGBOT2026/
├── backend/                    # Backend application
│   ├── src/
│   │   ├── cli/               # Command-line utilities
│   │   │   ├── migrate.ts     # Database migrations
│   │   │   └── seed.ts        # Database seeding
│   │   ├── guardrails/        # AI safety and prompts
│   │   │   ├── greetings.ts   # Greeting detection
│   │   │   └── prompt.ts      # System prompts
│   │   ├── retrieval/         # RAG components
│   │   │   ├── embed.ts       # Embedding utilities
│   │   │   └── retrieve.ts    # Vector retrieval
│   │   ├── routes/            # API endpoints
│   │   │   ├── chat.ts        # Chat endpoint
│   │   │   └── ingest.ts      # Document ingestion
│   │   ├── config.ts          # Configuration
│   │   ├── db.ts              # Database connection
│   │   ├── index.ts           # Application entry point
│   │   └── openaiClient.ts    # OpenAI client
│   ├── migrations/            # Database schema
│   │   └── 001_init.sql       # Initial schema
│   ├── Dockerfile             # Backend container
│   ├── openapi.yaml           # API specification
│   ├── package.json           # Backend dependencies
│   └── tsconfig.json          # TypeScript config
├── frontend/                   # Frontend application
│   ├── src/
│   │   ├── App.tsx            # Main application component
│   │   └── main.tsx           # Application entry point
│   ├── Dockerfile             # Frontend container
│   ├── index.html             # HTML template
│   ├── nginx.conf             # Nginx configuration
│   ├── package.json           # Frontend dependencies
│   └── vite.config.ts         # Vite configuration
├── docs/                       # Documentation data
│   ├── sample.json            # Sample documentation
│   └── additional_docs.json   # Extended documentation
├── docker-compose.yml          # Container orchestration
├── package.json                # Root package configuration
├── ragbot.sh                   # Management script
├── reseed.sh                   # Database reseeding script
└── README.md                   # Project documentation
```

## Dependencies

### Root Dependencies
```json
{
  "scripts": {
    "start": "docker compose up -d --build",
    "stop": "docker compose down",
    "restart": "docker compose restart",
    "reseed": "./reseed.sh",
    "test": "curl -X POST http://localhost:8080/v1/chat...",
    "status": "docker compose ps",
    "clean": "docker compose down -v && docker system prune -f"
  }
}
```

### Backend Dependencies
```json
{
  "dependencies": {
    "cors": "^2.8.5",           // CORS middleware
    "dotenv": "^16.4.5",        // Environment variables
    "express": "^4.19.2",       // Web framework
    "openai": "^4.52.0",        // OpenAI API client
    "pg": "^8.11.5",            // PostgreSQL client
    "zod": "^3.23.8"            // Schema validation
  },
  "devDependencies": {
    "nodemon": "^3.1.0",        // Development server
    "ts-node": "^10.9.2",       // TypeScript execution
    "typescript": "^5.5.4"      // TypeScript compiler
  }
}
```

### Frontend Dependencies
```json
{
  "dependencies": {
    "react": "^18.3.1",                    // UI framework
    "react-dom": "^18.3.1",                // React DOM
    "@mui/material": "^5.15.0",            // Material-UI components
    "@mui/icons-material": "^5.15.0",      // Material-UI icons
    "@emotion/react": "^11.11.1",          // CSS-in-JS
    "@emotion/styled": "^11.11.0"          // Styled components
  },
  "devDependencies": {
    "@types/react": "^18.2.66",            // React types
    "@types/react-dom": "^18.2.22",        // React DOM types
    "@vitejs/plugin-react": "^4.2.1",      // Vite React plugin
    "typescript": "^5.5.4",                // TypeScript
    "vite": "^5.2.0"                       // Build tool
  }
}
```

## Database Schema

### Knowledge Base Documents Table
```sql
CREATE TABLE kb_docs (
  id BIGSERIAL PRIMARY KEY,
  tenant_id TEXT NOT NULL,           -- Multi-tenant isolation
  source TEXT,                       -- Document source
  section TEXT,                      -- Document section
  doc_type TEXT,                     -- Document type
  version TEXT,                      -- Document version
  content TEXT NOT NULL,             -- Document content
  embedding VECTOR(1536),            -- OpenAI embedding vector
  tokens INT,                        -- Token count
  updated_at TIMESTAMPTZ DEFAULT now() -- Last updated
);

-- Vector similarity index
CREATE INDEX kb_embedding_idx
  ON kb_docs USING ivfflat (embedding vector_cosine_ops) 
  WITH (lists = 100);

-- Tenant isolation index
CREATE INDEX kb_tenant_idx ON kb_docs(tenant_id);
```

## API Endpoints

### Chat Endpoint
```http
POST /v1/chat
Content-Type: application/json

{
  "message": "How do I create a campaign?",
  "user": {
    "tenant_id": "adhub",
    "role": "admin",
    "plan": "premium"
  }
}
```

**Response:**
```json
{
  "answer": "To create a campaign...",
  "refusal": false,
  "citations": [1, 2],
  "chunks_used": ["123", "456"]
}
```

### Ingest Endpoint
```http
POST /v1/ingest
Content-Type: application/json

{
  "docs": [
    {
      "tenant_id": "adhub",
      "source": "user_guide",
      "section": "campaigns",
      "doc_type": "guide",
      "version": "1.0",
      "content": "Campaign creation guide..."
    }
  ]
}
```

**Response:**
```json
{
  "ok": true,
  "inserted": 1
}
```

## Configuration

### Environment Variables
```bash
# OpenAI Configuration
OPENAI_API_KEY=sk-REPLACE_ME
OPENAI_CHAT_MODEL=gpt-4o-mini
OPENAI_EMBED_MODEL=text-embedding-3-small

# Database Configuration
DATABASE_URL=postgresql://postgres:postgres@db:5432/adhub

# RAG Configuration
RAG_TOP_K=5                    # Number of chunks to retrieve
RAG_THRESHOLD=0.78             # Similarity threshold

# Application Configuration
PORT=8080                      # Backend port
NODE_ENV=production            # Environment
```

### Docker Configuration
```yaml
services:
  db:
    image: pgvector/pgvector:pg16
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: adhub
    ports:
      - "5433:5432"
    volumes:
      - db_data:/var/lib/postgresql/data

  backend:
    build: ./backend
    environment:
      NODE_ENV: production
      PORT: 8080
      OPENAI_API_KEY: ${OPENAI_API_KEY}
      DATABASE_URL: postgresql://postgres:postgres@db:5432/adhub
    depends_on:
      - db
    ports:
      - "8080:8080"

  frontend:
    build: ./frontend
    depends_on:
      - backend
    ports:
      - "3000:80"
```

## Security Considerations

### API Security
- **Input Validation**: Zod schemas validate all inputs
- **CORS**: Configured for cross-origin requests
- **Rate Limiting**: Consider implementing for production
- **Authentication**: Multi-tenant support with tenant_id

### Data Security
- **Vector Isolation**: Tenant-based data separation
- **API Key Management**: Environment variable storage
- **Database Security**: Connection pooling and prepared statements

### AI Safety
- **Guardrails**: Greeting detection and response system
- **Refusal Handling**: Explicit refusal for unknown information
- **Context Limitation**: Responses grounded in provided documentation only

## Performance Optimizations

### Database Optimizations
- **Vector Indexes**: ivfflat index for similarity search
- **Connection Pooling**: PostgreSQL connection management
- **Query Optimization**: Efficient vector similarity queries

### Retrieval Optimizations
- **Query Expansion**: Synonym and variation generation
- **Hybrid Search**: Vector + keyword matching
- **Chunking Strategy**: 1500-character optimal chunks

### Frontend Optimizations
- **Typing Effects**: Progressive text display
- **Lazy Loading**: Component-based loading
- **Caching**: Static asset optimization

## Deployment

### Development
```bash
# Start all services
./ragbot.sh start

# Reseed database
./ragbot.sh reseed

# Test chatbot
./ragbot.sh test

# Open in browser
./ragbot.sh open
```

### Production Considerations
- **Environment Variables**: Secure API key management
- **Database Backups**: Regular backup strategy
- **Monitoring**: Health checks and logging
- **Scaling**: Horizontal scaling with load balancers
- **SSL/TLS**: HTTPS termination
- **Container Registry**: Private image storage

## Monitoring and Observability

### Health Checks
- **Backend**: `/healthz` endpoint
- **Database**: Connection status monitoring
- **OpenAI**: API response monitoring

### Logging
- **Application Logs**: Structured logging
- **Error Tracking**: Exception monitoring
- **Performance Metrics**: Response time tracking

### Metrics
- **Query Performance**: Vector search latency
- **API Usage**: Request/response metrics
- **Database Performance**: Query execution times

## Future Enhancements

### Technical Improvements
- **Caching Layer**: Redis for query caching
- **Message Queues**: Async processing
- **Microservices**: Service decomposition
- **GraphQL**: Alternative API layer

### AI Enhancements
- **Fine-tuning**: Custom model training
- **Multi-modal**: Image and document support
- **Conversation Memory**: Context persistence
- **Personalization**: User-specific responses

### Platform Features
- **Analytics Dashboard**: Usage insights
- **Admin Panel**: Content management
- **API Documentation**: Interactive docs
- **Webhook Support**: Event notifications

---

*This documentation provides a comprehensive overview of the RAGBOT2026 architecture. For specific implementation details, refer to the source code and API documentation.*
