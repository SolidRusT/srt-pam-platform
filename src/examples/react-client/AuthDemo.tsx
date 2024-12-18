import React, { useEffect, useState } from 'react';
import { AuthClient } from './AuthClient';

interface Player {
  id: string;
  email: string;
  username: string;
  profile?: {
    displayName?: string;
    avatar?: string;
  };
}

interface Session {
  id: string;
  userAgent?: string;
  ipAddress?: string;
  lastActive: string;
  createdAt: string;
}

const authClient = new AuthClient();

export function AuthDemo() {
  const [player, setPlayer] = useState<Player | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');

  useEffect(() => {
    // Try to get profile on mount
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const profile = await authClient.getProfile();
      if (profile) {
        setPlayer(profile);
        loadSessions();
      }
    } catch (err) {
      // Ignore error on initial load
    }
  };

  const loadSessions = async () => {
    try {
      const activeSessions = await authClient.getActiveSessions();
      setSessions(activeSessions);
    } catch (err) {
      setError('Failed to load sessions');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const newPlayer = await authClient.register(email, password, username);
      setPlayer(newPlayer);
      loadSessions();
      setEmail('');
      setPassword('');
      setUsername('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const loggedInPlayer = await authClient.login(email, password);
      setPlayer(loggedInPlayer);
      loadSessions();
      setEmail('');
      setPassword('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      await authClient.logout();
      setPlayer(null);
      setSessions([]);
    } catch (err) {
      setError('Logout failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    try {
      await authClient.revokeSession(sessionId);
      loadSessions();
    } catch (err) {
      setError('Failed to revoke session');
    }
  };

  if (player) {
    return (
      <div className="p-4">
        <div className="mb-4">
          <h2 className="text-xl font-bold">Welcome, {player.username}!</h2>
          <p>Email: {player.email}</p>
          {player.profile?.displayName && (
            <p>Display Name: {player.profile.displayName}</p>
          )}
          <button
            onClick={handleLogout}
            disabled={loading}
            className="mt-2 px-4 py-2 bg-red-500 text-white rounded disabled:opacity-50"
          >
            {loading ? 'Logging out...' : 'Logout'}
          </button>
        </div>

        <div className="mt-8">
          <h3 className="text-lg font-bold mb-2">Active Sessions</h3>
          {error && <p className="text-red-500 mb-2">{error}</p>}
          <div className="space-y-2">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="p-4 border rounded flex justify-between items-center"
              >
                <div>
                  <p>Browser: {session.userAgent || 'Unknown'}</p>
                  <p>IP: {session.ipAddress || 'Unknown'}</p>
                  <p className="text-sm text-gray-500">
                    Created: {new Date(session.createdAt).toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={() => handleRevokeSession(session.id)}
                  className="px-3 py-1 bg-red-500 text-white rounded text-sm"
                >
                  Revoke
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold mb-4">Authentication Demo</h1>
        {error && <p className="text-red-500 mb-4">{error}</p>}

        {/* Register Form */}
        <form onSubmit={handleRegister} className="mb-8">
          <h2 className="text-xl font-bold mb-2">Register</h2>
          <div className="space-y-4">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2 border rounded"
              required
            />
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full p-2 border rounded"
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 border rounded"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 bg-blue-500 text-white rounded disabled:opacity-50"
            >
              {loading ? 'Registering...' : 'Register'}
            </button>
          </div>
        </form>

        {/* Login Form */}
        <form onSubmit={handleLogin}>
          <h2 className="text-xl font-bold mb-2">Login</h2>
          <div className="space-y-4">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2 border rounded"
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 border rounded"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 bg-green-500 text-white rounded disabled:opacity-50"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}