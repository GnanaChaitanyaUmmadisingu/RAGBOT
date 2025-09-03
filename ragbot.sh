#!/bin/bash

# RAG Chatbot Management Script
# Usage: ./ragbot.sh [command]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_header() {
    echo -e "${PURPLE}🚀 $1${NC}"
}

# Function to check if services are running
check_services() {
    if docker compose ps | grep -q "adhub_backend.*Up" && docker compose ps | grep -q "adhub_frontend.*Up"; then
        return 0
    else
        return 1
    fi
}

# Function to start services
start_services() {
    print_header "Starting RAG Chatbot Services"
    docker compose up -d --build
    print_info "Waiting for services to initialize..."
    sleep 15
    print_status "Services started successfully!"
}

# Function to stop services
stop_services() {
    print_header "Stopping RAG Chatbot Services"
    docker compose down
    print_status "Services stopped successfully!"
}

# Function to reseed database
reseed_database() {
    print_header "Reseeding Database and Ingesting Documents"
    
    if ! check_services; then
        print_warning "Services not running. Starting them first..."
        start_services
    fi
    
    print_info "Reseeding database with sample data..."
    docker compose exec backend node dist/cli/seed.js
    
    print_info "Ingesting sample documentation..."
    curl -s -X POST http://localhost:8080/v1/ingest \
      -H "Content-Type: application/json" \
      -d @docs/sample.json > /dev/null
    
    print_info "Ingesting additional documentation..."
    curl -s -X POST http://localhost:8080/v1/ingest \
      -H "Content-Type: application/json" \
      -d @docs/additional_docs.json > /dev/null
    
    print_status "Database reseeded successfully!"
}

# Function to test the chatbot
test_chatbot() {
    print_header "Testing RAG Chatbot"
    
    if ! check_services; then
        print_error "Services are not running. Start them first with: ./ragbot.sh start"
        exit 1
    fi
    
    print_info "Testing with sample query..."
    response=$(curl -s -X POST http://localhost:8080/v1/chat \
      -H "Content-Type: application/json" \
      -d '{"message": "How do I create a campaign?", "user": {"tenant_id": "adhub"}}')
    
    if echo "$response" | grep -q "refusal.*false"; then
        print_status "Chatbot is working correctly!"
        echo -e "${CYAN}Response:${NC} $(echo "$response" | jq -r '.answer' 2>/dev/null || echo "$response")"
    else
        print_warning "Chatbot response indicates no information found. You may need to reseed."
    fi
}

# Function to show status
show_status() {
    print_header "RAG Chatbot Status"
    docker compose ps
    echo ""
    if check_services; then
        print_status "All services are running!"
        print_info "Frontend: http://localhost:3000"
        print_info "Backend API: http://localhost:8080"
        print_info "Database: localhost:5433"
    else
        print_warning "Some services are not running."
    fi
}

# Function to show logs
show_logs() {
    print_header "RAG Chatbot Logs"
    docker compose logs -f
}

# Function to clean up
cleanup() {
    print_header "Cleaning Up RAG Chatbot"
    print_warning "This will stop all services and remove volumes. Are you sure? (y/N)"
    read -r response
    if [[ "$response" =~ ^[Yy]$ ]]; then
        docker compose down -v
        docker system prune -f
        print_status "Cleanup completed!"
    else
        print_info "Cleanup cancelled."
    fi
}

# Function to open the app
open_app() {
    if check_services; then
        print_info "Opening RAG Chatbot in browser..."
        open http://localhost:3000
    else
        print_error "Services are not running. Start them first with: ./ragbot.sh start"
        exit 1
    fi
}

# Function to show help
show_help() {
    echo -e "${PURPLE}RAG Chatbot Management Script${NC}"
    echo ""
    echo "Usage: ./ragbot.sh [command]"
    echo ""
    echo "Commands:"
    echo "  start     - Start all services"
    echo "  stop      - Stop all services"
    echo "  restart   - Restart all services"
    echo "  reseed    - Reseed database and ingest documents"
    echo "  test      - Test the chatbot with a sample query"
    echo "  status    - Show service status"
    echo "  logs      - Show service logs"
    echo "  open      - Open the chatbot in browser"
    echo "  clean     - Clean up all containers and volumes"
    echo "  help      - Show this help message"
    echo ""
    echo "Examples:"
    echo "  ./ragbot.sh start    # Start the chatbot"
    echo "  ./ragbot.sh reseed   # Reseed the database"
    echo "  ./ragbot.sh test     # Test the chatbot"
    echo "  ./ragbot.sh open     # Open in browser"
}

# Main script logic
case "${1:-help}" in
    start)
        start_services
        ;;
    stop)
        stop_services
        ;;
    restart)
        stop_services
        start_services
        ;;
    reseed)
        reseed_database
        ;;
    test)
        test_chatbot
        ;;
    status)
        show_status
        ;;
    logs)
        show_logs
        ;;
    open)
        open_app
        ;;
    clean)
        cleanup
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        print_error "Unknown command: $1"
        echo ""
        show_help
        exit 1
        ;;
esac
