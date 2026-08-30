'use client';

import React, { useState } from 'react';
import { useMetrologyStore } from '@/lib/store';
import { Application, Certificate, DeficiencyMemo } from '@/types/metrology';
import { StatusBadge } from '@/components/common/StatusBadge';
import { OfficialCertificateView } from '@/components/certificates/OfficialCertificateView';
import { OfficialDeficiencyMemoView } from '@/components/certificates/OfficialDeficiencyMemoView';
import {
  FileText,
  Clock,
  UserCheck,
  Calendar,
  CheckCircle2,
  AlertCircle,
  FileBadge,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';

export function ApplicationTracker() {
  const { currentUser, applications, certificates, deficiencyMemos } = useMetrologyStore();
  const userApplications = applications.filter((a) => a.applicantId === currentUser.id);

  const [selectedApp, setSelectedApp] = useState<Application | null>(userApplications[0] || null);
  const [viewingCert, setViewingCert] = useState<Certificate | null>(null);
  const [viewingMemo, setViewingMemo] = useState<DeficiencyMemo | null>(null);

  const steps = [
    { key: 'SUBMITTED', label: '1. Submitted Online', desc: 'Application filed and routed by PIN code' },
    { key: 'ASSIGNED', label: '2. Officer Assigned', desc: 'Assigned to jurisdictional LMO / GATC' },
    { key: 'SCHEDULED', label: '3. Inspection Scheduled', desc: 'Date & time slot allocated' },
    { key: 'INSPECTED', label: '4. Physical Inspection', desc: 'Standard weight calibration & tests' },
    { key: 'FINAL', label: '5. Outcome & Stamping', desc: 'Certificate or Deficiency Memo issued' },
  ];

  const getStepStatus = (app: Application, stepIndex: number) => {
    // 0: SUBMITTED, 1: ASSIGNED, 2: SCHEDULED, 3: INSPECTED, 4: FINAL
    if (stepIndex === 0) return 'COMPLETE';
    if (stepIndex === 1) return app.assignedOfficerId ? 'COMPLETE' : 'CURRENT';
    if (stepIndex === 2) {
      if (app.status === 'SCHEDULED' || app.status === 'APPROVED' || app.status === 'DEFICIENCY_ISSUED') return 'COMPLETE';
      return app.assignedOfficerId ? 'CURRENT' : 'PENDING';
    }
    if (stepIndex === 3) {
      if (app.status === 'APPROVED' || app.status === 'DEFICIENCY_ISSUED') return 'COMPLETE';
      if (app.status === 'SCHEDULED') return 'CURRENT';
      return 'PENDING';
    }
    if (stepIndex === 4) {
      if (app.status === 'APPROVED' || app.status === 'DEFICIENCY_ISSUED') return 'COMPLETE';
      return 'PENDING';
    }
    return 'PENDING';
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs">
        <h2 className="text-xl font-extrabold text-slate-900">Application Lifecycle Tracker</h2>
        <p className="text-xs text-slate-500">Track real-time progress and verification stages for all your submitted applications</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Applications List */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-4 space-y-2">
          <div className="px-2 py-1 text-xs font-bold text-slate-400 uppercase tracking-wider">
            Your Applications ({userApplications.length})
          </div>

          <div className="space-y-2">
            {userApplications.map((app) => {
              const isSelected = selectedApp?.id === app.id;
              return (
                <button
                  key={app.id}
                  onClick={() => setSelectedApp(app)}
                  className={`w-full p-3.5 rounded-2xl border text-left text-xs transition-all ${
                    isSelected
                      ? 'bg-[#002B49] text-white border-[#002B49] shadow-md'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`font-mono font-bold ${isSelected ? 'text-amber-400' : 'text-slate-900'}`}>
                      {app.applicationNumber}
                    </span>
                    <StatusBadge status={app.status} size="sm" />
                  </div>
                  <div className={`font-semibold ${isSelected ? 'text-white' : 'text-slate-800'}`}>
                    {app.instrument.categoryName}
                  </div>
                  <div className={`text-[11px] mt-1 ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                    {app.applicationType.replace(/_/g, ' ')} • {app.instrument.serialNumber}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Visual Stage Timeline & Details */}
        <div className="lg:col-span-2 space-y-6">
          {selectedApp ? (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 sm:p-8 space-y-6">
              {/* Header Info */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Application Reference
                  </span>
                  <h3 className="text-lg font-black text-slate-900 font-mono">
                    {selectedApp.applicationNumber}
                  </h3>
                  <div className="text-xs text-slate-600 mt-0.5">
                    Instrument: <strong>{selectedApp.instrument.categoryName}</strong> ({selectedApp.instrument.make} - {selectedApp.instrument.serialNumber})
                  </div>
                </div>
                <StatusBadge status={selectedApp.status} size="md" />
              </div>

              {/* Multi-Step Timeline */}
              <div className="space-y-4">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                  Workflow Execution Progression
                </span>
                <div className="relative pl-6 space-y-6 border-l-2 border-slate-200 ml-2">
                  {steps.map((step, idx) => {
                    const status = getStepStatus(selectedApp, idx);
                    return (
                      <div key={step.key} className="relative">
                        {/* Status Icon Marker */}
                        <div
                          className={`absolute -left-[31px] top-0.5 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors ${
                            status === 'COMPLETE'
                              ? 'bg-emerald-500 border-emerald-500 text-white shadow-xs'
                              : status === 'CURRENT'
                              ? 'bg-blue-600 border-blue-600 text-white animate-pulse'
                              : 'bg-white border-slate-300 text-slate-400'
                          }`}
                        >
                          {status === 'COMPLETE' ? <CheckCircle2 className="w-3.5 h-3.5" /> : idx + 1}
                        </div>

                        <div>
                          <div className="font-bold text-slate-900 text-xs sm:text-sm">{step.label}</div>
                          <div className="text-xs text-slate-500">{step.desc}</div>

                          {/* Dynamic Content for Steps */}
                          {idx === 1 && selectedApp.assignedOfficerName && (
                            <div className="mt-1.5 p-2.5 bg-slate-50 rounded-xl text-xs text-slate-700 border border-slate-200">
                              <span className="font-semibold text-[#002B49]">Assigned Inspector:</span>{' '}
                              {selectedApp.assignedOfficerName} ({selectedApp.assignedOfficerRole})
                            </div>
                          )}

                          {idx === 2 && selectedApp.scheduledDate && (
                            <div className="mt-1.5 p-2.5 bg-amber-50 rounded-xl text-xs text-amber-900 border border-amber-200 font-medium">
                              📅 Inspection Visit Scheduled for: <strong>{selectedApp.scheduledDate}</strong> ({selectedApp.scheduledTimeSlot || 'Morning Slot'})
                            </div>
                          )}

                          {idx === 4 && selectedApp.status === 'APPROVED' && (
                            <div className="mt-2 flex items-center gap-3">
                              <button
                                onClick={() => {
                                  const cert = certificates.find((c) => c.applicationId === selectedApp.id);
                                  if (cert) setViewingCert(cert);
                                }}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5"
                              >
                                <FileBadge className="w-4 h-4 text-amber-300" />
                                <span>View Issued Digital Certificate</span>
                              </button>
                            </div>
                          )}

                          {idx === 4 && selectedApp.status === 'DEFICIENCY_ISSUED' && (
                            <div className="mt-2 flex items-center gap-3">
                              <button
                                onClick={() => {
                                  const memo = deficiencyMemos.find((m) => m.applicationId === selectedApp.id);
                                  if (memo) setViewingMemo(memo);
                                }}
                                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5"
                              >
                                <AlertTriangle className="w-4 h-4 text-white" />
                                <span>View Deficiency Notice (Form VI)</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-12 text-center text-slate-400 border border-slate-200">
              Select an application from the left to view the status timeline.
            </div>
          )}
        </div>
      </div>

      {/* Modals for Certificate & Deficiency Memo */}
      {viewingCert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="max-w-4xl w-full">
            <OfficialCertificateView certificate={viewingCert} onClose={() => setViewingCert(null)} />
          </div>
        </div>
      )}

      {viewingMemo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="max-w-3xl w-full">
            <OfficialDeficiencyMemoView memo={viewingMemo} onClose={() => setViewingMemo(null)} />
          </div>
        </div>
      )}
    </div>
  );
}
