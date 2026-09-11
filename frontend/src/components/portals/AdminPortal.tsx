import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';

const FONT = "'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

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
    <div style={{ fontFamily: FONT }} className="space-y-6">
      <div className="border-b border-gray-200/90 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-700 shrink-0 shadow-xs">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900 tracking-tight">Platform Administration</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Manage users, monitor system status, and supervise activity records.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="rounded-2xl bg-white border border-gray-200 p-12 text-center text-xs text-gray-400 shadow-xs animate-pulse">
          Loading system status...
        </div>
      ) : (
        <div className="space-y-6">
          {/* Status Cards */}
          {systemInfo && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="rounded-2xl bg-white border border-gray-200/90 p-5 shadow-xs">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block mb-1">Active Sessions</span>
                  <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                  </div>
                </div>
                <span className="text-2xl font-bold text-blue-600">
                  {systemInfo.activeSessions}
                </span>
                <span className="text-[11px] text-gray-400 block mt-1">Logged In Now</span>
              </div>

              <div className="rounded-2xl bg-white border border-gray-200/90 p-5 shadow-xs">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block mb-1">System Uptime</span>
                  <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                  </div>
                </div>
                <span className="text-2xl font-bold text-emerald-600">
                  {Math.floor(systemInfo.uptimeSeconds / 60)}m {systemInfo.uptimeSeconds % 60}s
                </span>
                <span className="text-[11px] text-emerald-600 font-medium block mt-1 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Online & Stable</span>
                </span>
              </div>

              <div className="rounded-2xl bg-white border border-gray-200/90 p-5 shadow-xs">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block mb-1">Database Tables</span>
                  <div className="w-7 h-7 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>
                  </div>
                </div>
                <span className="text-2xl font-bold text-purple-600">
                  {systemInfo.tableStats?.length || 22}
                </span>
                <span className="text-[11px] text-gray-400 block mt-1">Data Tables</span>
              </div>

              <div className="rounded-2xl bg-white border border-gray-200/90 p-5 shadow-xs">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block mb-1">Registered Users</span>
                  <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                  </div>
                </div>
                <span className="text-2xl font-bold text-amber-600">
                  {users.length}
                </span>
                <span className="text-[11px] text-gray-400 block mt-1">Across 4 Roles</span>
              </div>
            </div>
          )}

          {/* Users Table */}
          <div className="rounded-2xl bg-white border border-gray-200 shadow-xs overflow-hidden">
            <div className="p-5 flex justify-between items-center text-sm border-b border-gray-100">
              <span className="font-bold text-gray-900 text-xs uppercase tracking-wider">
                User Directory
              </span>
              <span className="text-xs text-gray-400">
                {users.length} registered accounts
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-200 bg-[#F9FAFB] text-gray-500 text-[10px]">
                    <th className="py-3 px-4 font-bold uppercase">Name</th>
                    <th className="py-3 px-3 font-bold uppercase">Email</th>
                    <th className="py-3 px-3 font-bold uppercase">Role</th>
                    <th className="py-3 px-3 font-bold uppercase">Organization</th>
                    <th className="py-3 px-4 font-bold uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-3 px-4 text-gray-900 font-semibold">
                        {u.full_name}
                      </td>
                      <td className="py-3 px-3 text-gray-500 text-xs">{u.email}</td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2.5 py-0.5 rounded-full font-semibold text-[10px] border ${
                            u.role_code === 'ADMIN'
                              ? 'bg-red-50 text-red-700 border-red-200'
                              : u.role_code === 'GOVT_OFFICER'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : u.role_code === 'BIDDER'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }`}
                        >
                          {u.role_code === 'GOVT_OFFICER' ? 'Officer' : u.role_code === 'BIDDER' ? 'Bidder' : u.role_code === 'AUDITOR' ? 'Auditor' : 'Admin'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-gray-600">
                        {u.company_name || 'Government Agency'}
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          {u.status}
                        </span>
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
