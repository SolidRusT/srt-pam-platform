# Token Lifecycle Management

## Overview
The PAM platform uses a JWT-based authentication system with refresh tokens to provide secure and efficient authentication for games and applications.

## Token Types

### Access Token (JWT)
- Contains encoded player information and permissions
- 24-hour expiration
- Stateless validation
- Stored in memory by client applications

### Refresh Token
- Long-lived (30 days)
- Stored in database
- Used to obtain new access tokens
- One refresh token per active session

## Token Structure

### Access Token Payload
```typescript
interface AccessTokenPayload {
  sub: string;          // Player UUID
  iat: number;          // Issued at timestamp
  exp: number;          // Expiration timestamp
  jti: string;          // Unique token ID
  scope: string[];      // Permissions
  gameAccess: string[]; // Authorized games
}
```

### Example JWT
```typescript
// Header
{
  "alg": "RS256",
  "typ": "JWT"
}

// Payload
{
  "sub": "123e4567-e89b-12d3-a456-426614174000",
  "iat": 1638360000,
  "exp": 1638446400,
  "jti": "unique-token-id",
  "scope": ["play", "profile:read"],
  "gameAccess": ["game1", "game2"]
}
```

## Authentication Flow

### 1. Initial Login
```typescript
interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

async function login(email: string, password: string): Promise<LoginResponse> {
  // 1. Validate credentials
  // 2. Generate tokens
  // 3. Store refresh token
  // 4. Return tokens
}
```

### 2. Token Validation
```typescript
interface ValidationResult {
  valid: boolean;
  payload?: AccessTokenPayload;
}

async function validateToken(token: string): Promise<ValidationResult> {
  // 1. Check Redis cache
  // 2. Verify JWT signature
  // 3. Validate claims
  // 4. Cache result in Redis
  // 5. Return validation result
}
```

### 3. Token Refresh
```typescript
async function refreshToken(refreshToken: string): Promise<LoginResponse> {
  // 1. Validate refresh token
  // 2. Generate new access token
  // 3. Optionally rotate refresh token
  // 4. Return new tokens
}
```

## Example Integration

### Game Client Integration
```typescript
class GameAuthClient {
  private accessToken: string;
  private refreshToken: string;

  async initialize() {
    // Load tokens from secure storage
  }

  async validateAccess(): Promise<boolean> {
    // Check token expiration
    if (this.isTokenExpired()) {
      await this.refreshAccess();
    }
    return this.hasValidToken();
  }

  async getAuthHeader(): Promise<string> {
    await this.validateAccess();
    return `Bearer ${this.accessToken}`;
  }
}
```

### Protected Resource Access
```typescript
// Example protected API endpoint
app.get('/api/protected', async (req, res) => {
  const token = extractBearerToken(req);
  const validation = await validateToken(token);
  
  if (!validation.valid) {
    return res.status(401).json({ error: 'Invalid token' });
  }
  
  // Continue with protected resource access
});
```

## Demo Implementation
Here's a minimal example showing token usage:

```typescript
// pages/easter-egg.tsx
import { useAuth } from '../hooks/useAuth';

export default function EasterEgg() {
  const { isAuthenticated, token } = useAuth();

  if (!isAuthenticated) {
    return <div>Access Denied</div>;
  }

  return (
    <div>
      <h1>🎉 Secret Easter Egg Content!</h1>
      <pre>{JSON.stringify(token, null, 2)}</pre>
    </div>
  );
}
```

## Security Considerations

### Token Storage
- Access tokens: Memory only, never in localStorage
- Refresh tokens: HttpOnly, secure cookies
- No sensitive data in JWT payload

### Token Revocation
- Immediate revocation through Redis blacklist
- Refresh token rotation on security events
- Session termination capabilities

### Rate Limiting
- Token refresh: 10 requests per minute
- Failed login attempts: 5 per minute
- IP-based rate limiting

## Monitoring and Debugging

### Key Metrics
- Token validation rate
- Refresh token usage
- Failed validation attempts
- Cache hit ratio

### Debugging Tools
```typescript
// Development helper
function debugToken(token: string): void {
  const decoded = jwt.decode(token, { complete: true });
  console.log('Header:', decoded.header);
  console.log('Payload:', decoded.payload);
  console.log('Signature:', decoded.signature);
}
```

## Local Development Setup
```yaml
# docker-compose.yml excerpt
services:
  redis:
    image: redis:6
    ports:
      - "6379:6379"
    command: redis-server --appendonly yes
```