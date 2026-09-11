import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LoginPage } from './components/auth/LoginPage';
import { RegisterPage } from './components/auth/RegisterPage';
import { ProtectedRoute } from './components/ProtectedRoute';
import { TendersPortal } from './components/portals/TendersPortal';
import { BidderPortal } from './components/portals/BidderPortal';
import { AuditorPortal } from './components/portals/AuditorPortal';
import { AdminPortal } from './components/portals/AdminPortal';

const FONT = "'SF Pro Display', -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'San Francisco', 'Helvetica Neue', 'Segoe UI', Roboto, sans-serif";

function NavigationHeader() {
  const { user, isAuthenticated, logout, switchDemoRole } = useAuth();
  const [roleOpen, setRoleOpen] = useState(false);

  const roles = [
    { label: 'Government Officer', email: 'officer.suresh@finance.gov.in', code: 'GOVT_OFFICER', color: 'text-amber-700 bg-amber-50 border-amber-200' },
    { label: 'Bidder', email: 'bidder.alpha@alphacorp.dev', code: 'BIDDER', color: 'text-blue-700 bg-blue-50 border-blue-200' },
    { label: 'Auditor', email: 'auditor.priya@cag.gov.in', code: 'AUDITOR', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
    { label: 'Administrator', email: 'admin.rajesh@procureai.gov.in', code: 'ADMIN', color: 'text-red-700 bg-red-50 border-red-200' },
  ];

  const currentRole = roles.find((r) => r.code === user?.role_code);

  return (
    <header style={{ fontFamily: FONT }} className="sticky top-0 z-40 border-b border-gray-200 bg-white/95 backdrop-blur-md shadow-xs">
      <div className="w-full flex items-center justify-between px-4 sm:px-6 lg:px-8 py-3">
        {/* Logo & Brand in left corner matching LoginPage */}
        <div className="flex items-center">
          <Link to="/" className="flex items-center gap-2 group text-decoration-none">
            <div className="w-[26px] h-[26px] flex items-center justify-center shrink-0">
              <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="#22C55E" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="5" stroke="#22C55E" strokeWidth="2.2" />
                <path d="M8 12l3 3 5-6" stroke="#22C55E" strokeWidth="2.2" />
              </svg>
            </div>
            <div className="leading-[1.1] text-left">
              <div className="text-[16px] font-semibold text-gray-900 tracking-tight">procureai</div>
              <div className="text-[11px] text-[#6B7280] font-normal">
                by <span className="text-[#2563EB] font-medium">govt</span>
              </div>
            </div>
          </Link>
        </div>

        {/* User Controls in right corner */}
        <div className="flex items-center gap-3.5">
          {isAuthenticated && user ? (
            <div className="flex items-center gap-3 sm:gap-4">
              {/* Role Switcher Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setRoleOpen((v) => !v)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-gray-200 bg-white hover:bg-gray-50 text-xs font-medium text-gray-700 shadow-xs transition-colors cursor-pointer"
                >
                  <span className="hidden sm:inline text-gray-400 text-[11px]">Role:</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${currentRole?.color}`}>
                    {currentRole?.label ?? user.role_code}
                  </span>
                  <svg className="h-3.5 w-3.5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>

                {roleOpen && (
                  <div className="absolute right-0 mt-1.5 w-56 rounded-2xl border border-gray-200 bg-white shadow-xl py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-3.5 py-2 border-b border-gray-100 text-[10px] uppercase font-semibold text-gray-400 tracking-wider">
                      Switch Role Persona
                    </div>
                    {roles.map((r) => (
                      <button
                        key={r.code}
                        onClick={() => { switchDemoRole(r.email, r.code); setRoleOpen(false); }}
                        className={`w-full flex items-center justify-between px-3.5 py-2.5 text-xs text-left hover:bg-gray-50 transition-colors ${user.role_code === r.code ? 'font-semibold text-blue-700 bg-blue-50/50' : 'text-gray-700'}`}
                      >
                        <div className="flex flex-col">
                          <span>{r.label}</span>
                          <span className="text-[10px] text-gray-400 font-normal">{r.email.split('@')[0]}</span>
                        </div>
                        {user.role_code === r.code && (
                          <svg className="h-4 w-4 text-blue-600 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* User info */}
              <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-gray-200">
                <div className="text-right">
                  <div className="text-xs font-semibold text-gray-900">{user.full_name}</div>
                  <div className="text-[10px] text-gray-400 truncate max-w-[220px]">{user.email}</div>
                </div>
              </div>

              {/* Door arrow logout icon (no background, turns orange on hover) */}
              <button
                onClick={() => logout()}
                title="Sign Out"
                aria-label="Sign Out"
                className="p-1.5 text-gray-500 hover:text-orange-500 transition-colors duration-150 focus:outline-none flex items-center justify-center cursor-pointer group"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-5 h-5 transition-transform duration-150 group-hover:translate-x-0.5"
                >
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="px-4 py-1.5 rounded-full bg-[#18181B] hover:bg-black text-white text-xs font-medium shadow-xs transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="px-4 py-1.5 rounded-full bg-white hover:bg-gray-50 text-gray-800 text-xs font-medium border border-gray-300 transition-colors"
              >
                Create Account
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

function MainDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'tenders' | 'bidder' | 'auditor' | 'admin'>(() => {
    if (user?.role_code === 'BIDDER') return 'bidder';
    if (user?.role_code === 'AUDITOR') return 'auditor';
    if (user?.role_code === 'ADMIN') return 'admin';
    return 'tenders';
  });

  // Sync tab when user switches role
  useEffect(() => {
    if (user?.role_code === 'BIDDER') setActiveTab('bidder');
    else if (user?.role_code === 'AUDITOR') setActiveTab('auditor');
    else if (user?.role_code === 'ADMIN') setActiveTab('admin');
    else setActiveTab('tenders');
  }, [user?.role_code]);

  const tabs = [
    {
      id: 'tenders' as const,
      label: 'Tenders Management',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
        </svg>
      ),
    },
    {
      id: 'bidder' as const,
      label: 'My Bids & Proposals',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
          <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
        </svg>
      ),
      restrictedTo: ['BIDDER'],
    },
    {
      id: 'auditor' as const,
      label: 'Cryptographic Audit Ledger',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
        </svg>
      ),
      restrictedTo: ['AUDITOR', 'ADMIN'],
    },
    {
      id: 'admin' as const,
      label: 'Platform Administration',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      ),
      restrictedTo: ['ADMIN'],
    },
  ];

  return (
    <main style={{ fontFamily: FONT }} className="mx-auto max-w-7xl px-4 sm:px-6 py-8 space-y-6">
      {/* ── Executive Briefing Banner ────────────────────────────── */}
      <section className="relative overflow-hidden rounded-3xl bg-white border border-gray-200/90 p-8 sm:p-12 min-h-[340px] shadow-sm flex flex-col justify-between">
        {/* Cultural Illustration Background Layer (di.png) with reduced transparency */}
        <div
          className="absolute inset-0 pointer-events-none select-none z-0"
          style={{
            backgroundImage: 'url(/di.png)',
            backgroundSize: 'cover',
            backgroundPosition: 'center bottom',
            backgroundRepeat: 'no-repeat',
            opacity: 0.85,
          }}
        />
        {/* Soft translucent wash ensuring crisp text legibility while letting the rich artwork show clearly */}
        <div
          className="absolute inset-0 pointer-events-none select-none z-0 bg-gradient-to-r from-white/35 via-white/15 to-white/35"
        />

        <div className="relative z-10 space-y-6 sm:space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-200/70 pb-5">
            <div className="flex items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-50/90 backdrop-blur-xs text-emerald-800 text-xs font-semibold border border-emerald-200/80 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                National e-Procurement Gateway
              </span>
              <span className="text-xs text-gray-300">•</span>
              <span className="text-xs text-gray-600 font-medium">GFR 2017 & CVC Compliant</span>
            </div>
            <div className="text-xs text-gray-600 flex items-center gap-2 bg-white/80 backdrop-blur-xs px-3.5 py-1.5 rounded-full border border-gray-200/80 shadow-xs">
              <span className="text-gray-400">Authenticated Persona:</span>
              <strong className="text-gray-900 font-semibold">{user ? user.full_name : 'Guest'}</strong>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                {user ? (user.role_code === 'GOVT_OFFICER' ? 'Government Officer' : user.role_code === 'BIDDER' ? 'Bidder' : user.role_code === 'AUDITOR' ? 'Auditor' : user.role_code === 'ADMIN' ? 'Administrator' : user.role_code) : 'Public Guest'}
              </span>
            </div>
          </div>

          <div className="space-y-3 py-1">
            <h2 className="text-3xl sm:text-4xl lg:text-[42px] font-bold tracking-tight text-gray-900 leading-tight">
              Procurement Intelligence Dashboard
            </h2>
            <p className="text-base sm:text-lg text-gray-600 max-w-4xl leading-relaxed font-normal">
              Automated sealed-envelope pipelines, explainable multi-criteria AI recommendations, and sovereign government officer decision governance backed by an immutable cryptographic CAG audit ledger.
            </p>
          </div>

          {/* Feature Pills with Vector SVG Icons & Frosted Glass */}
          <div className="pt-2 flex flex-wrap gap-2.5 text-xs">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/85 backdrop-blur-xs text-gray-700 border border-gray-200/90 font-medium hover:bg-white transition-colors shadow-xs">
              <svg className="w-4 h-4 text-blue-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <span>Sealed Cryptography (AES-256)</span>
            </span>

            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/85 backdrop-blur-xs text-gray-700 border border-gray-200/90 font-medium hover:bg-white transition-colors shadow-xs">
              <svg className="w-4 h-4 text-purple-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="4" y="4" width="16" height="16" rx="2" />
                <rect x="9" y="9" width="6" height="6" />
                <line x1="9" y1="1" x2="9" y2="4" />
                <line x1="15" y1="1" x2="15" y2="4" />
                <line x1="9" y1="20" x2="9" y2="23" />
                <line x1="15" y1="20" x2="15" y2="23" />
                <line x1="20" y1="9" x2="23" y2="9" />
                <line x1="20" y1="14" x2="23" y2="14" />
                <line x1="1" y1="9" x2="4" y2="9" />
                <line x1="1" y1="14" x2="4" y2="14" />
              </svg>
              <span>Multi-Factor AI Scored</span>
            </span>

            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/85 backdrop-blur-xs text-gray-700 border border-gray-200/90 font-medium hover:bg-white transition-colors shadow-xs">
              <svg className="w-4 h-4 text-amber-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3v18" />
                <path d="m3 7 9-4 9 4" />
                <path d="M6 10l-3 5a3 3 0 0 0 6 0l-3-5Z" />
                <path d="M18 10l-3 5a3 3 0 0 0 6 0l-3-5Z" />
                <path d="M4 21h16" />
              </svg>
              <span>Sovereign Officer Authority</span>
            </span>

            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/85 backdrop-blur-xs text-gray-700 border border-gray-200/90 font-medium hover:bg-white transition-colors shadow-xs">
              <svg className="w-4 h-4 text-emerald-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <polyline points="9 12 11 14 15 10" />
              </svg>
              <span>100% Verified SHA-256 Audit Trail</span>
            </span>
          </div>
        </div>
      </section>

      {/* ── Apple-Style Segmented Tab Bar ──────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-200/90 pb-3">
        <div className="inline-flex p-1 rounded-full bg-[#F4F4F5] border border-gray-200/90 flex-wrap gap-1">
          {tabs.map((tab) => {
            const isRestricted = tab.restrictedTo && !tab.restrictedTo.includes(user?.role_code ?? '');
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-[color,background-color,box-shadow] duration-150 ease-out flex items-center gap-2 cursor-pointer select-none ${
                  isActive
                    ? 'bg-white text-gray-950 shadow-xs ring-1 ring-black/5'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/60'
                }`}
              >
                <span className={`transition-colors duration-150 ${isActive ? 'text-gray-900' : 'text-gray-400'}`}>{tab.icon}</span>
                <span>{tab.label}</span>
                {isRestricted && (
                  <svg className="w-3 h-3 text-gray-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>

        <div className="text-xs text-gray-400 font-medium">
          Section: <span className="text-gray-700 font-semibold">{tabs.find((t) => t.id === activeTab)?.label}</span>
        </div>
      </div>

      {/* ── Tab Panels with Smooth Cross-Fade ───────────────────────── */}
      <div className="min-h-[560px]">
        <div key={activeTab} className="tab-pane-fade">
          {activeTab === 'tenders' && (
            <ProtectedRoute>
              <TendersPortal />
            </ProtectedRoute>
          )}

          {activeTab === 'bidder' && (
            <ProtectedRoute allowedRoles={['BIDDER']}>
              <BidderPortal />
            </ProtectedRoute>
          )}

          {activeTab === 'auditor' && (
            <ProtectedRoute allowedRoles={['AUDITOR', 'ADMIN']}>
              <AuditorPortal />
            </ProtectedRoute>
          )}

          {activeTab === 'admin' && (
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminPortal />
            </ProtectedRoute>
          )}
        </div>
      </div>
    </main>
  );
}

function AppShell() {
  const location = useLocation();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';

  return (
    <div style={{ fontFamily: FONT }} className={`min-h-screen flex flex-col font-sans relative ${isAuthPage ? 'bg-white' : 'bg-[#FDFDFE] text-gray-900'}`}>
      {/* ── Dashboard Cultural Line-Art Background Layer (Increased Transparency / Opacity 0.10) ── */}
      {!isAuthPage && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundImage: 'url(/dashboard.png)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            opacity: 0.10,
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />
      )}
      <div className="relative z-10 flex flex-col min-h-screen">
        {!isAuthPage && <NavigationHeader />}
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/*" element={<MainDashboard />} />
        </Routes>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppShell />
      </AuthProvider>
    </BrowserRouter>
  );
}
