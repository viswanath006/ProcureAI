import { useCallback, useEffect, useState, useRef } from 'react';
import { api, SystemStatusData } from '../api/client';

/* ─── Types ────────────────────────────────────────────────────────────── */
type LoadState = 'idle' | 'loading' | 'success' | 'error';

interface ServiceCardProps {
  label: string;
  status: string;
  value: string;
  icon: React.ReactNode;
  detail?: string;
}

/* ─── Icons ─────────────────────────────────────────────────────────────── */
function IconServer() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <rect x="2" y="3" width="20" height="5" rx="1" />
      <rect x="2" y="10" width="20" height="5" rx="1" />
      <rect x="2" y="17" width="20" height="5" rx="1" />
      <circle cx="6" cy="5.5" r="0.8" fill="currentColor" stroke="none" />
      <circle cx="6" cy="12.5" r="0.8" fill="currentColor" stroke="none" />
      <circle cx="6" cy="19.5" r="0.8" fill="currentColor" stroke="none" />
    </svg>
  );
}

function IconDatabase() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M3 5v6c0 1.657 4.03 3 9 3s9-1.343 9-3V5" />
      <path d="M3 11v6c0 1.657 4.03 3 9 3s9-1.343 9-3v-6" />
    </svg>
  );
}

function IconBrain() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <path d="M9.5 2a4.5 4.5 0 0 1 4.5 4.5v.5h.5a3.5 3.5 0 0 1 0 7H14v.5a4.5 4.5 0 0 1-9 0v-.5H4.5a3.5 3.5 0 0 1 0-7H5v-.5A4.5 4.5 0 0 1 9.5 2Z" />
    </svg>
  );
}

function IconGlobe() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}

function IconRefresh({ spinning }: { spinning: boolean }) {
  return (
    <svg className={`h-4 w-4 ${spinning ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M21 2v6h-6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3 12a9 9 0 0 1 15-6.7L21 8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3 22v-6h6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M21 12a9 9 0 0 1-15 6.7L3 16" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconZap() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ─── Status Badge ──────────────────────────────────────────────────────── */
function StatusBadge({ status }: { status: string }) {
  const isUp = status === 'up' || status === 'healthy' || status === 'operational';
  const isLoading = status === 'loading';
  if (isLoading) return <span className="badge-loading"><span className="animate-spin-slow">↻</span> loading</span>;
  if (isUp) return <span className="badge-up"><span className="dot-up" />{status}</span>;
  return <span className="badge-down"><span className="dot-down" />{status}</span>;
}

/* ─── Service Card ──────────────────────────────────────────────────────── */
function ServiceCard({ label, status, value, icon, detail }: ServiceCardProps) {
  const isUp = status === 'up' || status === 'healthy' || status === 'operational';
  return (
    <div className="glass-card-hover p-5 animate-slide-up">
      <div className="flex items-start justify-between">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ring-1 ${
          isUp
            ? 'bg-procure-600/20 text-procure-300 ring-procure-500/20'
            : 'bg-red-500/10 text-red-400 ring-red-500/20'
        }`}>
          {icon}
        </div>
        <StatusBadge status={status} />
      </div>
      <div className="mt-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</p>
        <p className="mt-1 text-lg font-bold text-white truncate">{value}</p>
        {detail && <p className="mt-1 text-xs text-slate-500 truncate">{detail}</p>}
      </div>
    </div>
  );
}

/* ─── Skeleton Loader ───────────────────────────────────────────────────── */
function ServiceCardSkeleton() {
  return (
    <div className="glass-card p-5">
      <div className="flex items-start justify-between">
        <div className="skeleton h-10 w-10 rounded-xl" />
        <div className="skeleton h-6 w-16 rounded-full" />
      </div>
      <div className="mt-4 space-y-2">
        <div className="skeleton h-3 w-20 rounded" />
        <div className="skeleton h-6 w-32 rounded" />
      </div>
    </div>
  );
}

/* ─── Main Dashboard ────────────────────────────────────────────────────── */
export default function StatusDashboard() {
  const [loadState, setLoadState] = useState<LoadState>('idle');
  const [status, setStatus] = useState<SystemStatusData | null>(null);
  const [pingResult, setPingResult] = useState<{ ok: boolean; text: string } | null>(null);
  const [pingLoading, setPingLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [showRaw, setShowRaw] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refresh = useCallback(async () => {
    setLoadState('loading');
    setError(null);
    try {
      const response = await api.getStatus();
      if (!response.success || !response.data) {
        throw new Error(response.error?.message ?? 'Failed to fetch system status');
      }
      setStatus(response.data);
      setLastUpdated(new Date());
      setLoadState('success');
    } catch (err) {
      setLoadState('error');
      setError(err instanceof Error ? err.message : 'Could not reach the backend. Is it running?');
    }
  }, []);

  const testAiPing = useCallback(async () => {
    setPingResult(null);
    setPingLoading(true);
    try {
      const response = await api.pingAi();
      if (!response.success || !response.data) {
        throw new Error(response.error?.message ?? 'AI ping failed');
      }
      setPingResult({
        ok: true,
        text: `Backend → AI: "${response.data.aiResponse.message}" from ${response.data.aiResponse.from_service}`,
      });
    } catch (err) {
      setPingResult({
        ok: false,
        text: err instanceof Error ? err.message : 'Ping failed',
      });
    } finally {
      setPingLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    intervalRef.current = setInterval(refresh, 15000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [refresh]);

  const overallOk = status?.status === 'operational';

  return (
    <div className="space-y-6">
      {/* ── Controls ──────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {/* Overall indicator */}
          <div className={`flex h-8 w-8 items-center justify-center rounded-full ring-2 ${
            loadState === 'loading'
              ? 'ring-amber-500/30 bg-amber-500/10'
              : overallOk
              ? 'ring-emerald-500/30 bg-emerald-500/10'
              : loadState === 'error'
              ? 'ring-red-500/30 bg-red-500/10'
              : 'ring-slate-600/30 bg-slate-800'
          }`}>
            {loadState === 'loading' ? (
              <span className="h-3 w-3 rounded-full bg-amber-400 animate-pulse" />
            ) : overallOk ? (
              <span className="dot-up" />
            ) : (
              <span className="dot-down" />
            )}
          </div>
          <div>
            <p className="text-sm font-semibold text-white">
              {loadState === 'loading' ? 'Refreshing…' : overallOk ? 'All Systems Operational' : loadState === 'error' ? 'Connection Error' : 'Checking…'}
            </p>
            {lastUpdated && (
              <p className="text-[11px] text-slate-500">
                Last updated {lastUpdated.toLocaleTimeString()} · auto-refreshes every 15s
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="btn-refresh"
            type="button"
            onClick={refresh}
            disabled={loadState === 'loading'}
            className="btn-primary"
          >
            <IconRefresh spinning={loadState === 'loading'} />
            Refresh
          </button>
          <button
            id="btn-ai-ping"
            type="button"
            onClick={testAiPing}
            disabled={pingLoading}
            className="btn-outline"
          >
            <IconZap />
            {pingLoading ? 'Testing…' : 'Test Backend → AI'}
          </button>
        </div>
      </div>

      {/* ── Alert banners ─────────────────────────────────────────── */}
      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-300 animate-fade-in">
          <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" strokeLinecap="round" />
            <line x1="12" y1="16" x2="12.01" y2="16" strokeLinecap="round" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {pingResult && (
        <div className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm animate-fade-in ${
          pingResult.ok
            ? 'border-emerald-500/20 bg-emerald-500/5 text-emerald-300'
            : 'border-red-500/20 bg-red-500/5 text-red-300'
        }`}>
          <svg className="mt-0.5 h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            {pingResult.ok
              ? <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
              : <><line x1="18" y1="6" x2="6" y2="18" strokeLinecap="round" /><line x1="6" y1="6" x2="18" y2="18" strokeLinecap="round" /></>
            }
          </svg>
          <span>{pingResult.text}</span>
        </div>
      )}

      {/* ── Service cards ──────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {loadState === 'idle' || (loadState === 'loading' && !status) ? (
          Array.from({ length: 4 }).map((_, i) => <ServiceCardSkeleton key={i} />)
        ) : (
          <>
            <ServiceCard
              label="Overall System"
              status={status?.status ?? 'unknown'}
              value={status?.status === 'operational' ? 'Operational' : 'Degraded'}
              icon={<IconGlobe />}
              detail={status ? new Date(status.timestamp).toLocaleTimeString() : undefined}
            />
            <ServiceCard
              label="Backend API"
              status={status?.services.backend.status ?? 'unknown'}
              value={status?.services.backend.version ?? '—'}
              icon={<IconServer />}
              detail="Node.js + Express · :4000"
            />
            <ServiceCard
              label="PostgreSQL"
              status={status?.services.database.status ?? 'unknown'}
              value={`${status?.services.database.healthLogEntries ?? 0} health logs`}
              icon={<IconDatabase />}
              detail="PostgreSQL 16 · :5432"
            />
            <ServiceCard
              label="AI Service"
              status={status?.services.aiService.status ?? 'unknown'}
              value={status?.services.aiService.status === 'up' ? 'Ready' : 'Unreachable'}
              icon={<IconBrain />}
              detail={status?.services.aiService.url}
            />
          </>
        )}
      </div>

      {/* ── Connection flow diagram ────────────────────────────────── */}
      {status && (
        <div className="glass-card p-6 animate-fade-in">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-4">Communication Flow</p>
          <div className="flex flex-wrap items-center justify-center gap-2 text-sm">
            {[
              { label: 'Browser', color: 'bg-slate-700 text-slate-300' },
              null,
              { label: 'Frontend\n:5173', color: status ? 'bg-procure-600/20 text-procure-300 ring-1 ring-procure-500/20' : 'bg-slate-700 text-slate-400' },
              null,
              { label: 'Backend\n:4000', color: status?.services.backend.status === 'up' ? 'bg-procure-600/20 text-procure-300 ring-1 ring-procure-500/20' : 'bg-red-500/10 text-red-400' },
              null,
              { label: 'AI Service\n:8000', color: status?.services.aiService.status === 'up' ? 'bg-procure-600/20 text-procure-300 ring-1 ring-procure-500/20' : 'bg-red-500/10 text-red-400' },
            ].map((node, i) =>
              node === null ? (
                <div key={i} className="flex items-center text-slate-600">
                  <div className="h-px w-6 bg-slate-700" />
                  <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </div>
              ) : (
                <div key={i}
                  className={`rounded-xl px-3 py-2 text-center text-xs font-semibold leading-tight whitespace-pre-line ${node.color}`}>
                  {node.label}
                </div>
              )
            )}
            {/* Database branch */}
            <div className="w-full flex justify-center items-center gap-2 text-xs text-slate-600 mt-1">
              <span className="text-slate-600">└─ PostgreSQL :5432</span>
              {status?.services.database.status === 'up' && (
                <span className="badge-up">connected</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Raw JSON toggle ────────────────────────────────────────── */}
      {status && (
        <div className="glass-card overflow-hidden">
          <button
            id="btn-raw-toggle"
            type="button"
            onClick={() => setShowRaw(v => !v)}
            className="flex w-full items-center justify-between px-5 py-4 text-sm font-medium text-slate-300 hover:text-white transition-colors"
          >
            <span>Raw API response — <code className="text-xs text-procure-400">GET /api/v1/status</code></span>
            <svg
              className={`h-4 w-4 text-slate-500 transition-transform duration-200 ${showRaw ? 'rotate-180' : ''}`}
              fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"
            >
              <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          {showRaw && (
            <pre className="overflow-x-auto bg-slate-950/50 px-5 py-4 text-xs text-slate-400 border-t border-white/[0.04]">
              {JSON.stringify(status, null, 2)}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}
