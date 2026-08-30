'use client';

import React, { useState } from 'react';
import { useMetrologyStore } from '@/lib/store';
import { UserRole } from '@/types/metrology';
import {
  Scale,
  ShieldCheck,
  Building2,
  UserCheck,
  Sliders,
  QrCode,
  Bell,
  Search,
  Wifi,
  WifiOff,
  RefreshCw,
  ChevronDown,
  FileText,
} from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export function Header({ activeTab, setActiveTab }: HeaderProps) {
  const {
    currentUser,
    switchRole,
    availableUsers,
    setCurrentUser,
    isOfflineMode,
    setIsOfflineMode,
    offlineDrafts,
    syncOfflineDrafts,
    renewalAlerts,
  } = useMetrologyStore();

  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showAlerts, setShowAlerts] = useState(false);

  const roleLabels: Record<UserRole, { label: string; icon: React.ElementType; color: string }> = {
    APPLICANT: { label: 'Instrument Owner / Business', icon: Building2, color: 'text-blue-700 bg-blue-50' },
    LMO: { label: 'Legal Metrology Officer (Inspector)', icon: ShieldCheck, color: 'text-indigo-700 bg-indigo-50' },
    GATC: { label: 'Govt. Approved Test Centre (GATC)', icon: Scale, color: 'text-amber-700 bg-amber-50' },
    ADMIN: { label: 'Department Admin (DoCA)', icon: Sliders, color: 'text-purple-700 bg-purple-50' },
    PUBLIC: { label: 'Public Citizen / Verification', icon: QrCode, color: 'text-emerald-700 bg-emerald-50' },
  };

  const currentRoleInfo = roleLabels[currentUser.role];
  const IconComponent = currentRoleInfo.icon;

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
          <div className="flex items-center gap-3">
            {/* Quick Public Scanner Button */}
            <button
              onClick={() => setActiveTab('public-verify')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all shadow-2xs ${
                activeTab === 'public-verify'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
              }`}
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>Public QR Scan</span>
            </button>

            {/* Offline Mode Toggle for LMO Officers */}
            {currentUser.role === 'LMO' && (
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

            {/* Notifications / Alerts Drawer Trigger */}
            <div className="relative">
              <button
                onClick={() => setShowAlerts(!showAlerts)}
                className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 relative transition-colors"
                title="Notifications & Expiry Reminders"
              >
                <Bell className="w-4 h-4" />
                {renewalAlerts.length > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white"></span>
                )}
              </button>

              {showAlerts && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 p-3 z-50 animate-in fade-in zoom-in-95">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="text-xs font-bold text-slate-800">Renewal Alerts & Notices</span>
                    <span className="text-[10px] text-slate-500">{renewalAlerts.length} active</span>
                  </div>
                  <div className="mt-2 space-y-2 max-h-60 overflow-y-auto">
                    {renewalAlerts.map((alert) => (
                      <div
                        key={alert.id}
                        className={`p-2 rounded-lg text-xs border ${
                          alert.daysRemaining <= 0
                            ? 'bg-rose-50 border-rose-200 text-rose-800'
                            : 'bg-amber-50 border-amber-200 text-amber-800'
                        }`}
                      >
                        <div className="font-semibold">{alert.instrumentName}</div>
                        <div className="text-[11px] opacity-90">
                          {alert.daysRemaining <= 0
                            ? 'Certificate EXPIRED. Immediate re-verification needed!'
                            : `Expires in ${alert.daysRemaining} days (${alert.expiryDate})`}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Persona Switcher Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowRoleMenu(!showRoleMenu)}
                className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-slate-100 transition-all text-left"
              >
                <div className="w-7 h-7 rounded-full bg-[#002B49] text-white flex items-center justify-center text-xs font-bold">
                  {currentUser.fullName.charAt(0)}
                </div>
                <div className="hidden lg:block text-left">
                  <div className="text-xs font-bold text-slate-900 leading-tight">
                    {currentUser.fullName}
                  </div>
                  <div className="text-[10px] text-slate-500 font-medium">
                    {currentRoleInfo.label.split('(')[0]}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
              </button>

              {/* Persona Selector Menu */}
              {showRoleMenu && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 p-2 z-50 divide-y divide-slate-100">
                  <div className="px-3 py-2">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Switch Active Persona
                    </p>
                    <p className="text-xs text-slate-600">Test multi-stakeholder workflows</p>
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
                            {user.businessName && (
                              <div className="text-[10px] text-slate-400 truncate max-w-[180px]">
                                {user.businessName}
                              </div>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Role Navigation Tabs */}
        <div className="flex space-x-1 sm:space-x-4 border-t border-slate-100 overflow-x-auto py-2 scrollbar-none">
          {/* APPLICANT TABS */}
          {currentUser.role === 'APPLICANT' && (
            <>
              <TabButton
                active={activeTab === 'applicant-dashboard'}
                onClick={() => setActiveTab('applicant-dashboard')}
                label="My Instruments & Vault"
              />
              <TabButton
                active={activeTab === 'applicant-applications'}
                onClick={() => setActiveTab('applicant-applications')}
                label="Application Tracker"
              />
              <TabButton
                active={activeTab === 'applicant-deficiencies'}
                onClick={() => setActiveTab('applicant-deficiencies')}
                label="Deficiency Notices"
              />
            </>
          )}

          {/* LMO OFFICER TABS */}
          {currentUser.role === 'LMO' && (
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

          {/* GATC LAB TABS */}
          {currentUser.role === 'GATC' && (
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

          {/* ADMIN TABS */}
          {currentUser.role === 'ADMIN' && (
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
            active={activeTab === 'public-verify'}
            onClick={() => setActiveTab('public-verify')}
            label="Citizen QR Authentication"
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
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 text-xs font-semibold rounded-md whitespace-nowrap transition-all ${
        active
          ? 'bg-[#002B49] text-white shadow-xs'
          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
      }`}
    >
      {label}
    </button>
  );
}
