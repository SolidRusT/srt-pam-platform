# Project Structure

## Directory Layout
```
srt-pam-platform/
├── src/
│   ├── config/           # Configuration management
│   ├── modules/          # Feature modules
│   │   ├── auth/         # Authentication module
│   │   ├── player/       # Player management
│   │   └── profile/      # Profile management
│   ├── shared/           # Shared utilities and types
│   ├── graphql/          # GraphQL schema and resolvers
│   └── index.ts          # Application entry point
├── prisma/               # Database schema and migrations
├── tests/                # Test files
├── docs/                 # Documentation
└── scripts/              # Development and deployment scripts
```

## Module Structure
Each feature module follows this structure:
```
module/
├── resolvers/           # GraphQL resolvers
├── services/           # Business logic
├── models/             # Data models
├── types/              # TypeScript types
└── index.ts           # Module exports
```

## Key Files

### 1. Configuration
```typescript
// src/config/index.ts
export interface Config {
  server: {
    port: number;
    host: string;
  };
  database: {
    url: string;
  };
  redis: {
    url: string;
  };
  jwt: {
    secret: string;
    expiresIn: string;
  };
}

export const config: Config = {
  server: {
    port: process.env.PORT ? parseInt(process.env.PORT, 10) : 4000,
    host: process.env.HOST || "0.0.0.0",
  },
  // ... other config
};
```

### 2. Database Schema
```prisma
// prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model Player {
  id        String   @id @default(uuid())
  email     String   @unique
  username  String   @unique
  password  String
  profile   Profile?
  sessions  Session[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Profile {
  id          String   @id @default(uuid())
  playerId    String   @unique
  player      Player   @relation(fields: [playerId], references: [id])
  displayName String?
  avatar      String?
  preferences Json?
  updatedAt   DateTime @updatedAt
}

model Session {
  id         String   @id @default(uuid())
  playerId   String
  player     Player   @relation(fields: [playerId], references: [id])
  token      String   @unique
  expiresAt  DateTime
  createdAt  DateTime @default(now())
  lastActive DateTime @updatedAt
}
```

### 3. GraphQL Schema
```graphql
# src/graphql/schema.graphql
type Query {
  me: Player
  player(id: ID!): Player
}

type Mutation {
  register(input: RegisterInput!): AuthResponse!
  login(input: LoginInput!): AuthResponse!
  logout: Boolean!
}

# ... types defined in api-design.md
```

### 4. Module Example
```typescript
// src/modules/auth/services/auth.service.ts
export class AuthService {
  constructor(
    private readonly playerService: PlayerService,
    private readonly tokenService: TokenService,
  ) {}

  async login(input: LoginInput): Promise<AuthResponse> {
    const player = await this.playerService.findByEmail(input.email);
    if (!player) {
      throw new Error("Invalid credentials");
    }
    // ... authentication logic
  }
}
```

## Development Guidelines

### 1. Code Organization
- One feature per module
- Shared code in `shared/` directory
- Configuration in `config/` directory
- Tests alongside source files

### 2. Naming Conventions
- Files: kebab-case
- Classes: PascalCase
- Functions/variables: camelCase
- Constants: UPPER_SNAKE_CASE

### 3. Import Organization
```typescript
// External imports
import { Injectable } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";

// Internal imports
import { Config } from "@/config";
import { PlayerService } from "@/modules/player";

// Related imports
import { AuthResponse } from "./types";
```

### 4. Error Handling
```typescript
// src/shared/errors/index.ts
export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public status: number = 400,
  ) {
    super(message);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string) {
    super(message, "AUTHENTICATION_ERROR", 401);
  }
}
```

## Testing Structure

### 1. Unit Tests
```typescript
// src/modules/auth/services/__tests__/auth.service.test.ts
describe("AuthService", () => {
  let authService: AuthService;
  
  beforeEach(() => {
    // Setup
  });

  it("should authenticate valid credentials", async () => {
    // Test implementation
  });
});
```

### 2. Integration Tests
```typescript
// tests/integration/auth.test.ts
describe("Authentication Flow", () => {
  it("should complete registration and login", async () => {
    // Test implementation
  });
});
```

## Development Scripts

```json
{
  "scripts": {
    "dev": "ts-node-dev --respawn src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "test": "jest",
    "lint": "eslint . --ext .ts",
    "format": "prettier --write \"src/**/*.ts\"",
    "db:migrate": "prisma migrate deploy",
    "db:generate": "prisma generate"
  }
}
```