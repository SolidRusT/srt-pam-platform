import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthClient, Player, Session } from './AuthClient';

interface AuthContextType {
  isAuthenticated: boolean;
  player: Player | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, username: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (displayName: string, avatar?: string, bio?: string) => Promise<void>;
  updatePassword: (currentPassword: string, newPassword: string) => Promise<boolean>;
  updateNotificationPreferences: (preferences: { emailNotifications: boolean; pushNotifications: boolean }) => Promise<void>;
  getActiveSessions: () => Promise<Session[]>;
  revokeSession: (sessionId: string) => Promise<boolean>;
  requestPasswordReset: (email: string) => Promise<boolean>;
  verifyResetToken: (token: string) => Promise<{ valid: boolean; email?: string }>;
  resetPassword: (token: string, newPassword: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authClient] = useState(() => new AuthClient());
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [player, setPlayer] = useState<Player | null>(null);

  useEffect(() => {
    // Try to get profile on mount
    authClient.getProfile()
      .then(profile => {
        if (profile) {
          setPlayer(profile);
          setIsAuthenticated(true);
        }
      })
      .catch(() => {
        setIsAuthenticated(false);
        setPlayer(null);
      });
  }, []);

  const login = async (email: string, password: string) => {
    const player = await authClient.login(email, password);
    setPlayer(player);
    setIsAuthenticated(true);
  };

  const register = async (email: string, password: string, username: string) => {
    const player = await authClient.register(email, password, username);
    setPlayer(player);
    setIsAuthenticated(true);
  };

  const logout = async () => {
    await authClient.logout();
    setIsAuthenticated(false);
    setPlayer(null);
  };

  const updateProfile = async (displayName: string, avatar?: string, bio?: string) => {
    const profile = await authClient.updateProfile(displayName, avatar, bio);
    if (profile && player) {
      setPlayer({ ...player, profile });
    }
  };

  const updatePassword = async (currentPassword: string, newPassword: string) => {
    return authClient.updatePassword(currentPassword, newPassword);
  };

  const updateNotificationPreferences = async (preferences: { emailNotifications: boolean; pushNotifications: boolean }) => {
    const updatedPreferences = await authClient.updateNotificationPreferences(preferences);
    if (updatedPreferences && player?.profile) {
      setPlayer({
        ...player,
        profile: {
          ...player.profile,
          preferences: updatedPreferences
        }
      });
    }
  };

  const getActiveSessions = () => {
    return authClient.getActiveSessions();
  };

  const revokeSession = (sessionId: string) => {
    return authClient.revokeSession(sessionId);
  };

  const requestPasswordReset = async (email: string) => {
    return authClient.requestPasswordReset(email);
  };

  const verifyResetToken = async (token: string) => {
    return authClient.verifyResetToken(token);
  };

  const resetPassword = async (token: string, newPassword: string) => {
    return authClient.resetPassword(token, newPassword);
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        player,
        login,
        register,
        logout,
        updateProfile,
        updatePassword,
        updateNotificationPreferences,
        getActiveSessions,
        revokeSession,
        requestPasswordReset,
        verifyResetToken,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}