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
import { BidderComparisonChart } from './components/charts/BidderComparisonChart';
import { RiskIndicatorsChart } from './components/charts/RiskIndicatorsChart';
import { HistoricalPatternsChart } from './components/charts/HistoricalPatternsChart';
import { DemoScenarioConsole } from './components/demo/DemoScenarioConsole';

const FONT = "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'San Francisco', 'Helvetica Neue', 'Segoe UI', Roboto, sans-serif";

type TabId = 'overview' | 'tenders' | 'evaluations' | 'bids' | 'audit' | 'reports' | 'settings';

interface TabItem {
  id: TabId;
  label: string;
  icon: React.ReactNode;
}

const TABS: TabItem[] = [
  {
    id: 'overview',
    label: 'Overview',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
        <path d="M3 10.5L12 3l9 7.5V20a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <path d="M9 22V12a3 3 0 0 1 6 0v10" />
      </svg>
    ),
  },
  {
    id: 'tenders',
    label: 'Tenders',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <line x1="10" y1="9" x2="8" y2="9" />
      </svg>
    ),
  },
  {
    id: 'evaluations',
    label: 'Evaluations',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
        <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
        <path d="M9 13l2 2 4-4" />
      </svg>
    ),
  },
  {
    id: 'bids',
    label: 'Bids',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <path d="M12 18v-4" />
        <path d="M8 18v-2" />
        <path d="M16 18v-6" />
      </svg>
    ),
  },
  {
    id: 'audit',
    label: 'Audit Log',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
        <line x1="6" y1="3" x2="6" y2="15" />
        <circle cx="18" cy="6" r="3" />
        <circle cx="6" cy="18" r="3" />
        <path d="M18 9a9 9 0 0 1-9 9" />
      </svg>
    ),
  },
  {
    id: 'reports',
    label: 'Reports',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
        <rect x="3" y="4" width="18" height="16" rx="3" />
        <path d="M7 15v-3" />
        <path d="M12 15V9" />
        <path d="M17 15v-6" />
      </svg>
    ),
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    ),
  },
];

function NavigationHeader({
  activeTab,
  setActiveTab,
}: {
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
}) {
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
      <div className="w-full flex items-center justify-between px-4 sm:px-6 lg:px-8 py-2.5 gap-4">
        {/* Logo & Brand in left corner matching LoginPage */}
        <div className="flex items-center shrink-0">
          <Link
            to="/"
            onClick={() => setActiveTab('overview')}
            className="flex items-center gap-2.5 group text-decoration-none"
          >
            <img
              src="/logo.png"
              alt="ProcureAI Logo"
              className="w-7 h-7 sm:w-8 sm:h-8 object-contain shrink-0"
            />
            <div className="leading-[1.1] text-left">
              <div className="text-[16px] font-semibold text-gray-900 tracking-tight">procureai</div>
              <div className="text-[11px] text-[#6B7280] font-normal">
                by <span className="text-[#2563EB] font-medium">govt</span>
              </div>
            </div>
          </Link>
        </div>

        {/* Center: 7 Navigation Tabs right on the side of ProcureAI, between ProcureAI and Role */}
        {isAuthenticated && user && (
          <nav className="hidden lg:flex items-center gap-1 xl:gap-1.5 overflow-x-auto no-scrollbar mx-2" aria-label="Main Navigation">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{ fontStyle: 'normal' }}
                  className={`px-3.5 py-1.5 rounded-2xl text-xs sm:text-[13px] font-semibold not-italic flex items-center gap-2 transition-all duration-150 cursor-pointer select-none whitespace-nowrap ${
                    isActive
                      ? 'bg-[#E6F7F0] text-[#065F46] shadow-xs'
                      : 'text-[#64748B] hover:text-[#0F172A] hover:bg-gray-100/70'
                  }`}
                >
                  <span className={`shrink-0 transition-colors duration-150 ${isActive ? 'text-[#059669]' : 'text-[#64748B]'}`}>
                    {tab.icon}
                  </span>
                  <span className="not-italic" style={{ fontStyle: 'normal' }}>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        )}

        {/* User Controls in right corner */}
        <div className="flex items-center gap-3.5 shrink-0">
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
                      Switch Role / Account
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

      {/* For tablets & mobile: sleek secondary row below ProcureAI and Role */}
      {isAuthenticated && user && (
        <div className="lg:hidden border-t border-gray-100 px-3 sm:px-4 py-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar bg-gray-50/50">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{ fontStyle: 'normal' }}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold not-italic flex items-center gap-2 transition-all duration-150 cursor-pointer select-none whitespace-nowrap ${
                  isActive
                    ? 'bg-[#E6F7F0] text-[#065F46] shadow-xs'
                    : 'text-[#64748B] hover:text-[#0F172A] hover:bg-gray-200/60'
                }`}
              >
                <span className={`shrink-0 transition-colors duration-150 ${isActive ? 'text-[#059669]' : 'text-[#64748B]'}`}>
                  {tab.icon}
                </span>
                <span className="not-italic" style={{ fontStyle: 'normal' }}>{tab.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
}

function MainDashboard({ activeTab }: { activeTab: TabId }) {
  const { user } = useAuth();

  const tabHeroMap: Record<
    TabId,
    {
      badge: string;
      subBadge: string;
      title: string;
      description: string;
      pills: { icon: React.ReactNode; label: string }[];
    }
  > = {
    overview: {
      badge: 'Overview Dashboard',
      subBadge: 'Procurement At A Glance',
      title: 'Executive Overview',
      description: 'See live status of all tenders, upcoming deadlines, quick summaries of bids, and system alerts in one clean place.',
      pills: [
        {
          icon: (
            <svg className="w-4 h-4 text-emerald-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 10.5L12 3l9 7.5V20a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            </svg>
          ),
          label: 'Live Tender Counts',
        },
        {
          icon: (
            <svg className="w-4 h-4 text-blue-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
          ),
          label: 'Active Workflows',
        },
        {
          icon: (
            <svg className="w-4 h-4 text-purple-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          ),
          label: 'Deadlines & Tasks',
        },
        {
          icon: (
            <svg className="w-4 h-4 text-amber-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <polyline points="9 12 11 14 15 10" />
            </svg>
          ),
          label: 'Fair & Verified',
        },
      ],
    },
    tenders: {
      badge: 'Government Tender Portal',
      subBadge: 'Follows Government Rules (GFR & CVC)',
      title: 'Government Tenders',
      description: 'Look through all government tenders, search by department, see deadlines, and start a new tender with one click.',
      pills: [
        {
          icon: (
            <svg className="w-4 h-4 text-blue-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          ),
          label: 'Locked & Secret Bids',
        },
        {
          icon: (
            <svg className="w-4 h-4 text-purple-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="4" y="4" width="16" height="16" rx="2" />
              <rect x="9" y="9" width="6" height="6" />
              <line x1="9" y1="1" x2="9" y2="4" />
              <line x1="15" y1="1" x2="15" y2="4" />
              <line x1="9" y1="20" x2="9" y2="23" />
              <line x1="15" y1="20" x2="15" y2="23" />
            </svg>
          ),
          label: 'Fair Multi-Check AI Scoring',
        },
        {
          icon: (
            <svg className="w-4 h-4 text-amber-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3v18" />
              <path d="m3 7 9-4 9 4" />
              <path d="M6 10l-3 5a3 3 0 0 0 6 0l-3-5Z" />
              <path d="M18 10l-3 5a3 3 0 0 0 6 0l-3-5Z" />
              <path d="M4 21h16" />
            </svg>
          ),
          label: 'Final Decision by Officer',
        },
        {
          icon: (
            <svg className="w-4 h-4 text-emerald-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <polyline points="9 12 11 14 15 10" />
            </svg>
          ),
          label: '100% Tamper-Proof Record',
        },
      ],
    },
    evaluations: {
      badge: 'AI Evaluation Room',
      subBadge: 'Fair Scoring & Verification',
      title: 'Bid Evaluations & AI Scoring',
      description: 'Compare company bids side-by-side, inspect smart AI checks, test different evaluation rules, and ensure complete fairness.',
      pills: [
        {
          icon: (
            <svg className="w-4 h-4 text-emerald-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="20" x2="18" y2="10" />
              <line x1="12" y1="20" x2="12" y2="4" />
              <line x1="6" y1="20" x2="6" y2="14" />
            </svg>
          ),
          label: 'Side-by-Side Scoring',
        },
        {
          icon: (
            <svg className="w-4 h-4 text-blue-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 14 14" />
            </svg>
          ),
          label: 'Automated Accuracy Check',
        },
        {
          icon: (
            <svg className="w-4 h-4 text-rose-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          ),
          label: 'Unusual Price Warnings',
        },
        {
          icon: (
            <svg className="w-4 h-4 text-purple-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <polyline points="16 11 18 13 22 9" />
            </svg>
          ),
          label: 'Officer Reviews & Approves',
        },
      ],
    },
    bids: {
      badge: 'Bidder Workspace',
      subBadge: 'Confidential & Sealed Bidding',
      title: 'My Bids & Proposals',
      description: 'Submit your sealed bids safely, track tender applications, check official receipts, and submit locked proposals for open tenders.',
      pills: [
        {
          icon: (
            <svg className="w-4 h-4 text-blue-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          ),
          label: 'Private & Secret Pricing',
        },
        {
          icon: (
            <svg className="w-4 h-4 text-emerald-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          ),
          label: 'Instant Submission Receipt',
        },
        {
          icon: (
            <svg className="w-4 h-4 text-purple-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
          ),
          label: 'Simple Eligibility Check',
        },
        {
          icon: (
            <svg className="w-4 h-4 text-amber-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          ),
          label: 'Locked Until Deadline',
        },
      ],
    },
    audit: {
      badge: 'CAG Oversight Portal',
      subBadge: 'Permanent Activity Ledger',
      title: 'Audit & Activity Log',
      description: 'Review the complete permanent record of all tender actions, verify that past data has not been modified, and inspect officer decisions.',
      pills: [
        {
          icon: (
            <svg className="w-4 h-4 text-emerald-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <polyline points="9 12 11 14 15 10" />
            </svg>
          ),
          label: 'Tamper-Proof History',
        },
        {
          icon: (
            <svg className="w-4 h-4 text-blue-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          ),
          label: 'Instant Integrity Check',
        },
        {
          icon: (
            <svg className="w-4 h-4 text-amber-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3v18" />
              <path d="m3 7 9-4 9 4" />
              <path d="M6 10l-3 5a3 3 0 0 0 6 0l-3-5Z" />
              <path d="M18 10l-3 5a3 3 0 0 0 6 0l-3-5Z" />
              <path d="M4 21h16" />
            </svg>
          ),
          label: 'Officer Decisions & Overrides',
        },
        {
          icon: (
            <svg className="w-4 h-4 text-purple-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
            </svg>
          ),
          label: '6-Filter Search',
        },
      ],
    },
    reports: {
      badge: 'Procurement Intelligence',
      subBadge: 'Clear Data & Trends',
      title: 'Procurement Reports & Trends',
      description: 'Interactive risk indicators, historical pricing trends, vendor performance patterns, and compliance reporting across all departments.',
      pills: [
        {
          icon: (
            <svg className="w-4 h-4 text-emerald-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
              <polyline points="17 6 23 6 23 12" />
            </svg>
          ),
          label: 'Price Trend History',
        },
        {
          icon: (
            <svg className="w-4 h-4 text-rose-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          ),
          label: 'Risk & Anomaly Flags',
        },
        {
          icon: (
            <svg className="w-4 h-4 text-blue-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="16" rx="3" />
              <path d="M7 15v-3" />
              <path d="M12 15V9" />
              <path d="M17 15v-6" />
            </svg>
          ),
          label: 'Vendor Performance',
        },
        {
          icon: (
            <svg className="w-4 h-4 text-purple-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
          ),
          label: 'Ready for Review',
        },
      ],
    },
    settings: {
      badge: 'Platform Administration',
      subBadge: 'System Health & Access Control',
      title: 'Admin & Platform Settings',
      description: 'Manage registered user accounts, view active user sessions, monitor database tables, and configure platform settings.',
      pills: [
        {
          icon: (
            <svg className="w-4 h-4 text-blue-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
            </svg>
          ),
          label: 'User Directory',
        },
        {
          icon: (
            <svg className="w-4 h-4 text-emerald-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
          ),
          label: 'Real-Time System Status',
        },
        {
          icon: (
            <svg className="w-4 h-4 text-purple-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <ellipse cx="12" cy="5" rx="9" ry="3" />
              <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
              <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
            </svg>
          ),
          label: 'Data Tables',
        },
        {
          icon: (
            <svg className="w-4 h-4 text-amber-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          ),
          label: 'Role-Based Permissions',
        },
      ],
    },
  };

  const currentHero = tabHeroMap[activeTab] || tabHeroMap.overview;

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
            <div key={`badge-${activeTab}`} className="flex items-center gap-2.5 tab-pane-fade">
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-50/90 backdrop-blur-xs text-emerald-800 text-xs font-semibold border border-emerald-200/80 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                {currentHero.badge}
              </span>
              <span className="text-xs text-gray-300">•</span>
              <span className="text-xs text-gray-600 font-medium">{currentHero.subBadge}</span>
            </div>
            <div className="text-xs text-gray-600 flex items-center gap-2 bg-white/80 backdrop-blur-xs px-3.5 py-1.5 rounded-full border border-gray-200/80 shadow-xs">
              <span className="text-gray-400">Signed in as:</span>
              <strong className="text-gray-900 font-semibold">{user ? user.full_name : 'Guest'}</strong>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                {user ? (user.role_code === 'GOVT_OFFICER' ? 'Government Officer' : user.role_code === 'BIDDER' ? 'Bidder' : user.role_code === 'AUDITOR' ? 'Auditor' : user.role_code === 'ADMIN' ? 'Administrator' : user.role_code) : 'Public Guest'}
              </span>
            </div>
          </div>

          <div key={`hero-body-${activeTab}`} className="space-y-4 tab-pane-fade">
            <div className="space-y-3 py-1">
              <h2 className="text-3xl sm:text-4xl lg:text-[42px] font-bold tracking-tight text-gray-900 leading-tight">
                {currentHero.title}
              </h2>
              <p className="text-base sm:text-lg text-gray-600 max-w-4xl leading-relaxed font-normal">
                {currentHero.description}
              </p>
            </div>

            {/* Feature Pills with Vector SVG Icons & Frosted Glass */}
            <div className="pt-1 flex flex-wrap gap-2.5 text-xs">
              {currentHero.pills.map((pill, idx) => (
                <span key={idx} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/85 backdrop-blur-xs text-gray-700 border border-gray-200/90 font-medium hover:bg-white transition-colors shadow-xs">
                  {pill.icon}
                  <span>{pill.label}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Tab Panels with Smooth Cross-Fade ───────────────────────── */}
      <div className="min-h-[560px]">
        <div key={activeTab} className="tab-pane-fade">
          {activeTab === 'overview' && (
            <ProtectedRoute>
              <TendersPortal key="overview" initialMode="dashboard" hideSwitcher={true} />
            </ProtectedRoute>
          )}

          {activeTab === 'tenders' && (
            <ProtectedRoute>
              <TendersPortal key="tenders" initialMode="registry" hideSwitcher={true} />
            </ProtectedRoute>
          )}

          {activeTab === 'evaluations' && (
            <ProtectedRoute allowedRoles={['GOVT_OFFICER', 'AUDITOR', 'ADMIN', 'EVALUATOR']}>
              <div className="space-y-6">
                <BidderComparisonChart />
                <DemoScenarioConsole />
              </div>
            </ProtectedRoute>
          )}

          {activeTab === 'bids' && (
            <ProtectedRoute allowedRoles={['BIDDER', 'ADMIN', 'GOVT_OFFICER']}>
              <BidderPortal />
            </ProtectedRoute>
          )}

          {activeTab === 'audit' && (
            <ProtectedRoute allowedRoles={['AUDITOR', 'ADMIN', 'GOVT_OFFICER']}>
              <AuditorPortal />
            </ProtectedRoute>
          )}

          {activeTab === 'reports' && (
            <ProtectedRoute>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <RiskIndicatorsChart />
                <HistoricalPatternsChart />
              </div>
            </ProtectedRoute>
          )}

          {activeTab === 'settings' && (
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
  const { user } = useAuth();
  const location = useLocation();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';

  const [activeTab, setActiveTab] = useState<TabId>(() => {
    if (user?.role_code === 'BIDDER') return 'bids';
    if (user?.role_code === 'AUDITOR') return 'audit';
    if (user?.role_code === 'ADMIN') return 'settings';
    return 'overview';
  });

  // Sync tab when user switches role
  useEffect(() => {
    if (user?.role_code === 'BIDDER') setActiveTab('bids');
    else if (user?.role_code === 'AUDITOR') setActiveTab('audit');
    else if (user?.role_code === 'ADMIN') setActiveTab('settings');
    else setActiveTab('overview');
  }, [user?.role_code]);

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
        {!isAuthPage && <NavigationHeader activeTab={activeTab} setActiveTab={setActiveTab} />}
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/*" element={<MainDashboard activeTab={activeTab} />} />
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
