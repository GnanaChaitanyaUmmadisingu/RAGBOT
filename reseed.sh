#!/bin/bash

# RAG Chatbot Reseed Script
# This script reseeds the database and ingests all documentation

echo "🔄 Starting RAG Chatbot Reseed Process..."

# Check if docker compose is running
if ! docker compose ps | grep -q "adhub_backend.*Up"; then
    echo "❌ Backend container is not running. Starting services..."
    docker compose up -d
    echo "⏳ Waiting for services to start..."
    sleep 10
fi

echo "🌱 Reseeding database with sample data..."
docker compose exec backend node dist/cli/seed.js

echo "📚 Ingesting sample documentation..."
curl -X POST http://localhost:8080/v1/ingest \
  -H "Content-Type: application/json" \
  -d @docs/sample.json

echo "📖 Ingesting additional documentation..."
curl -X POST http://localhost:8080/v1/ingest \
  -H "Content-Type: application/json" \
  -d @docs/additional_docs.json

echo "✅ Reseed complete! Your RAG chatbot is ready."
echo "🌐 Open http://localhost:3000 to test the chatbot"
echo ""
echo "🧪 Test queries:"
echo "  - 'How do I create a campaign?'"
echo "  - 'What are the minimum budget requirements?'"
echo "  - 'How do I log into the portal?'"
