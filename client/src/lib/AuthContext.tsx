import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthClient, Player } from './AuthClient';

interface AuthContextType {
  isAuthenticated: boolean;
  player: Player | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, username: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (displayName: string, avatar?: string) => Promise<void>;
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

  const updateProfile = async (displayName: string, avatar?: string) => {
    const profile = await authClient.updateProfile(displayName, avatar);
    if (profile && player) {
      setPlayer({ ...player, profile });
    }
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