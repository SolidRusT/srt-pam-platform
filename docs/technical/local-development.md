# Local Development Setup

## Overview
This guide details how to set up and run the PAM platform locally using Docker Compose. The development environment closely mirrors our production setup while remaining lightweight and developer-friendly.

## Prerequisites
- Docker and Docker Compose
- Node.js 18+ and npm/yarn
- Git
- VS Code (recommended) with extensions:
  - ESLint
  - Prettier
  - TypeScript and JavaScript
  - GraphQL

## Quick Start
```bash
# Clone the repository
git clone https://github.com/solidrust/srt-pam-platform.git

# Navigate to project directory
cd srt-pam-platform

# Copy environment file
cp .env.example .env

# Start the development environment
docker-compose up -d

# Install dependencies
npm install

# Start development server
npm run dev
```

## Docker Compose Environment

```yaml
# docker-compose.yml
version: '3.8'

services:
  # API Service
  api:
    build:
      context: .
      target: development
    volumes:
      - .:/app
      - /app/node_modules
    ports:
      - "4000:4000"
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgresql://pam_dev:dev_password@postgres:5432/pam_local
      - REDIS_URL=redis://redis:6379
    depends_on:
      - postgres
      - redis

  # PostgreSQL Database
  postgres:
    image: postgres:14
    environment:
      POSTGRES_USER: pam_dev
      POSTGRES_PASSWORD: dev_password
      POSTGRES_DB: pam_local
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init-scripts:/docker-entrypoint-initdb.d

  # Redis Cache
  redis:
    image: redis:6
    ports:
      - "6379:6379"
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data

  # PgAdmin for database management
  pgadmin:
    image: dpage/pgadmin4
    environment:
      PGADMIN_DEFAULT_EMAIL: admin@solidrust.net
      PGADMIN_DEFAULT_PASSWORD: admin
    ports:
      - "5050:80"
    depends_on:
      - postgres

volumes:
  postgres_data:
  redis_data:
```

## Development Workflow

### 1. Environment Configuration
```bash
# .env.example
NODE_ENV=development
PORT=4000

# Database
DATABASE_URL=postgresql://pam_dev:dev_password@localhost:5432/pam_local
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-development-secret
JWT_EXPIRES_IN=24h
REFRESH_TOKEN_EXPIRES_IN=30d

# API
RATE_LIMIT_WINDOW=15m
RATE_LIMIT_MAX=100
```

### 2. Available Scripts
```json
{
  "scripts": {
    "dev": "ts-node-dev --respawn src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "test": "jest",
    "lint": "eslint . --ext .ts",
    "format": "prettier --write \"src/**/*.ts\"",
    "typecheck": "tsc --noEmit",
    "migrate": "prisma migrate dev",
    "generate": "prisma generate"
  }
}
```

### 3. Development Server
The development server runs on http://localhost:4000 with:
- Hot reloading
- GraphQL Playground
- Detailed error messages
- TypeScript type checking

### 4. Testing
```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage
```

## Available Development Tools

### 1. GraphQL Playground
- URL: http://localhost:4000/graphql
- Interactive API documentation
- Query/mutation testing
- Schema exploration

### 2. PgAdmin
- URL: http://localhost:5050
- Database administration
- Query execution
- Table visualization

### 3. Redis Commander (Optional)
```yaml
# Add to docker-compose.yml if needed
redis-commander:
  image: rediscommander/redis-commander
  ports:
    - "8081:8081"
  environment:
    - REDIS_HOSTS=redis
```

## Development Best Practices

### 1. Code Style
- Follow ESLint configuration
- Run Prettier before commits
- Use TypeScript strict mode
- Document with JSDoc comments

### 2. Git Workflow
```bash
# Create feature branch
git checkout -b feature/your-feature

# Make changes and commit
git add .
git commit -m "feat: your feature description"

# Push changes
git push origin feature/your-feature
```

### 3. Testing Requirements
- Unit tests for utilities
- Integration tests for API endpoints
- E2E tests for critical flows
- Maintain 80%+ coverage

## Debugging

### 1. API Debugging
```typescript
// Add to any resolver
debugger;
// Then run with --inspect flag
```

### 2. Database Debugging
- Use PgAdmin for query analysis
- Enable query logging in development
- Monitor connection pool

### 3. Token Debugging
```typescript
import jwt from 'jsonwebtoken';

// Debug helper
function debugToken(token: string): void {
  const decoded = jwt.decode(token, { complete: true });
  console.log(decoded);
}
```

## Example Integration Testing

```typescript
describe('Authentication Flow', () => {
  it('should complete login flow successfully', async () => {
    // Test login mutation
    const response = await graphql(`
      mutation {
        login(email: "test@example.com", password: "password123") {
          accessToken
          refreshToken
        }
      }
    `);

    expect(response.login).toHaveProperty('accessToken');
  });
});
```