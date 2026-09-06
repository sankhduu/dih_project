'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase, normalizeUserRole } from '@/lib/supabase-client';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { useMetrologyStore } from '@/lib/store';
import { DigitalCertificateModal, TraderRecord } from '@/components/certificates/DigitalCertificateModal';
import {
  Scale,
  Building2,
  CheckCircle2,
  Clock,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  PlusCircle,
  FileBadge,
  CreditCard,
  Mail,
  Lock,
  QrCode,
  MapPin,
  Sparkles,
} from 'lucide-react';

const DEFAULT_TRADER_SHOP: TraderRecord = {
  id: 'ROH-TR-001',
  shop_name: 'Sharma Kirana & General Store',
  owner_name: 'Ramesh Kumar Sharma',
  license_number: 'HR-LMO-ROH-2026-042',
  district: 'Rohtak',
  status: 'Pending_Inspection',
  address: 'Booth 12, Main Market, Model Town, Rohtak - 124001',
  instrument_type: 'Electronic Tabletop Scale (30 kg Class III)',
  capacity: '30 kg / e=2g',
  make_model: 'Essae DS-852 Tabletop',
  latitude: 28.8955,
  longitude: 76.6066,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export default function TraderDashboardPage() {
  const router = useRouter();
  const { currentUser, instruments, applications, certificates } = useMetrologyStore();
  const [authorized, setAuthorized] = useState(false);
  const [sessionEmail, setSessionEmail] = useState<string>('');

  // Real-time Trader Shop State
  const [traderShop, setTraderShop] = useState<TraderRecord>(DEFAULT_TRADER_SHOP);
  const [isCertificateOpen, setIsCertificateOpen] = useState<boolean>(false);
  const [justApproved, setJustApproved] = useState<boolean>(false);
  const [isReapplying, setIsReapplying] = useState<boolean>(false);

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

  // 2. Fetch Initial Trader Record from Supabase traders_list (latest submission first)
  useEffect(() => {
    async function fetchTraderRecord() {
      try {
        const { data, error } = await supabase
          .from('traders_list')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (data && !error) {
          setTraderShop(data as TraderRecord);
        }
      } catch (err) {
        console.warn('Error fetching trader record from Supabase:', err);
      }
    }

    fetchTraderRecord();
  }, []);

  // 3. Supabase Realtime Listener (Listening to LMO and GATC actions, and new Applications)
  useEffect(() => {
    const channel = supabase
      .channel('trader-realtime-lifecycle')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'traders_list' },
        (payload) => {
          const updatedRow = (payload.new || payload.old) as TraderRecord;
          if (!updatedRow) return;

          setTraderShop((prev) => {
            // If this is a newly inserted application, immediately switch tracker to it
            if (payload.eventType === 'INSERT') {
              return { ...updatedRow };
            }
            if (!prev.id || prev.id === updatedRow.id || prev.license_number === updatedRow.license_number) {
              if (prev.status !== 'Approved' && updatedRow.status === 'Approved') {
                setJustApproved(true);
                setTimeout(() => setJustApproved(false), 8000);
              }
              return { ...prev, ...updatedRow };
            }
            return prev;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Handler for Re-Applying when rejected
  const handleReapply = async () => {
    setIsReapplying(true);
    try {
      if (traderShop.id) {
        await supabase
          .from('traders_list')
          .update({
            status: 'Pending_Inspection',
            rejection_reason: null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', traderShop.id);
      }
      setTraderShop((prev) => ({
        ...prev,
        status: 'Pending_Inspection',
        rejection_reason: undefined,
        updated_at: new Date().toISOString(),
      }));
    } catch (err) {
      console.warn('Error resetting application:', err);
      // Fallback local update
      setTraderShop((prev) => ({
        ...prev,
        status: 'Pending_Inspection',
        rejection_reason: undefined,
        updated_at: new Date().toISOString(),
      }));
    } finally {
      setIsReapplying(false);
    }
  };

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
  const displayName = currentUser.fullName || traderShop.owner_name || 'Ramesh Kumar (Proprietor)';

  const rawStatus = (traderShop.status || 'Pending_Inspection').toLowerCase();
  const isApproved = rawStatus === 'approved';
  const isRejected = rawStatus === 'rejected';
  const isUnderReview = rawStatus === 'under_review';
  const isPendingInspection = rawStatus === 'pending_inspection' || rawStatus === 'pending';

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans text-slate-900">
      <Header activeTab="applicant-dashboard" setActiveTab={() => {}} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Real-time Approval Celebration Toast Banner */}
        {justApproved && (
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 text-white flex items-center justify-center shrink-0">
                <Sparkles className="w-6 h-6 text-amber-300" />
              </div>
              <div>
                <h4 className="font-black text-sm text-white flex items-center gap-1.5">
                  <span>Certificate Approved &amp; Digitally Signed!</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-300 animate-ping"></span>
                </h4>
                <p className="text-xs text-emerald-100 mt-0.5">
                  Your scale for <strong>{traderShop.shop_name}</strong> has been digitally signed by GATC. Download your verified QR certificate now.
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsCertificateOpen(true)}
              className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-[#002B49] font-black text-xs shadow-md transition-all cursor-pointer whitespace-nowrap"
            >
              Open Certificate Now
            </button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* WHEN APPROVED: GREEN BANNER WITH DOWNLOAD CERTIFICATE BUTTON */}
        {/* ========================================================================= */}
        {isApproved && (
          <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-800 text-white shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-emerald-500 animate-in fade-in duration-300">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-white/20 text-white flex items-center justify-center shrink-0 shadow-xs">
                <CheckCircle2 className="w-7 h-7 text-amber-300" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/50 text-emerald-100 border border-emerald-400/40">
                    Statutory Approval Complete
                  </span>
                  <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse"></span>
                </div>
                <h3 className="text-base sm:text-lg font-black text-white">
                  Verification Approved &amp; Digitally Signed by GATC
                </h3>
                <p className="text-xs text-emerald-100">
                  Official Schedule IX Form V certificate is issued with embedded QR code.
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsCertificateOpen(true)}
              className="px-5 py-3 rounded-2xl bg-amber-400 hover:bg-amber-300 text-[#002B49] font-black text-xs sm:text-sm shadow-md hover:shadow-lg transition-all cursor-pointer whitespace-nowrap flex items-center gap-2"
            >
              <QrCode className="w-4 h-4" />
              <span>Download Verified QR Certificate</span>
            </button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* WHEN REJECTED: RED BANNER WITH REJECTION REASON & RE-APPLY BUTTON */}
        {/* ========================================================================= */}
        {isRejected && (
          <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-rose-600 via-rose-700 to-red-800 text-white shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-rose-500 animate-in fade-in duration-300">
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-white/20 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                <AlertTriangle className="w-7 h-7 text-amber-300" />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-rose-500/50 text-rose-100 border border-rose-400/40">
                    Deficiency Notice (Form VI)
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-black text-white">
                  Application Rejected by GATC with Notice
                </h3>
                <p className="text-xs text-rose-100 leading-relaxed max-w-2xl bg-rose-900/40 p-2.5 rounded-xl border border-rose-400/30">
                  <strong>Deficiency Remarks:</strong>{' '}
                  {traderShop.rejection_reason || 'Seal mismatch or scale uncalibrated. Tolerances exceeded statutory limits under Legal Metrology Act, 2009.'}
                </p>
              </div>
            </div>
            <button
              onClick={handleReapply}
              disabled={isReapplying}
              className="px-5 py-3 rounded-2xl bg-white hover:bg-slate-100 text-rose-800 font-black text-xs sm:text-sm shadow-md hover:shadow-lg transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 disabled:opacity-50 shrink-0"
            >
              <PlusCircle className={`w-4 h-4 ${isReapplying ? 'animate-spin' : ''}`} />
              <span>Re-Apply / Submit Rectification</span>
            </button>
          </div>
        )}

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
                  <span>{traderShop.shop_name || currentUser.businessName || 'Sharma Kirana & General Store'}</span>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
                  <span>UIDAI Aadhaar Verified</span>
                </span>
                <span>•</span>
                <span>{traderShop.district || currentUser.district || 'Rohtak'}, Haryana</span>
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

        {/* ========================================================================= */}
        {/* LIVE APPLICATION TRACKER BAR (MULTI-STEP STEPPER: 1 -> 2 -> 3 -> 4) */}
        {/* ========================================================================= */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-6 relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-[#002B49] flex items-center justify-center font-bold">
                <Scale className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-black text-slate-900">{traderShop.shop_name}</h2>
                  <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                    {traderShop.license_number}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {traderShop.instrument_type || 'Counter Scale Class III'} • Capacity: {traderShop.capacity || '30 kg'}
                </p>
              </div>
            </div>

            {/* Live Status Badge & Certificate Trigger */}
            <div className="flex flex-wrap items-center gap-3">
              {isApproved && (
                <span className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-300 ring-2 ring-emerald-400/20 shadow-2xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Approved</span>
                </span>
              )}
              {isUnderReview && (
                <span className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-300 ring-2 ring-blue-400/20 shadow-2xs">
                  <Clock className="w-4 h-4 text-blue-600 animate-spin" />
                  <span>Under Review (LMO Submitted)</span>
                </span>
              )}
              {isPendingInspection && (
                <span className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-300 shadow-2xs">
                  <Clock className="w-4 h-4 text-amber-600" />
                  <span>Pending Inspection</span>
                </span>
              )}
              {isRejected && (
                <span className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-300 shadow-2xs">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  <span>Rejected</span>
                </span>
              )}

              {isApproved && (
                <button
                  onClick={() => setIsCertificateOpen(true)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#002B49] hover:bg-[#003B66] text-white font-black text-xs shadow-md hover:shadow-lg transition-all cursor-pointer"
                >
                  <QrCode className="w-4 h-4 text-amber-400" />
                  <span>View Verified QR Certificate</span>
                </button>
              )}
            </div>
          </div>

          {/* 4-Step Visual Progress Stepper */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
              <span>Lifecycle Verification Stepper</span>
              <span className="flex items-center gap-1 font-mono text-[11px] text-emerald-700 font-semibold normal-case">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Supabase Realtime Synced</span>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
              {/* Step 1: Applied */}
              <div className="p-4 rounded-2xl border bg-emerald-50/60 border-emerald-200 relative">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                    Step 1
                  </span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="font-extrabold text-slate-900 text-sm mt-1">1. Applied</div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Application registered and routed to jurisdictional district officer.
                </p>
                <div className="mt-2 text-[10px] font-semibold text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded-md inline-block">
                  ✓ Application Logged
                </div>
              </div>

              {/* Step 2: Field Inspection Completed */}
              <div
                className={`p-4 rounded-2xl border transition-all ${
                  isUnderReview || isApproved || isRejected
                    ? 'bg-emerald-50/60 border-emerald-200'
                    : 'bg-amber-50/70 border-amber-200 ring-2 ring-amber-400/30'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Step 2
                  </span>
                  {isUnderReview || isApproved || isRejected ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Clock className="w-4 h-4 text-amber-600 animate-spin" />
                  )}
                </div>
                <div className="font-extrabold text-slate-900 text-sm mt-1">
                  2. Field Inspection
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  LMO performs checklist, photo capture, and GPS coordinate lock.
                </p>
                <div className="mt-2 text-[10px] font-semibold">
                  {isUnderReview || isApproved || isRejected ? (
                    <span className="text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded-md inline-block">
                      ✓ Inspected with GPS &amp; Photo
                    </span>
                  ) : (
                    <span className="text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-md inline-block">
                      ● Awaiting LMO Visit
                    </span>
                  )}
                </div>
              </div>

              {/* Step 3: GATC Digital Signing */}
              <div
                className={`p-4 rounded-2xl border transition-all ${
                  isApproved
                    ? 'bg-emerald-50/60 border-emerald-200'
                    : isRejected
                    ? 'bg-rose-50/70 border-rose-200 ring-2 ring-rose-400/30'
                    : isUnderReview
                    ? 'bg-blue-50/70 border-blue-200 ring-2 ring-blue-400/30'
                    : 'bg-slate-50 border-slate-200 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Step 3
                  </span>
                  {isApproved ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : isRejected ? (
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                  ) : isUnderReview ? (
                    <Clock className="w-4 h-4 text-blue-600 animate-pulse" />
                  ) : (
                    <Clock className="w-4 h-4 text-slate-400" />
                  )}
                </div>
                <div className="font-extrabold text-slate-900 text-sm mt-1">
                  3. GATC Digital Signing
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Central GATC lab reviews inspection findings and cryptographically signs.
                </p>
                <div className="mt-2 text-[10px] font-semibold">
                  {isApproved ? (
                    <span className="text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded-md inline-block">
                      ✓ Digitally Signed (SHA-256)
                    </span>
                  ) : isRejected ? (
                    <span className="text-rose-800 bg-rose-100/80 px-2 py-0.5 rounded-md inline-block">
                      ✗ Rejected with Notice
                    </span>
                  ) : isUnderReview ? (
                    <span className="text-blue-800 bg-blue-100/80 px-2 py-0.5 rounded-md inline-block">
                      ● In GATC Review Queue
                    </span>
                  ) : (
                    <span className="text-slate-400">Pending Field Inspection</span>
                  )}
                </div>
              </div>

              {/* Step 4: Certificate Issued */}
              <div
                className={`p-4 rounded-2xl border transition-all ${
                  isApproved
                    ? 'bg-emerald-50/70 border-emerald-300 ring-2 ring-emerald-400/30'
                    : isRejected
                    ? 'bg-rose-50/50 border-rose-200'
                    : 'bg-slate-50 border-slate-200 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Step 4
                  </span>
                  {isApproved ? (
                    <QrCode className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <FileBadge className="w-4 h-4 text-slate-400" />
                  )}
                </div>
                <div className="font-extrabold text-slate-900 text-sm mt-1">
                  4. Certificate Issued
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Schedule IX Form V certificate unlocked with live verifiable QR code.
                </p>
                <div className="mt-2 text-[10px] font-semibold">
                  {isApproved ? (
                    <button
                      onClick={() => setIsCertificateOpen(true)}
                      className="text-emerald-800 bg-amber-300 hover:bg-amber-400 px-2.5 py-1 rounded-md inline-flex items-center gap-1 font-bold cursor-pointer"
                    >
                      <QrCode className="w-3 h-3" />
                      <span>Download QR</span>
                    </button>
                  ) : isRejected ? (
                    <span className="text-rose-700">Rectification Needed</span>
                  ) : (
                    <span className="text-slate-400">Locked</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Status Explanation Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs pt-2">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">Current Stage</span>
              <div className="font-bold text-slate-900 text-xs sm:text-sm">
                {isApproved
                  ? 'Certificate Issued & Stamped'
                  : isRejected
                  ? 'Deficiency Notice Issued'
                  : isUnderReview
                  ? 'Awaiting GATC Digital Signature'
                  : 'Physical Field Inspection Pending'}
              </div>
              <p className="text-[11px] text-slate-500">
                {isApproved
                  ? 'GATC has validated all calibration observations, applied cryptographic SHA-256 signature, and issued certificate.'
                  : isRejected
                  ? 'GATC identified a discrepancy during review. Please rectify and click Re-Apply above.'
                  : isUnderReview
                  ? 'LMO officer has completed physical inspection and uploaded photo + GPS. Waiting for GATC signature.'
                  : 'Assigned LMO Officer will visit your shop location to calibrate the instrument and capture geo-tagged proof.'}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">Verified GPS Location</span>
              <div className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                {traderShop.latitude && traderShop.longitude ? (
                  <span className="font-mono text-emerald-700">
                    {traderShop.latitude.toFixed(5)}, {traderShop.longitude.toFixed(5)}
                  </span>
                ) : (
                  <span className="text-slate-400 italic">Pending Officer GPS Capture</span>
                )}
              </div>
              <p className="text-[11px] text-slate-500">
                Tamper-proof coordinates captured directly during the officer’s mobile inspection.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">Real-time Mobile Sync</span>
              <div className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Live Supabase Channel Active</span>
              </div>
              <p className="text-[11px] text-slate-500">
                When the LMO officer or GATC updates the record, this stepper and certificate unlock dynamically.
              </p>
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
              {isApproved ? 1 : certificates.length || 0}
            </div>
            <div className="text-[11px] text-emerald-600 font-semibold mt-0.5">Schedule IX Form V Valid</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="text-slate-500 text-xs font-semibold flex items-center justify-between">
              <span>Verification In-Progress</span>
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
            <div className="mt-2 text-2xl font-black text-amber-700">
              {isApproved ? 0 : 1}
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

          {isApproved ? (
            <button
              onClick={() => setIsCertificateOpen(true)}
              className="p-6 rounded-3xl bg-white border border-emerald-200 shadow-xs hover:shadow-md transition-all group flex flex-col justify-between space-y-4 text-left cursor-pointer"
            >
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                <FileBadge className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-base group-hover:text-emerald-700 transition-colors">
                  Digital Verification Certificate
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Your scale has been approved. View and print your official Schedule IX certificate with live QR code.
                </p>
              </div>
              <div className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                <span>View Digital Certificate (QR)</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
          ) : (
            <Link
              href="/apply"
              className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs hover:shadow-md transition-all group flex flex-col justify-between space-y-4"
            >
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-base group-hover:text-amber-700 transition-colors">
                  Stamping Application Pending
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Track inspection status, assigned officer visit dates, and download digital verification certificates once approved.
                </p>
              </div>
              <div className="text-xs font-bold text-amber-700 flex items-center gap-1">
                <span>Track Application</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          )}

          <Link
            href={`/certificate/${traderShop.id || 'ROH-TR-001'}`}
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
                Open the permanent standalone certificate URL to inspect cryptographic hash and validity of physical scale stickers.
              </p>
            </div>
            <div className="text-xs font-bold text-indigo-700 flex items-center gap-1">
              <span>Open Certificate Link</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </div>
      </main>

      <Footer />

      {/* Digital Certificate Modal */}
      <DigitalCertificateModal
        isOpen={isCertificateOpen}
        onClose={() => setIsCertificateOpen(false)}
        shop={traderShop}
      />
    </div>
  );
}
