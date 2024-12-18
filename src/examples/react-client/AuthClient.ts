export class AuthClient {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private readonly apiUrl: string;

  constructor(apiUrl: string = 'http://localhost:4000/graphql') {
    this.apiUrl = apiUrl;
    this.loadTokens();
  }

  private loadTokens() {
    // Only load refresh token from storage
    this.refreshToken = localStorage.getItem('refreshToken');
    // Access token should be in memory only
    this.accessToken = null;
  }

  private saveTokens(accessToken: string, refreshToken: string) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    // Only store refresh token
    localStorage.setItem('refreshToken', refreshToken);
  }

  private clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
    localStorage.removeItem('refreshToken');
  }

  async register(email: string, password: string, username: string) {
    const response = await this.graphqlRequest(`
      mutation Register($input: RegisterInput!) {
        register(input: $input) {
          accessToken
          refreshToken
          player {
            id
            email
            username
          }
        }
      }
    `, {
      input: { email, password, username }
    });

    if (response.data?.register) {
      const { accessToken, refreshToken } = response.data.register;
      this.saveTokens(accessToken, refreshToken);
      return response.data.register.player;
    }
    throw new Error(response.errors?.[0]?.message || 'Registration failed');
  }

  async login(email: string, password: string) {
    const response = await this.graphqlRequest(`
      mutation Login($input: LoginInput!) {
        login(input: $input) {
          accessToken
          refreshToken
          player {
            id
            email
            username
          }
        }
      }
    `, {
      input: { email, password }
    });

    if (response.data?.login) {
      const { accessToken, refreshToken } = response.data.login;
      this.saveTokens(accessToken, refreshToken);
      return response.data.login.player;
    }
    throw new Error(response.errors?.[0]?.message || 'Login failed');
  }

  async logout() {
    if (this.accessToken) {
      await this.graphqlRequest(`
        mutation Logout {
          logout
        }
      `, {}, true);
    }
    this.clearTokens();
  }

  async getProfile() {
    const response = await this.graphqlRequest(`
      query Me {
        me {
          id
          email
          username
          profile {
            displayName
            avatar
          }
        }
      }
    `, {}, true);

    return response.data?.me;
  }

  async getActiveSessions() {
    const response = await this.graphqlRequest(`
      query ActiveSessions {
        activeSessions {
          id
          userAgent
          ipAddress
          lastActive
          createdAt
        }
      }
    `, {}, true);

    return response.data?.activeSessions || [];
  }

  async revokeSession(sessionId: string) {
    const response = await this.graphqlRequest(`
      mutation RevokeSession($sessionId: ID!) {
        revokeSession(sessionId: $sessionId)
      }
    `, { sessionId }, true);

    return response.data?.revokeSession;
  }

  private async refreshAccessToken(): Promise<boolean> {
    if (!this.refreshToken) return false;

    try {
      const response = await this.graphqlRequest(`
        mutation RefreshToken($token: String!) {
          refreshToken(token: $token) {
            accessToken
            refreshToken
          }
        }
      `, {
        token: this.refreshToken
      });

      if (response.data?.refreshToken) {
        const { accessToken, refreshToken } = response.data.refreshToken;
        this.saveTokens(accessToken, refreshToken);
        return true;
      }
    } catch (error) {
      this.clearTokens();
      return false;
    }
    return false;
  }

  private async graphqlRequest(
    query: string,
    variables: Record<string, any> = {},
    requiresAuth: boolean = false
  ) {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (requiresAuth) {
      // Try to refresh if no access token
      if (!this.accessToken && !(await this.refreshAccessToken())) {
        throw new Error('Not authenticated');
      }
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        query,
        variables,
      }),
    });

    const result = await response.json();

    // Handle token expiration
    if (result.errors?.[0]?.message === 'Not authenticated' && requiresAuth) {
      if (await this.refreshAccessToken()) {
        // Retry with new token
        return this.graphqlRequest(query, variables, requiresAuth);
      }
      throw new Error('Session expired');
    }

    return result;
  }
}