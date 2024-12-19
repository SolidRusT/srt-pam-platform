import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './lib/AuthContext';
import { AuthDemo } from './features/auth/AuthDemo';
import { Profile } from './features/profile/Profile';
import { Layout } from './components/Layout';

function RequireAuth({ children }: { children: JSX.Element }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

export function AppRoutes() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={
          isAuthenticated 
            ? <Navigate to="/profile" replace /> 
            : <Navigate to="/login" replace />
        } />
        
        {/* Auth routes */}
        <Route path="login" element={
          !isAuthenticated 
            ? <AuthDemo initialTab="login" /> 
            : <Navigate to="/profile" replace />
        } />
        <Route path="register" element={
          !isAuthenticated 
            ? <AuthDemo initialTab="register" /> 
            : <Navigate to="/profile" replace />
        } />
        
        {/* Protected routes */}
        <Route path="profile" element={
          <RequireAuth>
            <Profile />
          </RequireAuth>
        } />
        
        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}