import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase-client';
import { useMetrologyStore } from '@/lib/store';
import { UserRole } from '@/types/metrology';
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
        const res = await fetch('http://localhost:5000/api/traders');
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
    APPLICANT: { label: 'Instrument Owner / Business', icon: Building2 },
    LMO: { label: 'Legal Metrology Officer (Inspector)', icon: ShieldCheck },
    GATC: { label: 'Govt. Approved Test Centre (GATC)', icon: Scale },
    ADMIN: { label: 'Department Admin (DoCA)', icon: Sliders },
    PUBLIC: { label: 'Public Citizen / Verification', icon: QrCode },
  };

  const currentRoleInfo = roleLabels[currentUser.role] || roleLabels.APPLICANT;

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
          {/* Brand & Emblem */}
          <div className="flex items-center gap-3">
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
            {/* Online Registration Link */}
            <Link
              href="/apply"
              className="px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all shadow-2xs bg-[#002B49] text-white hover:bg-[#003B66] cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-amber-400" />
              <span>Apply Online</span>
            </Link>

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
                                href="/admin/traders"
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
                        href="/admin/traders"
                        onClick={() => setShowAlerts(false)}
                        className="text-xs font-bold text-[#002B49] hover:underline"
                      >
                        View All in Central Registry →
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

            {/* Persona Switcher / Profile Badge */}
            <div className="relative">
              <button
                onClick={() => setShowRoleMenu(!showRoleMenu)}
                className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-slate-100 transition-all text-left cursor-pointer"
              >
                <div className="w-7 h-7 rounded-full bg-[#002B49] text-white flex items-center justify-center text-xs font-bold">
                  {(currentUser.fullName || currentUser.email || 'T').charAt(0).toUpperCase()}
                </div>
                <div className="hidden lg:block text-left">
                  <div className="text-xs font-bold text-slate-900 leading-tight truncate max-w-[140px]">
                    {currentUser.fullName || currentUser.email?.split('@')[0] || 'Trader'}
                  </div>
                  <div className="text-[10px] text-slate-500 font-medium truncate max-w-[140px]">
                    {currentUser.email || (currentUser.role === 'APPLICANT' ? 'Trader / Enterprise' : currentRoleInfo.label.split('(')[0])}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
              </button>

              {/* Persona Selector Menu */}
              {showRoleMenu && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 p-2 z-50 divide-y divide-slate-100">
                  {currentUser.role === 'APPLICANT' ? (
                    /* ----------------- SECURED TRADER PROFILE VIEW (NO LMO/GATC LEAKS) ----------------- */
                    <div className="p-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-[#002B49] text-white flex items-center justify-center text-xs font-bold">
                          {(currentUser.fullName || 'T').charAt(0)}
                        </div>
                        <div className="overflow-hidden">
                          <p className="text-xs font-black text-slate-900 truncate">
                            {currentUser.fullName || 'Commercial Trader'}
                          </p>
                          <p className="text-[10px] text-slate-500 font-mono truncate">
                            {currentUser.email || 'trader@demo.com'}
                          </p>
                        </div>
                      </div>

                      <div className="pt-1 flex items-center justify-between text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-200/60">
                        <span className="font-semibold text-slate-700">Role:</span>
                        <span className="font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded-md text-[10px]">
                          Trader (Commercial Enterprise)
                        </span>
                      </div>

                      {currentUser.businessName && (
                        <div className="text-[10px] text-slate-500 flex items-center gap-1">
                          <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">{currentUser.businessName}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* ----------------- ADMIN/OFFICER PERSONA SWITCHER ----------------- */
                    <>
                      <div className="px-3 py-2">
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                          Switch Active Persona
                        </p>
                        <p className="text-xs text-slate-600">Administrative stakeholder roles</p>
                      </div>
                      <div className="py-1 space-y-1">
                        {availableUsers.map((user) => {
                          const isCurrent = user.id === currentUser.id;
                          const RoleIcon = roleLabels[user.role].icon;
                          return (
                            <button
                              key={user.id}
                              onClick={() => {
                                setCurrentUser(user);
                                setShowRoleMenu(false);
                                if (user.role === 'APPLICANT') setActiveTab('applicant-dashboard');
                                if (user.role === 'LMO') setActiveTab('officer-queue');
                                if (user.role === 'GATC') setActiveTab('gatc-queue');
                                if (user.role === 'ADMIN') setActiveTab('admin-analytics');
                              }}
                              className={`w-full flex items-start gap-2.5 px-3 py-2 rounded-lg text-left text-xs transition-colors ${
                                isCurrent
                                  ? 'bg-[#002B49]/10 text-[#002B49] font-bold'
                                  : 'hover:bg-slate-50 text-slate-700'
                              }`}
                            >
                              <RoleIcon className="w-4 h-4 mt-0.5 shrink-0 text-slate-600" />
                              <div>
                                <div className="font-semibold">{user.fullName}</div>
                                <div className="text-[10px] text-slate-500">
                                  {roleLabels[user.role].label}
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </>
                  )}

                  {/* Actions & Sign Out */}
                  <div className="p-2 bg-slate-50 border-t border-slate-100 flex flex-col gap-1 text-xs">
                    {currentUser.role === 'APPLICANT' && (
                      <Link
                        href="/apply"
                        onClick={() => setShowRoleMenu(false)}
                        className="px-2.5 py-1.5 rounded-lg text-[#002B49] font-bold hover:bg-white flex items-center justify-between transition-colors"
                      >
                        <span>📝 Apply for Scale Stamping</span>
                        <span className="text-[10px] text-amber-600">Online</span>
                      </Link>
                    )}
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
                        }
                        router.push('/login');
                      }}
                      className="w-full mt-1 pt-1.5 border-t border-slate-200/60 px-2.5 py-1.5 rounded-lg text-rose-700 font-bold hover:bg-rose-50 flex items-center justify-between transition-colors cursor-pointer text-left"
                    >
                      <span className="flex items-center gap-1.5">
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out Session</span>
                      </span>
                      <span className="text-[10px] text-rose-400">Exit</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Role Navigation Tabs */}
        <div className="flex space-x-1 sm:space-x-4 border-t border-slate-100 overflow-x-auto py-2 scrollbar-none">
          {/* APPLICANT TABS (Only shown when user is Trader/Applicant) */}
          {(!mounted || currentUser.role === 'APPLICANT') && (
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

          {/* LMO OFFICER TABS (Never shown to Trader) */}
          {mounted && currentUser.role === 'LMO' && (
            <>
              <TabButton
                active={activeTab === 'officer-queue'}
                onClick={() => setActiveTab('officer-queue')}
                label="Inspection Queue (South Delhi)"
              />
              <TabButton
                active={activeTab === 'officer-calendar'}
                onClick={() => setActiveTab('officer-calendar')}
                label="Visit Schedule"
              />
              <TabButton
                active={activeTab === 'officer-history'}
                onClick={() => setActiveTab('officer-history')}
                label="Verified Certificates Issued"
              />
            </>
          )}

          {/* GATC LAB TABS (Never shown to Trader) */}
          {mounted && currentUser.role === 'GATC' && (
            <>
              <TabButton
                active={activeTab === 'gatc-queue'}
                onClick={() => setActiveTab('gatc-queue')}
                label="GATC Lab Calibration Queue"
              />
              <TabButton
                active={activeTab === 'gatc-accreditation'}
                onClick={() => setActiveTab('gatc-accreditation')}
                label="Accreditation & Standards"
              />
            </>
          )}

          {/* ADMIN TABS (Never shown to Trader) */}
          {mounted && currentUser.role === 'ADMIN' && (
            <>
              <TabButton
                active={activeTab === 'admin-analytics'}
                onClick={() => setActiveTab('admin-analytics')}
                label="National Metrology Dashboard"
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
