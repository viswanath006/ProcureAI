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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
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
      code === 'GOVT_OFFICER' ? 'Government Officer' : code === 'BIDDER' ? 'Bidder' : code === 'AUDITOR' ? 'Auditor' : code === 'ADMIN' ? 'Administrator' : code;

    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <div className="card-glass max-w-md w-full p-8 text-center space-y-5">
          <div className="w-14 h-14 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center mx-auto text-3xl">
            🔒
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-bold text-gray-800">Access Restricted</h2>
            <p className="text-sm text-gray-500">
              Your current role (<span className="font-semibold text-gray-700">{roleLabel(user.role_code)}</span>) does not have permission to view this section.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 text-left text-sm space-y-2">
            <div className="flex justify-between text-gray-500">
              <span>Your Role:</span>
              <span className="font-semibold text-gray-700">{roleLabel(user.role_code)}</span>
            </div>
            <div className="flex justify-between text-gray-500">
              <span>Required Role:</span>
              <span className="font-semibold text-blue-600">{allowedRoles.map(roleLabel).join(' or ')}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              to="/"
              className="flex-1 px-4 py-2.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium transition-colors"
            >
              Go to Home
            </Link>
            <Link
              to="/login"
              className="flex-1 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors shadow-sm"
            >
              Sign In with Different Role
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
