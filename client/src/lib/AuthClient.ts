import { ApolloClient, gql } from '@apollo/client';
import { apolloClient } from './apollo';

export interface Profile {
  displayName?: string;
  avatar?: string;
  bio?: string;
  preferences?: {
    emailNotifications: boolean;
    pushNotifications: boolean;
  };
}

export interface Player {
  id: string;
  email: string;
  username: string;
  profile?: Profile;
}

export interface Session {
  id: string;
  userAgent?: string;
  ipAddress?: string;
  lastActive: string;
  createdAt: string;
}

export class AuthClient {
  private client: ApolloClient<any>;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  constructor(client: ApolloClient<any> = apolloClient) {
    this.client = client;
    this.loadTokens();
  }

  private loadTokens() {
    // Only load refresh token from storage
    this.refreshToken = localStorage.getItem('refreshToken');
    // Access token should be in memory only
    this.accessToken = localStorage.getItem('accessToken');
  }

  private saveTokens(accessToken: string, refreshToken: string) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    // Store tokens securely
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('accessToken', accessToken);
  }

  private clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('accessToken');
  }

  async register(email: string, password: string, username: string): Promise<Player> {
    const { data } = await this.client.mutate({
      mutation: gql`
        mutation Register($input: RegisterInput!) {
          register(input: $input) {
            accessToken
            refreshToken
            player {
              id
              email
              username
              profile {
                displayName
                avatar
                bio
                preferences
              }
            }
          }
        }
      `,
      variables: {
        input: { email, password, username }
      }
    });

    if (data?.register) {
      const { accessToken, refreshToken } = data.register;
      this.saveTokens(accessToken, refreshToken);
      return data.register.player;
    }
    throw new Error('Registration failed');
  }

  async login(email: string, password: string): Promise<Player> {
    const { data } = await this.client.mutate({
      mutation: gql`
        mutation Login($input: LoginInput!) {
          login(input: $input) {
            accessToken
            refreshToken
            player {
              id
              email
              username
              profile {
                displayName
                avatar
                bio
                preferences
              }
            }
          }
        }
      `,
      variables: {
        input: { email, password }
      }
    });

    if (data?.login) {
      const { accessToken, refreshToken } = data.login;
      this.saveTokens(accessToken, refreshToken);
      return data.login.player;
    }
    throw new Error('Login failed');
  }

  async logout() {
    if (this.refreshToken) {
      try {
        await this.client.mutate({
          mutation: gql`
            mutation Logout($refreshToken: String!) {
              logout(refreshToken: $refreshToken)
            }
          `,
          variables: {
            refreshToken: this.refreshToken
          }
        });
      } finally {
        // Clear tokens even if the mutation fails
        this.clearTokens();
      }
    }
  }

  async getProfile(): Promise<Player | null> {
    const { data } = await this.client.query({
      query: gql`
        query Me {
          me {
            id
            email
            username
            profile {
              displayName
              avatar
              bio
              preferences
            }
          }
        }
      `,
      fetchPolicy: 'network-only'
    });

    return data?.me || null;
  }

  async updateProfile(displayName: string, avatar?: string, bio?: string) {
    const { data } = await this.client.mutate({
      mutation: gql`
        mutation UpdateProfile($input: UpdateProfileInput!) {
          updateProfile(input: $input) {
            displayName
            avatar
            bio
            preferences
          }
        }
      `,
      variables: {
        input: { displayName, avatar, bio }
      }
    });

    return data?.updateProfile;
  }

  async updatePassword(currentPassword: string, newPassword: string): Promise<boolean> {
    const { data } = await this.client.mutate({
      mutation: gql`
        mutation UpdatePassword($input: UpdatePasswordInput!) {
          updatePassword(input: $input) {
            success
            message
          }
        }
      `,
      variables: {
        input: { currentPassword, newPassword }
      }
    });

    return data?.updatePassword?.success || false;
  }

  async updateNotificationPreferences(preferences: { emailNotifications: boolean; pushNotifications: boolean }) {
    const { data } = await this.client.mutate({
      mutation: gql`
        mutation UpdatePreferences($input: UpdatePreferencesInput!) {
          updatePreferences(input: $input) {
            preferences
          }
        }
      `,
      variables: {
        input: { preferences }
      }
    });

    return data?.updatePreferences?.preferences;
  }

  async getActiveSessions(): Promise<Session[]> {
    const { data } = await this.client.query({
      query: gql`
        query ActiveSessions {
          activeSessions {
            id
            userAgent
            ipAddress
            lastActive
            createdAt
          }
        }
      `,
      fetchPolicy: 'network-only'
    });

    return data?.activeSessions || [];
  }

  async revokeSession(sessionId: string): Promise<boolean> {
    const { data } = await this.client.mutate({
      mutation: gql`
        mutation RevokeSession($sessionId: ID!) {
          revokeSession(sessionId: $sessionId)
        }
      `,
      variables: { sessionId }
    });

    return data?.revokeSession || false;
  }

  async refreshAccessToken(): Promise<boolean> {
    if (!this.refreshToken) return false;

    try {
      const { data } = await this.client.mutate({
        mutation: gql`
          mutation RefreshToken($token: String!) {
            refreshToken(token: $token) {
              accessToken
              refreshToken
            }
          }
        `,
        variables: {
          token: this.refreshToken
        }
      });

      if (data?.refreshToken) {
        const { accessToken, refreshToken } = data.refreshToken;
        this.saveTokens(accessToken, refreshToken);
        return true;
      }
    } catch (error) {
      this.clearTokens();
      return false;
    }
    return false;
  }

  async requestPasswordReset(email: string): Promise<boolean> {
    const { data } = await this.client.mutate({
      mutation: gql`
        mutation RequestPasswordReset($email: String!) {
          requestPasswordReset(email: $email)
        }
      `,
      variables: { email }
    });

    return data?.requestPasswordReset || false;
  }

  async verifyResetToken(token: string): Promise<{ valid: boolean; email?: string }> {
    const { data } = await this.client.query({
      query: gql`
        query VerifyResetToken($token: String!) {
          verifyResetToken(token: $token) {
            valid
            email
          }
        }
      `,
      variables: { token }
    });

    return data?.verifyResetToken || { valid: false };
  }

  async resetPassword(token: string, newPassword: string): Promise<boolean> {
    const { data } = await this.client.mutate({
      mutation: gql`
        mutation ResetPassword($input: ResetPasswordInput!) {
          resetPassword(input: $input) {
            success
            message
          }
        }
      `,
      variables: {
        input: {
          token,
          newPassword
        }
      }
    });

    return data?.resetPassword?.success || false;
  }
}