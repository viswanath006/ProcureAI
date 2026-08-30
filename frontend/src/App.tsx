import { useState } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LoginPage } from './components/auth/LoginPage';
import { RegisterPage } from './components/auth/RegisterPage';
import { ProtectedRoute } from './components/ProtectedRoute';
import { TendersPortal } from './components/portals/TendersPortal';
import { BidderPortal } from './components/portals/BidderPortal';
import { AuditorPortal } from './components/portals/AuditorPortal';
import { AdminPortal } from './components/portals/AdminPortal';
import { RbacSecurityTester } from './components/security/RbacSecurityTester';
import StatusDashboard from './components/StatusDashboard';

function NavigationHeader() {
  const { user, isAuthenticated, logout, switchDemoRole } = useAuth();

  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-slate-950/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 py-3.5">
        {/* Logo & Brand */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-procure-500 to-indigo-600 shadow-lg glow-blue group-hover:scale-105 transition-transform">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="h-5 w-5 text-white"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 18L9 6l6 7 4-5" />
              <circle cx="19" cy="6" r="2" fill="currentColor" stroke="none" className="text-procure-200" />
            </svg>
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-white font-mono flex items-center gap-1.5">
              Procure<span className="text-procure-400">AI</span>
            </h1>
            <p className="text-[9px] font-semibold text-procure-400 -mt-0.5 tracking-wider font-mono uppercase">
              Intelligent. Fair. Transparent.
            </p>
          </div>
        </Link>

        {/* User Identity & Demo Switcher */}
        <div className="flex items-center gap-3">
          {isAuthenticated && user ? (
            <div className="flex items-center gap-3">
              {/* Quick Role Switcher for 4 Personas */}
              <div className="hidden lg:flex items-center gap-1.5 bg-slate-900/90 p-1 rounded-xl border border-slate-800 text-xs">
                <span className="text-[10px] text-slate-500 font-mono px-2 font-bold">Role:</span>
                <button
                  onClick={() => switchDemoRole('officer.suresh@finance.gov.in', 'GOVT_OFFICER')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold font-mono transition-all ${
                    user.role_code === 'GOVT_OFFICER'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Switch to Government Officer (Suresh Kumar)"
                >
                  🏛️ Officer
                </button>
                <button
                  onClick={() => switchDemoRole('bidder.alpha@alphacorp.dev', 'BIDDER')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold font-mono transition-all ${
                    user.role_code === 'BIDDER'
                      ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Switch to Bidder (Apex Infra Buildtech)"
                >
                  🏢 Bidder
                </button>
                <button
                  onClick={() => switchDemoRole('auditor.priya@cag.gov.in', 'AUDITOR')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold font-mono transition-all ${
                    user.role_code === 'AUDITOR'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Switch to Auditor (CAG Principal Auditor)"
                >
                  🔍 Auditor
                </button>
                <button
                  onClick={() => switchDemoRole('admin.rajesh@procureai.gov.in', 'ADMIN')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold font-mono transition-all ${
                    user.role_code === 'ADMIN'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Switch to Administrator"
                >
                  ⚙️ Admin
                </button>
              </div>

              {/* Active User Pill */}
              <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
                <div className="text-right hidden sm:block">
                  <div className="text-xs font-semibold text-slate-200">{user.full_name}</div>
                  <div className="text-[10px] text-slate-500 font-mono truncate max-w-[140px]">
                    {user.email}
                  </div>
                </div>

                <span
                  className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase border ${
                    user.role_code === 'ADMIN'
                      ? 'bg-red-500/20 border-red-500/40 text-red-400'
                      : user.role_code === 'GOVT_OFFICER'
                      ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                      : user.role_code === 'BIDDER'
                      ? 'bg-blue-500/20 border-blue-500/40 text-blue-300'
                      : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                  }`}
                >
                  {user.role_code}
                </span>

                <button
                  onClick={() => logout()}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs transition-colors border border-slate-800"
                  title="End Session"
                >
                  Logout
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="px-3.5 py-1.5 rounded-lg bg-procure-600 hover:bg-procure-500 text-white text-xs font-semibold shadow-md shadow-procure-600/25 transition-all"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-medium border border-slate-800 transition-colors"
              >
                Register
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
  const [activeTab, setActiveTab] = useState<
    'tenders' | 'bidder' | 'auditor' | 'admin' | 'security' | 'infra'
  >('tenders');

  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 py-8 space-y-8">
      {/* ── Hero section ──────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden rounded-3xl p-8 sm:p-10"
        style={{
          background: 'linear-gradient(135deg, #091136 0%, #0d2182 45%, #1535d6 80%, #080c2b 100%)',
          boxShadow: '0 0 0 1px rgba(21,53,214,0.3), 0 24px 64px rgba(0,0,0,0.5)',
        }}
      >
        <div className="relative z-10 space-y-3">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono tracking-wider bg-procure-500/20 text-procure-300 border border-procure-500/30">
              SMART INDIA HACKATHON 2026
            </span>
            <span className="text-xs text-procure-200/70 font-mono">
              15 Phases Complete · AES-256-GCM · SHAP XAI · Isolation Forest · Hash Chained Ledger
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            AI RECOMMENDS.{' '}
            <span className="text-gradient-blue">HUMANS DECIDE.</span>{' '}
            <span className="opacity-80">SYSTEM AUDITS.</span>
          </h2>

          <p className="max-w-2xl text-xs sm:text-sm text-procure-200/80 leading-relaxed">
            Role-Based Access Control enforced at the database and gateway levels. Bidders submit sealed bids;
            government officers make final procurement decisions with mandatory override compliance; auditors inspect
            immutable logs.
          </p>

          <div className="pt-2 flex flex-wrap gap-2 text-[11px] font-mono">
            <span className="px-2.5 py-1 rounded-lg bg-slate-900/60 border border-white/10 text-slate-300">
              Current Session: <strong className="text-procure-300">{user ? user.role_code : 'ANONYMOUS'}</strong>
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-slate-900/60 border border-white/10 text-slate-300">
              Sealed Bids: <strong className="text-emerald-400">Cryptographically Locked</strong>
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-slate-900/60 border border-white/10 text-slate-300">
              Audit Trail: <strong className="text-amber-400">Append-Only (Trigger Enforced)</strong>
            </span>
          </div>
        </div>
      </section>

      {/* ── Navigation Tabs ────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('tenders')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
            activeTab === 'tenders'
              ? 'bg-procure-600 text-white shadow-lg shadow-procure-600/30'
              : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <span>📑</span> Tenders Portal
        </button>

        <button
          onClick={() => setActiveTab('bidder')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
            activeTab === 'bidder'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
              : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <span>🏢</span> Bidder Workspace
          {user?.role_code !== 'BIDDER' && <span className="text-[10px] opacity-60">🔒</span>}
        </button>

        <button
          onClick={() => setActiveTab('auditor')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
            activeTab === 'auditor'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
              : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <span>🔍</span> Audit Vault
          {user?.role_code !== 'AUDITOR' && user?.role_code !== 'ADMIN' && (
            <span className="text-[10px] opacity-60">🔒</span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('admin')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
            activeTab === 'admin'
              ? 'bg-red-600 text-white shadow-lg shadow-red-600/30'
              : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <span>⚙️</span> System Admin
          {user?.role_code !== 'ADMIN' && <span className="text-[10px] opacity-60">🔒</span>}
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
            activeTab === 'security'
              ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30'
              : 'bg-slate-900/80 text-amber-400/80 hover:text-amber-300 border border-amber-500/20'
          }`}
        >
          <span>🛡️</span> RBAC Security Test Suite
        </button>

        <button
          onClick={() => setActiveTab('infra')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
            activeTab === 'infra'
              ? 'bg-slate-800 text-slate-200 shadow-md'
              : 'bg-slate-900/80 text-slate-500 hover:text-slate-300 border border-slate-800'
          }`}
        >
          <span>🩺</span> Health Monitor
        </button>
      </div>

      {/* ── Tab Panels with Route Guarding ────────────────────────── */}
      <div>
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

        {activeTab === 'security' && <RbacSecurityTester />}

        {activeTab === 'infra' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-100">Full Stack Infrastructure Health</h3>
              <span className="badge-neutral text-xs font-mono">Real-Time Polling</span>
            </div>
            <StatusDashboard />
          </div>
        )}
      </div>
    </main>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
          <NavigationHeader />
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/*" element={<MainDashboard />} />
          </Routes>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}
