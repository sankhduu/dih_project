'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase-client';
import { useMetrologyStore } from '@/lib/store';
import { MOCK_USERS } from '@/lib/mock-data';
import { API_BASE_URL } from '@/lib/api-config';
import { UserRole, UserProfile } from '@/types/metrology';
import {
  Scale,
  ShieldCheck,
  Building2,
  Sliders,
  QrCode,
  Bell,
  Wifi,
  WifiOff,
  RefreshCw,
  ChevronDown,
  FileSpreadsheet,
  LogOut,
  ArrowLeft,
  Clock,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

interface HeaderTraderRecord {
  id?: string | number;
  trader_name: string;
  shop_name?: string;
  owner_name?: string;
  license_number: string;
  instrument_type?: string;
  district?: string;
  status?: string;
  inspection_status?: string;
  assigned_officer?: string;
  created_at?: string;
  updated_at?: string;
}

interface ExpiringTraderAlert {
  id: string | number;
  traderName: string;
  licenseNumber: string;
  instrumentType: string;
  daysRemaining: number;
  issueDate: string;
  expiryDate: string;
}

interface PendingLmoAlert {
  id: string | number;
  traderName: string;
  licenseNumber: string;
  instrumentType: string;
  district: string;
  appliedDate: string;
}

interface LmoApprovedAlert {
  id: string | number;
  traderName: string;
  licenseNumber: string;
  instrumentType: string;
  district: string;
  approvedDate: string;
  officerName: string;
}

interface TraderAlert {
  id: string | number;
  title: string;
  licenseNumber: string;
  instrumentType: string;
  status: 'Passed' | 'Pending' | 'Failed' | 'Scheduled';
  message: string;
  timestamp: string;
  actionHref: string;
}

export function Header({ activeTab, setActiveTab }: HeaderProps) {
  const {
    currentUser,
    availableUsers,
    setCurrentUser,
    isOfflineMode,
    setIsOfflineMode,
    offlineDrafts,
    syncOfflineDrafts,
    renewalAlerts,
    applications,
  } = useMetrologyStore();

  const router = useRouter();
  const pathname = usePathname() || '';
  const [mounted, setMounted] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showAlerts, setShowAlerts] = useState(false);
  const [expiringTraders, setExpiringTraders] = useState<ExpiringTraderAlert[]>([]);
  const [pendingLmoRequests, setPendingLmoRequests] = useState<PendingLmoAlert[]>([]);
  const [lmoApprovedApplications, setLmoApprovedApplications] = useState<LmoApprovedAlert[]>([]);
  const [traderAlerts, setTraderAlerts] = useState<TraderAlert[]>([]);

  useEffect(() => {
    setMounted(true);

    async function fetchNotificationsData() {
      try {
        // Resolve current user ID and role strictly from context and local session
        let currentUserId = currentUser.id || '';
        let currentRole = currentUser.role;

        if (typeof window !== 'undefined') {
          const storedUser = localStorage.getItem('eMaap_currentUser');
          if (storedUser) {
            try {
              const parsed = JSON.parse(storedUser);
              if (parsed?.id) currentUserId = parsed.id;
              if (parsed?.role) {
                const normRole = (parsed.role || '').toLowerCase();
                if (normRole.includes('trader') || normRole.includes('applicant')) currentRole = 'APPLICANT';
                else if (normRole.includes('lmo')) currentRole = 'LMO';
                else if (normRole.includes('gatc')) currentRole = 'GATC';
                else if (normRole.includes('admin')) currentRole = 'ADMIN';
              }
            } catch {}
          }
        }

        const isTraderRole =
          currentRole === 'APPLICANT' ||
          pathname.startsWith('/trader') ||
          pathname.startsWith('/apply') ||
          pathname.startsWith('/tracker') ||
          pathname.startsWith('/notices');

        // =====================================================================
        // TASK 2: TRADER NOTIFICATIONS (Strictly filter by user_id & role)
        // =====================================================================
        if (isTraderRole) {
          let userTraderRows: HeaderTraderRecord[] = [];

          if (supabase && currentUserId) {
            // Strictly query by user_id as requested
            try {
              const { data, error } = await supabase
                .from('traders')
                .select('*')
                .eq('user_id', currentUserId)
                .order('updated_at', { ascending: false });

              if (!error && Array.isArray(data) && data.length > 0) {
                userTraderRows = data as HeaderTraderRecord[];
              }
            } catch (err) {
              console.warn('Note on user_id query:', err);
            }

            // Resilient fallback for current schema if user_id column not present in postgres:
            if (userTraderRows.length === 0) {
              try {
                const lastLicense = typeof window !== 'undefined' ? localStorage.getItem('last_applied_license') : null;
                let fbQuery = supabase.from('traders').select('*');
                if (lastLicense) {
                  fbQuery = fbQuery.eq('license_number', lastLicense);
                } else if (currentUser.fullName) {
                  fbQuery = fbQuery.ilike('owner_name', `%${currentUser.fullName}%`);
                }
                const { data: fbData } = await fbQuery;
                if (fbData && fbData.length > 0) userTraderRows = fbData as HeaderTraderRecord[];
              } catch {}
            }
          }

          const myAlerts: TraderAlert[] = [];
          userTraderRows.forEach((row, idx) => {
            const insp = (row.inspection_status || row.status || 'Pending').toLowerCase();
            const lic = row.license_number || `LIC-${idx + 1}`;
            const inst = row.instrument_type || 'Weighing Scale';
            const dateStr = row.updated_at || row.created_at || new Date().toISOString();
            const formattedDate = new Date(dateStr).toLocaleDateString('en-GB', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            });

            if (insp === 'passed' || insp === 'verified' || insp === 'approved') {
              myAlerts.push({
                id: row.id || lic,
                title: 'Scale Verification Passed & Stamped',
                licenseNumber: lic,
                instrumentType: inst,
                status: 'Passed',
                message: 'Your instrument has been verified and stamped by LMO officer. Schedule IX Certificate is ready!',
                timestamp: formattedDate,
                actionHref: `/certificate/${encodeURIComponent(lic)}`,
              });
            } else if (insp === 'failed' || insp === 'rejected') {
              myAlerts.push({
                id: row.id || lic,
                title: 'Deficiency Notice Issued (Action Needed)',
                licenseNumber: lic,
                instrumentType: inst,
                status: 'Failed',
                message: 'Scale exceeded statutory MPE tolerance. Recalibration and re-testing required within 30 days.',
                timestamp: formattedDate,
                actionHref: '/notices',
              });
            } else {
              myAlerts.push({
                id: row.id || lic,
                title: 'Application Queued for LMO Inspection',
                licenseNumber: lic,
                instrumentType: inst,
                status: 'Pending',
                message: 'Application has been assigned to Legal Metrology Officer. Physical inspection pending.',
                timestamp: formattedDate,
                actionHref: '/tracker',
              });
            }
          });

          // Store application fallback
          if (myAlerts.length === 0 && applications.length > 0) {
            const userApps = applications.filter((a) => a.applicantId === currentUserId);
            userApps.forEach((app) => {
              myAlerts.push({
                id: app.id,
                title: app.status === 'APPROVED' ? 'Scale Verification Approved' : 'Application in Queue',
                licenseNumber: app.applicationNumber,
                instrumentType: 'Commercial Weighing Instrument',
                status: app.status === 'APPROVED' ? 'Passed' : 'Pending',
                message: app.status === 'APPROVED' ? 'Your certificate is ready.' : 'Waiting for LMO physical visit.',
                timestamp: new Date(app.submittedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
                actionHref: '/tracker',
              });
            });
          }

          // STRICT RBAC: Clear out all LMO & GATC lists so Traders NEVER see them
          setTraderAlerts(myAlerts);
          setPendingLmoRequests([]);
          setExpiringTraders([]);
          setLmoApprovedApplications([]);
          return;
        }

        // =====================================================================
        // OFFICER / GATC / ADMIN NOTIFICATIONS
        // =====================================================================
        setTraderAlerts([]); // Officers never see private trader alerts

        let records: HeaderTraderRecord[] = [];

        // 1. First attempt: Direct Supabase query
        if (supabase) {
          try {
            const { data, error } = await supabase
              .from('traders')
              .select('*')
              .order('created_at', { ascending: false });
            if (!error && Array.isArray(data) && data.length > 0) {
              records = data as HeaderTraderRecord[];
            }
          } catch (sbErr) {
            console.warn('Supabase fetch notice for Header notifications:', sbErr);
          }
        }

        // 2. Second attempt: Fallback to Next.js API route
        if (records.length === 0) {
          const res = await fetch(`${API_BASE_URL}/api/traders`);
          if (res.ok) {
            const json = await res.json();
            if (json.success && Array.isArray(json.data)) {
              records = json.data as HeaderTraderRecord[];
            }
          }
        }

        if (records.length > 0) {
          const now = new Date();
          const expiring: ExpiringTraderAlert[] = [];
          const pendingList: PendingLmoAlert[] = [];
          const approvedList: LmoApprovedAlert[] = [];

          records.forEach((trader, index) => {
            const inspStatus = (trader.inspection_status || '').toLowerCase();
            const rawStatus = (trader.status || '').toLowerCase();
            const name = trader.trader_name || trader.shop_name || 'Commercial Shop';
            const lic = trader.license_number || `TR-${index + 1}`;
            const inst = trader.instrument_type || 'Weighing Instrument';
            const dist = trader.district || 'Hisar';

            // 1. Pending LMO Applications (applications awaiting LMO physical inspection)
            if (
              inspStatus === 'pending' ||
              rawStatus === 'pending' ||
              rawStatus === 'pending_lmo' ||
              rawStatus === 'pending_inspection' ||
              rawStatus === 'submitted'
            ) {
              const appliedAt = trader.created_at ? new Date(trader.created_at) : now;
              pendingList.push({
                id: trader.id || lic || index,
                traderName: name,
                licenseNumber: lic,
                instrumentType: inst,
                district: dist,
                appliedDate: appliedAt.toLocaleDateString('en-GB', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                }),
              });
            }

            // 2. LMO Approved Applications (physically inspected & approved by LMO, ready for GATC lab certification)
            if (
              inspStatus === 'passed' ||
              rawStatus === 'verified' ||
              rawStatus === 'pending_gatc' ||
              rawStatus === 'approved'
            ) {
              const approvedAt = trader.updated_at || trader.created_at
                ? new Date(trader.updated_at || trader.created_at!)
                : now;

              approvedList.push({
                id: trader.id || lic || index,
                traderName: name,
                licenseNumber: lic,
                instrumentType: inst,
                district: dist,
                approvedDate: approvedAt.toLocaleDateString('en-GB', {
                  day: '2-digit',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                }),
                officerName: trader.assigned_officer || 'LMO Inspector',
              });

              // 3. Expiration / Renewal Alerts (< 30 days)
              const rawDate = trader.created_at || trader.updated_at;
              let issueDate: Date;
              if (rawDate) {
                issueDate = new Date(rawDate);
              } else {
                const monthsAgo = 11 + (index % 3) * 0.4;
                issueDate = new Date(now.getTime() - monthsAgo * 30 * 24 * 60 * 60 * 1000);
              }
              const expiryDate = new Date(issueDate.getTime() + 365 * 24 * 60 * 60 * 1000);
              const diffMs = expiryDate.getTime() - now.getTime();
              const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

              if (diffDays <= 30) {
                expiring.push({
                  id: trader.id || lic || index,
                  traderName: name,
                  licenseNumber: lic,
                  instrumentType: inst,
                  daysRemaining: Math.max(1, diffDays),
                  issueDate: issueDate.toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  }),
                  expiryDate: expiryDate.toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  }),
                });
              }
            }
          });

          setPendingLmoRequests(pendingList.slice(0, 10));
          setExpiringTraders(expiring.slice(0, 10));
          setLmoApprovedApplications(approvedList.slice(0, 10));
        }
      } catch (e) {
        console.warn('Notice fetching notifications for Header:', e);
      }
    }

    fetchNotificationsData();

    // Global Supabase Realtime Subscription for instant live alerts
    const channel = supabase
      .channel('header-live-alerts')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'traders' },
        () => {
          fetchNotificationsData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser.id, currentUser.role, pathname]);

  const roleLabels: Record<UserRole, { label: string; icon: React.ElementType }> = {
    APPLICANT: { label: 'Trader (Commercial Enterprise)', icon: Building2 },
    LMO: { label: 'Legal Metrology Officer (LMO)', icon: ShieldCheck },
    GATC: { label: 'Govt. Approved Test Centre (GATC)', icon: Scale },
    ADMIN: { label: 'Department Admin (DoCA)', icon: Sliders },
    PUBLIC: { label: 'Public Citizen / Verification', icon: QrCode },
  };

  // Determine effective role strictly by route if on a role-specific dashboard:
  const isLmoRoute = pathname.startsWith('/lmo');
  const isGatcRoute = pathname.startsWith('/gatc');
  const isDocaRoute = pathname.startsWith('/doca') || pathname.startsWith('/admin');
  const isTraderRoute =
    pathname.startsWith('/trader') ||
    pathname.startsWith('/apply') ||
    pathname.startsWith('/tracker') ||
    pathname.startsWith('/notices');

  const effectiveRole: UserRole = isLmoRoute
    ? 'LMO'
    : isGatcRoute
    ? 'GATC'
    : isDocaRoute
    ? 'ADMIN'
    : isTraderRoute
    ? 'APPLICANT'
    : currentUser.role;

  const isLmoUser = effectiveRole === 'LMO' || isLmoRoute;
  const isGatcUser = effectiveRole === 'GATC' || isGatcRoute;
  const isAdminUser = effectiveRole === 'ADMIN' || isDocaRoute;
  const isTraderUser = effectiveRole === 'APPLICANT' || isTraderRoute;

  // Notification button is shown for Trader (with their private alerts), LMO, GATC, and Admin
  const shouldShowNotificationBell = mounted && effectiveRole !== 'PUBLIC';

  const notificationCount = isTraderUser
    ? traderAlerts.length
    : isGatcUser
    ? lmoApprovedApplications.length
    : isLmoUser
    ? pendingLmoRequests.length + expiringTraders.length
    : isAdminUser
    ? pendingLmoRequests.length + lmoApprovedApplications.length + expiringTraders.length
    : 0;

  // Resolve user profile corresponding to the effective role
  const lmoUser = availableUsers.find((u) => u.role === 'LMO') || MOCK_USERS[1];
  const gatcUser = availableUsers.find((u) => u.role === 'GATC') || MOCK_USERS[2];
  const docaUser = availableUsers.find((u) => u.role === 'ADMIN') || MOCK_USERS[3];
  const traderUser = availableUsers.find((u) => u.role === 'APPLICANT') || MOCK_USERS[0];

  const displayedUser: UserProfile = isLmoRoute
    ? (currentUser.role === 'LMO' ? currentUser : lmoUser)
    : isGatcRoute
    ? (currentUser.role === 'GATC' ? currentUser : gatcUser)
    : isDocaRoute
    ? (currentUser.role === 'ADMIN' ? currentUser : docaUser)
    : isTraderRoute
    ? (currentUser.role === 'APPLICANT' ? currentUser : traderUser)
    : currentUser;

  const currentRoleInfo = roleLabels[effectiveRole] || roleLabels.LMO;

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
      {/* Government Tricolor Top Strip */}
      <div className="h-1.5 w-full flex">
        <div className="flex-1 bg-[#FF9933]"></div>
        <div className="flex-1 bg-[#FFFFFF]"></div>
        <div className="flex-1 bg-[#138808]"></div>
      </div>

      {/* Main Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand & Emblem + Global Back Button */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="p-2 rounded-xl text-slate-600 hover:text-slate-950 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer flex items-center justify-center"
              title="Go Back (History -1)"
              aria-label="Go Back"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="w-10 h-10 rounded-lg bg-[#002B49] text-white flex items-center justify-center shadow-xs">
              <Scale className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight text-[#002B49]">
                  e-Māpan <span className="text-amber-600 font-semibold">2.0</span>
                </span>
                <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded-sm bg-slate-100 text-slate-700 border border-slate-200">
                  DoCA GovTech
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                National Online Verification & Certification Platform for Weighing and Measuring Instruments
              </p>
            </div>
          </div>

          {/* Quick Actions, Offline Toggle & Persona Switcher */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Online Registration Link - ONLY FOR TRADER DASHBOARD */}
            {currentUser.role === 'APPLICANT' && (
              <Link
                href="/apply"
                className="px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all shadow-2xs bg-[#002B49] text-white hover:bg-[#003B66] cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-amber-400" />
                <span>Apply Online</span>
              </Link>
            )}

            {/* Quick Public Scanner Button */}
            <Link
              href="/auth/citizen"
              onClick={() => setActiveTab('public-verify')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer ${
                activeTab === 'public-verify'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
              }`}
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>Public QR Scan</span>
            </Link>

            {/* Offline Mode Toggle for LMO Officers - Wait until mounted to prevent hydration mismatch */}
            {mounted && currentUser.role === 'LMO' && (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setIsOfflineMode(!isOfflineMode)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition-all ${
                    isOfflineMode
                      ? 'bg-amber-100 text-amber-900 border-amber-300 font-semibold'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                  title="Toggle offline field mode simulation"
                >
                  {isOfflineMode ? (
                    <WifiOff className="w-3.5 h-3.5 text-amber-700" />
                  ) : (
                    <Wifi className="w-3.5 h-3.5 text-emerald-600" />
                  )}
                  <span className="hidden md:inline">{isOfflineMode ? 'Field Offline' : 'Online'}</span>
                </button>

                {offlineDrafts.length > 0 && (
                  <button
                    onClick={syncOfflineDrafts}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-1 shadow-xs animate-pulse"
                    title="Sync captured field inspection observations"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Sync ({offlineDrafts.length})</span>
                  </button>
                )}
              </div>
            )}

            {/* Role-Specific Notifications / Alerts Bell */}
            {shouldShowNotificationBell && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowAlerts(!showAlerts)}
                  className="p-2 rounded-xl text-slate-600 hover:text-[#002B49] hover:bg-slate-100 relative transition-all cursor-pointer"
                  title={
                    isTraderUser
                      ? 'My Application Alerts & Verification Updates'
                      : isGatcUser
                      ? 'LMO Approved Applications (Awaiting GATC Certification)'
                      : isLmoUser
                      ? 'LMO Inspection Queue & Renewal Alerts'
                      : 'System Alerts & Notifications'
                  }
                >
                  <Bell className="w-4 h-4" />
                  {mounted && notificationCount > 0 && (
                    <span
                      className={`absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 text-white text-[10px] font-black rounded-full flex items-center justify-center ring-2 ring-white shadow-xs animate-pulse ${
                        isTraderUser
                          ? 'bg-amber-600'
                          : isGatcUser
                          ? 'bg-emerald-600'
                          : isLmoUser
                          ? 'bg-rose-600'
                          : 'bg-indigo-600'
                      }`}
                    >
                      {notificationCount}
                    </span>
                  )}
                </button>

                {showAlerts && (
                  <div className="absolute right-0 mt-2 w-84 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 z-50 animate-in fade-in zoom-in-95">
                    {/* Trader Application & Stamping Notification Dropdown */}
                    {isTraderUser && (
                      <div>
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
                              <Bell className="w-4 h-4" />
                            </div>
                            <div>
                              <h4 className="text-xs font-black text-slate-900">Application & Stamping Alerts</h4>
                              <p className="text-[10px] text-slate-500 font-medium">Updates for Your Instruments</p>
                            </div>
                          </div>
                          <span className="text-[10px] font-bold bg-amber-50 text-amber-800 px-2 py-0.5 rounded-full border border-amber-200">
                            {traderAlerts.length} Notification{traderAlerts.length !== 1 ? 's' : ''}
                          </span>
                        </div>

                        <div className="mt-3 space-y-2 max-h-80 overflow-y-auto pr-1">
                          {traderAlerts.length > 0 ? (
                            traderAlerts.map((item) => (
                              <div
                                key={`trader-alert-${item.id}`}
                                className={`p-3 rounded-xl border text-xs space-y-1.5 transition-colors ${
                                  item.status === 'Passed'
                                    ? 'bg-emerald-50/70 border-emerald-200'
                                    : item.status === 'Failed'
                                    ? 'bg-rose-50/70 border-rose-200'
                                    : 'bg-amber-50/70 border-amber-200'
                                }`}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <span className="font-extrabold text-slate-900 line-clamp-1">{item.title}</span>
                                  <span
                                    className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 ${
                                      item.status === 'Passed'
                                        ? 'bg-emerald-200/80 text-emerald-900'
                                        : item.status === 'Failed'
                                        ? 'bg-rose-200/80 text-rose-900'
                                        : 'bg-amber-200/80 text-amber-900'
                                    }`}
                                  >
                                    {item.status === 'Passed' && <CheckCircle2 className="w-3 h-3 text-emerald-700" />}
                                    {item.status === 'Failed' && <AlertTriangle className="w-3 h-3 text-rose-700" />}
                                    {item.status === 'Pending' && <Clock className="w-3 h-3 text-amber-700" />}
                                    {item.status}
                                  </span>
                                </div>

                                <div className="flex items-center justify-between text-[11px] text-slate-600 font-medium">
                                  <span className="font-mono text-slate-800 font-bold">{item.licenseNumber}</span>
                                  <span className="text-[10px] text-slate-500 truncate max-w-[140px]">{item.instrumentType}</span>
                                </div>

                                <p className="text-[11px] text-slate-600 leading-tight">
                                  {item.message}
                                </p>

                                <div className="text-[10px] text-slate-500 pt-1.5 flex items-center justify-between border-t border-slate-200/60">
                                  <span>{item.timestamp}</span>
                                  <Link
                                    href={item.actionHref}
                                    onClick={() => setShowAlerts(false)}
                                    className="font-bold text-[#002B49] hover:underline flex items-center gap-1"
                                  >
                                    <span>View Details</span>
                                    <span>→</span>
                                  </Link>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="text-center py-6 text-slate-500 text-xs space-y-1">
                              <CheckCircle2 className="w-8 h-8 text-slate-400 mx-auto opacity-60" />
                              <p className="font-semibold text-slate-700">No New Notifications</p>
                              <p className="text-[11px] text-slate-400">All your instrument verifications are up to date.</p>
                            </div>
                          )}
                        </div>

                        <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                          <Link
                            href="/tracker"
                            onClick={() => setShowAlerts(false)}
                            className="text-xs font-bold text-[#002B49] hover:underline"
                          >
                            Application Tracker →
                          </Link>
                          <button
                            type="button"
                            onClick={() => setShowAlerts(false)}
                            className="text-xs text-slate-500 hover:text-slate-800 font-semibold cursor-pointer"
                          >
                            Close
                          </button>
                        </div>
                      </div>
                    )}
                    {/* GATC Laboratory Notification Dropdown */}
                    {isGatcUser && (
                      <div>
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                              <CheckCircle2 className="w-4 h-4" />
                            </div>
                            <div>
                              <h4 className="text-xs font-black text-slate-900">LMO Approved Applications</h4>
                              <p className="text-[10px] text-emerald-700 font-medium">Ready for GATC Lab Certification</p>
                            </div>
                          </div>
                          <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200">
                            {lmoApprovedApplications.length} Verified
                          </span>
                        </div>

                        <p className="text-[11px] text-slate-500 mt-2 mb-2 leading-tight">
                          Weighing and measuring instruments physically inspected and stamped by LMO officers, awaiting GATC secondary calibration &amp; digital signing:
                        </p>

                        <div className="mt-2 space-y-2 max-h-72 overflow-y-auto pr-1">
                          {lmoApprovedApplications.length > 0 ? (
                            lmoApprovedApplications.map((item) => (
                              <div
                                key={`gatc-alert-${item.id}`}
                                className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200/80 text-xs space-y-1.5 hover:bg-emerald-50 transition-colors"
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <span className="font-extrabold text-slate-900 line-clamp-1">{item.traderName}</span>
                                  <span className="shrink-0 text-[10px] font-bold text-emerald-900 bg-emerald-200/80 px-2 py-0.5 rounded-md flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                                    LMO Approved
                                  </span>
                                </div>

                                <div className="flex items-center justify-between text-[11px] text-slate-600 font-medium">
                                  <span className="font-mono text-slate-700 font-bold">{item.licenseNumber}</span>
                                  <span className="text-[10px] text-slate-500 truncate max-w-[140px]">{item.instrumentType}</span>
                                </div>

                                <div className="text-[10px] text-slate-500 flex items-center justify-between">
                                  <span>District: <strong>{item.district}</strong></span>
                                  <span>Officer: <strong>{item.officerName}</strong></span>
                                </div>

                                <div className="text-[10px] text-emerald-800 pt-1 flex items-center justify-between border-t border-emerald-200/60">
                                  <span>Verified: {item.approvedDate}</span>
                                  <Link
                                    href="/gatc/dashboard"
                                    onClick={() => setShowAlerts(false)}
                                    className="text-emerald-900 font-black hover:underline flex items-center gap-1 bg-emerald-200/60 px-2 py-0.5 rounded-md hover:bg-emerald-200"
                                  >
                                    <span>Review &amp; Certify</span>
                                    <span>→</span>
                                  </Link>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="text-center py-6 text-slate-500 text-xs space-y-1">
                              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto opacity-60" />
                              <p className="font-semibold text-slate-700">All Applications Certified</p>
                              <p className="text-[11px] text-slate-400">No pending LMO approved instruments awaiting GATC calibration.</p>
                            </div>
                          )}
                        </div>

                        <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                          <Link
                            href="/gatc/dashboard"
                            onClick={() => setShowAlerts(false)}
                            className="text-xs font-bold text-[#002B49] hover:underline"
                          >
                            Open GATC Certification Queue →
                          </Link>
                          <button
                            type="button"
                            onClick={() => setShowAlerts(false)}
                            className="text-xs text-slate-500 hover:text-slate-800 font-semibold cursor-pointer"
                          >
                            Close
                          </button>
                        </div>
                      </div>
                    )}

                    {/* LMO Officer Notification Dropdown */}
                    {isLmoUser && (
                      <div>
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                              <Bell className="w-4 h-4" />
                            </div>
                            <div>
                              <h4 className="text-xs font-black text-slate-900">LMO Officer Notifications</h4>
                              <p className="text-[10px] text-slate-500 font-medium">Field Queue &amp; Renewal Alerts</p>
                            </div>
                          </div>
                          <span className="text-[10px] font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200">
                            {notificationCount} Action{notificationCount !== 1 ? 's' : ''}
                          </span>
                        </div>

                        <div className="mt-3 space-y-3 max-h-80 overflow-y-auto pr-1">
                          {/* Section 1: Pending Inspection Requests */}
                          <div>
                            <div className="flex items-center justify-between text-[11px] font-extrabold text-slate-700 mb-1.5 px-1">
                              <span className="flex items-center gap-1.5">
                                <Clock className="w-3 h-3 text-blue-600" />
                                Pending Inspections
                              </span>
                              <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded font-bold">
                                {pendingLmoRequests.length}
                              </span>
                            </div>

                            {pendingLmoRequests.length > 0 ? (
                              <div className="space-y-1.5">
                                {pendingLmoRequests.map((item) => (
                                  <div
                                    key={`req-${item.id}`}
                                    className="p-2.5 rounded-xl bg-blue-50/70 border border-blue-200/80 text-xs space-y-1 hover:bg-blue-50 transition-colors"
                                  >
                                    <div className="flex items-start justify-between gap-2">
                                      <span className="font-extrabold text-slate-900 line-clamp-1">{item.traderName}</span>
                                      <span className="shrink-0 text-[9px] font-bold text-blue-800 bg-blue-200/70 px-1.5 py-0.5 rounded">
                                        {item.district}
                                      </span>
                                    </div>
                                    <div className="flex items-center justify-between text-[10px] text-slate-600">
                                      <span className="font-mono text-slate-700">{item.licenseNumber}</span>
                                      <span className="truncate max-w-[130px]">{item.instrumentType}</span>
                                    </div>
                                    <div className="pt-1 flex items-center justify-between border-t border-blue-200/50 text-[10px]">
                                      <span className="text-slate-400">Applied: {item.appliedDate}</span>
                                      <Link
                                        href="/lmo?tab=inspection_queue"
                                        onClick={() => setShowAlerts(false)}
                                        className="text-blue-700 font-bold hover:underline flex items-center gap-1"
                                      >
                                        <span>Inspect Scale</span>
                                        <span>→</span>
                                      </Link>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-[11px] text-slate-400 italic px-1 py-1">No pending inspection requests in queue.</p>
                            )}
                          </div>

                          {/* Section 2: Statutory Expiration Alerts */}
                          <div>
                            <div className="flex items-center justify-between text-[11px] font-extrabold text-slate-700 mb-1.5 px-1 pt-1 border-t border-slate-100">
                              <span className="flex items-center gap-1.5">
                                <AlertTriangle className="w-3 h-3 text-amber-600" />
                                Renewal Alerts (&lt; 30 Days)
                              </span>
                              <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded font-bold">
                                {expiringTraders.length}
                              </span>
                            </div>

                            {expiringTraders.length > 0 ? (
                              <div className="space-y-1.5">
                                {expiringTraders.map((item) => (
                                  <div
                                    key={`exp-${item.id}`}
                                    className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/80 text-xs space-y-1 hover:bg-amber-50 transition-colors"
                                  >
                                    <div className="flex items-start justify-between gap-2">
                                      <span className="font-extrabold text-slate-900 line-clamp-1">{item.traderName}</span>
                                      <span className="shrink-0 text-[9px] font-bold text-amber-900 bg-amber-200/80 px-1.5 py-0.5 rounded">
                                        Due in {item.daysRemaining}d
                                      </span>
                                    </div>
                                    <div className="flex items-center justify-between text-[10px] text-slate-600">
                                      <span className="font-mono text-slate-700">{item.licenseNumber}</span>
                                      <span>Expires: {item.expiryDate}</span>
                                    </div>
                                    <div className="pt-1 flex items-center justify-end border-t border-amber-200/50 text-[10px]">
                                      <Link
                                        href="/lmo?tab=visit_schedule"
                                        onClick={() => setShowAlerts(false)}
                                        className="text-amber-900 font-bold hover:underline flex items-center gap-1"
                                      >
                                        <span>Schedule Re-test</span>
                                        <span>→</span>
                                      </Link>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-[11px] text-slate-400 italic px-1 py-1">No certificates expiring within 30 days.</p>
                            )}
                          </div>
                        </div>

                        <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                          <Link
                            href="/lmo?tab=inspection_queue"
                            onClick={() => setShowAlerts(false)}
                            className="text-xs font-bold text-[#002B49] hover:underline"
                          >
                            Open LMO Verification Portal →
                          </Link>
                          <button
                            type="button"
                            onClick={() => setShowAlerts(false)}
                            className="text-xs text-slate-500 hover:text-slate-800 font-semibold cursor-pointer"
                          >
                            Close
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Admin Central Command Notification Dropdown */}
                    {isAdminUser && (
                      <div>
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
                              <Bell className="w-4 h-4" />
                            </div>
                            <div>
                              <h4 className="text-xs font-black text-slate-900">DoCA Command Alerts</h4>
                              <p className="text-[10px] text-slate-500 font-medium">State Metrology Overview</p>
                            </div>
                          </div>
                          <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-200">
                            {notificationCount} System Alerts
                          </span>
                        </div>

                        <div className="mt-3 space-y-2 text-xs">
                          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                            <span className="font-semibold text-slate-700">Pending Field Inspections</span>
                            <span className="font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-md">{pendingLmoRequests.length}</span>
                          </div>
                          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                            <span className="font-semibold text-slate-700">LMO Approved (GATC Queue)</span>
                            <span className="font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">{lmoApprovedApplications.length}</span>
                          </div>
                          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                            <span className="font-semibold text-slate-700">Expiring Certifications (&lt; 30d)</span>
                            <span className="font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md">{expiringTraders.length}</span>
                          </div>
                        </div>

                        <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                          <Link
                            href="/doca"
                            onClick={() => setShowAlerts(false)}
                            className="text-xs font-bold text-[#002B49] hover:underline"
                          >
                            Open DoCA Command →
                          </Link>
                          <button
                            type="button"
                            onClick={() => setShowAlerts(false)}
                            className="text-xs text-slate-500 hover:text-slate-800 font-semibold cursor-pointer"
                          >
                            Close
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Officer / User Profile Badge */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowRoleMenu(!showRoleMenu)}
                className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-slate-100 transition-all text-left cursor-pointer"
              >
                <div className="w-8 h-8 rounded-full bg-[#002B49] text-white flex items-center justify-center text-xs font-bold shadow-xs">
                  {((isTraderUser ? 'Ramesh Kumar' : (displayedUser.fullName || displayedUser.email || 'O'))).charAt(0).toUpperCase()}
                </div>
                <div className="hidden lg:block text-left">
                  <div className="text-xs font-bold text-slate-900 leading-tight truncate max-w-[150px]">
                    {isTraderUser ? 'Ramesh Kumar' : (displayedUser.fullName || 'Officer')}
                  </div>
                  <div className="text-[10px] text-slate-500 font-medium truncate max-w-[150px]">
                    {isTraderUser
                      ? 'Rohtak - Trader'
                      : `${displayedUser.district ? `${displayedUser.district} • ` : ''}${currentRoleInfo.label.split('(')[0].trim()}`}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
              </button>

              {/* Profile Card Menu (Strictly shows current authenticated officer/user - NO persona switching) */}
              {showRoleMenu && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 z-50 space-y-3">
                  {/* Officer / User Profile Header */}
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#002B49] text-white flex items-center justify-center text-sm font-black shrink-0 shadow-xs">
                      {((isTraderUser ? 'Ramesh Kumar' : (displayedUser.fullName || 'O'))).charAt(0).toUpperCase()}
                    </div>
                    <div className="overflow-hidden flex-1 min-w-0">
                      <p className="text-xs font-black text-slate-900 truncate">
                        {isTraderUser ? 'Ramesh Kumar' : displayedUser.fullName}
                      </p>
                      <p className="text-[10px] text-slate-500 font-mono truncate">
                        {isTraderUser ? (displayedUser.email || 'trader@demo.com') : displayedUser.email}
                      </p>
                      <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                        {isTraderUser ? 'Rohtak - Trader' : currentRoleInfo.label}
                      </span>
                    </div>
                  </div>

                  {/* Official Credentials & Jurisdiction Details */}
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/70 space-y-1.5 text-xs">
                    {(isTraderUser || displayedUser.district) && (
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-500 font-medium">{isTraderUser ? 'Location:' : 'Assigned Jurisdiction:'}</span>
                        <span className="font-bold text-slate-800">{isTraderUser ? 'Rohtak, Haryana' : `${displayedUser.district} District, Haryana`}</span>
                      </div>
                    )}
                    {!isTraderUser && displayedUser.designation && (
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-500 font-medium">Official Title:</span>
                        <span className="font-semibold text-slate-700 text-right truncate max-w-[150px]">
                          {displayedUser.designation}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 font-medium">Enterprise:</span>
                      <span className="font-semibold text-slate-700 truncate max-w-[150px]">
                        {isTraderUser ? 'Ramesh Kumar' : (displayedUser.businessName || 'Trading Enterprise')}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-200/50">
                      <span className="text-slate-500 font-medium">Session Security:</span>
                      <span className="font-bold text-emerald-700 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        {isTraderUser ? 'Verified Trader' : 'Verified Officer'}
                      </span>
                    </div>
                  </div>

                  {/* Sign Out Action */}
                  <div className="pt-1 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={async () => {
                        setShowRoleMenu(false);
                        try {
                          await supabase.auth.signOut();
                        } catch {
                          // ignore
                        }
                        if (typeof window !== 'undefined') {
                          localStorage.removeItem('eMaap_currentUser');
                          sessionStorage.clear();
                        }
                        router.push('/login');
                      }}
                      className="w-full px-3 py-2 rounded-xl text-rose-700 font-bold hover:bg-rose-50 flex items-center justify-between transition-colors cursor-pointer text-xs"
                    >
                      <span className="flex items-center gap-2">
                        <LogOut className="w-4 h-4" />
                        <span>{isTraderUser ? 'Sign Out Trader Session' : 'Sign Out Officer Session'}</span>
                      </span>
                      <span className="text-[10px] text-rose-400 font-medium">Exit</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Role Navigation Tabs */}
        <div className="flex space-x-1 sm:space-x-4 border-t border-slate-100 overflow-x-auto py-2 scrollbar-none">
          {/* APPLICANT TABS (Strictly shown for Trader/Applicant) */}
          {effectiveRole === 'APPLICANT' && (
            <>
              <TabButton
                active={activeTab === 'applicant-dashboard'}
                onClick={() => {
                  setActiveTab('applicant-dashboard');
                  router.push('/trader/dashboard');
                }}
                href="/trader/dashboard"
                label="My Instruments & Vault"
              />
              <TabButton
                active={activeTab === 'applicant-applications' || activeTab === 'tracker'}
                onClick={() => {
                  setActiveTab('applicant-applications');
                  router.push('/tracker');
                }}
                href="/tracker"
                label="Application Tracker"
              />
              <TabButton
                active={activeTab === 'applicant-deficiencies' || activeTab === 'notices'}
                onClick={() => {
                  setActiveTab('applicant-deficiencies');
                  router.push('/notices');
                }}
                href="/notices"
                label="Deficiency Notices"
              />
            </>
          )}

          {/* LMO OFFICER TABS (Strictly shown for LMO) */}
          {effectiveRole === 'LMO' && (
            <>
              <TabButton
                active={activeTab === 'inspection_queue' || activeTab === 'officer-queue'}
                onClick={() => {
                  setActiveTab('inspection_queue');
                  router.push('/lmo?tab=inspection_queue');
                }}
                href="/lmo?tab=inspection_queue"
                label="Inspection Queue"
              />
              <TabButton
                active={activeTab === 'visit_schedule' || activeTab === 'officer-calendar'}
                onClick={() => {
                  setActiveTab('visit_schedule');
                  router.push('/lmo?tab=visit_schedule');
                }}
                href="/lmo?tab=visit_schedule"
                label="Visit Schedule"
              />
              <TabButton
                active={activeTab === 'verified'}
                onClick={() => {
                  setActiveTab('verified');
                  router.push('/lmo?tab=verified');
                }}
                href="/lmo?tab=verified"
                label="Verified"
              />
              <TabButton
                active={activeTab === 'certificates_issued' || activeTab === 'officer-history'}
                onClick={() => {
                  setActiveTab('certificates_issued');
                  router.push('/lmo?tab=certificates_issued');
                }}
                href="/lmo?tab=certificates_issued"
                label="Certificates Issued"
              />
            </>
          )}

          {/* GATC LAB TABS (Strictly shown for GATC) */}
          {effectiveRole === 'GATC' && (
            <>
              <TabButton
                active={activeTab === 'gatc-queue'}
                onClick={() => {
                  setActiveTab('gatc-queue');
                  router.push('/gatc/dashboard');
                }}
                href="/gatc/dashboard"
                label="Pending Certification Queue"
              />
              <TabButton
                active={activeTab === 'gatc-accreditation'}
                onClick={() => {
                  setActiveTab('gatc-accreditation');
                  router.push('/gatc/dashboard');
                }}
                href="/gatc/dashboard"
                label="Accreditation & Standards"
              />
            </>
          )}

          {/* ADMIN TABS (Strictly shown for DoCA Admin) */}
          {effectiveRole === 'ADMIN' && (
            <>
              <TabButton
                active={activeTab === 'doca-command' || activeTab === 'admin-analytics'}
                onClick={() => {
                  setActiveTab('doca-command');
                  router.push('/doca');
                }}
                href="/doca"
                label="DoCA Central Command"
              />
              <TabButton
                active={activeTab === 'admin-jurisdictions'}
                onClick={() => setActiveTab('admin-jurisdictions')}
                label="Jurisdiction & Officer Mapping"
              />
              <TabButton
                active={activeTab === 'admin-audit'}
                onClick={() => setActiveTab('admin-audit')}
                label="Immutable Audit Trail"
              />
            </>
          )}

          {/* PUBLIC TAB (Always available) */}
          <TabButton
            active={activeTab === 'public-verify' || activeTab === 'citizen-auth'}
            onClick={() => {
              setActiveTab('public-verify');
              router.push('/auth/citizen');
            }}
            href="/auth/citizen"
            label="Citizen Authentication"
          />
        </div>
      </div>
    </header>
  );
}

function TabButton({
  active,
  onClick,
  label,
  href,
}: {
  active: boolean;
  onClick?: () => void;
  label: string;
  href?: string;
}) {
  const className = `px-3 py-1.5 text-xs font-semibold rounded-md whitespace-nowrap transition-all inline-block cursor-pointer ${
    active
      ? 'bg-[#002B49] text-white shadow-xs'
      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
  }`;

  if (href) {
    return (
      <Link href={href} onClick={onClick} className={className}>
        {label}
      </Link>
    );
  }

  return (
    <button onClick={onClick} className={className}>
      {label}
    </button>
  );
}
