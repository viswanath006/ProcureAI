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
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 py-3.5">
        {/* Logo & Brand */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 shadow group-hover:shadow-md transition-shadow">
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 text-white" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 18L9 6l6 7 4-5" />
              <circle cx="19" cy="6" r="2" fill="currentColor" stroke="none" />
            </svg>
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-gray-900">
              Procure<span className="text-blue-600">AI</span>
            </h1>
            <p className="text-[10px] font-medium text-gray-400 -mt-0.5 tracking-wide">
              Intelligent. Fair. Transparent.
            </p>
          </div>
        </Link>

        {/* User Controls */}
        <div className="flex items-center gap-3">
          {isAuthenticated && user ? (
            <div className="flex items-center gap-3">
              {/* Role Switcher Dropdown */}
              <div className="relative hidden sm:block">
                <button
                  onClick={() => setRoleOpen((v) => !v)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 text-xs font-medium text-gray-700 transition-colors"
                >
                  <span>Switch Role</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${currentRole?.color}`}>
                    {currentRole?.label ?? user.role_code}
                  </span>
                  <svg className="h-3.5 w-3.5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>

                {roleOpen && (
                  <div className="absolute right-0 mt-1 w-52 rounded-xl border border-gray-200 bg-white shadow-lg py-1 z-50">
                    {roles.map((r) => (
                      <button
                        key={r.code}
                        onClick={() => { switchDemoRole(r.email, r.code); setRoleOpen(false); }}
                        className={`w-full flex items-center justify-between px-4 py-2.5 text-xs text-left hover:bg-gray-50 transition-colors ${user.role_code === r.code ? 'font-semibold text-blue-700' : 'text-gray-700'}`}
                      >
                        <span>{r.label}</span>
                        {user.role_code === r.code && (
                          <svg className="h-3.5 w-3.5 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
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
                  <div className="text-xs font-semibold text-gray-800">{user.full_name}</div>
                  <div className="text-[10px] text-gray-400 truncate max-w-[140px]">{user.email}</div>
                </div>
              </div>

              <button
                onClick={() => logout()}
                className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-800 text-xs font-medium transition-colors border border-gray-200"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="px-4 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium border border-gray-200 transition-colors"
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
  const [activeTab, setActiveTab] = useState<'tenders' | 'bidder' | 'auditor' | 'admin'>('tenders');

  const tabs = [
    { id: 'tenders' as const, label: 'Tenders', icon: '📑', color: 'blue' },
    { id: 'bidder' as const, label: 'My Bids', icon: '🏢', color: 'blue', restrictedTo: ['BIDDER'] },
    { id: 'auditor' as const, label: 'Audit Records', icon: '🔍', color: 'emerald', restrictedTo: ['AUDITOR', 'ADMIN'] },
    { id: 'admin' as const, label: 'Administration', icon: '⚙️', color: 'red', restrictedTo: ['ADMIN'] },
  ];

  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 py-8 space-y-6">
      {/* ── Welcome Banner ─────────────────────────────────────────── */}
      <section className="rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-700 p-6 sm:p-8 shadow-md">
        <div className="space-y-2">
          <h2 className="text-xl sm:text-2xl font-bold text-white">
            Welcome to ProcureAI
          </h2>
          <p className="text-sm text-blue-100 max-w-xl leading-relaxed">
            A transparent and fair e-procurement platform. AI helps recommend decisions — final approval always rests with authorised government officers.
          </p>
          <div className="pt-2 flex flex-wrap gap-2 text-xs">
            <span className="px-3 py-1 rounded-full bg-white/15 text-white border border-white/20">
              Signed in as: <strong>{user ? (user.role_code === 'GOVT_OFFICER' ? 'Government Officer' : user.role_code === 'BIDDER' ? 'Bidder' : user.role_code === 'AUDITOR' ? 'Auditor' : user.role_code === 'ADMIN' ? 'Administrator' : user.role_code) : 'Guest'}</strong>
            </span>
            <span className="px-3 py-1 rounded-full bg-white/15 text-white border border-white/20">
              Bids are sealed until deadline
            </span>
            <span className="px-3 py-1 rounded-full bg-white/15 text-white border border-white/20">
              Full audit trail maintained
            </span>
          </div>
        </div>
      </section>

      {/* ── Navigation Tabs ─────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-3">
        {tabs.map((tab) => {
          const isRestricted = tab.restrictedTo && !tab.restrictedTo.includes(user?.role_code ?? '');
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white text-gray-600 hover:text-gray-900 border border-gray-200 hover:border-gray-300'
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
              {isRestricted && <span className="text-xs opacity-50">🔒</span>}
            </button>
          );
        })}
      </div>

      {/* ── Tab Panels ─────────────────────────────────────────────── */}
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
      </div>
    </main>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="min-h-screen bg-gray-50 text-gray-800 flex flex-col font-sans">
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
