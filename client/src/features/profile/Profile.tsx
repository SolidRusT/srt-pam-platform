import React, { useState, useEffect } from 'react';
import { useAuth } from '../../lib/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Bell, Key, LogOut, Shield, User } from 'lucide-react';

export function Profile() {
  const { player, updateProfile, getActiveSessions, revokeSession } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [sessions, setSessions] = useState([]);
  const [displayName, setDisplayName] = useState(player?.profile?.displayName || '');
  const [bio, setBio] = useState(player?.profile?.bio || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Load active sessions
  useEffect(() => {
    const loadSessions = async () => {
      try {
        const activeSessions = await getActiveSessions();
        setSessions(activeSessions);
      } catch (err) {
        console.error('Failed to load sessions:', err);
      }
    };
    loadSessions();
  }, [getActiveSessions]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await updateProfile(displayName, undefined, bio);
      setSuccess('Profile updated successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    try {
      await revokeSession(sessionId);
      setSessions(sessions.filter(session => session.id !== sessionId));
      setSuccess('Session revoked successfully');
    } catch (err) {
      setError('Failed to revoke session');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid gap-6">
        {/* Profile Header */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={player?.profile?.avatar} />
                <AvatarFallback>
                  {player?.username?.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-2xl font-bold">{displayName || player?.username}</h2>
                <p className="text-gray-500">{player?.email}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Security
            </TabsTrigger>
            <TabsTrigger value="sessions" className="flex items-center gap-2">
              <LogOut className="h-4 w-4" />
              Sessions
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notifications
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpdateProfile} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Display Name</label>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full rounded-md border p-2"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Bio</label>
                    <textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      rows={4}
                      className="w-full rounded-md border p-2"
                    />
                  </div>

                  {error && (
                    <div className="rounded-md bg-red-50 p-4 text-red-700">
                      {error}
                    </div>
                  )}

                  {success && (
                    <div className="rounded-md bg-green-50 p-4 text-green-700">
                      {success}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-medium">Password</h3>
                      <p className="text-sm text-gray-500">Update your password</p>
                    </div>
                    <button className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
                      <Key className="h-4 w-4" />
                      Change Password
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-medium">Two-Factor Authentication</h3>
                      <p className="text-sm text-gray-500">Add extra security to your account</p>
                    </div>
                    <button className="flex items-center gap-2 rounded-md border px-4 py-2 hover:bg-gray-50">
                      Enable 2FA
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sessions Tab */}
          <TabsContent value="sessions">
            <Card>
              <CardHeader>
                <CardTitle>Active Sessions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {sessions.map((session) => (
                    <div key={session.id} className="flex items-center justify-between rounded-lg border p-4">
                      <div>
                        <p className="font-medium">{session.userAgent}</p>
                        <p className="text-sm text-gray-500">Last active: {new Date(session.lastActive).toLocaleString()}</p>
                        <p className="text-sm text-gray-500">IP: {session.ipAddress}</p>
                      </div>
                      <button
                        onClick={() => handleRevokeSession(session.id)}
                        className="rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700"
                      >
                        Revoke
                      </button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Email Notifications</h3>
                      <p className="text-sm text-gray-500">Receive email updates</p>
                    </div>
                    <input type="checkbox" className="h-6 w-6" />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Push Notifications</h3>
                      <p className="text-sm text-gray-500">Receive push notifications</p>
                    </div>
                    <input type="checkbox" className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}