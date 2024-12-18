# Development Guide

## Getting Started

### Prerequisites
- Node.js 18+
- Docker and Docker Compose
- Git
- VS Code (recommended)

### Development Environment Setup

1. Clone the repository:
```bash
git clone https://github.com/solidrust/srt-pam-platform.git
cd srt-pam-platform
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

4. Start development services:
```bash
docker-compose up -d
```

5. Run database migrations:
```bash
npm run db:migrate
```

6. Start development server:
```bash
npm run dev
```

## Development Workflow

### 1. Feature Development Process
1. Create feature branch from main
2. Implement feature with tests
3. Run test suite
4. Submit pull request

### 2. Testing Requirements
- Unit tests for business logic
- Integration tests for API endpoints
- Minimum 80% coverage
- All tests must pass

### 3. Code Style
- Follow ESLint configuration
- Use Prettier for formatting
- Follow TypeScript best practices

### 4. Documentation
- Update API documentation
- Add JSDoc comments
- Update README if needed

## Testing

### Running Tests
```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run specific test file
npm test -- auth.test.ts

# Watch mode for development
npm test -- --watch
```

### Writing Tests

#### Unit Tests
```typescript
import { AuthService } from '../services/auth.service';
import { TokenService } from '../services/token.service';

describe('AuthService', () => {
  let authService: AuthService;
  let tokenService: TokenService;

  beforeEach(() => {
    tokenService = new TokenService();
    authService = new AuthService(tokenService);
  });

  it('should generate valid tokens', async () => {
    const result = await authService.generateTokens({ id: '123' });
    expect(result).toHaveProperty('accessToken');
    expect(result).toHaveProperty('refreshToken');
  });
});
```

#### Integration Tests
```typescript
describe('Authentication API', () => {
  it('should register new user', async () => {
    const response = await request(app)
      .post('/graphql')
      .send({
        query: `
          mutation Register($input: RegisterInput!) {
            register(input: $input) {
              accessToken
              refreshToken
            }
          }
        `,
        variables: {
          input: {
            email: 'test@example.com',
            password: 'password123'
          }
        }
      });

    expect(response.status).toBe(200);
    expect(response.body.data.register).toHaveProperty('accessToken');
  });
});
```

## Debugging

### VSCode Configuration
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug API",
      "skipFiles": ["<node_internals>/**"],
      "program": "${workspaceFolder}/src/index.ts",
      "outFiles": ["${workspaceFolder}/dist/**/*.js"],
      "env": {
        "NODE_ENV": "development"
      }
    }
  ]
}
```

### GraphQL Playground
- Available at http://localhost:4000/graphql
- Test queries and mutations
- View schema documentation

### Database Access
- PgAdmin: http://localhost:5050
- Redis Commander: http://localhost:8081

## Deployment

### Local Development
```yaml
# docker-compose.yml is used for local development
docker-compose up -d
```

### Staging/Production
- Use Kubernetes manifests
- Follow GitOps workflow
- Use proper secrets management

## Common Tasks

### Database Migrations
```bash
# Create migration
npm run db:migrate:create

# Apply migrations
npm run db:migrate

# Reset database (development only)
npm run db:reset
```

### Code Generation
```bash
# Generate Prisma client
npm run db:generate

# Generate GraphQL types
npm run codegen
```

### Linting and Formatting
```bash
# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format
```

## Troubleshooting

### Common Issues

1. Database Connection
```bash
# Check PostgreSQL logs
docker-compose logs postgres

# Verify connection
nc -zv localhost 5432
```

2. Redis Connection
```bash
# Check Redis logs
docker-compose logs redis

# Test connection
redis-cli ping
```

3. GraphQL Issues
```bash
# Clear GraphQL schema cache
rm -rf src/generated
npm run codegen
```

### Performance Profiling

1. Node.js Profiling
```bash
# Start with profiling
NODE_ENV=development node --prof src/index.js

# Process profiling data
node --prof-process isolate-*.log > profile.txt
```

2. Database Query Performance
```sql
-- Enable query logging
ALTER DATABASE pam_local SET log_min_duration_statement = 0;

-- Check slow queries
SELECT * FROM pg_stat_activity WHERE state = 'active';
```

## Security Considerations

### Development Security
- Never commit secrets
- Use environment variables
- Regular dependency updates
- Security linting rules

### API Security
- Rate limiting
- Input validation
- Token validation
- SQL injection prevention

## Best Practices

### Code Organization
- Follow module structure
- Use dependency injection
- Keep functions small
- Write clear comments

### Error Handling
- Use custom error classes
- Proper error logging
- User-friendly messages
- Type-safe error handling

### Performance
- Use connection pooling
- Implement caching
- Optimize queries
- Monitor memory usage