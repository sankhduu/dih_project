'use client';

import React from 'react';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { useMetrologyStore } from '@/lib/store';
import {
  Scale,
  Building2,
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  Download,
  PlusCircle,
  FileBadge,
  Sliders,
  Microscope,
  FlaskConical,
  Award,
} from 'lucide-react';

export default function GatcDashboardPage() {
  const { currentUser, applications, certificates } = useMetrologyStore();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans text-slate-900">
      <Header activeTab="gatc-queue" setActiveTab={() => {}} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* GATC Laboratory Profile Banner */}
        <div className="bg-[#002B49] text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
          <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none">
            <Microscope className="w-64 h-64 text-white" />
          </div>

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-400/20 text-emerald-300 text-xs font-bold border border-emerald-400/30">
                <Award className="w-3.5 h-3.5" />
                <span>Govt. Approved Test Centre (GATC) • NABL / DoCA Notified</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {currentUser.fullName || 'National Calibration & Test Centre (GATC-04)'}
              </h1>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300">
                <span className="flex items-center gap-1 font-mono">
                  <Award className="w-3.5 h-3.5 text-amber-400" />
                  <span>Accreditation: GATC/DL/2026/04</span>
                </span>
                <span>•</span>
                <span>Valid Until: 31 March 2028</span>
                <span>•</span>
                <span>Jurisdiction: Haryana & Delhi NCR Industrial Belt</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <Link
                href="/admin/traders"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-amber-400 hover:bg-amber-300 text-[#002B49] font-black text-xs shadow-md transition-all cursor-pointer whitespace-nowrap"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Central Verification Directory</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Metric Cards Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="text-slate-500 text-xs font-semibold flex items-center justify-between">
              <span>Assigned Test Batches</span>
              <FlaskConical className="w-4 h-4 text-blue-600" />
            </div>
            <div className="mt-2 text-2xl font-black text-slate-900">12</div>
            <div className="text-[11px] text-slate-500 mt-0.5">High-Precision Instruments</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="text-slate-500 text-xs font-semibold flex items-center justify-between">
              <span>Passed Calibration</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="mt-2 text-2xl font-black text-emerald-700">9</div>
            <div className="text-[11px] text-emerald-600 font-semibold mt-0.5">MPE Tolerance Certified</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="text-slate-500 text-xs font-semibold flex items-center justify-between">
              <span>Awaiting Lab Verification</span>
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
            <div className="mt-2 text-2xl font-black text-amber-700">3</div>
            <div className="text-[11px] text-amber-600 font-semibold mt-0.5">SLA Deadline: 48 hrs</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="text-slate-500 text-xs font-semibold flex items-center justify-between">
              <span>Test Compliance Rate</span>
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="mt-2 text-2xl font-black text-indigo-900">98.4%</div>
            <div className="text-[11px] text-indigo-600 font-semibold mt-0.5">NABL ISO/IEC 17025 Standard</div>
          </div>
        </div>

        {/* Action Navigation Panels */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link
            href="/admin/traders"
            className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs hover:shadow-md transition-all group flex flex-col justify-between space-y-4"
          >
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center group-hover:scale-110 transition-transform">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base group-hover:text-blue-700 transition-colors">
                Assigned Laboratory Queue
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Access scheduled weighing instruments, platform scales, and analytical balances assigned to your test centre.
              </p>
            </div>
            <div className="text-xs font-bold text-blue-700 flex items-center gap-1">
              <span>Open Queue</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          <Link
            href="/apply"
            className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs hover:shadow-md transition-all group flex flex-col justify-between space-y-4"
          >
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:scale-110 transition-transform">
              <PlusCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base group-hover:text-emerald-700 transition-colors">
                Register Laboratory Equipment
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Add secondary working standards, standard weights (Class E1-F2), and test mass comparators.
              </p>
            </div>
            <div className="text-xs font-bold text-emerald-700 flex items-center gap-1">
              <span>Add Equipment</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          <Link
            href="/verify"
            className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs hover:shadow-md transition-all group flex flex-col justify-between space-y-4"
          >
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center group-hover:scale-110 transition-transform">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base group-hover:text-indigo-700 transition-colors">
                Public Certificate Authenticator
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Authenticate stamped Schedule IX verification certificates and inspect tamper-evident security seal serial numbers.
              </p>
            </div>
            <div className="text-xs font-bold text-indigo-700 flex items-center gap-1">
              <span>Verify Certificate</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
