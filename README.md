# SolidRusT Networks - Player Account Management (PAM) Platform

## Overview
Central authentication and account management system for SolidRusT Networks games, providing secure player identity management and authentication services.

## Quick Start

### Prerequisites
- Docker and Docker Compose
- Git

### Development Setup
```bash
# Clone the repository
git clone https://github.com/solidrust/srt-pam-platform.git
cd srt-pam-platform

# Copy environment file
cp .env.example .env

# Start development environment
docker-compose up -d

# Access development portals
GraphQL API:     http://localhost:4000/graphql
Database Admin:  http://localhost:5050
```

## Development URLs
| Service | URL | Description |
|---------|-----|-------------|
| GraphQL API | http://localhost:4000/graphql | Main API endpoint and playground |
| PgAdmin | http://localhost:5050 | Database management interface |
| Redis Commander | http://localhost:8081 | Redis monitoring (optional) |

## Documentation
- `/docs/architecture.md` - High-level system architecture
- `/docs/technical/` - Detailed technical specifications
  - `database.md` - Database architecture and scaling
  - `token-lifecycle.md` - Authentication system
  - `api-design.md` - API specifications
  - `development-guide.md` - Detailed development guide
  - `local-development.md` - Local environment setup
  - `project-structure.md` - Codebase organization

## Technology Stack
- Backend: TypeScript/Node.js
- Database: PostgreSQL
- Caching: Redis
- API: GraphQL (Apollo Server)

## Development Workflow
1. Bring up the development environment: `docker-compose up -d`
2. Access the GraphQL playground at http://localhost:4000/graphql
3. Use PgAdmin at http://localhost:5050 for database management
4. Shut down with `docker-compose down` when finished

## License
Proprietary - SolidRusT Networks