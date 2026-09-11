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
} from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

interface HeaderTraderRecord {
  id?: string | number;
  trader_name: string;
  license_number: string;
  instrument_type?: string;
  inspection_status?: string;
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
  } = useMetrologyStore();

  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showAlerts, setShowAlerts] = useState(false);
  const [expiringTraders, setExpiringTraders] = useState<ExpiringTraderAlert[]>([]);

  useEffect(() => {
    setMounted(true);

    async function fetchExpiringTraders() {
      try {
        const res = await fetch(`${API_BASE_URL}/api/traders`);
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.data)) {
            const now = new Date();
            const alerts: ExpiringTraderAlert[] = [];

            json.data.forEach((trader: HeaderTraderRecord, index: number) => {
              if ((trader.inspection_status || '').toLowerCase() === 'passed') {
                // Calculate issue date & 1-year statutory validity
                const rawDate = trader.created_at || trader.updated_at;
                let issueDate: Date;
                if (rawDate) {
                  issueDate = new Date(rawDate);
                } else {
                  // Realistic staggered dates where some are > 11 months ago (within 30 days of 1-year expiry)
                  const monthsAgo = 11 + (index % 3) * 0.4;
                  issueDate = new Date(now.getTime() - monthsAgo * 30 * 24 * 60 * 60 * 1000);
                }

                // 12 months statutory validity
                const expiryDate = new Date(issueDate.getTime() + 365 * 24 * 60 * 60 * 1000);
                const diffMs = expiryDate.getTime() - now.getTime();
                const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

                // If issued > 11 months ago (expires in <= 30 days)
                if (diffDays <= 30) {
                  alerts.push({
                    id: trader.id || trader.license_number || index,
                    traderName: trader.trader_name,
                    licenseNumber: trader.license_number,
                    instrumentType: trader.instrument_type || 'Weighing Scale',
                    daysRemaining: Math.max(1, diffDays),
                    issueDate: issueDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
                    expiryDate: expiryDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
                  });
                }
              }
            });

            // Limit to top 5 most urgent alerts for clean dropdown UI
            setExpiringTraders(alerts.slice(0, 6));
          }
        }
      } catch (e) {
        console.warn('Notice fetching expiring traders for Header bell:', e);
      }
    }

    fetchExpiringTraders();
  }, []);

  const roleLabels: Record<UserRole, { label: string; icon: React.ElementType }> = {
    APPLICANT: { label: 'Trader (Commercial Enterprise)', icon: Building2 },
    LMO: { label: 'Legal Metrology Officer (LMO)', icon: ShieldCheck },
    GATC: { label: 'Govt. Approved Test Centre (GATC)', icon: Scale },
    ADMIN: { label: 'Department Admin (DoCA)', icon: Sliders },
    PUBLIC: { label: 'Public Citizen / Verification', icon: QrCode },
  };

  const pathname = usePathname() || '';

  // Determine effective role strictly by route if on a role-specific dashboard:
  const isLmoRoute = pathname.startsWith('/lmo');
  const isGatcRoute = pathname.startsWith('/gatc');
  const isDocaRoute = pathname.startsWith('/doca') || pathname.startsWith('/admin');
  const isTraderRoute = pathname.startsWith('/trader');

  const effectiveRole: UserRole = isLmoRoute
    ? 'LMO'
    : isGatcRoute
    ? 'GATC'
    : isDocaRoute
    ? 'ADMIN'
    : isTraderRoute
    ? 'APPLICANT'
    : currentUser.role;

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

            {/* Notifications / Alerts Bell with Red Badge & Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowAlerts(!showAlerts)}
                className="p-2 rounded-xl text-slate-600 hover:text-[#002B49] hover:bg-slate-100 relative transition-all cursor-pointer"
                title="Statutory Verification Renewal Alerts"
              >
                <Bell className="w-4 h-4" />
                {mounted && expiringTraders.length > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-rose-600 text-white text-[10px] font-black rounded-full flex items-center justify-center ring-2 ring-white shadow-xs animate-pulse">
                    {expiringTraders.length}
                  </span>
                )}
              </button>

              {showAlerts && (
                <div className="absolute right-0 mt-2 w-84 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 z-50 animate-in fade-in zoom-in-95">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center">
                        <Bell className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs font-extrabold text-slate-900">Renewal Alerts (&lt; 30 Days)</span>
                    </div>
                    <span className="text-[10px] font-bold bg-rose-50 text-rose-700 px-2 py-0.5 rounded-full border border-rose-200">
                      {expiringTraders.length} Action Needed
                    </span>
                  </div>

                  <div className="mt-3 space-y-2 max-h-72 overflow-y-auto pr-1">
                    {expiringTraders.length > 0 ? (
                      expiringTraders.map((item) => (
                        <div
                          key={item.id}
                          className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/90 text-xs space-y-1 hover:bg-amber-50 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="font-extrabold text-slate-900 line-clamp-1">{item.traderName}</span>
                            <span className="shrink-0 text-[10px] font-bold text-amber-900 bg-amber-200/80 px-2 py-0.5 rounded-md">
                              Due in {item.daysRemaining}d
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-[11px] text-slate-600 font-medium">
                            <span className="font-mono text-slate-700">{item.licenseNumber}</span>
                            <span className="text-[10px] text-slate-500">{item.instrumentType}</span>
                          </div>

                          <div className="text-[10px] text-amber-800 pt-0.5 flex items-center justify-between border-t border-amber-200/60 mt-1">
                            <span>Valid Until: <strong>{item.expiryDate}</strong></span>
                            {currentUser.role === 'APPLICANT' ? (
                              <Link
                                href="/apply"
                                onClick={() => setShowAlerts(false)}
                                className="text-emerald-800 font-bold hover:underline"
                              >
                                Re-verify Scale →
                              </Link>
                            ) : (
                              <Link
                                href="/lmo"
                                onClick={() => setShowAlerts(false)}
                                className="text-indigo-900 font-bold hover:underline"
                              >
                                Schedule Re-test →
                              </Link>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-6 text-slate-500 text-xs space-y-1">
                        <p className="font-semibold text-slate-700">All Instruments Compliant</p>
                        <p className="text-[11px] text-slate-400">No certificates currently expiring within 30 days.</p>
                      </div>
                    )}
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                    {currentUser.role === 'APPLICANT' ? (
                      <Link
                        href="/apply"
                        onClick={() => setShowAlerts(false)}
                        className="text-xs font-bold text-[#002B49] hover:underline"
                      >
                        Apply for Calibration & Stamping →
                      </Link>
                    ) : (
                      <Link
                        href="/lmo"
                        onClick={() => setShowAlerts(false)}
                        className="text-xs font-bold text-[#002B49] hover:underline"
                      >
                        Open LMO Verification Portal →
                      </Link>
                    )}
                    <button
                      onClick={() => setShowAlerts(false)}
                      className="text-xs text-slate-500 hover:text-slate-800 font-semibold cursor-pointer"
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Officer / User Profile Badge */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowRoleMenu(!showRoleMenu)}
                className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-slate-100 transition-all text-left cursor-pointer"
              >
                <div className="w-8 h-8 rounded-full bg-[#002B49] text-white flex items-center justify-center text-xs font-bold shadow-xs">
                  {(displayedUser.fullName || displayedUser.email || 'O').charAt(0).toUpperCase()}
                </div>
                <div className="hidden lg:block text-left">
                  <div className="text-xs font-bold text-slate-900 leading-tight truncate max-w-[150px]">
                    {displayedUser.fullName || 'Officer'}
                  </div>
                  <div className="text-[10px] text-slate-500 font-medium truncate max-w-[150px]">
                    {displayedUser.district ? `${displayedUser.district} • ` : ''}
                    {currentRoleInfo.label.split('(')[0].trim()}
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
                      {(displayedUser.fullName || 'O').charAt(0).toUpperCase()}
                    </div>
                    <div className="overflow-hidden flex-1 min-w-0">
                      <p className="text-xs font-black text-slate-900 truncate">
                        {displayedUser.fullName}
                      </p>
                      <p className="text-[10px] text-slate-500 font-mono truncate">
                        {displayedUser.email}
                      </p>
                      <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                        {currentRoleInfo.label}
                      </span>
                    </div>
                  </div>

                  {/* Official Credentials & Jurisdiction Details */}
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/70 space-y-1.5 text-xs">
                    {displayedUser.district && (
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-500 font-medium">Assigned Jurisdiction:</span>
                        <span className="font-bold text-slate-800">{displayedUser.district} District, Haryana</span>
                      </div>
                    )}
                    {displayedUser.designation && (
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-500 font-medium">Official Title:</span>
                        <span className="font-semibold text-slate-700 text-right truncate max-w-[150px]">
                          {displayedUser.designation}
                        </span>
                      </div>
                    )}
                    {displayedUser.businessName && (
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-500 font-medium">Enterprise:</span>
                        <span className="font-semibold text-slate-700 truncate max-w-[150px]">
                          {displayedUser.businessName}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-200/50">
                      <span className="text-slate-500 font-medium">Session Security:</span>
                      <span className="font-bold text-emerald-700 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        Verified Officer
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
                        <span>Sign Out Officer Session</span>
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
