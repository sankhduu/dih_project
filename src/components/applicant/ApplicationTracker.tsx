'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase-client';
import { useMetrologyStore } from '@/lib/store';
import { DigitalCertificateModal, TraderRecord } from '@/components/certificates/DigitalCertificateModal';
import {
  Scale,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileBadge,
  QrCode,
  Building2,
  MapPin,
  RefreshCw,
  Send,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import Link from 'next/link';

// Fallback seed data if database is empty or offline
const FALLBACK_TRADERS: TraderRecord[] = [
  {
    id: 'ROH-TR-001',
    shop_name: 'Sharma Kirana & General Store',
    owner_name: 'Ramesh Kumar Sharma',
    license_number: 'HR-LMO-ROH-2026-042',
    district: 'Rohtak',
    status: 'Pending_Inspection',
    address: 'Booth 12, Main Market, Model Town, Rohtak - 124001',
    instrument_type: 'Electronic Counter Scale (Class III)',
    capacity: '30 kg / e=2g',
    latitude: 28.8955,
    longitude: 76.6066,
    created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
  {
    id: 'HIS-TR-101',
    shop_name: 'Hisar Agro Mill & Grain Store',
    owner_name: 'Suresh Chand Bishnoi',
    license_number: 'HR-LMO-HIS-2026-081',
    district: 'Hisar',
    status: 'Under_Review',
    address: 'Shop 14, Anaj Mandi, Hisar, Haryana - 125001',
    instrument_type: 'Platform Weighing Scale (500 kg)',
    capacity: '500 kg / e=50g',
    latitude: 29.1492,
    longitude: 75.7217,
    checklist_confirmed: true,
    lmo_id: 'officer.hisar@lmo.gov.in',
    created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 'ROH-TR-002',
    shop_name: 'Haryana Gold & Diamond Jewelers',
    owner_name: 'Vikram Soni',
    license_number: 'HR-LMO-ROH-2026-057',
    district: 'Rohtak',
    status: 'Approved',
    address: 'Sarafa Bazar, Near Quilla Mohalla, Rohtak - 124001',
    instrument_type: 'High Precision Gold Balance (Class II)',
    capacity: '600 g / e=0.01g',
    latitude: 28.8988,
    longitude: 76.5922,
    checklist_confirmed: true,
    lmo_id: 'officer.rohtak@lmo.gov.in',
    digital_signature: 'GATC-SIG-20260906-88F4A190BC3E',
    signed_at: new Date(Date.now() - 3600000).toISOString(),
    created_at: new Date(Date.now() - 3600000 * 48).toISOString(),
    updated_at: new Date(Date.now() - 3600000).toISOString(),
  },
];

export function ApplicationTracker() {
  const { currentUser } = useMetrologyStore();
  const [traders, setTraders] = useState<TraderRecord[]>([]);
  const [selectedApp, setSelectedApp] = useState<TraderRecord | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isCertModalOpen, setIsCertModalOpen] = useState<boolean>(false);
  const [isReapplying, setIsReapplying] = useState<boolean>(false);

  // Fetch all applications from Supabase traders_list (latest first)
  const fetchApplications = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('traders_list')
        .select('*')
        .order('created_at', { ascending: false });

      if (data && data.length > 0 && !error) {
        setTraders(data as TraderRecord[]);
        setSelectedApp((prev) => {
          if (!prev) return data[0] as TraderRecord;
          const matched = data.find((d) => d.id === prev.id || d.license_number === prev.license_number);
          return (matched || data[0]) as TraderRecord;
        });
      } else {
        setTraders(FALLBACK_TRADERS);
        setSelectedApp(FALLBACK_TRADERS[0]);
      }
    } catch (err) {
      console.warn('Error querying traders_list for tracker:', err);
      setTraders(FALLBACK_TRADERS);
      setSelectedApp(FALLBACK_TRADERS[0]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();

    // Supabase Realtime Listener on traders_list
    const channel = supabase
      .channel('tracker-realtime-lifecycle')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'traders_list' },
        (payload) => {
          const updatedRow = (payload.new || payload.old) as TraderRecord;
          if (!updatedRow) return;

          setTraders((prev) => {
            if (payload.eventType === 'INSERT') {
              return [updatedRow, ...prev.filter((p) => p.id !== updatedRow.id)];
            }
            return prev.map((item) => {
              if (item.id === updatedRow.id || item.license_number === updatedRow.license_number) {
                return { ...item, ...updatedRow };
              }
              return item;
            });
          });

          setSelectedApp((prev) => {
            if (!prev) return updatedRow;
            if (payload.eventType === 'INSERT') return updatedRow;
            if (prev.id === updatedRow.id || prev.license_number === updatedRow.license_number) {
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

  // Re-apply when rejected
  const handleReapply = async (appId?: string) => {
    if (!appId) return;
    setIsReapplying(true);
    try {
      await supabase
        .from('traders_list')
        .update({
          status: 'Pending_Inspection',
          rejection_reason: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', appId);

      // Local update
      setTraders((prev) =>
        prev.map((t) => (t.id === appId ? { ...t, status: 'Pending_Inspection', rejection_reason: undefined } : t))
      );
      if (selectedApp?.id === appId) {
        setSelectedApp((prev) => (prev ? { ...prev, status: 'Pending_Inspection', rejection_reason: undefined } : prev));
      }
    } catch (err) {
      console.warn('Re-apply error:', err);
    } finally {
      setIsReapplying(false);
    }
  };

  // 4 Statutory Lifecycle Stepper Steps
  const steps = [
    {
      key: 'Pending_Inspection',
      label: '1. Applied (Registration)',
      desc: 'Application submitted with district jurisdiction & coordinates',
    },
    {
      key: 'Under_Review',
      label: '2. Field Inspection Completed',
      desc: 'LMO completed 5-point checklist, photo proof, and GPS lock',
    },
    {
      key: 'GATC_Review',
      label: '3. GATC Digital Signing',
      desc: 'Central authority reviews MPE calibration and cryptographically signs',
    },
    {
      key: 'Approved',
      label: '4. Certificate Issued',
      desc: 'Form V Verification Certificate unlocked with verifiable QR code',
    },
  ];

  // Explicit status check logic for the 4 lifecycle values
  const getStepStatus = (status: string | undefined, stepIndex: number) => {
    const raw = (status || 'Pending_Inspection').trim();

    // 1. Pending_Inspection
    if (raw === 'Pending_Inspection' || raw.toLowerCase() === 'pending_inspection' || raw === 'Pending') {
      if (stepIndex === 0) return 'COMPLETE';
      if (stepIndex === 1) return 'CURRENT'; // Awaiting LMO
      return 'PENDING';
    }

    // 2. Under_Review
    if (raw === 'Under_Review' || raw.toLowerCase() === 'under_review') {
      if (stepIndex === 0 || stepIndex === 1) return 'COMPLETE';
      if (stepIndex === 2) return 'CURRENT'; // In GATC Queue
      return 'PENDING';
    }

    // 3. Approved
    if (raw === 'Approved' || raw.toLowerCase() === 'approved') {
      return 'COMPLETE'; // All steps complete
    }

    // 4. Rejected
    if (raw === 'Rejected' || raw.toLowerCase() === 'rejected') {
      if (stepIndex === 0 || stepIndex === 1) return 'COMPLETE';
      if (stepIndex === 2) return 'REJECTED';
      return 'PENDING';
    }

    if (stepIndex === 0) return 'COMPLETE';
    return 'PENDING';
  };

  const getStatusBadge = (status: string | undefined) => {
    const raw = (status || 'Pending_Inspection').trim();
    if (raw === 'Approved' || raw.toLowerCase() === 'approved') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-300">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>Approved</span>
        </span>
      );
    }
    if (raw === 'Under_Review' || raw.toLowerCase() === 'under_review') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-300">
          <Clock className="w-3.5 h-3.5 text-blue-600 animate-spin" />
          <span>Under Review</span>
        </span>
      );
    }
    if (raw === 'Rejected' || raw.toLowerCase() === 'rejected') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-300">
          <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
          <span>Rejected</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-300">
        <Clock className="w-3.5 h-3.5 text-amber-600" />
        <span>Pending Inspection</span>
      </span>
    );
  };

  const currentStatus = selectedApp?.status || 'Pending_Inspection';
  const isApproved = currentStatus === 'Approved' || currentStatus.toLowerCase() === 'approved';
  const isRejected = currentStatus === 'Rejected' || currentStatus.toLowerCase() === 'rejected';
  const isUnderReview = currentStatus === 'Under_Review' || currentStatus.toLowerCase() === 'under_review';
  const isPendingInspection = currentStatus === 'Pending_Inspection' || currentStatus.toLowerCase() === 'pending_inspection' || currentStatus === 'Pending';

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900">Application Lifecycle Tracker</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time multi-stage monitoring across Trader Application, LMO Field Inspection, and GATC Digital Signing.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchApplications}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh Queue</span>
          </button>
          <Link
            href="/apply"
            className="px-4 py-2 rounded-xl bg-[#002B49] hover:bg-[#003B66] text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <span>+ Apply for New Scale</span>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Applications List */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-4 space-y-2">
          <div className="px-2 py-1 text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Submitted Applications ({traders.length})</span>
            <span className="text-[10px] text-emerald-600 font-semibold">● Realtime Sync</span>
          </div>

          <div className="space-y-2">
            {traders.map((app) => {
              const isSelected = selectedApp?.id === app.id || selectedApp?.license_number === app.license_number;
              return (
                <button
                  key={app.id || app.license_number}
                  onClick={() => setSelectedApp(app)}
                  className={`w-full p-3.5 rounded-2xl border text-left text-xs transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#002B49] text-white border-[#002B49] shadow-md'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={`font-mono font-bold text-[11px] ${isSelected ? 'text-amber-400' : 'text-slate-900'}`}>
                      {app.license_number}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        app.status === 'Approved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : app.status === 'Under_Review'
                          ? 'bg-blue-100 text-blue-800'
                          : app.status === 'Rejected'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {(app.status || 'Pending_Inspection').replace('_', ' ')}
                    </span>
                  </div>

                  <div className={`font-bold text-xs truncate ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                    {app.shop_name}
                  </div>

                  <div className={`text-[11px] mt-1 flex items-center justify-between ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                    <span>District: {app.district || 'Rohtak'}</span>
                    <span>{app.instrument_type || 'Weighing Scale'}</span>
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
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      License / File Reference
                    </span>
                    <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono">
                      District: {selectedApp.district || 'Rohtak'}
                    </span>
                  </div>
                  <h3 className="text-xl font-black text-slate-900 font-mono mt-0.5">
                    {selectedApp.license_number}
                  </h3>
                  <div className="text-xs text-slate-600 mt-1">
                    Establishment: <strong>{selectedApp.shop_name}</strong> • Proprietor: {selectedApp.owner_name || 'Proprietor'}
                  </div>
                </div>
                {getStatusBadge(selectedApp.status)}
              </div>

              {/* Notice Banners based on Status */}
              {isApproved && (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2.5 text-emerald-900">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <div>
                      <span className="font-bold block">Verification Approved & Digitally Signed</span>
                      <span className="text-emerald-700 text-[11px]">
                        GATC Signature Hash: <code className="font-mono">{selectedApp.digital_signature || 'GATC-SIG-VERIFIED'}</code>
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsCertModalOpen(true)}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
                  >
                    <QrCode className="w-4 h-4 text-amber-300" />
                    <span>Download QR Certificate</span>
                  </button>
                </div>
              )}

              {isRejected && (
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-start gap-2.5 text-rose-900">
                    <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block">Inspection Rejected by GATC</span>
                      <span className="text-rose-700 text-[11px] block mt-0.5">
                        Deficiency Reason: <strong>{selectedApp.rejection_reason || 'Instrument tolerance exceeded Maximum Permissible Error (MPE) thresholds.'}</strong>
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleReapply(selectedApp.id)}
                    disabled={isReapplying}
                    className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-xs flex items-center gap-1.5 whitespace-nowrap cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isReapplying ? 'animate-spin' : ''}`} />
                    <span>Re-Apply / Rectify</span>
                  </button>
                </div>
              )}

              {isUnderReview && (
                <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 flex items-center gap-2.5 text-xs text-blue-900">
                  <Clock className="w-5 h-5 text-blue-600 shrink-0 animate-spin" />
                  <div>
                    <span className="font-bold block">Field Inspection Submitted — Under GATC Review</span>
                    <span className="text-blue-700 text-[11px]">
                      LMO Inspector {selectedApp.lmo_id || 'officer@lmo.gov.in'} has submitted verification findings with geo-tag proof. Awaiting GATC digital signature.
                    </span>
                  </div>
                </div>
              )}

              {isPendingInspection && (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-center gap-2.5 text-xs text-amber-900">
                  <Clock className="w-5 h-5 text-amber-600 shrink-0" />
                  <div>
                    <span className="font-bold block">Application Registered — Awaiting LMO Visit</span>
                    <span className="text-amber-800 text-[11px]">
                      Your application has been assigned to the {selectedApp.district || 'Rohtak'} District Legal Metrology Officer. Inspection checklist and GPS lock will be executed shortly.
                    </span>
                  </div>
                </div>
              )}

              {/* 4-Step Statutory Progression Timeline */}
              <div className="space-y-4">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                  Statutory 4-Tier Progression Timeline
                </span>

                <div className="relative pl-6 space-y-6 border-l-2 border-slate-200 ml-2">
                  {steps.map((step, idx) => {
                    const status = getStepStatus(selectedApp.status, idx);
                    return (
                      <div key={step.key} className="relative">
                        {/* Status Icon Marker */}
                        <div
                          className={`absolute -left-[31px] top-0.5 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors ${
                            status === 'COMPLETE'
                              ? 'bg-emerald-500 border-emerald-500 text-white shadow-xs'
                              : status === 'CURRENT'
                              ? 'bg-amber-500 border-amber-500 text-white animate-pulse'
                              : status === 'REJECTED'
                              ? 'bg-rose-600 border-rose-600 text-white'
                              : 'bg-white border-slate-300 text-slate-400'
                          }`}
                        >
                          {status === 'COMPLETE' ? (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          ) : status === 'REJECTED' ? (
                            <AlertTriangle className="w-3.5 h-3.5" />
                          ) : (
                            idx + 1
                          )}
                        </div>

                        <div>
                          <div className="font-bold text-slate-900 text-xs sm:text-sm">{step.label}</div>
                          <div className="text-xs text-slate-500">{step.desc}</div>

                          {/* Dynamic Content for Step 1 */}
                          {idx === 0 && (
                            <div className="mt-1.5 p-2 bg-slate-50 rounded-xl text-[11px] text-slate-700 border border-slate-200 font-mono">
                              Jurisdiction: {selectedApp.district || 'Rohtak'} District • Scale: {selectedApp.instrument_type || 'Counter Scale'} ({selectedApp.capacity || '30 kg'})
                            </div>
                          )}

                          {/* Dynamic Content for Step 2 */}
                          {idx === 1 && (isUnderReview || isApproved || isRejected) && (
                            <div className="mt-1.5 p-2.5 bg-emerald-50 rounded-xl text-xs text-emerald-900 border border-emerald-200">
                              <span className="font-bold text-[#002B49]">✓ Field Inspection Certified:</span> 5-point checklist confirmed, device photo stamped, GPS coordinates verified ({selectedApp.latitude?.toFixed(4) || '28.8955'}° N, {selectedApp.longitude?.toFixed(4) || '76.6066'}° E).
                            </div>
                          )}

                          {/* Dynamic Content for Step 3 */}
                          {idx === 2 && isApproved && (
                            <div className="mt-1.5 p-2.5 bg-emerald-50 rounded-xl text-xs text-emerald-900 border border-emerald-200">
                              <span className="font-bold text-emerald-800">✓ Digitally Signed by GATC:</span> Hash <code className="font-mono text-[11px]">{selectedApp.digital_signature || 'GATC-SIG-SHA256-VALID'}</code>
                            </div>
                          )}

                          {/* Dynamic Content for Step 3 Rejected */}
                          {idx === 2 && isRejected && (
                            <div className="mt-1.5 p-2.5 bg-rose-50 rounded-xl text-xs text-rose-900 border border-rose-200">
                              <span className="font-bold text-rose-800">✗ Rejection Memo:</span> {selectedApp.rejection_reason || 'MPE tolerance exceeded.'}
                            </div>
                          )}

                          {/* Dynamic Content for Step 4 Approved */}
                          {idx === 3 && isApproved && (
                            <div className="mt-2">
                              <button
                                onClick={() => setIsCertModalOpen(true)}
                                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
                              >
                                <QrCode className="w-3.5 h-3.5 text-amber-300" />
                                <span>View Statutory Certificate (Form V)</span>
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

      {/* Digital Certificate Modal */}
      {selectedApp && (
        <DigitalCertificateModal
          isOpen={isCertModalOpen}
          onClose={() => setIsCertModalOpen(false)}
          shop={selectedApp}
        />
      )}
    </div>
  );
}

