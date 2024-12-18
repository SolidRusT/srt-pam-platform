# SolidRusT Networks - Player Account Management (PAM) Platform

## Overview
Central authentication and account management system for SolidRusT Networks games, providing secure player identity management and authentication services.

## Documentation Structure
- `/docs/ARCHITECTURE.md` - High-level system architecture
- `/docs/technical/` - Detailed technical specifications
  - `database.md` - Database architecture and scaling strategy
  - `token-lifecycle.md` - Token management and authentication flow
  - `local-development.md` - Setting up local development environment
  - `deployment.md` - Production deployment configurations

## Quick Start (Development)
```bash
# Clone the repository
git clone https://github.com/solidrust/srt-pam-platform.git

# Navigate to project directory
cd srt-pam-platform

# Start development environment
docker-compose up -d

# Access development portal
http://localhost:3000
```

## Technology Stack
- Backend: TypeScript/Node.js
- Database: PostgreSQL
- Caching: Redis
- API: GraphQL (Apollo Server)
- Development: Docker Compose
- Production: Kubernetes

## Development Philosophy
- Security-first approach
- Developer-friendly local environment
- Production-like development setup
- Comprehensive testing
- Clear documentation

## License
Proprietary - SolidRusT Networks