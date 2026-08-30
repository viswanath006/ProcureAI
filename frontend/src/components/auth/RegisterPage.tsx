import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [roleCode, setRoleCode] = useState<'BIDDER' | 'GOVT_OFFICER' | 'AUDITOR'>('BIDDER');
  const [password, setPassword] = useState('ProcureAI_Dev_2026!');
  const [confirmPassword, setConfirmPassword] = useState('ProcureAI_Dev_2026!');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsSubmitting(true);
    const result = await register({
      full_name: fullName,
      email,
      role_code: roleCode,
      password,
    });
    setIsSubmitting(false);

    if (result.success) {
      navigate('/', { replace: true });
    } else {
      setError(result.error || 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-3 z-10">
        <Link to="/" className="inline-flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-procure-500 to-indigo-600 flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-procure-500/25">
            ⚡
          </div>
          <span className="text-2xl font-black tracking-tight text-white font-mono">
            Procure<span className="text-procure-400">AI</span>
          </span>
        </Link>
        <h2 className="text-xl font-bold text-slate-100">Create Principal Account</h2>
        <p className="text-xs text-slate-400 font-mono tracking-wider uppercase">
          Identity & Role-Based Authorization Registration
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10 px-4 sm:px-0">
        <div className="card-glass p-8 space-y-6">
          {error && (
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-400 flex items-start gap-2">
              <span className="text-base">⚠️</span>
              <div className="flex-1 font-medium">{error}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Full Name / Representative Name
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Dr. Rajesh Kumar / Sarah Jenkins"
                className="w-full px-3.5 py-2.5 rounded-lg bg-slate-900/80 border border-slate-800 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-procure-500/40 focus:border-procure-500 transition-all font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Official Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@dept.gov.in / rep@company.com"
                className="w-full px-3.5 py-2.5 rounded-lg bg-slate-900/80 border border-slate-800 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-procure-500/40 focus:border-procure-500 transition-all font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Account Role (RBAC Tier)
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setRoleCode('BIDDER')}
                  className={`p-2 rounded-lg text-xs font-semibold border transition-all text-center ${
                    roleCode === 'BIDDER'
                      ? 'bg-blue-500/20 border-blue-500 text-blue-300'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="text-base mb-0.5">🏢</div>
                  Bidder
                </button>

                <button
                  type="button"
                  onClick={() => setRoleCode('GOVT_OFFICER')}
                  className={`p-2 rounded-lg text-xs font-semibold border transition-all text-center ${
                    roleCode === 'GOVT_OFFICER'
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="text-base mb-0.5">🏛️</div>
                  Govt Officer
                </button>

                <button
                  type="button"
                  onClick={() => setRoleCode('AUDITOR')}
                  className={`p-2 rounded-lg text-xs font-semibold border transition-all text-center ${
                    roleCode === 'AUDITOR'
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="text-base mb-0.5">🔍</div>
                  Auditor
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg bg-slate-900/80 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-procure-500/40 focus:border-procure-500 transition-all font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Confirm Password
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg bg-slate-900/80 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-procure-500/40 focus:border-procure-500 transition-all font-mono"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 rounded-lg bg-gradient-to-r from-procure-600 to-indigo-600 hover:from-procure-500 hover:to-indigo-500 text-white text-sm font-semibold shadow-lg shadow-procure-600/30 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                  <span>Registering Principal...</span>
                </>
              ) : (
                <span>Register & Issue Access Token</span>
              )}
            </button>
          </form>

          <div className="text-center text-xs text-slate-400 pt-2">
            Already registered?{' '}
            <Link to="/login" className="text-procure-400 hover:text-procure-300 font-medium underline">
              Sign In to Existing Session
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
