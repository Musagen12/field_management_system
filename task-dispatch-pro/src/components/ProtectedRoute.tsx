import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { isAuthenticated, authStorage } from '@/lib/auth';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: 'admin' | 'worker';
}

export const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole) {
    const user = authStorage.getUser();
    if (!user || user.role !== requiredRole) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return <>{children}</>;
};