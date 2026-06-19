import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import type { UserRole } from '../types/auth';

const PageLoader = () => (
  <div className="d-flex justify-content-center align-items-center vh-100">
    <div className="spinner-border text-primary" role="status">
      <span className="visually-hidden">Loading...</span>
    </div>
  </div>
);

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, loading } = useAuth();
  const location = useLocation();

  if (loading) return <PageLoader />;

  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export const RoleProtectedRoute: React.FC<{ children: React.ReactNode, allowedRoles: UserRole[] }> = ({ children, allowedRoles }) => {
  const { userProfile, loading, role } = useAuth();

  if (loading) return <PageLoader />;

  if (!userProfile || !role || !allowedRoles.includes(role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};

export const AgentProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { userProfile, loading, role, isApprovedAgent, isSuspendedOrRejected } = useAuth();

  if (loading) return <PageLoader />;

  if (!userProfile || !role || (role !== 'agent' && role !== 'admin' && !isApprovedAgent)) {
    return <Navigate to="/unauthorized" replace />;
  }

  if (isSuspendedOrRejected) {
    return <Navigate to="/agent-status" replace />;
  }

  if (role === 'agent' && !isApprovedAgent) {
    return <Navigate to="/agent-status" replace />;
  }

  return <>{children}</>;
};
