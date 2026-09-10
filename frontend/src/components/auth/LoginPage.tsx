import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, user, logout } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('ProcureAI_Dev_2026!');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const from = (location.state as any)?.from?.pathname || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const result = await login({ email, password });
    setIsSubmitting(false);

    if (result.success) {
      navigate(from, { replace: true });
    } else {
      setError(result.error || 'Login failed. Please check your credentials.');
    }
  };

  const handleQuickLogin = async (demoEmail: string) => {
    setEmail(demoEmail);
    setError(null);
    setIsSubmitting(true);
    const result = await login({ email: demoEmail, password: 'ProcureAI_Dev_2026!' });
    setIsSubmitting(false);
    if (result.success) {
      navigate(from, { replace: true });
    } else {
      setError(result.error || 'Login failed.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-3">
        <Link to="/" className="inline-flex items-center gap-3 group">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-md group-hover:shadow-lg transition-shadow">
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 text-white" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 18L9 6l6 7 4-5" />
              <circle cx="19" cy="6" r="2" fill="currentColor" stroke="none" />
            </svg>
          </div>
          <span className="text-2xl font-black tracking-tight text-gray-900">
            Procure<span className="text-blue-600">AI</span>
          </span>
        </Link>
        <h2 className="text-xl font-bold text-gray-800">Sign in to your account</h2>
        <p className="text-sm text-gray-500">Intelligent. Fair. Transparent.</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="card-glass p-8 space-y-6">
          {isAuthenticated && user && (
            <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-sm flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-xs">Currently signed in as:</p>
                <p className="font-semibold text-gray-800">{user.email}</p>
              </div>
              <button
                onClick={() => logout()}
                className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-medium transition-colors"
              >
                Sign out
              </button>
            </div>
          )}

          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-sm text-red-600 flex items-start gap-2">
              <span className="text-base">⚠️</span>
              <div className="flex-1 font-medium">{error}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@domain.gov.in"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-gray-800 text-sm placeholder:text-gray-400 outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-gray-800 text-sm placeholder:text-gray-400 outline-none transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Quick Login Shortcuts */}
          <div className="pt-4 border-t border-gray-200">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 text-center">
              Quick Sign In — Demo Accounts
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('officer.suresh@finance.gov.in')}
                className="p-3 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-left transition-colors"
              >
                <div className="text-xs font-bold text-amber-700 flex items-center gap-1.5">
                  🏛️ Government Officer
                </div>
                <div className="text-[11px] text-amber-600 mt-0.5">Manage Tenders & Decisions</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('bidder.alpha@alphacorp.dev')}
                className="p-3 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-left transition-colors"
              >
                <div className="text-xs font-bold text-blue-700 flex items-center gap-1.5">
                  🏢 Bidder
                </div>
                <div className="text-[11px] text-blue-600 mt-0.5">Submit Bids</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('auditor.priya@cag.gov.in')}
                className="p-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-left transition-colors"
              >
                <div className="text-xs font-bold text-emerald-700 flex items-center gap-1.5">
                  🔍 Auditor
                </div>
                <div className="text-[11px] text-emerald-600 mt-0.5">View Audit Records</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('admin.rajesh@procureai.gov.in')}
                className="p-3 rounded-xl bg-red-50 hover:bg-red-100 border border-red-200 text-left transition-colors"
              >
                <div className="text-xs font-bold text-red-700 flex items-center gap-1.5">
                  ⚙️ Administrator
                </div>
                <div className="text-[11px] text-red-600 mt-0.5">System Management</div>
              </button>
            </div>
          </div>

          <div className="text-center text-sm text-gray-500">
            Don't have an account?{' '}
            <Link to="/register" className="text-blue-600 hover:text-blue-700 font-medium underline">
              Register
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
