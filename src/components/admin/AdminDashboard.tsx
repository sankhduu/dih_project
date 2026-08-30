'use client';

import React from 'react';
import { useMetrologyStore } from '@/lib/store';
import {
  Sliders,
  Scale,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  Building,
  ShieldAlert,
  Download,
  MapPin,
} from 'lucide-react';

export function AdminDashboard() {
  const { applications, certificates, deficiencyMemos, instruments, jurisdictions } = useMetrologyStore();

  const totalApps = applications.length;
  const approvedApps = applications.filter((a) => a.status === 'APPROVED').length;
  const clearanceRate = totalApps > 0 ? Math.round((approvedApps / totalApps) * 100) : 0;
  const pendingApps = applications.filter((a) => a.status !== 'APPROVED' && a.status !== 'REJECTED').length;
  const expiredInstruments = instruments.filter((i) => i.status === 'EXPIRED').length;

  return (
    <div className="space-y-8">
      {/* Admin Executive Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#002B49] text-amber-400 flex items-center justify-center font-bold text-xl shadow-xs">
            <Sliders className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                National Legal Metrology Command Center
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 text-xs font-bold border border-purple-200">
                DoCA Central Directorate
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Real-time statewide statutory compliance, officer SLA pendency, and market enforcement oversight
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => alert('Exporting Statewide Legal Metrology Annual Compliance Report (CSV)...')}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4 text-amber-400" />
            <span>Export Directorate Report</span>
          </button>
        </div>
      </div>

      {/* KPI Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Clearance Rate</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">{clearanceRate}%</div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1">SLA Benchmark &gt; 85%</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Avg. Turnaround (TAT)</span>
            <Clock className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">4.2 Days</div>
          <div className="text-[11px] text-blue-600 font-medium mt-1">Cut by 68% vs paper legacy</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Active Stamped Assets</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">{certificates.length}</div>
          <div className="text-[11px] text-slate-500 font-medium mt-1">Digitally authenticated</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Expired Risk Index</span>
            <ShieldAlert className="w-4 h-4 text-rose-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-rose-700">{expiredInstruments} Lapsed</div>
          <div className="text-[11px] text-rose-600 font-medium mt-1">Auto-notified for renewal</div>
        </div>
      </div>

      {/* Jurisdiction Performance Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <div>
              <h3 className="font-extrabold text-base text-slate-900">State / District Pendency & Enforcement</h3>
              <p className="text-xs text-slate-500">Live operational throughput by Legal Metrology zone</p>
            </div>
            <span className="text-xs font-bold text-slate-400 uppercase">3 Jurisdictions Tracked</span>
          </div>

          <div className="space-y-3">
            {jurisdictions.map((jur) => {
              const jurApps = applications.filter((a) => a.jurisdictionId === jur.id);
              const jurApproved = jurApps.filter((a) => a.status === 'APPROVED').length;
              const jurPending = jurApps.filter((a) => a.status !== 'APPROVED').length;
              const pct = jurApps.length > 0 ? Math.round((jurApproved / jurApps.length) * 100) : 100;

              return (
                <div key={jur.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-slate-900">{jur.district} ({jur.zone})</span>
                      <div className="text-[11px] text-slate-500">
                        Officer: {jur.assignedLmoName} • GATC: {jur.assignedGatcName || 'Direct LMO'}
                      </div>
                    </div>
                    <div className="text-right font-mono">
                      <span className="font-bold text-slate-900">{jurApproved} / {jurApps.length}</span>
                      <span className="text-[10px] text-slate-500 block">({pct}% Clearance)</span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-[#002B49] h-2 rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Legal Metrology Enforcement Risk Radar */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div>
            <h3 className="font-extrabold text-base text-slate-900">Enforcement Hotspots</h3>
            <p className="text-xs text-slate-500">Categories requiring inspection vigilance</p>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900">
              <div className="font-bold">Heavy Weighbridges (Class III)</div>
              <p className="text-[11px] mt-0.5">High wear & tear on load cells requires strict 12-month re-verification compliance.</p>
            </div>

            <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-rose-900">
              <div className="font-bold">Retail Market Counter Scales</div>
              <p className="text-[11px] mt-0.5">Deficiency rate of 12% observed in lead seal tampering and display flicker.</p>
            </div>

            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900">
              <div className="font-bold">Precision Lab Balances (Class I/II)</div>
              <p className="text-[11px] mt-0.5">100% compliant testing handled via accredited GATCs.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
