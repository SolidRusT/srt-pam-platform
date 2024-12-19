import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../../lib/AuthContext';

export function ResetPassword() {
  const { resetPassword, verifyResetToken } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [token] = useState(searchParams.get('token') || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tokenValid, setTokenValid] = useState(false);
  const [verifying, setVerifying] = useState(true);

  useEffect(() => {
    async function checkToken() {
      try {
        const result = await verifyResetToken(token);
        setTokenValid(result.valid);
      } catch (err) {
        setError('Invalid or expired reset token');
      } finally {
        setVerifying(false);
      }
    }

    if (token) {
      checkToken();
    } else {
      setVerifying(false);
      setError('No reset token provided');
    }
  }, [token, verifyResetToken]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await resetPassword(token, newPassword);
      // Redirect to login with success message
      navigate('/login', { 
        state: { message: 'Password reset successful. Please login with your new password.' }
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  if (verifying) {
    return <div>Verifying reset token...</div>;
  }

  if (!tokenValid) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Invalid Reset Link</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>This password reset link is invalid or has expired.</p>
              <p className="mt-2">
                <button
                  onClick={() => navigate('/login')}
                  className="text-red-800 underline hover:text-red-600"
                >
                  Return to login
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
          New Password
        </label>
        <input
          type="password"
          id="newPassword"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
        />
      </div>

      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
          Confirm New Password
        </label>
        <input
          type="password"
          id="confirmPassword"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
        />
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        {loading ? 'Resetting Password...' : 'Reset Password'}
      </button>
    </form>
  );
}