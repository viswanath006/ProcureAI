import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';

export const AdminPortal: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [systemInfo, setSystemInfo] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      setError(null);

      const [usersRes, sysRes] = await Promise.all([
        api.getAdminUsers(),
        api.getAdminSystem(),
      ]);

      if (usersRes.success && usersRes.data) {
        setUsers(usersRes.data.users);
      } else {
        setError(usersRes.error?.message || 'Failed to load user directory');
      }

      if (sysRes.success && sysRes.data) {
        setSystemInfo(sysRes.data);
      }

      setIsLoading(false);
    }

    loadData();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <span className="text-xl">⚙️</span>
          <h2 className="text-xl font-bold text-slate-100">System Administration & RBAC Management</h2>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Platform-level configuration, principal directory, and active cryptographic session diagnostics.
        </p>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-400">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="card-glass p-8 text-center text-xs text-slate-400 animate-pulse">
          Loading system telemetry...
        </div>
      ) : (
        <div className="space-y-6">
          {/* Telemetry Cards */}
          {systemInfo && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="card-glass p-4">
                <span className="text-[10px] text-slate-500 font-mono block">ACTIVE JWT SESSIONS</span>
                <span className="text-2xl font-bold text-procure-400 font-mono">
                  {systemInfo.activeSessions}
                </span>
                <span className="text-[10px] text-slate-400 block mt-1">Cryptographic Refresh Families</span>
              </div>

              <div className="card-glass p-4">
                <span className="text-[10px] text-slate-500 font-mono block">SYSTEM UPTIME</span>
                <span className="text-2xl font-bold text-emerald-400 font-mono">
                  {Math.floor(systemInfo.uptimeSeconds / 60)}m {systemInfo.uptimeSeconds % 60}s
                </span>
                <span className="text-[10px] text-slate-400 block mt-1">Node {systemInfo.nodeVersion}</span>
              </div>

              <div className="card-glass p-4">
                <span className="text-[10px] text-slate-500 font-mono block">DATABASE TABLES</span>
                <span className="text-2xl font-bold text-indigo-400 font-mono">
                  {systemInfo.tableStats?.length || 22}
                </span>
                <span className="text-[10px] text-slate-400 block mt-1">PostgreSQL 16 Normalized</span>
              </div>

              <div className="card-glass p-4">
                <span className="text-[10px] text-slate-500 font-mono block">REGISTERED PRINCIPALS</span>
                <span className="text-2xl font-bold text-amber-400 font-mono">
                  {users.length}
                </span>
                <span className="text-[10px] text-slate-400 block mt-1">RBAC Enforced</span>
              </div>
            </div>
          )}

          {/* Users Table */}
          <div className="card-glass p-6 space-y-4">
            <div className="flex justify-between items-center text-xs border-b border-slate-800 pb-3">
              <span className="font-bold text-slate-300 uppercase tracking-wider font-mono">
                Principal Identity Directory
              </span>
              <span className="text-[10px] text-slate-500 font-mono">
                BCrypt Cost 12 Enforced
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-500">
                    <th className="pb-2.5 pr-4 font-semibold uppercase">Principal Name</th>
                    <th className="pb-2.5 px-3 font-semibold uppercase">Email</th>
                    <th className="pb-2.5 px-3 font-semibold uppercase">Assigned Role</th>
                    <th className="pb-2.5 px-3 font-semibold uppercase">Affiliation</th>
                    <th className="pb-2.5 pl-3 font-semibold uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-[11px]">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-900/40">
                      <td className="py-2.5 pr-4 text-slate-200 font-sans font-medium">
                        {u.full_name}
                      </td>
                      <td className="py-2.5 px-3 text-slate-400">{u.email}</td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                            u.role_code === 'ADMIN'
                              ? 'bg-red-500/20 text-red-400'
                              : u.role_code === 'GOVT_OFFICER'
                              ? 'bg-amber-500/20 text-amber-300'
                              : u.role_code === 'BIDDER'
                              ? 'bg-blue-500/20 text-blue-300'
                              : 'bg-emerald-500/20 text-emerald-300'
                          }`}
                        >
                          {u.role_code}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-400">
                        {u.company_name || 'Government Agency'}
                      </td>
                      <td className="py-2.5 pl-3">
                        <span className="text-emerald-400 font-semibold">{u.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
