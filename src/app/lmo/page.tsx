'use client';

import React from 'react';
import Link from 'next/link';
import {
  Scale,
  Smartphone,
  ShieldCheck,
  ArrowLeft,
  ArrowRight,
  MapPin,
  Camera,
  RefreshCw,
} from 'lucide-react';

export default function LMOFieldInspectorPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans text-slate-900">
      {/* Government Tricolor Top Strip */}
      <div className="h-1.5 w-full flex">
        <div className="flex-1 bg-[#FF9933]"></div>
        <div className="flex-1 bg-[#FFFFFF]"></div>
        <div className="flex-1 bg-[#138808]"></div>
      </div>

      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 py-3 px-4 sm:px-8 flex items-center justify-between shadow-xs">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-[#002B49] text-white flex items-center justify-center shadow-xs">
            <Scale className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <span className="font-extrabold text-base text-[#002B49] tracking-tight">
              e-Māpan <span className="text-amber-600 font-semibold">2.0</span>
            </span>
            <span className="text-[10px] block text-slate-500 font-medium -mt-0.5">
              Department of Consumer Affairs (DoCA) • Legal Metrology
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Switch Account</span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="max-w-xl w-full bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
          {/* Top Banner */}
          <div className="bg-[#002B49] text-white p-6 sm:p-8 relative overflow-hidden">
            <div className="relative z-10 space-y-2">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-400/20 text-amber-300 text-[11px] font-bold border border-amber-400/30">
                <Smartphone className="w-3.5 h-3.5" />
                <span>Field Operations Notice</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Legal Metrology Officer (LMO) Portal
              </h1>
              <p className="text-xs text-slate-300">
                Statutory Physical Verification & Stamping Field Deployment
              </p>
            </div>
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            {/* Clean UI Message */}
            <div className="p-5 rounded-2xl bg-amber-50 border border-amber-300 text-amber-950 flex items-start gap-3.5 shadow-xs">
              <div className="p-2 bg-amber-200/60 rounded-xl shrink-0 text-amber-800 mt-0.5">
                <Smartphone className="w-6 h-6" />
              </div>
              <div className="space-y-1.5">
                <h3 className="font-extrabold text-sm text-amber-950">
                  Mobile Application Required
                </h3>
                <p className="text-xs text-amber-900 leading-relaxed font-medium">
                  LMO Dashboard is optimized for the Field Inspector Mobile App. Please log in on your device.
                </p>
              </div>
            </div>

            {/* Feature Highlights of the Mobile App */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Field Inspector Mobile App Capabilities
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-bold text-slate-800">GPS Geofence Tagging</div>
                    <div className="text-[11px] text-slate-500">Auto-validates officer presence at trader premises</div>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-2.5">
                  <Camera className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-bold text-slate-800">Live Photo Evidence</div>
                    <div className="text-[11px] text-slate-500">Capture stamped instruments and lead seals directly</div>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-2.5">
                  <RefreshCw className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-bold text-slate-800">Offline Queue Sync</div>
                    <div className="text-[11px] text-slate-500">Complete checklists even with no cellular connectivity</div>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-bold text-slate-800">Real-Time Supabase</div>
                    <div className="text-[11px] text-slate-500">Live inspection queue for Hisar and Rohtak districts</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="pt-2 space-y-3">
              <Link
                href="/admin/traders"
                className="w-full py-3 bg-[#002B49] hover:bg-[#003B66] text-white font-extrabold text-xs rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <span>Continue to Desktop Review Queue</span>
                <ArrowRight className="w-4 h-4 text-amber-400" />
              </Link>

              <Link
                href="/login"
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to Login</span>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
