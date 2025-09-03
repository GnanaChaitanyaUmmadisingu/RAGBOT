# Adhub RAG Chatbot (Frontend + Backend)

Stack:
- Frontend: React + Vite + TS (served via Nginx in Docker)
- Backend: Node + Express + TS
- DB: Postgres 16 + pgvector
- OpenAI: embeddings + chat
- OpenAPI: backend spec at /openapi.yaml

## Setup

1. Create a `.env` file in the root directory:
```bash
OPENAI_API_KEY=sk-REPLACE_ME
OPENAI_CHAT_MODEL=gpt-4o-mini
OPENAI_EMBED_MODEL=text-embedding-3-small
```

2. Replace `sk-REPLACE_ME` with your actual OpenAI API key

## Quick Start

### Option 1: Using Management Script (Recommended)
```bash
# Start everything and reseed
./ragbot.sh start
./ragbot.sh reseed

# Open the app
./ragbot.sh open
```

### Option 2: Using npm Scripts
```bash
# Start services
npm start

# Reseed database
npm run reseed

# Open app
npm run open
```

### Option 3: Manual Commands
```bash
# Build and start all services
docker compose up -d --build

# Wait for backend to be ready, then seed sample docs
docker compose exec backend node dist/cli/seed.js

# Open the app
open http://localhost:3000
```

## Management Commands

### Using the Management Script (`./ragbot.sh`)
```bash
./ragbot.sh start     # Start all services
./ragbot.sh stop      # Stop all services
./ragbot.sh restart   # Restart all services
./ragbot.sh reseed    # Reseed database and ingest documents
./ragbot.sh test      # Test the chatbot with a sample query
./ragbot.sh status    # Show service status
./ragbot.sh logs      # Show service logs
./ragbot.sh open      # Open the chatbot in browser
./ragbot.sh clean     # Clean up all containers and volumes
./ragbot.sh help      # Show help message
```

### Using npm Scripts
```bash
npm start             # Start all services
npm stop              # Stop all services
npm run restart       # Restart all services
npm run reseed        # Reseed database and ingest documents
npm run reseed:quick  # Quick reseed (no service checks)
npm test              # Test the chatbot
npm run status        # Show service status
npm run logs          # Show service logs
npm run open          # Open the chatbot in browser
npm run clean         # Clean up containers and volumes
```

## Test Queries

- "How do I add a new campaign?" → should answer with instructions
- "What's your office Wi-Fi password?" → should reply "I don't have that information."

## Bulk Ingest Your Own Docs

1. Edit `docs/sample.json` with your own documentation content
2. Ingest the documents via API:
```bash
curl -X POST http://localhost:8080/v1/ingest \
  -H "Content-Type: application/json" \
  -d @docs/sample.json
```

3. Additional comprehensive documentation is available in `docs/additional_docs.json`:
```bash
curl -X POST http://localhost:8080/v1/ingest \
  -H "Content-Type: application/json" \
  -d @docs/additional_docs.json
```
