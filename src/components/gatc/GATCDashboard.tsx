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
  Play,
  FileBadge,
} from 'lucide-react';

export function GATCDashboard() {
  const { currentUser, applications, certificates } = useMetrologyStore();
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [viewingCert, setViewingCert] = useState<Certificate | null>(null);

  const gatcApps = applications.filter(
    (a) => a.assignedOfficerId === currentUser.id || a.assignedOfficerRole === 'GATC'
  );

  return (
    <div className="space-y-8">
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
            </div>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-2">
              <span>Accreditation No: <strong className="text-slate-800 font-mono">{currentUser.gatcAccreditationNumber || 'DoCA/GATC/2024/042'}</strong></span>
              <span>•</span>
              <span className="text-emerald-700 font-semibold">Empanelled until: {currentUser.gatcValidUntil || '2028-03-31'}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
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
            <h3 className="font-extrabold text-base text-slate-900">Laboratory Calibration & Testing Queue</h3>
            <p className="text-xs text-slate-500">Precision analytical balances (Class I & II) & Heavy instrument testing requests</p>
          </div>
          <span className="text-xs font-semibold text-slate-500">{gatcApps.length} Test Batches</span>
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
              {gatcApps.map((app) => (
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
                    {app.status === 'APPROVED' ? (
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
                        <Play className="w-3 h-3" />
                        <span>Run Lab Calibration</span>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
