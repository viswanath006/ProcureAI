import React from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const FONT = "'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: Array<'ADMIN' | 'GOVT_OFFICER' | 'BIDDER' | 'AUDITOR' | 'EVALUATOR'>;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div style={{ fontFamily: FONT }} className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin" />
          <p className="text-sm text-gray-500 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role_code)) {
    const roleLabel = (code: string) =>
      code === 'GOVT_OFFICER'
        ? 'Government Officer'
        : code === 'BIDDER'
          ? 'Bidder'
          : code === 'AUDITOR'
            ? 'Auditor'
            : code === 'ADMIN'
              ? 'Administrator'
              : code;

    return (
      <div style={{ fontFamily: FONT }} className="min-h-[65vh] flex items-center justify-center p-6">
        <div className="relative overflow-hidden max-w-md w-full p-8 sm:p-10 text-center rounded-3xl bg-white border border-gray-200/90 shadow-2xl animate-scale-up">
          {/* ── Cultural Security Artwork Background Layer (access-blocked.png) with reduced transparency ── */}
          <div
            className="absolute inset-0 pointer-events-none select-none z-0 rounded-3xl"
            style={{
              backgroundImage: 'url(/access-blocked.png)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              opacity: 0.90, // Rich, reduced transparency so Parliament dome, flag, and lock artwork pop vividly
            }}
          />
          {/* Subtle translucent tint ensuring crisp text legibility */}
          <div className="absolute inset-0 pointer-events-none select-none z-0 rounded-3xl bg-gradient-to-b from-white/15 via-transparent to-white/20" />

          {/* ── Foreground Content ── */}
          <div className="relative z-10 space-y-5">
            {/* Custom Security Lock Illustration (lock.png) */}
            <div className="w-24 h-24 mx-auto flex items-center justify-center">
              <img
                src="/lock.png"
                alt="Security Lock"
                className="w-full h-full object-contain drop-shadow-sm select-none pointer-events-none"
              />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold text-gray-900 tracking-tight">Access Restricted</h2>
              <p className="text-sm text-gray-600 leading-relaxed max-w-sm mx-auto">
                Your current role (<span className="font-semibold text-gray-900">{roleLabel(user.role_code)}</span>) does not have permission to view this section.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white/85 backdrop-blur-md border border-gray-200/90 text-left text-sm space-y-2.5 shadow-xs">
              <div className="flex justify-between items-center text-gray-600">
                <span className="font-medium">Your Role:</span>
                <span className="font-semibold text-gray-900">{roleLabel(user.role_code)}</span>
              </div>
              <div className="flex justify-between items-center text-gray-600 pt-2 border-t border-gray-100/90">
                <span className="font-medium">Required Role:</span>
                <span className="font-bold text-blue-600">{allowedRoles.map(roleLabel).join(' or ')}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-1">
              <Link
                to="/"
                className="flex-1 px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200/90 text-gray-700 text-sm font-semibold transition-all shadow-xs text-center cursor-pointer"
              >
                Go to Home
              </Link>
              <Link
                to="/login"
                className="flex-1 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-all shadow-sm text-center cursor-pointer"
              >
                Sign In with Different Role
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
