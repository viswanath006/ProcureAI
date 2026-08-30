import React from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: Array<'ADMIN' | 'GOVT_OFFICER' | 'BIDDER' | 'AUDITOR' | 'EVALUATOR'>;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-procure-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-procure-500/20 border-t-procure-400 animate-spin" />
          <p className="text-sm text-procure-400 font-medium tracking-wide animate-pulse">
            Verifying cryptographic credentials...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role_code)) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-6">
        <div className="card-glass max-w-lg w-full p-8 border-red-500/30 text-center space-y-6 animate-fade-in">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto text-red-400 text-3xl">
            🛡️
          </div>

          <div className="space-y-2">
            <span className="badge-danger text-xs uppercase tracking-wider font-semibold">
              403 Forbidden — RBAC Enforcement
            </span>
            <h2 className="text-2xl font-bold text-slate-100">Access Restricted</h2>
            <p className="text-sm text-slate-400">
              Your assigned role <span className="font-semibold text-procure-300">[{user.role_code}]</span> does
              not have authorization to view this procurement resource.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-left text-xs space-y-2 font-mono">
            <div className="flex justify-between text-slate-400">
              <span>Authenticated User:</span>
              <span className="text-slate-200">{user.email}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Current Role:</span>
              <span className="text-amber-400 font-bold">{user.role_code}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Required Role(s):</span>
              <span className="text-emerald-400 font-bold">{allowedRoles.join(', ')}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Link
              to="/"
              className="flex-1 px-4 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium transition-colors"
            >
              Return to Hub
            </Link>
            <Link
              to="/login"
              className="flex-1 px-4 py-2.5 rounded-lg bg-procure-600 hover:bg-procure-500 text-white text-sm font-medium transition-colors shadow-lg shadow-procure-600/30"
            >
              Switch Role
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
