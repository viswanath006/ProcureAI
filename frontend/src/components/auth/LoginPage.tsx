import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

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

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [activeDemo, setActiveDemo] = useState<string | null>(null);
  const from = (location.state as any)?.from?.pathname || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const r = await login({ email, password });
    setSubmitting(false);
    if (r.success) navigate(from, { replace: true });
    else setError(r.error || 'Invalid email or password.');
  };

  const handleDemo = async (demoEmail: string) => {
    setActiveDemo(demoEmail);
    setError(null);
    const r = await login({ email: demoEmail, password: 'ProcureAI_Dev_2026!' });
    setActiveDemo(null);
    if (r.success) navigate(from, { replace: true });
    else setError(r.error || 'Login failed.');
  };

  const focusIn = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.borderColor = '#22C55E';
    e.currentTarget.style.borderWidth = '1.5px';
  };

  const focusOut = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.borderColor = '#D1D5DB';
    e.currentTarget.style.borderWidth = '1px';
  };

  const demos = [
    { email: 'officer.suresh@finance.gov.in', label: 'Govt Officer', icon: '🏛️' },
    { email: 'bidder.alpha@alphacorp.dev', label: 'Bidder', icon: '🏢' },
    { email: 'auditor.priya@cag.gov.in', label: 'Auditor', icon: '🔍' },
    { email: 'admin.rajesh@procureai.gov.in', label: 'Administrator', icon: '⚙️' },
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
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <img
            src="/logo.png"
            alt="ProcureAI Logo"
            style={{ width: 32, height: 32, objectFit: 'contain', flexShrink: 0 }}
          />
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
          <span>Don't have an account?</span>
          <Link to="/register" style={{
            color: '#111827',
            fontWeight: 500,
            textDecoration: 'underline',
            textDecorationColor: '#111827',
            textDecorationThickness: '1px',
            textUnderlineOffset: '2px',
            letterSpacing: '-0.01em',
          }}>
            Sign up
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
            Welcome back
          </h1>

          {/* Demo buttons */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16, animation: 'authItemCascade 0.55s cubic-bezier(0.16, 1, 0.3, 1) 0.06s both' }}>
            {demos.map((d) => (
              <button key={d.email} type="button"
                onClick={() => handleDemo(d.email)}
                disabled={!!activeDemo}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                  padding: '0 12px', height: 38, borderRadius: 6,
                  border: '1px solid #dde0e3', background: '#fff',
                  fontSize: 13, fontWeight: 400, color: '#111827',
                  cursor: 'pointer', fontFamily: FONT, width: '100%',
                  boxSizing: 'border-box',
                  opacity: activeDemo && activeDemo !== d.email ? 0.4 : 1,
                  transition: 'border-color 0.12s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#bbb'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#dde0e3'; }}
              >
                {activeDemo === d.email
                  ? <div style={{ width: 13, height: 13, borderRadius: '50%', border: '1.5px solid #ccc', borderTopColor: '#555', animation: 'spin .7s linear infinite', flexShrink: 0 }} />
                  : <span style={{ fontSize: 15, lineHeight: 1, flexShrink: 0 }}>{d.icon}</span>
                }
                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {d.label}
                </span>
              </button>
            ))}
          </div>

          {/* OR divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0 24px', fontFamily: FONT, animation: 'authItemCascade 0.55s cubic-bezier(0.16, 1, 0.3, 1) 0.09s both' }}>
            <div style={{ flex: 1, height: 1, background: '#ebebeb' }} />
            <span style={{ fontSize: 12, color: '#9ca3af', letterSpacing: '0.04em' }}>OR</span>
            <div style={{ flex: 1, height: 1, background: '#ebebeb' }} />
          </div>

          {/* Error Banner */}
          {error && (
            <div style={{ marginBottom: 20, padding: '10px 12px', borderRadius: 6, background: '#fff5f5', border: '1px solid #ffd5d5', fontSize: 13, color: '#c0392b', fontFamily: FONT }}>
              {error}
            </div>
          )}

          {/* ── 4. Form & Input Fields ── */}
          <form onSubmit={handleSubmit} autoComplete="off" style={{ animation: 'authItemCascade 0.55s cubic-bezier(0.16, 1, 0.3, 1) 0.12s both' }}>
            {/* Email */}
            <div style={{ marginBottom: 24 }}>
              <label style={labelStyle}>Email</label>
              <input type="email" required autoComplete="off"
                value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                style={inputStyle} onFocus={focusIn} onBlur={focusOut} />
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
                </button>
              </div>
            </div>

            {/* ── 7. Primary Button ── */}
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
                ? <><div style={{ width: 13, height: 13, borderRadius: '50%', border: '2px solid rgba(255,255,255,.25)', borderTopColor: '#fff', animation: 'spin .7s linear infinite' }} />Signing in…</>
                : 'Log In'}
            </button>
          </form>

          {/* Footer links */}
          <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, animation: 'authItemCascade 0.55s cubic-bezier(0.16, 1, 0.3, 1) 0.15s both' }}>
            <Link to="/register" style={{ fontSize: 14, color: '#111827', fontWeight: 400, textDecoration: 'underline', textUnderlineOffset: 3, textDecorationThickness: '1px', fontFamily: FONT }}>
              Create an account
            </Link>
          </div>

        </div>
      </main>
    </div>
  );
};
