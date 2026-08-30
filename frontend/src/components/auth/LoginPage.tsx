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
      setError(result.error || 'Authentication failed');
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
      setError(result.error || 'Quick login failed');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-procure-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-3 z-10">
        <Link to="/" className="inline-flex items-center gap-3 group">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-procure-500 to-indigo-600 flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-procure-500/25 group-hover:scale-105 transition-transform">
            ⚡
          </div>
          <span className="text-2xl font-black tracking-tight text-white font-mono">
            Procure<span className="text-procure-400">AI</span>
          </span>
        </Link>
        <h2 className="text-xl font-bold text-slate-100">Secure Access Portal</h2>
        <p className="text-xs text-procure-400 font-mono tracking-wider uppercase font-semibold">
          Intelligent. Fair. Transparent.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10 px-4 sm:px-0">
        <div className="card-glass p-8 space-y-6">
          {isAuthenticated && user && (
            <div className="p-4 rounded-xl bg-procure-500/10 border border-procure-500/30 text-xs flex items-center justify-between">
              <div>
                <p className="text-slate-300">Currently logged in as:</p>
                <p className="font-semibold text-procure-300 font-mono">
                  {user.email} <span className="text-amber-400">[{user.role_code}]</span>
                </p>
              </div>
              <button
                onClick={() => logout()}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs transition-colors"
              >
                Log out
              </button>
            </div>
          )}

          {error && (
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-400 flex items-start gap-2">
              <span className="text-base">⚠️</span>
              <div className="flex-1 font-medium">{error}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Government / Corporate Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@domain.gov.in"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/80 border border-slate-800 focus:border-procure-500 text-slate-100 text-sm placeholder:text-slate-500 outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Cryptographic Key / Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/80 border border-slate-800 focus:border-procure-500 text-slate-100 text-sm placeholder:text-slate-500 outline-none transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-procure-600 to-indigo-600 hover:from-procure-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-lg shadow-procure-500/25 transition-all disabled:opacity-50"
            >
              {isSubmitting ? 'Authenticating Principal...' : 'Sign In to Workspace →'}
            </button>
          </form>

          {/* Quick Demo Switcher */}
          <div className="pt-4 border-t border-slate-800/80">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2.5 text-center font-mono">
              SIH Judging Quick Role Logins
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('officer.suresh@finance.gov.in')}
                className="p-2.5 rounded-lg bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 hover:border-amber-500/40 text-left transition-all group"
              >
                <div className="text-[11px] font-bold text-amber-400 flex items-center gap-1.5 font-mono">
                  <span>🏛️</span> Govt Officer
                </div>
                <div className="text-[10px] text-slate-400 truncate mt-0.5 font-mono">officer.suresh</div>
                <div className="text-[9px] text-slate-500 font-sans">Tenders & Decisions</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('bidder.alpha@alphacorp.dev')}
                className="p-2.5 rounded-lg bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 hover:border-blue-500/40 text-left transition-all group"
              >
                <div className="text-[11px] font-bold text-blue-400 flex items-center gap-1.5 font-mono">
                  <span>🏢</span> Bidder Rep
                </div>
                <div className="text-[10px] text-slate-400 truncate mt-0.5 font-mono">Apex Infra</div>
                <div className="text-[9px] text-slate-500 font-sans">Sealed Submissions</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('auditor.priya@cag.gov.in')}
                className="p-2.5 rounded-lg bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 hover:border-emerald-500/40 text-left transition-all group"
              >
                <div className="text-[11px] font-bold text-emerald-400 flex items-center gap-1.5 font-mono">
                  <span>🔍</span> CAG Auditor
                </div>
                <div className="text-[10px] text-slate-400 truncate mt-0.5 font-mono">auditor.priya</div>
                <div className="text-[9px] text-slate-500 font-sans">Immutable Audit Chain</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('admin.rajesh@procureai.gov.in')}
                className="p-2.5 rounded-lg bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 hover:border-rose-500/40 text-left transition-all group"
              >
                <div className="text-[11px] font-bold text-rose-400 flex items-center gap-1.5 font-mono">
                  <span>⚙️</span> Admin
                </div>
                <div className="text-[10px] text-slate-400 truncate mt-0.5 font-mono">admin.rajesh</div>
                <div className="text-[9px] text-slate-500 font-sans">System & Security</div>
              </button>
            </div>
          </div>

          <div className="text-center text-xs text-slate-400 pt-2">
            Need a new account?{' '}
            <Link to="/register" className="text-procure-400 hover:text-procure-300 font-medium underline">
              Register New Entity
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
