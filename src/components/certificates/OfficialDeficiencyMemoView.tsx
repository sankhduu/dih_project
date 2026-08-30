'use client';

import React, { useState } from 'react';
import { DeficiencyMemo } from '@/types/metrology';
import { exportDeficiencyMemoPDF } from '@/lib/pdf-generator';
import { useMetrologyStore } from '@/lib/store';
import {
  AlertTriangle,
  Download,
  Calendar,
  Wrench,
  CheckCircle,
  FileWarning,
  Send,
  Upload,
} from 'lucide-react';

interface OfficialDeficiencyMemoViewProps {
  memo: DeficiencyMemo;
  onClose?: () => void;
}

export function OfficialDeficiencyMemoView({ memo, onClose }: OfficialDeficiencyMemoViewProps) {
  const { resolveDeficiencyMemo, currentUser } = useMetrologyStore();
  const [rectificationNotes, setRectificationNotes] = useState('');
  const [submittedProof, setSubmittedProof] = useState(false);

  const handleResolve = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rectificationNotes.trim()) return;
    resolveDeficiencyMemo(
      memo.id,
      rectificationNotes,
      'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=300'
    );
    setSubmittedProof(true);
  };

  return (
    <div className="bg-white rounded-2xl border border-rose-200 shadow-xl overflow-hidden max-w-3xl mx-auto my-4">
      {/* Top Header Bar */}
      <div className="bg-rose-900 text-white px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileWarning className="w-5 h-5 text-rose-300" />
          <span className="font-bold text-sm">Notice of Deficiency & Non-Compliance (Form VI)</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportDeficiencyMemoPDF(memo)}
            className="px-3 py-1.5 bg-white text-rose-900 hover:bg-rose-50 font-bold text-xs rounded-lg flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            Download Notice PDF
          </button>
          {onClose && (
            <button onClick={onClose} className="text-xs text-rose-200 hover:text-white px-2 py-1">
              Close
            </button>
          )}
        </div>
      </div>

      <div className="p-6 sm:p-8 space-y-6">
        {/* Banner Alert */}
        <div className="flex items-start gap-3 p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 text-xs">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-sm">Statutory Rectification Notice Issued</h4>
            <p className="mt-0.5">
              The instrument failed verification parameters under the Legal Metrology Rules, 2011. You are granted{' '}
              <span className="font-bold text-rose-950">14 calendar days</span> (until {memo.cureDeadline}) to repair, recalibrate, and resubmit for re-verification stamping. Commercial use is prohibited until certified.
            </p>
          </div>
        </div>

        {/* Memo Particulars */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-3.5 bg-slate-50 rounded-lg text-xs">
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Memo Number</span>
            <span className="font-bold text-slate-900 font-mono">{memo.memoNumber}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Issued Date</span>
            <span className="font-medium text-slate-800">{memo.issuedDate}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Cure Deadline</span>
            <span className="font-bold text-rose-700">{memo.cureDeadline}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Status</span>
            <span
              className={`inline-flex px-2 py-0.5 rounded-md font-bold text-[11px] ${
                memo.status === 'RECTIFIED'
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-rose-100 text-rose-800'
              }`}
            >
              {memo.status === 'RECTIFIED' ? 'Proof Submitted' : 'Rectification Pending'}
            </span>
          </div>
        </div>

        {/* Deficiencies Checklist */}
        <div className="space-y-2">
          <h5 className="text-xs font-bold uppercase tracking-wider text-slate-800">
            Observed Infractions & Non-Compliance Grounds:
          </h5>
          <div className="space-y-2">
            {memo.reasons.map((r, i) => (
              <div
                key={i}
                className="flex items-start gap-2 text-xs text-slate-700 p-2.5 bg-slate-50 rounded-lg border border-slate-200"
              >
                <span className="w-5 h-5 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <span>{r}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Technical Observation Report */}
        <div className="text-xs space-y-1 bg-amber-50/60 p-3.5 rounded-lg border border-amber-200">
          <span className="font-bold text-amber-900 block uppercase text-[10px]">Inspector Technical Notes:</span>
          <p className="text-slate-800">{memo.observedDiscrepancy}</p>
        </div>

        {/* Rectification Submission Box for Applicant */}
        {currentUser.role === 'APPLICANT' && (
          <div className="border-t border-slate-200 pt-6">
            <h5 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-2 flex items-center gap-1.5">
              <Wrench className="w-4 h-4 text-blue-600" />
              <span>Submit Proof of Repair & Recalibration</span>
            </h5>

            {submittedProof || memo.status === 'RECTIFIED' ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-xs flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <span className="font-bold">Rectification proof submitted!</span>
                  <p className="text-[11px] text-emerald-700 mt-0.5">
                    Your assigned Legal Metrology Officer has been notified to conduct a re-inspection.
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleResolve} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Repair Details & Registered Metrology Repairer Name / License No.
                  </label>
                  <textarea
                    rows={3}
                    value={rectificationNotes}
                    onChange={(e) => setRectificationNotes(e.target.value)}
                    placeholder="E.g., Recalibrated by M/s National Scale Services (License DL/REP/2023/18). Load cell error adjusted and test weights verified within +/- 0.5g."
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                    required
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Upload className="w-4 h-4" />
                    <span>Repair Receipt & Calibration Sheet attached (simulated)</span>
                  </div>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 transition-colors shadow-xs"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Submit for Re-Verification
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
