# API Design Specification

## Overview
This document defines the GraphQL API schema and patterns for the PAM platform.

## GraphQL Schema

### Types

```graphql
type Player {
  id: ID!
  email: String!
  username: String!
  profile: Profile
  sessions: [Session!]!
  createdAt: DateTime!
  updatedAt: DateTime!
}

type Profile {
  id: ID!
  playerId: ID!
  displayName: String
  avatar: String
  preferences: JSONObject
  updatedAt: DateTime!
}

type Session {
  id: ID!
  playerId: ID!
  lastActive: DateTime!
  expiresAt: DateTime!
}

type AuthResponse {
  accessToken: String!
  refreshToken: String!
  player: Player!
}

input RegisterInput {
  email: String!
  password: String!
  username: String!
}

input LoginInput {
  email: String!
  password: String!
}
```

### Queries

```graphql
type Query {
  # Player queries
  me: Player                           # Get current player
  player(id: ID!): Player             # Get player by ID
  players(limit: Int, offset: Int): [Player!]! # List players (admin only)
  
  # Session queries
  activeSessions: [Session!]!         # List active sessions for current player
}
```

### Mutations

```graphql
type Mutation {
  # Authentication
  register(input: RegisterInput!): AuthResponse!
  login(input: LoginInput!): AuthResponse!
  logout: Boolean!
  refreshToken(token: String!): AuthResponse!
  
  # Profile management
  updateProfile(input: UpdateProfileInput!): Profile!
  deleteAccount: Boolean!
  
  # Session management
  revokeSession(id: ID!): Boolean!
  revokeAllSessions: Boolean!
}
```

## Error Handling

### Error Types
```graphql
enum ErrorCode {
  UNAUTHORIZED
  INVALID_CREDENTIALS
  ACCOUNT_LOCKED
  RATE_LIMITED
  VALIDATION_ERROR
  INTERNAL_ERROR
}

type Error {
  code: ErrorCode!
  message: String!
  path: [String!]
}
```

### Error Responses
```graphql
{
  "errors": [
    {
      "code": "UNAUTHORIZED",
      "message": "Invalid or expired token",
      "path": ["login"]
    }
  ]
}
```

## Authentication Flow

### Registration
```graphql
mutation Register {
  register(input: {
    email: "player@example.com"
    password: "secure_password"
    username: "player1"
  }) {
    accessToken
    refreshToken
    player {
      id
      username
    }
  }
}
```

### Login
```graphql
mutation Login {
  login(input: {
    email: "player@example.com"
    password: "secure_password"
  }) {
    accessToken
    refreshToken
    player {
      id
      username
    }
  }
}
```

## Best Practices

### 1. Query Depth
- Maximum depth: 3 levels
- Use pagination for lists
- Implement field-level cost analysis

### 2. Rate Limiting
```typescript
const rateLimits = {
  anonymous: {
    window: "15m",
    max: 100
  },
  authenticated: {
    window: "15m",
    max: 1000
  }
};
```

### 3. Caching Strategy
- Use Redis for caching
- Cache invalidation on mutations
- Type-level cache policies

### 4. Security
- Input validation
- Query complexity analysis
- Authentication checks
- Rate limiting

## Testing Examples

### Query Tests
```typescript
describe("Player Queries", () => {
  it("should fetch current player", async () => {
    const query = `
      query Me {
        me {
          id
          username
          profile {
            displayName
          }
        }
      }
    `;
    // Test implementation
  });
});
```

### Mutation Tests
```typescript
describe("Authentication Mutations", () => {
  it("should register new player", async () => {
    const mutation = `
      mutation Register($input: RegisterInput!) {
        register(input: $input) {
          accessToken
          player {
            id
          }
        }
      }
    `;
    // Test implementation
  });
});
```

## Integration Guidelines

### Client Integration
```typescript
const client = new GraphQLClient({
  url: "https://api.pam.solidrust.net/graphql",
  headers: {
    Authorization: `Bearer ${accessToken}`
  }
});
```

### Error Handling
```typescript
try {
  const response = await client.query(PLAYER_QUERY);
} catch (error) {
  if (error.code === "UNAUTHORIZED") {
    // Handle token refresh
  }
}
```