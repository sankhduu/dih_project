'use client';

import React, { useState } from 'react';
import { useMetrologyStore } from '@/lib/store';
import { Instrument, Certificate } from '@/types/metrology';
import { StatusBadge } from '@/components/common/StatusBadge';
import { InstrumentRegisterModal } from './InstrumentRegisterModal';
import { ApplicationSubmitModal } from './ApplicationSubmitModal';
import { OfficialCertificateView } from '@/components/certificates/OfficialCertificateView';
import { exportCertificatePDF } from '@/lib/pdf-generator';
import {
  Scale,
  Plus,
  Send,
  FileBadge,
  Calendar,
  AlertTriangle,
  Clock,
  Download,
  Building2,
  MapPin,
  CheckCircle2,
  AlertOctagon,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';

export function ApplicantDashboard() {
  const {
    currentUser,
    instruments,
    applications,
    certificates,
    deficiencyMemos,
    renewalAlerts,
  } = useMetrologyStore();

  const userInstruments = instruments.filter((i) => i.ownerId === currentUser.id);
  const userApplications = applications.filter((a) => a.applicantId === currentUser.id);
  const userCertificates = certificates.filter((c) => c.ownerId === currentUser.id);
  const userDeficiencies = deficiencyMemos.filter((d) => d.ownerId === currentUser.id);

  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isSubmitOpen, setIsSubmitOpen] = useState(false);
  const [selectedInstForApp, setSelectedInstForApp] = useState<Instrument | null>(null);
  const [viewingCertificate, setViewingCertificate] = useState<Certificate | null>(null);

  // Statistics
  const activeCount = userInstruments.filter((i) => i.status === 'ACTIVE_VERIFIED').length;
  const pendingCount = userInstruments.filter((i) => i.status === 'PENDING_VERIFICATION' || i.status === 'SCHEDULED').length;
  const deficientCount = userInstruments.filter((i) => i.status === 'DEFICIENT').length;
  const expiredCount = userInstruments.filter((i) => i.status === 'EXPIRED').length;

  return (
    <div className="space-y-8">
      {/* Trader Profile & Establishment Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#002B49] text-amber-400 flex items-center justify-center font-bold text-xl shadow-xs">
            <Building2 className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                {currentUser.businessName || currentUser.fullName}
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                KYC Verified
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-2">
              <span>Proprietor: <strong className="text-slate-700">{currentUser.fullName}</strong></span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3 text-slate-400" />
                {currentUser.address}, {currentUser.district} - {currentUser.pinCode}
              </span>
            </p>
            {currentUser.gstin && (
              <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                GSTIN: {currentUser.gstin}
              </p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsRegisterOpen(true)}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4 text-amber-400" />
            <span>Register Instrument</span>
          </button>
          <button
            onClick={() => {
              setSelectedInstForApp(userInstruments[0] || null);
              setIsSubmitOpen(true);
            }}
            className="px-4 py-2.5 bg-[#002B49] hover:bg-[#003B66] text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>Apply for Verification</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Active & Stamped</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">{activeCount}</div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1">Legally compliant</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>In Pipeline</span>
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">{pendingCount}</div>
          <div className="text-[11px] text-blue-600 font-medium mt-1">Submitted / Scheduled</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Deficiency Notices</span>
            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">{deficientCount}</div>
          <div className="text-[11px] text-rose-600 font-medium mt-1">Requires repair action</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Expired / Lapsed</span>
            <span className="w-2 h-2 rounded-full bg-red-500"></span>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">{expiredCount}</div>
          <div className="text-[11px] text-red-600 font-medium mt-1">Renewal overdue</div>
        </div>
      </div>

      {/* Renewal Expiry Alerts Banner if any */}
      {renewalAlerts.length > 0 && (
        <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent p-4 rounded-2xl border border-amber-300/80 flex items-start gap-3 text-amber-900">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1 text-xs">
            <h4 className="font-bold text-sm text-amber-950">Statutory Re-Verification Reminders</h4>
            <p className="mt-0.5 text-slate-700">
              Under Rule 14, weighing instruments must be re-verified prior to the anniversary date.
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {renewalAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="bg-white px-3 py-1.5 rounded-lg border border-amber-200 shadow-2xs flex items-center gap-2 text-xs"
                >
                  <span className="font-semibold text-slate-800">{alert.instrumentName}</span>
                  <span className="text-[10px] text-slate-500">({alert.certificateNumber})</span>
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      alert.daysRemaining <= 0
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {alert.daysRemaining <= 0 ? 'Expired' : `${alert.daysRemaining} days left`}
                  </span>
                  <button
                    onClick={() => {
                      const target = instruments.find((i) => i.id === alert.instrumentId);
                      setSelectedInstForApp(target || null);
                      setIsSubmitOpen(true);
                    }}
                    className="ml-1 text-blue-600 hover:text-blue-800 font-bold hover:underline"
                  >
                    Re-verify →
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Table: Registered Instruments */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-base text-slate-900">Registered Weighing & Measuring Assets</h3>
            <p className="text-xs text-slate-500">Inventory of all instruments registered at your business premises</p>
          </div>
          <span className="text-xs font-semibold text-slate-500">{userInstruments.length} Instruments</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="px-6 py-3.5">Instrument / Category</th>
                <th className="px-6 py-3.5">Make & Serial No.</th>
                <th className="px-6 py-3.5">Capacity / Class</th>
                <th className="px-6 py-3.5">Stamping Status</th>
                <th className="px-6 py-3.5">Validity Expiry</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {userInstruments.map((inst) => {
                const cert = certificates.find((c) => c.instrumentId === inst.id);
                return (
                  <tr key={inst.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900">{inst.categoryName}</div>
                      <div className="text-[11px] text-slate-500 truncate max-w-xs">{inst.installationAddress}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-800">{inst.make} - {inst.model}</div>
                      <div className="text-[11px] font-mono text-slate-500">{inst.serialNumber}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900">{inst.maxCapacity}</div>
                      <div className="text-[11px] text-indigo-600 font-medium">Class: {inst.accuracyClass} (e={inst.verificationScaleInterval})</div>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={inst.status} size="sm" />
                    </td>
                    <td className="px-6 py-4">
                      {inst.expiryDate ? (
                        <div>
                          <div className="font-semibold text-slate-800">{inst.expiryDate}</div>
                          <div className="text-[10px] text-slate-500">
                            {inst.daysToExpiry !== undefined && inst.daysToExpiry > 0
                              ? `In ${inst.daysToExpiry} days`
                              : 'Expired'}
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {cert && (
                          <button
                            onClick={() => setViewingCertificate(cert)}
                            className="px-2.5 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 font-semibold rounded-lg flex items-center gap-1 transition-colors"
                            title="View / Download Certificate"
                          >
                            <FileBadge className="w-3.5 h-3.5 text-blue-600" />
                            <span>Certificate</span>
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setSelectedInstForApp(inst);
                            setIsSubmitOpen(true);
                          }}
                          className="px-2.5 py-1.5 bg-slate-100 text-slate-800 hover:bg-slate-200 font-semibold rounded-lg flex items-center gap-1 transition-colors"
                        >
                          <Send className="w-3 h-3 text-slate-600" />
                          <span>Apply</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: View Full Certificate */}
      {viewingCertificate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="max-w-4xl w-full">
            <OfficialCertificateView
              certificate={viewingCertificate}
              onClose={() => setViewingCertificate(null)}
            />
          </div>
        </div>
      )}

      {/* Modals */}
      <InstrumentRegisterModal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
      />

      <ApplicationSubmitModal
        isOpen={isSubmitOpen}
        onClose={() => {
          setIsSubmitOpen(false);
          setSelectedInstForApp(null);
        }}
        instrument={selectedInstForApp}
      />
    </div>
  );
}
