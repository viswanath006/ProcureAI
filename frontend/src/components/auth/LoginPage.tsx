import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { DepartmentSelectModal } from '../common/DepartmentSelectModal';
import { GovtDepartment, getDepartmentEmail } from '../../data/govtDepartments';

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
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
  const [selectedDept, setSelectedDept] = useState<GovtDepartment | null>(null);
  const from = (location.state as any)?.from?.pathname || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const r = await login({ email, password });
    setSubmitting(false);
    if (r.success) {
      const isGovt = selectedRole === 'GOVT_OFFICER' || email.toLowerCase().endsWith('@govt.in');
      if (isGovt) {
        try {
          const saved = localStorage.getItem('procureai_user');
          const deptName = selectedDept?.name || (email.toLowerCase().includes('nhai')
            ? 'National Highways Authority of India (NHAI)'
            : email.toLowerCase().includes('rail')
            ? 'Railway Board & Zonal Rail Procurement'
            : email.toLowerCase().includes('defence') || email.toLowerCase().includes('mes')
            ? 'Military Engineer Services (MES)'
            : email.toLowerCase().includes('energy') || email.toLowerCase().includes('seci')
            ? 'Solar Energy Corporation of India (SECI Renewable Grid)'
            : email.toLowerCase().includes('tech') || email.toLowerCase().includes('nic')
            ? 'National Informatics Centre (NIC Central Procurement)'
            : email.toLowerCase().includes('health') || email.toLowerCase().includes('aiims')
            ? 'AIIMS Centralized Medical Equipment Procurement Cell'
            : email.toLowerCase().includes('water') || email.toLowerCase().includes('jal')
            ? 'Department of Drinking Water & Sanitation (Jal Jeevan Mission)'
            : email.toLowerCase().includes('edu')
            ? 'Department of School Education & Literacy'
            : email.toLowerCase().includes('agri')
            ? 'Department of Agriculture & Farmers Welfare (Farm Mechanization)'
            : 'Central Public Works Department (CPWD)');

          if (saved) {
            const parsed = JSON.parse(saved);
            parsed.department = deptName;
            localStorage.setItem('procureai_user', JSON.stringify(parsed));
          }
          localStorage.setItem('procureai_officer_department', deptName);
        } catch {}
      }
      navigate(from, { replace: true });
    } else {
      setError(r.error || 'Invalid email or password.');
    }
  };

  const handleRoleSelect = (roleCode: string, roleEmail: string) => {
    setSelectedRole(roleCode);
    setPassword('ProcureAI_Dev_2026!');
    setError(null);

    if (roleCode === 'GOVT_OFFICER') {
      const targetEmail = getDepartmentEmail(selectedDept);
      setEmail(targetEmail);
      setIsDeptModalOpen(true);
    } else {
      setEmail(roleEmail);
    }
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
    { role: 'GOVT_OFFICER', email: 'cpwddept@govt.in', label: 'Govt Officer', icon: '🏛️' },
    { role: 'BIDDER', email: 'bidder@alphacorp.dev', label: 'Bidder', icon: '🏢' },
    { role: 'AUDITOR', email: 'auditor@cag.gov.in', label: 'Auditor', icon: '🔍' },
    { role: 'ADMIN', email: 'admin@procureai.gov.in', label: 'Administrator', icon: '⚙️' },
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

          {/* 4 Role Selector Buttons (no direct login) */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: selectedRole === 'GOVT_OFFICER' ? 10 : 16, animation: 'authItemCascade 0.55s cubic-bezier(0.16, 1, 0.3, 1) 0.06s both' }}>
            {demos.map((d) => {
              const isSelected = selectedRole === d.role;
              return (
                <button
                  key={d.role}
                  type="button"
                  onClick={() => handleRoleSelect(d.role, d.email)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 7,
                    padding: '0 12px',
                    height: 38,
                    borderRadius: 6,
                    border: isSelected ? '1.5px solid #111827' : '1px solid #dde0e3',
                    backgroundColor: isSelected ? '#F3F4F6' : '#ffffff',
                    fontSize: 13,
                    fontWeight: isSelected ? 600 : 400,
                    color: '#111827',
                    cursor: 'pointer',
                    fontFamily: FONT,
                    width: '100%',
                    boxSizing: 'border-box',
                    transition: 'all 0.12s ease-in-out',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) e.currentTarget.style.borderColor = '#bbb';
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) e.currentTarget.style.borderColor = '#dde0e3';
                  }}
                >
                  <span style={{ fontSize: 15, lineHeight: 1, flexShrink: 0 }}>{d.icon}</span>
                  <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {d.label}
                  </span>
                  {isSelected && (
                    <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#16A34A', marginLeft: 2, flexShrink: 0 }} />
                  )}
                </button>
              );
            })}
          </div>

          {/* Department Selection (Displayed ONLY when Govt Officer is selected) */}
          {selectedRole === 'GOVT_OFFICER' && (
            <div style={{ marginBottom: 16, animation: 'authItemCascade 0.3s ease-out both' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <label style={{ ...labelStyle, fontSize: 12, margin: 0 }}>
                  Government Department <span style={{ color: '#EF4444' }}>*</span>
                </label>
                {selectedDept && (
                  <span style={{ fontSize: 11, color: '#16A34A', fontWeight: 600 }}>✓ Selected</span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setIsDeptModalOpen(true)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 8,
                  border: selectedDept ? '1.5px solid #16A34A' : '1.5px dashed #CBD5E1',
                  backgroundColor: selectedDept ? '#F0FDF4' : '#F8FAFC',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  fontFamily: FONT,
                  transition: 'all 0.15s ease',
                  textAlign: 'left',
                }}
                onMouseEnter={(e) => {
                  if (!selectedDept) {
                    e.currentTarget.style.borderColor = '#94A3B8';
                    e.currentTarget.style.backgroundColor = '#F1F5F9';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!selectedDept) {
                    e.currentTarget.style.borderColor = '#CBD5E1';
                    e.currentTarget.style.backgroundColor = '#F8FAFC';
                  }
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 9, minWidth: 0 }}>
                  <span style={{ fontSize: 18, flexShrink: 0 }}>🏛️</span>
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 12.5,
                        fontWeight: 600,
                        color: selectedDept ? '#15803D' : '#1E293B',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {selectedDept ? selectedDept.name : 'Select Department (Govt of India)...'}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: '#64748B',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        marginTop: 1,
                      }}
                    >
                      {selectedDept
                        ? `${selectedDept.ministry} • ${selectedDept.code}`
                        : 'Click to choose from all 41 Ministries & Departments'}
                    </div>
                  </div>
                </div>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: selectedDept ? '#16A34A' : '#2563EB',
                    padding: '3px 8px',
                    borderRadius: 4,
                    backgroundColor: selectedDept ? '#DCFCE7' : '#EFF6FF',
                    flexShrink: 0,
                    marginLeft: 8,
                  }}
                >
                  {selectedDept ? 'Change' : 'Browse All'}
                </span>
              </button>
            </div>
          )}

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

      <DepartmentSelectModal
        isOpen={isDeptModalOpen}
        onClose={() => setIsDeptModalOpen(false)}
        selectedDepartment={selectedDept?.name || ''}
        onSelect={(dept) => {
          setSelectedDept(dept);
          setSelectedRole('GOVT_OFFICER');
          setEmail(getDepartmentEmail(dept));
          setPassword('ProcureAI_Dev_2026!');
        }}
        title="Select Government Department"
        subtitle="Choose your Ministry or Department under the Government of India"
      />
    </div>
  );
};
