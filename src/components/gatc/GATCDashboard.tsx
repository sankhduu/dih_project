'use client';

import React, { useState } from 'react';
import { useMetrologyStore } from '@/lib/store';
import { Application, Certificate } from '@/types/metrology';
import { StatusBadge } from '@/components/common/StatusBadge';
import { FieldInspectionSheet } from '@/components/officer/FieldInspectionSheet';
import { OfficialCertificateView } from '@/components/certificates/OfficialCertificateView';
import {
  FlaskConical,
  CheckCircle2,
  FileBadge,
  Sparkles,
  Download,
} from 'lucide-react';

export function GATCDashboard() {
  const { currentUser, applications, certificates } = useMetrologyStore();
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [viewingCert, setViewingCert] = useState<Certificate | null>(null);

  // Task 1: Demo State Setup
  const [isDemoMode, setIsDemoMode] = useState<boolean>(true);
  const [isRameshCertified, setIsRameshCertified] = useState<boolean>(false);
  const [approvingStepText, setApprovingStepText] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const rameshDemoApp: Application = {
    id: 'demo-app-ramesh-0042',
    applicationNumber: 'HR-LMO-2026-0042',
    applicantId: 'trader-ramesh-0042',
    applicant: {
      id: 'trader-ramesh-0042',
      email: 'ramesh.kumar@trader.in',
      fullName: 'Ramesh Kumar',
      mobile: '+91 98123 45678',
      role: 'APPLICANT',
      businessName: 'Ramesh Kumar General Store',
      businessType: 'RETAIL',
      address: 'Shop No. 14, Main Market, Hansi Road, Hisar - 125001',
      district: 'Hisar',
      state: 'Haryana',
      pinCode: '125001',
    },
    instrumentId: 'inst-ramesh-0042',
    instrument: {
      id: 'inst-ramesh-0042',
      ownerId: 'trader-ramesh-0042',
      ownerName: 'Ramesh Kumar',
      businessName: 'Ramesh Kumar General Store',
      category: 'ELECTRONIC_COUNTER_SCALE',
      categoryName: 'Electronic Counter Scale (Class III)',
      accuracyClass: 'CLASS_III',
      make: 'Essae Teraoka',
      model: 'DS-215',
      serialNumber: 'ES-2026-0042',
      maxCapacity: '30 kg',
      minCapacity: '100 g',
      verificationScaleInterval: '2 g',
      installationAddress: 'Shop No. 14, Main Market, Hansi Road, Hisar - 125001',
      district: 'Hisar',
      state: 'Haryana',
      pinCode: '125001',
      status: isRameshCertified ? 'ACTIVE_VERIFIED' : 'PENDING_VERIFICATION',
      createdAt: new Date().toISOString(),
    },
    applicationType: 'PERIODIC_REVERIFICATION',
    jurisdictionId: 'JUR-HISAR',
    status: isRameshCertified ? 'APPROVED' : 'SUBMITTED',
    assignedOfficerRole: 'GATC',
    assignedOfficerId: currentUser.id || 'GATC-CENTRAL-01',
    submittedAt: new Date().toISOString(),
  };

  const baseApps = applications.filter(
    (a) => a.assignedOfficerId === currentUser.id || a.assignedOfficerRole === 'GATC'
  );

  const gatcApps = isDemoMode
    ? [rameshDemoApp, ...baseApps.filter((a) => !a.applicationNumber.includes('0042'))]
    : baseApps;

  // Task 2: Golden Path Fake Approval & Certificate Generation
  const handleFakeApprove = async () => {
    setApprovingStepText('Verifying LMO Signature...');
    await new Promise((r) => setTimeout(r, 1000));
    setApprovingStepText('Generating Schedule IX & QR...');
    await new Promise((r) => setTimeout(r, 1000));
    setApprovingStepText('Appending SHA-256 Hash...');
    await new Promise((r) => setTimeout(r, 1000));
    setApprovingStepText(null);
    setToastMessage('Certificate Officially Issued');
    setTimeout(() => setToastMessage(null), 5000);
    setIsRameshCertified(true);
  };

  return (
    <div className="space-y-8 relative">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="p-4 rounded-2xl bg-emerald-600 text-white shadow-xl flex items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4">
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-amber-300" />
            <span className="font-bold text-sm">{toastMessage}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="px-2.5 py-1 bg-white/20 rounded-lg text-xs font-bold hover:bg-white/30"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* GATC Centre Profile Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold text-xl shadow-xs">
            <FlaskConical className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                {currentUser.businessName || currentUser.fullName}
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-xs font-bold border border-amber-300">
                Government Approved Test Centre (GATC)
              </span>
              {isDemoMode && (
                <span className="px-2 py-0.5 rounded-full bg-amber-400 text-[#002B49] text-[10px] font-black">
                  DEMO MODE
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-2">
              <span>Accreditation No: <strong className="text-slate-800 font-mono">{currentUser.gatcAccreditationNumber || 'DoCA/GATC/2024/042'}</strong></span>
              <span>•</span>
              <span className="text-emerald-700 font-semibold">Empanelled until: {currentUser.gatcValidUntil || '2028-03-31'}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsDemoMode(!isDemoMode)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              isDemoMode ? 'bg-amber-400 text-[#002B49] shadow-xs' : 'bg-slate-100 text-slate-600'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isDemoMode ? 'Demo Mode: ON' : 'Live Mode'}</span>
          </button>
          <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-xl border border-emerald-200 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" />
            NABL ISO/IEC 17025 Compliant
          </span>
        </div>
      </div>

      {/* Laboratory Queue */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-base text-slate-900">
              {isRameshCertified ? 'Issued Certificates & Calibration Directory' : 'Pending Laboratory Calibration & Testing Queue'}
            </h3>
            <p className="text-xs text-slate-500">Precision analytical balances (Class I & II) & Heavy instrument testing requests</p>
          </div>
          <span className="text-xs font-semibold text-slate-500">{gatcApps.length} Applications</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="px-6 py-3.5">Application No.</th>
                <th className="px-6 py-3.5">Client Enterprise</th>
                <th className="px-6 py-3.5">Precision Instrument</th>
                <th className="px-6 py-3.5">Class / Tolerance</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {gatcApps.map((app) => {
                const isRamesh = app.applicationNumber.includes('0042') || app.applicant.fullName.toLowerCase().includes('ramesh');
                return (
                  <tr key={app.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-slate-900">{app.applicationNumber}</td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900">{app.applicant.businessName || app.applicant.fullName}</div>
                      <div className="text-[11px] text-slate-500">{app.applicant.address}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900">{app.instrument.categoryName}</div>
                      <div className="text-[11px] text-slate-500">Make: {app.instrument.make} • SN: {app.instrument.serialNumber}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-indigo-700">{app.instrument.accuracyClass}</span>
                      <div className="text-[10px] text-slate-500">e = {app.instrument.verificationScaleInterval}</div>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={app.status} size="sm" />
                    </td>
                    <td className="px-6 py-4 text-right">
                      {isDemoMode && isRamesh ? (
                        isRameshCertified ? (
                          <button
                            onClick={() => {
                              setToastMessage('📥 Schedule IX Certificate (HR-LMO-2026-0042.pdf) Downloaded');
                              setTimeout(() => setToastMessage(null), 4000);
                            }}
                            className="px-3 py-1.5 bg-[#002B49] text-white font-bold rounded-lg transition-colors flex items-center gap-1.5 ml-auto text-xs"
                            title="Fake Download PDF"
                          >
                            <Download className="w-3.5 h-3.5 text-amber-400" />
                            <span>Download PDF</span>
                          </button>
                        ) : (
                          <button
                            onClick={handleFakeApprove}
                            disabled={approvingStepText !== null}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-colors flex items-center gap-1.5 ml-auto shadow-xs text-xs disabled:opacity-75"
                          >
                            {approvingStepText ? (
                              <>
                                <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-spin" />
                                <span>{approvingStepText}</span>
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="w-3.5 h-3.5 text-amber-300" />
                                <span>Approve / Issue Certificate</span>
                              </>
                            )}
                          </button>
                        )
                      ) : app.status === 'APPROVED' ? (
                        <button
                          onClick={() => {
                            const cert = certificates.find((c) => c.applicationId === app.id);
                            if (cert) setViewingCert(cert);
                          }}
                          className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold rounded-lg transition-colors flex items-center gap-1 ml-auto"
                        >
                          <FileBadge className="w-3.5 h-3.5" />
                          <span>View Certificate</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => setSelectedApp(app)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-colors flex items-center gap-1 ml-auto shadow-xs"
                        >
                          <CheckCircle2 className="w-3 h-3 text-amber-300" />
                          <span>Approve / Issue Certificate</span>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Task 3: Secret Reset for Next Judge (Bottom Right of screen/component) */}
      <div
        onClick={() => {
          setIsRameshCertified(false);
          setToastMessage('✨ Demo Queue Reset (Ramesh Kumar restored to Pending)');
          setTimeout(() => setToastMessage(null), 3000);
        }}
        className="fixed bottom-1 right-1 w-8 h-8 opacity-0 hover:opacity-10 cursor-default z-50 text-[8px] text-slate-700 select-none flex items-center justify-center"
        title="Secret Demo Reset"
      >
        •
      </div>

      {/* Field / Lab Inspection Modal */}
      {selectedApp && (
        <FieldInspectionSheet
          application={selectedApp}
          onClose={() => setSelectedApp(null)}
          onSuccess={() => setSelectedApp(null)}
        />
      )}

      {/* Certificate Modal */}
      {viewingCert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="max-w-4xl w-full">
            <OfficialCertificateView certificate={viewingCert} onClose={() => setViewingCert(null)} />
          </div>
        </div>
      )}
    </div>
  );
}
