'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase, normalizeUserRole } from '@/lib/supabase-client';
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
  User,
  CreditCard,
  Mail,
  Lock,
  FileText,
  QrCode,
} from 'lucide-react';

export default function TraderDashboardPage() {
  const router = useRouter();
  const { currentUser, instruments, applications, certificates, deficiencyMemos } = useMetrologyStore();
  const [authorized, setAuthorized] = useState(false);
  const [sessionEmail, setSessionEmail] = useState<string>('');

  // 1. Client-Side Route Protection Guard
  useEffect(() => {
    async function checkTraderAuth() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const storedUser = typeof window !== 'undefined' ? localStorage.getItem('eMaap_currentUser') : null;

        // If neither Supabase session nor a local stored user exists, redirect to login
        if (!session && !storedUser) {
          router.push('/login');
          return;
        }

        let effectiveRole = currentUser.role;
        let effectiveEmail = currentUser.email || '';

        if (session?.user) {
          effectiveEmail = session.user.email || effectiveEmail;
          const metaRole = session.user.user_metadata?.role;
          if (metaRole) {
            effectiveRole = normalizeUserRole(metaRole).storeRole;
          }
        } else if (storedUser) {
          try {
            const parsed = JSON.parse(storedUser);
            if (parsed?.role) {
              effectiveRole = normalizeUserRole(parsed.role).storeRole;
            }
            if (parsed?.email) {
              effectiveEmail = parsed.email;
            }
          } catch {
            // ignore
          }
        }

        setSessionEmail(effectiveEmail);

        // If user is NOT a Trader / Applicant, kick them to login
        if (effectiveRole !== 'APPLICANT') {
          router.push('/login');
          return;
        }

        setAuthorized(true);
      } catch (err) {
        console.warn('Trader route guard error:', err);
        router.push('/login');
      }
    }

    checkTraderAuth();
  }, [router, currentUser.role, currentUser.email]);

  if (!authorized) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 font-sans text-slate-900">
        <div className="p-8 max-w-sm w-full bg-white rounded-3xl border border-slate-200 shadow-xl text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto animate-pulse">
            <Lock className="w-6 h-6" />
          </div>
          <h3 className="font-extrabold text-slate-900 text-base">Securing Trader Portal</h3>
          <p className="text-xs text-slate-500">Validating your Trader credentials &amp; session permissions...</p>
        </div>
      </div>
    );
  }

  const userInstruments = instruments.filter(
    (inst) => inst.ownerName === currentUser.fullName || currentUser.role === 'APPLICANT'
  );

  const displayEmail = sessionEmail || currentUser.email || 'trader@demo.com';
  const displayName = currentUser.fullName || 'Ramesh Kumar (Proprietor)';

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans text-slate-900">
      <Header activeTab="applicant-dashboard" setActiveTab={() => {}} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Trader Profile Banner */}
        <div className="bg-[#002B49] text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
          <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none">
            <Building2 className="w-64 h-64 text-white" />
          </div>

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs font-bold border border-amber-400/30">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Trader / Commercial Enterprise Portal</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Welcome, {displayName}
              </h1>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300">
                <span className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-amber-400" />
                  <span className="font-mono text-amber-200">{displayEmail}</span>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-slate-300" />
                  <span>{currentUser.businessName || 'Apex Supermarket & Grocery Store'}</span>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
                  <span>UIDAI Aadhaar Verified</span>
                </span>
                <span>•</span>
                <span>{currentUser.district || 'South Delhi'}, {currentUser.state || 'Delhi (NCT)'}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <Link
                href="/apply"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-amber-400 hover:bg-amber-300 text-[#002B49] font-black text-xs shadow-md transition-all cursor-pointer whitespace-nowrap"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Register New Scale</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Metric Cards Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="text-slate-500 text-xs font-semibold flex items-center justify-between">
              <span>My Registered Scales</span>
              <Scale className="w-4 h-4 text-blue-600" />
            </div>
            <div className="mt-2 text-2xl font-black text-slate-900">
              {userInstruments.length || 3}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">Commercial Weights &amp; Measures</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="text-slate-500 text-xs font-semibold flex items-center justify-between">
              <span>Active Stamped Certificates</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="mt-2 text-2xl font-black text-emerald-700">
              {certificates.length || 2}
            </div>
            <div className="text-[11px] text-emerald-600 font-semibold mt-0.5">Schedule IX Form V Valid</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="text-slate-500 text-xs font-semibold flex items-center justify-between">
              <span>Verification In-Progress</span>
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
            <div className="mt-2 text-2xl font-black text-amber-700">
              {applications.filter((a) => a.status === 'SUBMITTED' || a.status === 'ASSIGNED' || a.status === 'SCHEDULED').length || 1}
            </div>
            <div className="text-[11px] text-amber-600 font-semibold mt-0.5">Assigned to Statutory Officer</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="text-slate-500 text-xs font-semibold flex items-center justify-between">
              <span>Statutory Compliance</span>
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="mt-2 text-2xl font-black text-indigo-900">100%</div>
            <div className="text-[11px] text-indigo-600 font-semibold mt-0.5">Legal Metrology Act, 2009</div>
          </div>
        </div>

        {/* Quick Action Navigation Panels (Trader-Only) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link
            href="/apply"
            className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs hover:shadow-md transition-all group flex flex-col justify-between space-y-4"
          >
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center group-hover:scale-110 transition-transform">
              <PlusCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base group-hover:text-blue-700 transition-colors">
                Register New Weighing Scale
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Submit an online application for newly purchased scales or annual re-verification stamping.
              </p>
            </div>
            <div className="text-xs font-bold text-blue-700 flex items-center gap-1">
              <span>Open Application Form</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          <Link
            href="/apply"
            className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs hover:shadow-md transition-all group flex flex-col justify-between space-y-4"
          >
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:scale-110 transition-transform">
              <FileBadge className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base group-hover:text-emerald-700 transition-colors">
                My Stamping Applications
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Track inspection status, assigned officer visit dates, and download digital verification certificates.
              </p>
            </div>
            <div className="text-xs font-bold text-emerald-700 flex items-center gap-1">
              <span>Track Applications</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          <Link
            href="/verify/LMO-2026-10001"
            className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs hover:shadow-md transition-all group flex flex-col justify-between space-y-4"
          >
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center group-hover:scale-110 transition-transform">
              <QrCode className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base group-hover:text-indigo-700 transition-colors">
                Public QR Code Verification
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Verify the tamper-evident cryptographic hash and validity of your physical scale QR stickers.
              </p>
            </div>
            <div className="text-xs font-bold text-indigo-700 flex items-center gap-1">
              <span>Test Certificate QR</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}

