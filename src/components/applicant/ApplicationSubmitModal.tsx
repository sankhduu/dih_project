'use client';

import React, { useState } from 'react';
import { useMetrologyStore } from '@/lib/store';
import { ApplicationType, Instrument } from '@/types/metrology';
import { X, Send, ShieldCheck, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';

interface ApplicationSubmitModalProps {
  isOpen: boolean;
  onClose: () => void;
  instrument?: Instrument | null;
  onSuccess?: () => void;
}

export function ApplicationSubmitModal({
  isOpen,
  onClose,
  instrument,
  onSuccess,
}: ApplicationSubmitModalProps) {
  const { instruments, currentUser, submitApplication, jurisdictions } = useMetrologyStore();

  const userInstruments = instruments.filter((i) => i.ownerId === currentUser.id);
  const [selectedInstId, setSelectedInstId] = useState<string>(instrument?.id || userInstruments[0]?.id || '');
  const [applicationType, setApplicationType] = useState<ApplicationType>('PERIODIC_REVERIFICATION');
  const [remarks, setRemarks] = useState('');

  if (!isOpen) return null;

  const currentSelectedInst = instruments.find((i) => i.id === (instrument?.id || selectedInstId));
  const matchedJur = jurisdictions.find((j) => currentSelectedInst && j.pinCodes.includes(currentSelectedInst.pinCode)) || jurisdictions[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentSelectedInst) return;

    submitApplication({
      instrumentId: currentSelectedInst.id,
      applicationType,
      remarks,
    });

    onClose();
    if (onSuccess) onSuccess();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="bg-[#002B49] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-base">Submit Legal Metrology Verification Application</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-white/10">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 text-xs text-slate-800">
          {/* Instrument Selector if not preselected */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Target Instrument *</label>
            <select
              value={instrument?.id || selectedInstId}
              disabled={!!instrument}
              onChange={(e) => setSelectedInstId(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-blue-500"
            >
              {userInstruments.map((inst) => (
                <option key={inst.id} value={inst.id}>
                  {inst.categoryName} — {inst.make} ({inst.serialNumber}) [Status: {inst.status}]
                </option>
              ))}
            </select>
          </div>

          {/* Application Type */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Verification Category *</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'PERIODIC_REVERIFICATION', label: 'Periodic Re-Verification (Annual)' },
                { id: 'INITIAL_VERIFICATION', label: 'Initial Stamping (New Instrument)' },
                { id: 'VERIFICATION_AFTER_REPAIR', label: 'Stamping After Repair / MPE Fix' },
              ].map((type) => (
                <button
                  type="button"
                  key={type.id}
                  onClick={() => setApplicationType(type.id as ApplicationType)}
                  className={`p-2.5 rounded-xl border text-left font-medium transition-all ${
                    applicationType === type.id
                      ? 'bg-blue-50 border-blue-500 text-blue-900 font-bold ring-1 ring-blue-500'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          {/* Automated Jurisdiction Routing Preview */}
          <div className="p-3.5 bg-indigo-50/70 border border-indigo-200 rounded-xl space-y-1.5">
            <span className="font-bold text-indigo-950 flex items-center gap-1 text-[11px] uppercase tracking-wider">
              <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
              Automated Statutory Jurisdiction Routing
            </span>
            <div className="text-[11px] text-indigo-900 space-y-0.5">
              <p>
                <span className="font-semibold">Jurisdiction:</span> {matchedJur.district} ({matchedJur.zone})
              </p>
              <p>
                <span className="font-semibold">Assigned Officer / Centre:</span> {matchedJur.assignedLmoName}
              </p>
              <p className="text-[10px] text-indigo-700">{matchedJur.officeAddress}</p>
            </div>
          </div>

          {/* Additional Notes */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Applicant Remarks / Special Instructions</label>
            <textarea
              rows={2}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="e.g. Convenient for inspection during morning business hours (10 AM to 1 PM)..."
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Statutory Declaration */}
          <div className="text-[11px] text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-200 leading-relaxed">
            Statutory Declaration: I hereby declare that the instrument particulars provided are accurate and the instrument conforms to standard specifications under the Legal Metrology Act, 2009.
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 font-semibold rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-[#002B49] hover:bg-[#003B66] text-white font-bold rounded-xl shadow-md flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              <span>Submit Application</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
