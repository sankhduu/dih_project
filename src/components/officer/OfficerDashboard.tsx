'use client';

import React, { useState } from 'react';
import { useMetrologyStore } from '@/lib/store';
import { Application, Certificate } from '@/types/metrology';
import { StatusBadge } from '@/components/common/StatusBadge';
import { FieldInspectionSheet } from './FieldInspectionSheet';
import { OfficialCertificateView } from '@/components/certificates/OfficialCertificateView';
import {
  ShieldCheck,
  Calendar,
  MapPin,
  Scale,
  FileBadge,
  Play,
  RefreshCw,
  Wifi,
  WifiOff,
} from 'lucide-react';

export function OfficerDashboard() {
  const {
    currentUser,
    applications,
    certificates,
    deficiencyMemos,
    scheduleInspection,
    isOfflineMode,
    setIsOfflineMode,
    offlineDrafts,
    syncOfflineDrafts,
  } = useMetrologyStore();

  const [activeSubTab, setActiveSubTab] = useState<'queue' | 'scheduled' | 'issued'>('queue');
  const [selectedAppForInspection, setSelectedAppForInspection] = useState<Application | null>(null);
  const [schedulingApp, setSchedulingApp] = useState<Application | null>(null);
  const [scheduleDate, setScheduleDate] = useState(new Date().toISOString().split('T')[0]);
  const [scheduleSlot, setScheduleSlot] = useState('11:00 AM - 01:00 PM');
  const [viewingCert, setViewingCert] = useState<Certificate | null>(null);

  // Filter assigned applications
  const officerApps = applications.filter(
    (a) => a.assignedOfficerId === currentUser.id || currentUser.role === 'ADMIN'
  );

  const pendingQueue = officerApps.filter(
    (a) => a.status === 'SUBMITTED' || a.status === 'ASSIGNED' || a.status === 'RECTIFIED'
  );
  const scheduledQueue = officerApps.filter((a) => a.status === 'SCHEDULED');
  const completedCerts = certificates.filter(
    (c) => c.issuedByOfficerId === currentUser.id || currentUser.role === 'ADMIN'
  );
  const officerMemos = deficiencyMemos.filter(
    (m) => m.officerId === currentUser.id || currentUser.role === 'ADMIN'
  );

  const handleScheduleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!schedulingApp) return;
    scheduleInspection(schedulingApp.id, scheduleDate, scheduleSlot);
    setSchedulingApp(null);
  };

  return (
    <div className="space-y-8">
      {/* Officer Jurisdiction Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#002B49] text-white flex items-center justify-center font-bold text-xl shadow-xs">
            <ShieldCheck className="w-8 h-8 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                {currentUser.fullName}
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold border border-indigo-200">
                {currentUser.designation || 'Legal Metrology Officer'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-2">
              <span>Jurisdiction: <strong className="text-slate-700">{currentUser.district} (Zone 4)</strong></span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3 text-slate-400" />
                PIN Codes: 110016, 110017, 110019, 110020
              </span>
            </p>
          </div>
        </div>

        {/* Offline Toggle & Sync for field officers */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsOfflineMode(!isOfflineMode)}
            className={`px-3 py-2 text-xs font-semibold rounded-xl border flex items-center gap-2 transition-all ${
              isOfflineMode
                ? 'bg-amber-100 text-amber-900 border-amber-300'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            {isOfflineMode ? (
              <WifiOff className="w-4 h-4 text-amber-700" />
            ) : (
              <Wifi className="w-4 h-4 text-emerald-600" />
            )}
            <span>{isOfflineMode ? 'Offline Mode Active' : 'Online Sync Ready'}</span>
          </button>

          {offlineDrafts.length > 0 && (
            <button
              onClick={syncOfflineDrafts}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 animate-pulse"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Sync Drafts ({offlineDrafts.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Pending Inspection</span>
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">{pendingQueue.length}</div>
          <div className="text-[11px] text-blue-600 font-medium mt-1">Ready for scheduling</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Scheduled Field Visits</span>
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">{scheduledQueue.length}</div>
          <div className="text-[11px] text-amber-600 font-medium mt-1">On-site inspections</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Certificates Issued</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">{completedCerts.length}</div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1">Stamped & verified</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Deficiency Memos</span>
            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">{officerMemos.length}</div>
          <div className="text-[11px] text-rose-600 font-medium mt-1">Pending cure deadline</div>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveSubTab('queue')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
            activeSubTab === 'queue'
              ? 'bg-[#002B49] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Inspection Queue ({pendingQueue.length})
        </button>
        <button
          onClick={() => setActiveSubTab('scheduled')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
            activeSubTab === 'scheduled'
              ? 'bg-[#002B49] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Scheduled Visits ({scheduledQueue.length})
        </button>
        <button
          onClick={() => setActiveSubTab('issued')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
            activeSubTab === 'issued'
              ? 'bg-[#002B49] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Issued Certificates ({completedCerts.length})
        </button>
      </div>

      {/* Queue Table */}
      {activeSubTab === 'queue' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-base text-slate-900">Assigned Verification Applications</h3>
              <p className="text-xs text-slate-500">Auto-routed by PIN code to South Delhi legal metrology jurisdiction</p>
            </div>
            <span className="text-xs font-semibold text-slate-500">{pendingQueue.length} pending</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3.5">Application No.</th>
                  <th className="px-6 py-3.5">Applicant / Trader</th>
                  <th className="px-6 py-3.5">Instrument & Class</th>
                  <th className="px-6 py-3.5">Premises Location</th>
                  <th className="px-6 py-3.5">Type & Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pendingQueue.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-slate-900">
                      {app.applicationNumber}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900">{app.applicant.businessName || app.applicant.fullName}</div>
                      <div className="text-[11px] text-slate-500">{app.applicant.fullName} • {app.applicant.mobile}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900">{app.instrument.categoryName}</div>
                      <div className="text-[11px] text-indigo-600 font-medium">
                        {app.instrument.make} (SN: {app.instrument.serialNumber}) • Class {app.instrument.accuracyClass}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-slate-800 font-medium text-[11px] max-w-xs truncate">
                        {app.instrument.installationAddress}
                      </div>
                      <div className="text-[10px] text-slate-500">PIN: {app.instrument.pinCode}</div>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={app.status} size="sm" />
                      <div className="text-[10px] text-slate-400 mt-1">{app.applicationType.replace(/_/g, ' ')}</div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSchedulingApp(app)}
                          className="px-2.5 py-1.5 bg-amber-50 text-amber-800 hover:bg-amber-100 font-semibold rounded-lg flex items-center gap-1 transition-colors"
                        >
                          <Calendar className="w-3.5 h-3.5 text-amber-600" />
                          <span>Schedule</span>
                        </button>
                        <button
                          onClick={() => setSelectedAppForInspection(app)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg flex items-center gap-1.5 shadow-xs transition-colors"
                        >
                          <Play className="w-3 h-3" />
                          <span>Inspect Now</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Scheduled Tab */}
      {activeSubTab === 'scheduled' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-base text-slate-900">Scheduled On-Site Inspection Visits</h3>
              <p className="text-xs text-slate-500">Field itinerary booked with instrument traders</p>
            </div>
            <span className="text-xs font-semibold text-slate-500">{scheduledQueue.length} visits</span>
          </div>

          <div className="divide-y divide-slate-100">
            {scheduledQueue.map((app) => (
              <div key={app.id} className="p-6 hover:bg-slate-50 flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-900">{app.applicationNumber}</span>
                    <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                      📅 {app.scheduledDate} ({app.scheduledTimeSlot})
                    </span>
                  </div>
                  <div className="font-bold text-sm text-slate-900">{app.applicant.businessName || app.applicant.fullName}</div>
                  <div className="text-xs text-slate-600">
                    {app.instrument.categoryName} — {app.instrument.make} ({app.instrument.serialNumber})
                  </div>
                  <div className="text-xs text-slate-500 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    {app.instrument.installationAddress}, PIN: {app.instrument.pinCode}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setSelectedAppForInspection(app)}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2 transition-all cursor-pointer"
                  >
                    <Scale className="w-4 h-4 text-amber-300" />
                    <span>Open Field Observation Sheet</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Issued Certificates Tab */}
      {activeSubTab === 'issued' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-base text-slate-900">Digitally Verified & Stamped Certificates</h3>
              <p className="text-xs text-slate-500">Legal Metrology verification certificates issued with cryptographic QR code</p>
            </div>
            <span className="text-xs font-semibold text-slate-500">{completedCerts.length} certificates</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3.5">Certificate No.</th>
                  <th className="px-6 py-3.5">Owner / Business</th>
                  <th className="px-6 py-3.5">Instrument</th>
                  <th className="px-6 py-3.5">Lead Seal Serial No.</th>
                  <th className="px-6 py-3.5">Valid Until</th>
                  <th className="px-6 py-3.5 text-right">View / PDF</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {completedCerts.map((cert) => (
                  <tr key={cert.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-[#002B49]">
                      {cert.certificateNumber}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900">{cert.businessName}</div>
                      <div className="text-[11px] text-slate-500">{cert.ownerName}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900">{cert.instrument.categoryName}</div>
                      <div className="text-[11px] text-slate-500">SN: {cert.instrument.serialNumber}</div>
                    </td>
                    <td className="px-6 py-4 font-mono text-amber-900 font-bold">
                      {cert.physicalSealNumber}
                    </td>
                    <td className="px-6 py-4 font-semibold text-emerald-700">
                      {cert.validUntil}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setViewingCert(cert)}
                        className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold rounded-lg transition-colors flex items-center gap-1 ml-auto"
                      >
                        <FileBadge className="w-3.5 h-3.5" />
                        <span>View Certificate</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Field Inspection Modal */}
      {selectedAppForInspection && (
        <FieldInspectionSheet
          application={selectedAppForInspection}
          onClose={() => setSelectedAppForInspection(null)}
          onSuccess={() => {
            setSelectedAppForInspection(null);
            setActiveSubTab('issued');
          }}
        />
      )}

      {/* Schedule Visit Modal */}
      {schedulingApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900">Schedule On-Site Inspection</h3>
            <p className="text-xs text-slate-500 mt-1">
              Set visit date and time slot for {schedulingApp.instrument.categoryName}
            </p>

            <form onSubmit={handleScheduleSubmit} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Inspection Date</label>
                <input
                  type="date"
                  required
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Time Slot</label>
                <select
                  value={scheduleSlot}
                  onChange={(e) => setScheduleSlot(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                >
                  <option value="09:00 AM - 11:00 AM">09:00 AM - 11:00 AM (Morning Slot 1)</option>
                  <option value="11:00 AM - 01:00 PM">11:00 AM - 01:00 PM (Morning Slot 2)</option>
                  <option value="02:00 PM - 04:00 PM">02:00 PM - 04:00 PM (Afternoon Slot 1)</option>
                  <option value="04:00 PM - 06:00 PM">04:00 PM - 06:00 PM (Afternoon Slot 2)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setSchedulingApp(null)}
                  className="px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#002B49] text-white font-bold rounded-xl shadow-md"
                >
                  Confirm Slot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Certificate Modal */}
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
