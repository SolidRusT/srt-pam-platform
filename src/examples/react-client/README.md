# PAM Platform React Client Example

This example demonstrates how to integrate with the PAM Platform using React. It shows:
- User registration and login
- Token management and refresh
- Session tracking and management
- Secure token storage practices

## Key Features
- Keeps access token in memory only
- Stores refresh token in localStorage
- Automatically refreshes expired tokens
- Handles session management
- Shows active sessions and allows revocation

## Usage

### Setup
1. Make sure the PAM Platform is running locally
2. Install the dependencies in your React project
3. Copy the `AuthClient.ts` and optionally the `AuthDemo.tsx` components

### Basic Usage

```typescript
import { AuthClient } from './AuthClient';

// Create client instance
const authClient = new AuthClient();

// Register new user
const player = await authClient.register(email, password, username);

// Login
const player = await authClient.login(email, password);

// Get profile
const profile = await authClient.getProfile();

// Get active sessions
const sessions = await authClient.getActiveSessions();

// Revoke session
await authClient.revokeSession(sessionId);

// Logout
await authClient.logout();
```

### Token Management
The client implements secure token management:
- Access tokens are kept in memory only
- Refresh tokens are stored in localStorage
- Automatic token refresh when access token expires
- Proper cleanup on logout

### Error Handling
The client provides clear error messages for:
- Authentication failures
- Token expiration
- Network issues
- Invalid credentials

## Security Considerations
1. Access tokens are never stored in localStorage
2. All sensitive operations require valid tokens
3. Failed refresh attempts clear stored tokens
4. Session tracking for security monitoring

## Integration Example
See `AuthDemo.tsx` for a complete implementation example including:
- Login/Register forms
- Profile display
- Session management UI
- Error handling
- Loading states

## Best Practices
1. Initialize the client early in your app
2. Handle authentication state globally (e.g., with Context)
3. Add interceptors for authenticated requests
4. Implement proper error boundaries
5. Add loading states for operations