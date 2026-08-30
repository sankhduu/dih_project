'use client';

import React, { useState } from 'react';
import { useMetrologyStore } from '@/lib/store';
import { Search, ShieldAlert, History, Filter, Download, Lock, CheckCircle2 } from 'lucide-react';

export function AuditLogViewer() {
  const { auditLogs } = useMetrologyStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');

  const filteredLogs = auditLogs.filter((log) => {
    const matchesSearch =
      log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.actorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.entityId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'ALL' || log.actorRole === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-purple-700" />
            <h2 className="text-xl font-extrabold text-slate-900">Immutable Compliance & Audit Trail</h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Cryptographically sealed log of every state-changing verification, certificate issuance, and rejection
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-full bg-purple-50 text-purple-700 text-xs font-bold border border-purple-200 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Tamper-Proof NIC Ledger
          </span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by actor, entity ID, or description..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-purple-500"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700"
        >
          <option value="ALL">All Roles</option>
          <option value="APPLICANT">Applicant / Owner</option>
          <option value="LMO">Legal Metrology Officer</option>
          <option value="GATC">GATC Testing Centre</option>
          <option value="ADMIN">Department Admin</option>
          <option value="PUBLIC">Public Verification</option>
        </select>
      </div>

      {/* Log Entries Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="px-6 py-3.5">Timestamp (UTC+5:30)</th>
                <th className="px-6 py-3.5">Actor & Role</th>
                <th className="px-6 py-3.5">Action Event</th>
                <th className="px-6 py-3.5">Target Entity ID</th>
                <th className="px-6 py-3.5">Activity Details</th>
                <th className="px-6 py-3.5">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 text-slate-500 whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                  </td>
                  <td className="px-6 py-4 font-sans font-semibold text-slate-900">
                    <div>{log.actorName}</div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-mono">
                      {log.actorRole}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-md font-bold text-[10px] ${
                        log.action.includes('CERTIFICATE')
                          ? 'bg-emerald-100 text-emerald-800'
                          : log.action.includes('DEFICIENCY')
                          ? 'bg-rose-100 text-rose-800'
                          : log.action.includes('SCHEDULED')
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {log.action}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-bold text-[#002B49]">{log.entityId}</td>
                  <td className="px-6 py-4 font-sans text-slate-800 max-w-sm">{log.details}</td>
                  <td className="px-6 py-4 text-slate-400">{log.ipAddress}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
