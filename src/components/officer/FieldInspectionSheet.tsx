'use client';

import React, { useState, useId } from 'react';
import { useMetrologyStore } from '@/lib/store';
import { Application, CalibrationObservation } from '@/types/metrology';
import { calculateMPE } from '@/lib/metrology-rules';
import {
  Scale,
  Camera,
  MapPin,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileBadge,
  ShieldCheck,
  X,
  Sparkles,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface FieldInspectionSheetProps {
  application: Application;
  onClose: () => void;
  onSuccess: () => void;
}

export function FieldInspectionSheet({ application, onClose, onSuccess }: FieldInspectionSheetProps) {
  const { currentUser, recordInspectionAndIssueCertificate } = useMetrologyStore();
  const idPrefix = useId().replace(/:/g, '');

  const inst = application.instrument;

  // Visual & Security Checks
  const [visualInspectionPassed, setVisualInspectionPassed] = useState(true);
  const [sealingIntegrityPassed, setSealingIntegrityPassed] = useState(true);
  const [eccentricityTestPassed, setEccentricityTestPassed] = useState(true);
  const [repeatabilityTestPassed, setRepeatabilityTestPassed] = useState(true);

  // Calibration Observations (Default 3 standard weight loads: Zero, 50% Capacity, 100% Capacity)
  const defaultIntervalNum = parseFloat(inst.verificationScaleInterval.replace(/[^\d.]/g, '')) || 1;
  const defaultCapacityNum = parseFloat(inst.maxCapacity.replace(/[^\d.]/g, '')) || 30;

  const [observations, setObservations] = useState<CalibrationObservation[]>([
    {
      testLoad: 'Zero Load Check',
      standardWeight: 0,
      observedReading: 0.0,
      error: 0.0,
      maxPermissibleError: calculateMPE(0, inst.accuracyClass, defaultIntervalNum),
      isWithinLimits: true,
    },
    {
      testLoad: `50% Test Load (${defaultCapacityNum * 0.5} kg)`,
      standardWeight: defaultCapacityNum * 0.5,
      observedReading: defaultCapacityNum * 0.5,
      error: 0.0,
      maxPermissibleError: calculateMPE(defaultCapacityNum * 0.5, inst.accuracyClass, defaultIntervalNum),
      isWithinLimits: true,
    },
    {
      testLoad: `Max Capacity Load (${defaultCapacityNum} kg)`,
      standardWeight: defaultCapacityNum,
      observedReading: defaultCapacityNum,
      error: 0.0,
      maxPermissibleError: calculateMPE(defaultCapacityNum, inst.accuracyClass, defaultIntervalNum),
      isWithinLimits: true,
    },
  ]);

  // Physical Security Lead Seal Number (Pure initialization)
  const [physicalSealNumber, setPhysicalSealNumber] = useState(
    `DL-LM-SEAL-88941-${inst.accuracyClass === 'CLASS_I' ? 'A' : 'K'}`
  );

  // Geo Location & Photos (Mock captured for mobile field officer)
  const geoLat = inst.geoLat || 28.5494;
  const geoLng = inst.geoLng || 77.2001;
  const [officerNotes, setOfficerNotes] = useState('');

  // Handle Reading Changes
  const handleReadingChange = (index: number, newReading: number) => {
    const updated = [...observations];
    const obs = updated[index];
    const err = +(newReading - obs.standardWeight).toFixed(3);
    const mpe = calculateMPE(obs.standardWeight, inst.accuracyClass, defaultIntervalNum);
    const within = Math.abs(err) <= mpe;

    updated[index] = {
      ...obs,
      observedReading: newReading,
      error: err,
      maxPermissibleError: mpe,
      isWithinLimits: within,
    };
    setObservations(updated);
  };

  // Quick Preset Test Cases for Demo
  const applyPreset = (type: 'PERFECT_PASS' | 'CALIBRATION_FAIL') => {
    if (type === 'PERFECT_PASS') {
      setVisualInspectionPassed(true);
      setSealingIntegrityPassed(true);
      setEccentricityTestPassed(true);
      setRepeatabilityTestPassed(true);
      setObservations([
        {
          testLoad: 'Zero Load Check',
          standardWeight: 0,
          observedReading: 0.0,
          error: 0.0,
          maxPermissibleError: calculateMPE(0, inst.accuracyClass, defaultIntervalNum),
          isWithinLimits: true,
        },
        {
          testLoad: `50% Test Load (${defaultCapacityNum * 0.5} kg)`,
          standardWeight: defaultCapacityNum * 0.5,
          observedReading: defaultCapacityNum * 0.5,
          error: 0.0,
          maxPermissibleError: calculateMPE(defaultCapacityNum * 0.5, inst.accuracyClass, defaultIntervalNum),
          isWithinLimits: true,
        },
        {
          testLoad: `Max Capacity Load (${defaultCapacityNum} kg)`,
          standardWeight: defaultCapacityNum,
          observedReading: defaultCapacityNum,
          error: 0.0,
          maxPermissibleError: calculateMPE(defaultCapacityNum, inst.accuracyClass, defaultIntervalNum),
          isWithinLimits: true,
        },
      ]);
      setOfficerNotes('Instrument verified within standard tolerance limits under Seventh Schedule. Physical security seal affixed.');
    } else {
      setVisualInspectionPassed(true);
      setSealingIntegrityPassed(false);
      setEccentricityTestPassed(false);
      setRepeatabilityTestPassed(false);
      setObservations([
        {
          testLoad: 'Zero Load Check',
          standardWeight: 0,
          observedReading: 0.005,
          error: 0.005,
          maxPermissibleError: calculateMPE(0, inst.accuracyClass, defaultIntervalNum),
          isWithinLimits: true,
        },
        {
          testLoad: `50% Test Load (${defaultCapacityNum * 0.5} kg)`,
          standardWeight: defaultCapacityNum * 0.5,
          observedReading: defaultCapacityNum * 0.5 + 0.015,
          error: 0.015,
          maxPermissibleError: calculateMPE(defaultCapacityNum * 0.5, inst.accuracyClass, defaultIntervalNum),
          isWithinLimits: false, // EXCEEDS MPE!
        },
        {
          testLoad: `Max Capacity Load (${defaultCapacityNum} kg)`,
          standardWeight: defaultCapacityNum,
          observedReading: defaultCapacityNum + 0.025,
          error: 0.025,
          maxPermissibleError: calculateMPE(defaultCapacityNum, inst.accuracyClass, defaultIntervalNum),
          isWithinLimits: false, // EXCEEDS MPE!
        },
      ]);
      setOfficerNotes('Observed errors exceed Maximum Permissible Error (MPE) tolerances. Lead seal broken.');
    }
  };

  // Compute overall status
  const calibrationPassed = observations.every((o) => o.isWithinLimits);
  const finalOutcome: 'PASS' | 'FAIL' =
    visualInspectionPassed &&
    sealingIntegrityPassed &&
    eccentricityTestPassed &&
    repeatabilityTestPassed &&
    calibrationPassed
      ? 'PASS'
      : 'FAIL';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    recordInspectionAndIssueCertificate({
      applicationId: application.id,
      applicationNumber: application.applicationNumber,
      instrumentId: inst.id,
      officerId: currentUser.id,
      officerName: currentUser.fullName,
      officerRole: currentUser.role as 'LMO' | 'GATC',
      inspectionDate: new Date().toISOString().split('T')[0],
      inspectionLocation: inst.installationAddress,
      geoLat,
      geoLng,
      visualInspectionPassed,
      sealingIntegrityPassed,
      eccentricityTestPassed,
      repeatabilityTestPassed,
      calibrationObservations: observations,
      overallCalibrationPassed: calibrationPassed,
      physicalSealNumber,
      photoUrls: {
        instrumentPhoto: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=400',
        displayReadingPhoto: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=400',
        physicalSealPhoto: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400',
      },
      outcome: finalOutcome,
      officerNotes: officerNotes || (finalOutcome === 'PASS' ? 'Instrument fully certified under Rule 14.' : 'Deficiency observed during verification.'),
    });

    if (finalOutcome === 'PASS') {
      try {
        confetti({
          particleCount: 60,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {}
    }

    onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200">
        {/* Top Header */}
        <div className="sticky top-0 bg-[#002B49] text-white px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="font-bold text-sm sm:text-base">Field Verification & Observation Sheet</h3>
              <p className="text-[11px] text-slate-300">
                Application: <span className="font-mono text-amber-300 font-bold">{application.applicationNumber}</span> • Inspector: {currentUser.fullName}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-white/10">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 text-xs text-slate-800">
          {/* Quick Demo Preset Selector */}
          <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-2">
            <span className="font-bold text-indigo-950 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              Field Inspection Simulation Presets:
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => applyPreset('PERFECT_PASS')}
                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-2xs text-[11px]"
              >
                Pass All Tests (Generate Certificate)
              </button>
              <button
                type="button"
                onClick={() => applyPreset('CALIBRATION_FAIL')}
                className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg shadow-2xs text-[11px]"
              >
                Fail MPE Check (Generate Deficiency)
              </button>
            </div>
          </div>

          {/* Instrument Identification Banner */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Instrument</span>
              <span className="font-bold text-slate-900">{inst.categoryName}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Make & Serial No.</span>
              <span className="font-semibold text-slate-800">{inst.make} ({inst.serialNumber})</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Accuracy Class</span>
              <span className="font-bold text-indigo-700">{inst.accuracyClass} (e={inst.verificationScaleInterval})</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Capacity</span>
              <span className="font-bold text-slate-900">{inst.maxCapacity}</span>
            </div>
          </div>

          {/* Step 1: Visual, Sealing & Mechanical Condition Checks */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-900 uppercase tracking-wider text-xs border-b pb-1">
              1. Visual & Physical Sealing Condition (Rule 12)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={visualInspectionPassed}
                  onChange={(e) => setVisualInspectionPassed(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
                <div>
                  <span className="font-bold text-slate-800 block">Visual & Display Integrity</span>
                  <span className="text-[11px] text-slate-500">Nameplate, level indicator & segment display sound</span>
                </div>
              </label>

              <label className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={sealingIntegrityPassed}
                  onChange={(e) => setSealingIntegrityPassed(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
                <div>
                  <span className="font-bold text-slate-800 block">Tamper Sealing Provision</span>
                  <span className="text-[11px] text-slate-500">Calibration adjustment housing seal intact</span>
                </div>
              </label>

              <label className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={eccentricityTestPassed}
                  onChange={(e) => setEccentricityTestPassed(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
                <div>
                  <span className="font-bold text-slate-800 block">Eccentric Load Test Passed</span>
                  <span className="text-[11px] text-slate-500">Corner loading tests within permissible limits</span>
                </div>
              </label>

              <label className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={repeatabilityTestPassed}
                  onChange={(e) => setRepeatabilityTestPassed(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
                <div>
                  <span className="font-bold text-slate-800 block">Repeatability Test Passed</span>
                  <span className="text-[11px] text-slate-500">3 consecutive weighings match within allowable delta</span>
                </div>
              </label>
            </div>
          </div>

          {/* Step 2: Calibration Observation Sheet with MPE calculations */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b pb-1">
              <h4 className="font-bold text-slate-900 uppercase tracking-wider text-xs">
                2. Standard Weights Error Verification (Seventh Schedule MPE Limits)
              </h4>
              <span className="text-[10px] text-indigo-700 font-bold">
                Max Permissible Error: {inst.accuracyClass}
              </span>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-2xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-[10px] font-bold text-slate-600 uppercase">
                  <tr>
                    <th className="p-3">Test Load</th>
                    <th className="p-3">Certified Standard</th>
                    <th className="p-3">Observed Scale Reading</th>
                    <th className="p-3">Calculated Error</th>
                    <th className="p-3">Max Permissible (MPE)</th>
                    <th className="p-3">Compliance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {observations.map((obs, idx) => (
                    <tr key={idx} className="bg-white">
                      <td className="p-3 font-semibold text-slate-900">{obs.testLoad}</td>
                      <td className="p-3 font-mono font-medium">{obs.standardWeight} kg</td>
                      <td className="p-3">
                        <input
                          type="number"
                          step="0.001"
                          value={obs.observedReading}
                          onChange={(e) => handleReadingChange(idx, parseFloat(e.target.value) || 0)}
                          className="w-24 p-1.5 bg-slate-50 border border-slate-300 rounded font-mono font-bold text-slate-900 focus:ring-2 focus:ring-blue-500"
                        />
                      </td>
                      <td className="p-3 font-mono">
                        <span className={obs.error !== 0 ? 'font-bold text-amber-700' : 'text-slate-500'}>
                          {obs.error > 0 ? `+${obs.error}` : obs.error} kg
                        </span>
                      </td>
                      <td className="p-3 font-mono text-slate-500">±{obs.maxPermissibleError} kg</td>
                      <td className="p-3">
                        {obs.isWithinLimits ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700 font-bold text-[11px] bg-emerald-50 px-2 py-0.5 rounded-full">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Pass
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-rose-700 font-bold text-[11px] bg-rose-50 px-2 py-0.5 rounded-full">
                            <XCircle className="w-3.5 h-3.5" /> Exceeds MPE
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Step 3: Physical Stamping & Lead Seal Particulars */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Physical Lead / Hologram Seal Serial Number *
              </label>
              <input
                type="text"
                required
                value={physicalSealNumber}
                onChange={(e) => setPhysicalSealNumber(e.target.value)}
                placeholder="e.g. DL-LM-SEAL-88941-K"
                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-mono font-bold text-slate-900 focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                Unique tamper-evident stamp pressed onto calibration wire
              </span>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Geo-Location & Stamp Coordinates</label>
              <div className="flex items-center gap-2 p-2.5 bg-white border border-slate-300 rounded-xl text-slate-700 font-mono text-xs">
                <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Lat: {geoLat.toFixed(4)}, Lng: {geoLng.toFixed(4)} (Geo-stamped)</span>
              </div>
              <span className="text-[10px] text-slate-500 mt-1 block">
                Automatically verified at applicant business premises
              </span>
            </div>
          </div>

          {/* Photo Evidence (Mocked previews) */}
          <div className="space-y-2">
            <span className="font-bold text-slate-700 block uppercase text-[10px] tracking-wider">
              Photo Attachments (3 captured on device):
            </span>
            <div className="grid grid-cols-3 gap-3">
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-center">
                <div className="h-16 bg-slate-200 rounded-lg flex items-center justify-center text-slate-500 mb-1">
                  <Camera className="w-5 h-5 text-slate-400" />
                </div>
                <span className="text-[10px] font-semibold text-slate-700">Instrument Display</span>
              </div>
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-center">
                <div className="h-16 bg-slate-200 rounded-lg flex items-center justify-center text-slate-500 mb-1">
                  <Scale className="w-5 h-5 text-slate-400" />
                </div>
                <span className="text-[10px] font-semibold text-slate-700">Standard Test Weights</span>
              </div>
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-center">
                <div className="h-16 bg-slate-200 rounded-lg flex items-center justify-center text-slate-500 mb-1">
                  <ShieldCheck className="w-5 h-5 text-slate-400" />
                </div>
                <span className="text-[10px] font-semibold text-slate-700">Lead Security Seal</span>
              </div>
            </div>
          </div>

          {/* Officer Observations & Remarks */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Inspector Statutory Observations</label>
            <textarea
              rows={2}
              value={officerNotes}
              onChange={(e) => setOfficerNotes(e.target.value)}
              placeholder="e.g. Standard weights applied. Error within permissible range. Sealing completed."
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Inspection Decision Card */}
          <div
            className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
              finalOutcome === 'PASS'
                ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                : 'bg-rose-50 border-rose-300 text-rose-950'
            }`}
          >
            <div className="flex items-center gap-3">
              {finalOutcome === 'PASS' ? (
                <CheckCircle2 className="w-7 h-7 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="w-7 h-7 text-rose-600 shrink-0" />
              )}
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider">
                  Verification Evaluation Result
                </div>
                <h4 className="text-sm font-extrabold">
                  {finalOutcome === 'PASS'
                    ? 'INSPECTION PASSED — ISSUE DIGITAL CERTIFICATE'
                    : 'DEFICIENCY IDENTIFIED — ISSUE DEFICIENCY MEMO (FORM VI)'}
                </h4>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="submit"
                className={`px-6 py-2.5 text-white font-bold rounded-xl shadow-md transition-all flex items-center gap-2 ${
                  finalOutcome === 'PASS'
                    ? 'bg-emerald-700 hover:bg-emerald-800'
                    : 'bg-rose-700 hover:bg-rose-800'
                }`}
              >
                {finalOutcome === 'PASS' ? <FileBadge className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                <span>{finalOutcome === 'PASS' ? 'Issue Certificate & Seal' : 'Issue Deficiency Notice'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
