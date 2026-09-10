import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

<<<<<<< HEAD
=======
const FONT = "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif";

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 14,
  fontWeight: 500,
  color: '#111827',
  marginBottom: 4,
  lineHeight: '20px',
  fontFamily: FONT,
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  height: 40,
  boxSizing: 'border-box',
  padding: '0 12px',
  fontSize: 14,
  lineHeight: '38px',
  color: '#111827',
  backgroundColor: '#ffffff',
  border: '1px solid #D1D5DB',
  borderRadius: 6,
  outline: 'none',
  fontFamily: FONT,
  transition: 'border-color 0.15s ease-in-out',
};

>>>>>>> 4169a4f (Recreated professional README and organized assets)
export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [roleCode, setRoleCode] = useState<'BIDDER' | 'GOVT_OFFICER' | 'AUDITOR'>('BIDDER');
<<<<<<< HEAD
  const [password, setPassword] = useState('ProcureAI_Dev_2026!');
  const [confirmPassword, setConfirmPassword] = useState('ProcureAI_Dev_2026!');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
=======
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
>>>>>>> 4169a4f (Recreated professional README and organized assets)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
<<<<<<< HEAD

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
=======
    setSubmitting(true);
    const r = await register({ full_name: fullName, email, role_code: roleCode, password });
    setSubmitting(false);
    if (r.success) navigate('/', { replace: true });
    else setError(r.error || 'Registration failed.');
  };

  const focusIn = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.borderColor = '#22C55E';
    e.currentTarget.style.borderWidth = '1.5px';
  };

  const focusOut = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.borderColor = '#D1D5DB';
    e.currentTarget.style.borderWidth = '1px';
  };

  const roles: { code: 'BIDDER' | 'GOVT_OFFICER' | 'AUDITOR'; label: string }[] = [
    { code: 'BIDDER', label: 'Bidder' },
    { code: 'GOVT_OFFICER', label: 'Govt Officer' },
    { code: 'AUDITOR', label: 'Auditor' },
  ];

  return (
    <div style={{ fontFamily: FONT, background: '#fff', minHeight: '100vh', display: 'flex', flexDirection: 'column', color: '#111827', position: 'relative' }}>

      {/* ── Background Image Layer (Subtle Opacity 0.15 with Ambient Wave) ── */}
      <div style={{
        position: 'fixed',
        inset: 0,
        backgroundImage: 'url(/login-bg.jpeg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        opacity: 0.15,
        pointerEvents: 'none',
        zIndex: 0,
        animation: 'bgAmbientWave 0.9s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      }} />

      {/* autofill & placeholder overrides */}
      <style>{`
        @keyframes authPageCard {
          0% {
            opacity: 0;
            transform: translateY(16px) scale(0.985) rotateX(3deg);
            filter: blur(3px);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1) rotateX(0deg);
            filter: blur(0px);
          }
        }
        @keyframes authItemCascade {
          0% {
            opacity: 0;
            transform: translateY(10px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes bgAmbientWave {
          0% {
            transform: scale(1.02);
            opacity: 0.08;
          }
          100% {
            transform: scale(1);
            opacity: 0.15;
          }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        input::placeholder { color: #CBD5E1 !important; font-size: 14px; opacity: 1; }
        input:focus { outline: none !important; box-shadow: none !important; }
        input:-webkit-autofill,
        input:-webkit-autofill:hover,
        input:-webkit-autofill:focus {
          -webkit-box-shadow: 0 0 0px 1000px #ffffff inset !important;
          -webkit-text-fill-color: #111827 !important;
        }
      `}</style>

      {/* ── 1. Top Navigation Bar ── */}
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px 48px 0px', position: 'relative', zIndex: 1 }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
          <div style={{ width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg viewBox="0 0 24 24" fill="none" style={{ width: 24, height: 24 }} stroke="#22C55E" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="5" stroke="#22C55E" strokeWidth="2.2" />
              <path d="M8 12l3 3 5-6" stroke="#22C55E" strokeWidth="2.2" />
            </svg>
          </div>
          <div style={{ lineHeight: 1.1 }}>
            <div style={{ fontSize: 16, fontWeight: 600, color: '#111827', fontFamily: FONT, letterSpacing: '-0.01em' }}>procureai</div>
            <div style={{ fontSize: 11, color: '#6B7280', fontWeight: 400, fontFamily: FONT }}>
              by <span style={{ color: '#2563EB', fontWeight: 500 }}>govt</span>
            </div>
          </div>
        </Link>

        <p style={{
          fontSize: 14,
          lineHeight: '20px',
          color: '#6B7280',
          margin: 0,
          fontFamily: FONT,
          fontWeight: 400,
          letterSpacing: '-0.01em',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}>
          <span>Already have an account?</span>
          <Link to="/login" style={{
            color: '#111827',
            fontWeight: 500,
            textDecoration: 'underline',
            textDecorationColor: '#111827',
            textDecorationThickness: '1px',
            textUnderlineOffset: '2px',
            letterSpacing: '-0.01em',
          }}>
            Log in
          </Link>
        </p>
      </header>

      {/* ── 2. Main Form Container ── */}
      <main style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'flex-start', paddingTop: 80, paddingBottom: 48, paddingLeft: 24, paddingRight: 24, position: 'relative', zIndex: 1, perspective: 1000 }}>
        <div style={{
          width: '100%',
          maxWidth: 368,
          margin: '0 auto',
          animation: 'authPageCard 0.62s cubic-bezier(0.16, 1, 0.3, 1) forwards',
          transformOrigin: '50% 0%',
          backfaceVisibility: 'hidden',
          willChange: 'transform, opacity, filter',
        }}>

          {/* ── 3. Heading ── */}
          <h1 style={{ fontSize: 36, lineHeight: '44px', fontWeight: 500, color: '#111827', letterSpacing: '-0.025em', marginBottom: 32, textAlign: 'center', fontFamily: FONT, animation: 'authItemCascade 0.55s cubic-bezier(0.16, 1, 0.3, 1) 0.03s both' }}>
            Create your account
          </h1>

          {/* Error Banner */}
          {error && (
            <div style={{ marginBottom: 20, padding: '10px 12px', borderRadius: 6, background: '#fff5f5', border: '1px solid #ffd5d5', fontSize: 13, color: '#c0392b', fontFamily: FONT, lineHeight: '20px' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} autoComplete="off" style={{ animation: 'authItemCascade 0.55s cubic-bezier(0.16, 1, 0.3, 1) 0.06s both' }}>

            {/* Email */}
            <div style={{ marginBottom: 24 }}>
              <label style={labelStyle}>Email</label>
              <input type="email" required autoComplete="off" value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                style={inputStyle} onFocus={focusIn} onBlur={focusOut} />
            </div>

            {/* Full name */}
            <div style={{ marginBottom: 24 }}>
              <label style={labelStyle}>Full name</label>
              <input type="text" required autoComplete="off" value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Alex Morgan"
                style={inputStyle} onFocus={focusIn} onBlur={focusOut} />
            </div>

            {/* Role Pills */}
            <div style={{ marginBottom: 24 }}>
              <label style={labelStyle}>Role</label>
              <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                {roles.map((r) => (
                  <button
                    key={r.code}
                    type="button"
                    onClick={() => setRoleCode(r.code)}
                    style={{
                      flex: 1,
                      height: 38,
                      borderRadius: 6,
                      border: `1px solid ${roleCode === r.code ? '#111827' : '#E5E7EB'}`,
                      background: roleCode === r.code ? '#111827' : '#ffffff',
                      color: roleCode === r.code ? '#ffffff' : '#6B7280',
                      fontSize: 12,
                      fontWeight: 500,
                      cursor: 'pointer',
                      fontFamily: FONT,
                      transition: 'all 0.15s ease-in-out',
                    }}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Password */}
            <div style={{ marginBottom: 24 }}>
              <label style={labelStyle}>Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPw ? 'text' : 'password'} required autoComplete="new-password"
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  style={{ ...inputStyle, paddingRight: 36 }}
                  onFocus={focusIn} onBlur={focusOut}
                />
                {/* Eye Icon */}
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  aria-label={showPw ? "Hide password" : "Show password"}
                  style={{
                    position: 'absolute',
                    right: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 20,
                    height: 20,
                    color: '#6B7280',
                    transition: 'color 0.15s ease',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = '#111827'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = '#6B7280'; }}
                >
                  {showPw ? (
                    /* Eye Off */
                    <svg style={{ width: 18, height: 18 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                      <path d="M6.61 6.61A13.52 13.52 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                      <line x1="2" y1="2" x2="22" y2="22" />
                    </svg>
                  ) : (
                    /* Eye Open */
                    <svg style={{ width: 18, height: 18 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
>>>>>>> 4169a4f (Recreated professional README and organized assets)
                </button>
              </div>
            </div>

<<<<<<< HEAD
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
=======
            {/* Legal Text */}
            <p style={{ fontSize: 12, lineHeight: '16px', color: '#6B7280', marginTop: 24, marginBottom: 20, textAlign: 'center', fontFamily: FONT }}>
              By creating an account you accept our{' '}
              <span style={{ color: '#111827', textDecoration: 'underline', textDecorationThickness: '1px', textUnderlineOffset: 3, cursor: 'pointer' }}>Terms</span>
              {' '}and{' '}
              <span style={{ color: '#111827', textDecoration: 'underline', textDecorationThickness: '1px', textUnderlineOffset: 3, cursor: 'pointer' }}>Privacy Policy.</span>
            </p>

            {/* Submit */}
            <button type="submit" disabled={submitting}
              style={{
                width: '100%', height: 44, borderRadius: 9999,
                backgroundColor: '#18181B', color: '#FFFFFF',
                fontSize: 14, fontWeight: 500, border: 'none', marginTop: 0,
                cursor: submitting ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                fontFamily: FONT, opacity: submitting ? 0.65 : 1,
                transition: 'opacity 0.15s',
              }}
            >
              {submitting
                ? <><div style={{ width: 13, height: 13, borderRadius: '50%', border: '2px solid rgba(255,255,255,.25)', borderTopColor: '#fff', animation: 'spin .7s linear infinite' }} />Creating account…</>
                : 'Create Free Account'}
            </button>
          </form>

        </div>
      </main>
>>>>>>> 4169a4f (Recreated professional README and organized assets)
    </div>
  );
};
