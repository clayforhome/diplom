import type { PropsWithChildren } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { jwtService } from '../utils/jwt';
import type { UserRole } from '../types';

interface ProtectedRouteProps extends PropsWithChildren {
  allowedRoles?: UserRole[];
}

export function ProtectedRoute({ allowedRoles, children }: ProtectedRouteProps) {
  const { token, roles } = useAuth();
  const storedToken = token ?? jwtService.getToken();

  if (!storedToken || jwtService.isExpired(storedToken)) {
    jwtService.clearToken();
    return <Navigate to="/auth/login" replace />;
  }

  if (allowedRoles && !allowedRoles.some((role) => roles.includes(role))) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
