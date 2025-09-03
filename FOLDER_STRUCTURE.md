# RAGBOT2026 - Folder Structure Documentation

## Overview

This document provides a detailed breakdown of the RAGBOT2026 project's folder structure, explaining the purpose and organization of each directory and file.

## Root Directory Structure

```
RAGBOT2026/
├── backend/                    # Backend Node.js application
├── frontend/                   # Frontend React application
├── docs/                       # Documentation and sample data
├── docker-compose.yml          # Container orchestration
├── package.json                # Root package configuration
├── ragbot.sh                   # Management script
├── reseed.sh                   # Database reseeding script
├── README.md                   # Project documentation
├── ARCHITECTURE.md             # Architectural documentation
├── DATA_FLOW.md                # Data flow documentation
├── TECH_STACK.md               # Technology stack documentation
└── FOLDER_STRUCTURE.md         # This file
```

## Backend Directory (`/backend/`)

### Purpose
Contains the Node.js/Express backend application that handles API requests, database operations, and AI integrations.

### Structure
```
backend/
├── src/                        # Source code
│   ├── cli/                   # Command-line utilities
│   ├── guardrails/            # AI safety and prompt management
│   ├── retrieval/             # RAG (Retrieval-Augmented Generation) components
│   ├── routes/                # API endpoint handlers
│   ├── config.ts              # Configuration management
│   ├── db.ts                  # Database connection and utilities
│   ├── index.ts               # Application entry point
│   └── openaiClient.ts        # OpenAI API client
├── migrations/                # Database schema migrations
├── Dockerfile                 # Backend container configuration
├── openapi.yaml               # OpenAPI specification
├── package.json               # Backend dependencies
└── tsconfig.json              # TypeScript configuration
```

### Detailed Breakdown

#### `/backend/src/` - Source Code
- **Purpose**: Main application source code
- **Language**: TypeScript
- **Entry Point**: `index.ts`

#### `/backend/src/cli/` - Command Line Interface
```
cli/
├── migrate.ts                 # Database migration utility
└── seed.ts                    # Database seeding utility
```
- **Purpose**: Command-line tools for database management
- **Usage**: `npm run migrate`, `npm run seed`
- **Features**: Database initialization and sample data loading

#### `/backend/src/guardrails/` - AI Safety
```
guardrails/
├── greetings.ts               # Greeting detection and responses
└── prompt.ts                  # System prompts and AI instructions
```
- **Purpose**: AI safety measures and response control
- **Features**: Greeting detection, system prompts, response validation

#### `/backend/src/retrieval/` - RAG Components
```
retrieval/
├── embed.ts                   # Text embedding utilities
└── retrieve.ts                # Vector retrieval and search
```
- **Purpose**: Core RAG functionality
- **Features**: Text embedding, vector similarity search, query expansion

#### `/backend/src/routes/` - API Endpoints
```
routes/
├── chat.ts                    # Chat endpoint handler
└── ingest.ts                  # Document ingestion endpoint
```
- **Purpose**: REST API endpoint implementations
- **Features**: Request validation, response formatting, error handling

#### `/backend/migrations/` - Database Schema
```
migrations/
└── 001_init.sql               # Initial database schema
```
- **Purpose**: Database schema definitions
- **Features**: Table creation, indexes, extensions (pgvector)

#### Configuration Files
- **`Dockerfile`**: Container configuration for backend
- **`openapi.yaml`**: API specification for documentation
- **`package.json`**: Dependencies and scripts
- **`tsconfig.json`**: TypeScript compiler configuration

## Frontend Directory (`/frontend/`)

### Purpose
Contains the React frontend application that provides the user interface for the chatbot.

### Structure
```
frontend/
├── src/                       # Source code
│   ├── App.tsx                # Main application component
│   └── main.tsx               # Application entry point
├── Dockerfile                 # Frontend container configuration
├── index.html                 # HTML template
├── nginx.conf                 # Nginx configuration
├── package.json               # Frontend dependencies
└── vite.config.ts             # Vite build configuration
```

### Detailed Breakdown

#### `/frontend/src/` - Source Code
- **Purpose**: React application source code
- **Language**: TypeScript
- **Entry Point**: `main.tsx`

#### `/frontend/src/App.tsx` - Main Component
- **Purpose**: Main application component
- **Features**: Chat interface, message handling, typing effects
- **Dependencies**: Material-UI, React hooks

#### `/frontend/src/main.tsx` - Entry Point
- **Purpose**: Application initialization
- **Features**: React DOM rendering, root component mounting

#### Configuration Files
- **`Dockerfile`**: Container configuration for frontend
- **`index.html`**: HTML template with meta tags
- **`nginx.conf`**: Nginx configuration for static file serving
- **`package.json`**: Dependencies and build scripts
- **`vite.config.ts`**: Vite build tool configuration

## Documentation Directory (`/docs/`)

### Purpose
Contains sample documentation and data files used for testing and demonstration.

### Structure
```
docs/
├── sample.json                # Sample documentation data
└── additional_docs.json       # Extended documentation data
```

### Detailed Breakdown

#### `/docs/sample.json` - Sample Data
- **Purpose**: Basic documentation for testing
- **Content**: Adhub platform documentation
- **Usage**: Initial database seeding

#### `/docs/additional_docs.json` - Extended Data
- **Purpose**: Comprehensive documentation set
- **Content**: Detailed Adhub features and procedures
- **Usage**: Extended knowledge base population

## Root Configuration Files

### `docker-compose.yml`
- **Purpose**: Multi-container orchestration
- **Services**: Database, backend, frontend
- **Features**: Service dependencies, networking, volumes

### `package.json`
- **Purpose**: Root package configuration
- **Scripts**: Management commands for the entire project
- **Features**: Docker commands, testing, status checking

### `ragbot.sh`
- **Purpose**: Management script for the entire system
- **Features**: Start/stop services, database management, testing
- **Usage**: `./ragbot.sh [command]`

### `reseed.sh`
- **Purpose**: Database reseeding script
- **Features**: Database cleanup and repopulation
- **Usage**: `./reseed.sh`

## File Organization Principles

### Separation of Concerns
- **Frontend**: UI components and user interaction
- **Backend**: API logic and business rules
- **Database**: Data persistence and retrieval
- **Documentation**: Sample data and project docs

### Modularity
- **CLI Tools**: Separate utilities for database management
- **Routes**: Individual files for each API endpoint
- **Components**: Modular React components
- **Configuration**: Centralized configuration management

### Scalability
- **Containerization**: Docker for easy deployment
- **Microservices**: Separate frontend and backend services
- **Database**: Separate database service
- **Scripts**: Automated management and deployment

## Development Workflow

### Local Development
```
# Start all services
./ragbot.sh start

# Development mode (frontend)
cd frontend && npm run dev

# Development mode (backend)
cd backend && npm run dev
```

### Production Deployment
```
# Build and deploy
docker compose up -d --build

# Database operations
./ragbot.sh reseed
```

### File Modifications
- **Frontend Changes**: Modify files in `/frontend/src/`
- **Backend Changes**: Modify files in `/backend/src/`
- **Database Changes**: Modify files in `/backend/migrations/`
- **Configuration**: Modify `docker-compose.yml` or environment variables

## Best Practices

### File Naming
- **TypeScript**: `.ts` for source files, `.tsx` for React components
- **Configuration**: `.json`, `.yaml`, `.yml` for config files
- **Scripts**: `.sh` for shell scripts
- **Documentation**: `.md` for markdown files

### Directory Structure
- **Flat Structure**: Avoid deep nesting where possible
- **Logical Grouping**: Group related files together
- **Clear Naming**: Use descriptive directory and file names
- **Consistency**: Follow established patterns

### Code Organization
- **Single Responsibility**: Each file has a clear purpose
- **Modularity**: Reusable components and utilities
- **Type Safety**: TypeScript for type checking
- **Documentation**: Comments and README files

## Security Considerations

### File Permissions
- **Scripts**: Executable permissions for shell scripts
- **Configuration**: Secure handling of sensitive data
- **Docker**: Proper container security practices

### Data Protection
- **Environment Variables**: Sensitive data in environment files
- **Database**: Secure connection strings and credentials
- **API Keys**: Secure storage and transmission

## Maintenance and Updates

### Regular Tasks
- **Dependency Updates**: Keep packages up to date
- **Security Patches**: Apply security updates promptly
- **Documentation**: Keep documentation current
- **Testing**: Regular testing of all components

### Backup Strategy
- **Code**: Version control with Git
- **Database**: Regular database backups
- **Configuration**: Backup configuration files
- **Documentation**: Backup documentation and sample data

---

*This document provides a comprehensive overview of the RAGBOT2026 folder structure. For specific implementation details, refer to the individual files and the main README.md.*
