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
          <h2 className="text-xl font-bold text-gray-800">Administration</h2>
        </div>
        <p className="text-sm text-gray-500 mt-1">
          Manage users, view system status, and configure platform settings.
        </p>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-400">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="card-glass p-8 text-center text-sm text-gray-400 animate-pulse">
          Loading...
        </div>
      ) : (
        <div className="space-y-6">
          {/* Telemetry Cards */}
          {systemInfo && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="card-glass p-4">
                <span className="text-[11px] text-gray-500 block mb-1">Active Sessions</span>
                <span className="text-2xl font-bold text-blue-600">
                  {systemInfo.activeSessions}
                </span>
              </div>

              <div className="card-glass p-4">
                <span className="text-[11px] text-gray-500 block mb-1">System Uptime</span>
                <span className="text-2xl font-bold text-emerald-600">
                  {Math.floor(systemInfo.uptimeSeconds / 60)}m {systemInfo.uptimeSeconds % 60}s
                </span>
              </div>

              <div className="card-glass p-4">
                <span className="text-[11px] text-gray-500 block mb-1">Database Tables</span>
                <span className="text-2xl font-bold text-indigo-600">
                  {systemInfo.tableStats?.length || 22}
                </span>
              </div>

              <div className="card-glass p-4">
                <span className="text-[11px] text-gray-500 block mb-1">Registered Users</span>
                <span className="text-2xl font-bold text-amber-600">
                  {users.length}
                </span>
              </div>
            </div>
          )}

          {/* Users Table */}
          <div className="card-glass p-6 space-y-4">
            <div className="flex justify-between items-center text-sm border-b border-gray-200 pb-3">
              <span className="font-bold text-gray-700">
                User Directory
              </span>
              <span className="text-xs text-gray-400">
                {users.length} registered users
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-500">
                    <th className="pb-2.5 pr-4 font-semibold text-xs uppercase">Name</th>
                    <th className="pb-2.5 px-3 font-semibold text-xs uppercase">Email</th>
                    <th className="pb-2.5 px-3 font-semibold text-xs uppercase">Role</th>
                    <th className="pb-2.5 px-3 font-semibold text-xs uppercase">Organization</th>
                    <th className="pb-2.5 pl-3 font-semibold text-xs uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-gray-50">
                      <td className="py-2.5 pr-4 text-gray-800 font-medium text-sm">
                        {u.full_name}
                      </td>
                      <td className="py-2.5 px-3 text-gray-500 text-xs">{u.email}</td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded font-bold text-[11px] border ${
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
                      <td className="py-2.5 px-3 text-gray-500 text-xs">
                        {u.company_name || 'Government Agency'}
                      </td>
                      <td className="py-2.5 pl-3">
                        <span className="text-emerald-600 font-semibold text-xs">{u.status}</span>
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
