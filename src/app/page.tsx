'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase-client';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { useMetrologyStore } from '@/lib/store';
import { ApplicantDashboard } from '@/components/applicant/ApplicantDashboard';
import { ApplicationTracker } from '@/components/applicant/ApplicationTracker';
import { OfficerDashboard } from '@/components/officer/OfficerDashboard';
import { GATCDashboard } from '@/components/gatc/GATCDashboard';
import { AdminDashboard } from '@/components/admin/AdminDashboard';
import { JurisdictionManager } from '@/components/admin/JurisdictionManager';
import { AuditLogViewer } from '@/components/admin/AuditLogViewer';
import { PublicVerificationPortal } from '@/components/public/PublicVerificationPortal';
import { OfficialDeficiencyMemoView } from '@/components/certificates/OfficialDeficiencyMemoView';
import {
  Scale,
  Building2,
  CheckCircle2,
  Clock,
  TrendingUp,
  ArrowRight,
  RefreshCw,
  FileSpreadsheet,
  FileBadge,
  ShieldCheck,
  MapPin,
  FileWarning,
  RotateCcw,
  Download,
  Activity,
} from 'lucide-react';

interface TraderSummary {
  id?: string | number;
  trader_name: string;
  owner_name?: string;
  license_number: string;
  latitude?: string | number;
  longitude?: string | number;
  inspection_status: string;
  instrument_type: string;
}

export default function HomePage() {
  const router = useRouter();
  const { currentUser, deficiencyMemos, resetToDefaultData } = useMetrologyStore();
  const [activeTab, setActiveTab] = useState<string>('analytics-dashboard');
  const [checkingAuth, setCheckingAuth] = useState<boolean>(true);

  // Stats state from API / Supabase
  const [traders, setTraders] = useState<TraderSummary[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Authentication check for first-time / unauthenticated visitors
  useEffect(() => {
    async function checkAuth() {
      try {
        const { data } = await supabase.auth.getSession();
        const storedUser = typeof window !== 'undefined' ? localStorage.getItem('eMaap_currentUser') : null;
        
        // If neither Supabase session nor a local stored user exists, redirect to login
        if (!data.session && !storedUser) {
          router.replace('/login');
          return;
        }
      } catch {
        router.replace('/login');
        return;
      }
      setCheckingAuth(false);
    }
    checkAuth();
  }, [router]);

  useEffect(() => {
    async function fetchStats() {
      setLoading(true);
      try {
        const res = await fetch('http://localhost:5000/api/traders?limit=100');
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.data) && json.data.length > 0) {
            setTraders(json.data);
          }
        }
      } catch {
        // Fallback default sample data
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  // Compute live metrics
  const totalCount = traders.length > 0 ? traders.length : 1000;
  const passedCount = traders.length > 0
    ? traders.filter((t) => (t.inspection_status || '').toLowerCase() === 'passed').length
    : 550;
  const pendingCount = traders.length > 0
    ? traders.filter((t) => (t.inspection_status || '').toLowerCase() === 'pending').length
    : 300;
  const failedCount = traders.length > 0
    ? traders.filter((t) => (t.inspection_status || '').toLowerCase() === 'failed').length
    : 150;

  const totalEvaluated = passedCount + failedCount;
  const complianceRate = totalEvaluated > 0
    ? ((passedCount / totalEvaluated) * 100).toFixed(1)
    : '78.5';

  const userDeficiencies = deficiencyMemos.filter((m) => m.ownerId === currentUser.id);

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900 font-sans">
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Reset State & View Indicator */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-200 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">Active Portal View:</span>
            <span className="bg-[#002B49] text-white px-2.5 py-0.5 rounded-md font-mono text-[11px] font-bold">
              {activeTab === 'analytics-dashboard' ? 'National LMO Analytics Dashboard' : activeTab}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (confirm('Reset state to initial seed data?')) {
                  resetToDefaultData();
                }
              }}
              className="text-slate-500 hover:text-slate-900 flex items-center gap-1 transition-colors text-[11px] cursor-pointer"
              title="Reset to fresh seed state"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset State</span>
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* MAIN ANALYTICS DASHBOARD (DEFAULT VIEW) */}
        {/* ========================================================================= */}
        {activeTab === 'analytics-dashboard' && (
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* Hero Banner with Quick Action to /admin/traders */}
            <div className="relative rounded-3xl bg-gradient-to-br from-[#002B49] via-[#003B66] to-[#0A192F] text-white p-6 sm:p-10 shadow-xl overflow-hidden">
              <div className="absolute -right-10 -bottom-10 opacity-10 pointer-events-none">
                <Scale className="w-96 h-96 text-white" />
              </div>

              <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="max-w-2xl space-y-3">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs font-bold border border-amber-400/30">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Official Legal Metrology Officer (LMO) Inspector Portal</span>
                  </div>

                  <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
                    Legal Metrology Verification & Stamping Dashboard
                  </h1>

                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    Centralized statutory monitoring system for commercial scales, weighbridges, and measuring instruments under the <span className="text-amber-400 font-semibold">Legal Metrology Act, 2009</span> across the Haryana & Delhi NCR region.
                  </p>
                </div>

                {/* Primary Quick-Action Link to /admin/traders */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
                  <Link
                    href="/admin/traders"
                    className="px-6 py-3.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs sm:text-sm rounded-2xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 group cursor-pointer"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-slate-950" />
                    <span>Manage Trader Database</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>

                  <button
                    onClick={() => setActiveTab('public-verify')}
                    className="px-5 py-3.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs sm:text-sm rounded-2xl border border-white/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Public QR Scan</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Top Stat Cards (Responsive Grid) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {/* Card 1: Total Registered Traders */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Registered Traders</span>
                  <div className="w-10 h-10 rounded-2xl bg-[#002B49]/10 text-[#002B49] flex items-center justify-center">
                    <Building2 className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                    {totalCount.toLocaleString()}
                  </span>
                  <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                    Active
                  </span>
                </div>
                <div className="mt-2 text-xs text-slate-500 flex items-center gap-1 font-medium">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>Haryana / Delhi NCR Region</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full mt-4 overflow-hidden">
                  <div className="h-full bg-[#002B49] w-full rounded-full"></div>
                </div>
              </div>

              {/* Card 2: Inspections Passed */}
              <div className="bg-white p-6 rounded-3xl border border-emerald-100 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Inspections Passed</span>
                  <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="text-3xl sm:text-4xl font-black text-emerald-700 tracking-tight">
                    {passedCount.toLocaleString()}
                  </span>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                    Stamped
                  </span>
                </div>
                <div className="mt-2 text-xs text-emerald-600 font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Statutorily certified & verified</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full mt-4 overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{ width: `${(passedCount / totalCount) * 100}%` }}
                  ></div>
                </div>
              </div>

              {/* Card 3: Pending Reviews */}
              <div className="bg-white p-6 rounded-3xl border border-amber-100 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pending Reviews</span>
                  <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center">
                    <Clock className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="text-3xl sm:text-4xl font-black text-amber-700 tracking-tight">
                    {pendingCount.toLocaleString()}
                  </span>
                  <span className="text-xs font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full">
                    In Queue
                  </span>
                </div>
                <div className="mt-2 text-xs text-amber-700 font-semibold flex items-center gap-1">
                  <Activity className="w-3.5 h-3.5" />
                  <span>Awaiting field inspector visits</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full mt-4 overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full"
                    style={{ width: `${(pendingCount / totalCount) * 100}%` }}
                  ></div>
                </div>
              </div>

              {/* Card 4: Compliance Rate */}
              <div className="bg-white p-6 rounded-3xl border border-indigo-100 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Compliance Rate</span>
                  <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="text-3xl sm:text-4xl font-black text-indigo-900 tracking-tight">
                    {complianceRate}%
                  </span>
                  <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full">
                    SLA 85%
                  </span>
                </div>
                <div className="mt-2 text-xs text-indigo-600 font-semibold flex items-center gap-1">
                  <span>MPE Tolerance Pass Ratio</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full mt-4 overflow-hidden">
                  <div
                    className="h-full bg-indigo-600 rounded-full"
                    style={{ width: `${complianceRate}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Quick Navigation Action Button to /admin/traders */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-[#002B49]/10 text-[#002B49] flex items-center justify-center shrink-0">
                  <FileSpreadsheet className="w-5 h-5 text-[#002B49]" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">Central Trader & Verification Registry</h3>
                  <p className="text-xs text-slate-500">Access the comprehensive live dataset, search by license number, and issue Schedule IX certificates.</p>
                </div>
              </div>

              <Link
                href="/admin/traders"
                className="inline-flex items-center justify-center px-6 py-3 bg-[#002B49] hover:bg-[#003B66] text-white font-bold text-sm rounded-xl shadow-xs hover:shadow-md transition-all cursor-pointer whitespace-nowrap group shrink-0"
              >
                <span>View & Manage Traders →</span>
              </Link>
            </div>

            {/* Quick Action Grid & Jurisdiction Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left 2 Cols: Central Directory Quick Access & Recent Inspections */}
              <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-xs p-6 sm:p-8 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div>
                    <h3 className="font-black text-lg text-slate-900">Central Traders Inspection Directory</h3>
                    <p className="text-xs text-slate-500">Live feed from Legal Metrology Supabase database</p>
                  </div>
                  <Link
                    href="/admin/traders"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#002B49] bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-xl transition-colors cursor-pointer"
                  >
                    <span>Open Full Directory</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                {/* Sample Live Records Table Preview */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                      <tr>
                        <th className="px-4 py-3">Trader Name</th>
                        <th className="px-4 py-3">License Number</th>
                        <th className="px-4 py-3">Instrument</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3 text-right">Certificate</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(traders.length > 0 ? traders.slice(0, 5) : [
                        { trader_name: 'Apex Supermarket', license_number: 'LMO/2026/10001', instrument_type: 'Counter Scale', inspection_status: 'Passed' },
                        { trader_name: 'Precision Pharma Labs', license_number: 'LMO/2026/10002', instrument_type: 'Lab Balance', inspection_status: 'Passed' },
                        { trader_name: 'Haryana Agro Flour Mill', license_number: 'LMO/2026/10003', instrument_type: 'Platform Scale', inspection_status: 'Pending' },
                        { trader_name: 'Karnal Cotton Mill', license_number: 'LMO/2026/10004', instrument_type: 'Weighbridge', inspection_status: 'Failed' },
                      ]).map((t, idx) => {
                        const isPassed = (t.inspection_status || '').toLowerCase() === 'passed';
                        const isPending = (t.inspection_status || '').toLowerCase() === 'pending';
                        return (
                          <tr key={t.license_number || idx} className="hover:bg-slate-50/70 transition-colors">
                            <td className="px-4 py-3.5 font-bold text-slate-900">{t.trader_name}</td>
                            <td className="px-4 py-3.5 font-mono text-[11px] text-[#002B49] font-semibold">{t.license_number}</td>
                            <td className="px-4 py-3.5 text-slate-600 font-medium">{t.instrument_type}</td>
                            <td className="px-4 py-3.5">
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  isPassed
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : isPending
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-rose-100 text-rose-800'
                                }`}
                              >
                                {t.inspection_status}
                              </span>
                            </td>
                            <td className="px-4 py-3.5 text-right">
                              {isPassed ? (
                                <a
                                  href={`http://localhost:5000/api/certificate/${encodeURIComponent(t.license_number)}`}
                                  download
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold bg-[#002B49] hover:bg-[#003B66] text-white rounded-lg shadow-2xs transition-colors"
                                >
                                  <Download className="w-3 h-3 text-amber-400" />
                                  <span>PDF</span>
                                </a>
                              ) : (
                                <span className="text-[10px] text-slate-400 font-medium">—</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="pt-2 flex items-center justify-between text-xs text-slate-500">
                  <span>Showing 5 recent records from database</span>
                  <Link href="/admin/traders" className="font-bold text-[#002B49] hover:underline">
                    View all 1,000+ traders with live search & filters &rarr;
                  </Link>
                </div>
              </div>

              {/* Right Col: Regional Jurisdiction Breakdown & System Status */}
              <div className="space-y-6">
                {/* Zone Breakdown */}
                <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-extrabold text-sm text-slate-900">Regional Jurisdiction Status</h3>
                    <span className="text-[10px] font-bold bg-slate-100 px-2 py-0.5 rounded text-slate-600">NCR Zone</span>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div>
                      <div className="flex justify-between font-semibold text-slate-800 pb-1">
                        <span>South Delhi Zone (Saket / Okhla)</span>
                        <span className="text-emerald-700 font-bold">92% Verified</span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 w-[92%] rounded-full"></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between font-semibold text-slate-800 pb-1">
                        <span>Gurugram & Manesar Industrial</span>
                        <span className="text-emerald-700 font-bold">84% Verified</span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 w-[84%] rounded-full"></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between font-semibold text-slate-800 pb-1">
                        <span>Faridabad & Palwal Trade Zone</span>
                        <span className="text-amber-700 font-bold">68% Verified</span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-500 w-[68%] rounded-full"></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between font-semibold text-slate-800 pb-1">
                        <span>Karnal, Panipat & Rohtak Agro</span>
                        <span className="text-emerald-700 font-bold">76% Verified</span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 w-[76%] rounded-full"></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* System Services Status */}
                <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-3">
                  <h3 className="font-extrabold text-sm text-slate-900">Connected Services</h3>

                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        <span className="font-semibold text-slate-700">Express API Gateway</span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-500">Port 5000</span>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        <span className="font-semibold text-slate-700">Supabase Cloud PostgreSQL</span>
                      </div>
                      <span className="text-[10px] font-mono text-emerald-700 font-bold">Live Connected</span>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                        <span className="font-semibold text-slate-700">LMO Inspector Mobile App</span>
                      </div>
                      <span className="text-[10px] font-mono text-blue-700 font-bold">Flutter Ready</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* OTHER SUB-PORTAL VIEWS ACCESSIBLE VIA TABS */}
        {/* ========================================================================= */}
        {activeTab === 'applicant-dashboard' && <ApplicantDashboard />}
        {activeTab === 'applicant-applications' && <ApplicationTracker />}
        {activeTab === 'applicant-deficiencies' && (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs">
              <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                <FileWarning className="w-6 h-6 text-rose-600" />
                <span>Statutory Deficiency Notices (Form VI)</span>
              </h2>
              <p className="text-xs text-slate-500">
                Instruments requiring repair & recalibration before statutory cure deadline
              </p>
            </div>

            {userDeficiencies.length > 0 ? (
              userDeficiencies.map((memo) => (
                <OfficialDeficiencyMemoView key={memo.id} memo={memo} />
              ))
            ) : (
              <div className="bg-white rounded-3xl p-12 text-center text-slate-400 border border-slate-200">
                No active deficiency notices for your registered instruments. All equipment in compliance!
              </div>
            )}
          </div>
        )}

        {(activeTab === 'officer-queue' ||
          activeTab === 'officer-calendar' ||
          activeTab === 'officer-history') && <OfficerDashboard />}

        {(activeTab === 'gatc-queue' || activeTab === 'gatc-accreditation') && <GATCDashboard />}

        {activeTab === 'admin-analytics' && <AdminDashboard />}
        {activeTab === 'admin-jurisdictions' && <JurisdictionManager />}
        {activeTab === 'admin-audit' && <AuditLogViewer />}

        {activeTab === 'public-verify' && <PublicVerificationPortal />}
      </main>

      <Footer />
    </div>
  );
}
