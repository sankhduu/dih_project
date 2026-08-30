'use client';

import React, { useState, useEffect } from 'react';
import { useMetrologyStore } from '@/lib/store';
import { Camera, QrCode, X, Sparkles, CheckCircle2, ShieldCheck, Zap } from 'lucide-react';
import confetti from 'canvas-confetti';

interface InteractiveScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanResult: (certNumber: string) => void;
}

export function InteractiveScannerModal({
  isOpen,
  onClose,
  onScanResult,
}: InteractiveScannerModalProps) {
  const { certificates } = useMetrologyStore();
  const [scanning, setScanning] = useState(false);
  const [scannedCert, setScannedCert] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setScanning(true);
      setScannedCert(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSimulateScan = (certNumber: string) => {
    setScanning(true);
    setTimeout(() => {
      setScannedCert(certNumber);
      setScanning(false);
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
        });
      } catch (e) {}
      setTimeout(() => {
        onScanResult(certNumber);
        onClose();
      }, 900);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="bg-slate-950 border border-slate-800 rounded-3xl max-w-md w-full p-6 text-white shadow-2xl relative overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-1">
            <Camera className="w-6 h-6 animate-pulse" />
          </div>
          <h3 className="text-lg font-bold">QR Camera Scanner</h3>
          <p className="text-xs text-slate-400">
            Point camera at the physical verification sticker or digital QR certificate
          </p>
        </div>

        {/* Viewfinder simulation */}
        <div className="my-6 relative flex items-center justify-center h-52 bg-slate-900/90 rounded-2xl border-2 border-dashed border-slate-700 overflow-hidden">
          {/* Laser scanline animation */}
          <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_15px_#10b981] animate-bounce top-1/3"></div>

          {/* Corner brackets */}
          <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-emerald-400"></div>
          <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-emerald-400"></div>
          <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-emerald-400"></div>
          <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-emerald-400"></div>

          <div className="flex flex-col items-center justify-center text-center p-4">
            <QrCode className="w-16 h-16 text-slate-600 mb-2" />
            <span className="text-xs text-slate-400 font-mono">Align QR within bounds</span>
          </div>

          {scannedCert && (
            <div className="absolute inset-0 bg-emerald-950/90 flex flex-col items-center justify-center text-emerald-400 animate-in zoom-in-90">
              <CheckCircle2 className="w-12 h-12 mb-2" />
              <span className="text-sm font-bold">QR Authenticated!</span>
              <span className="text-xs font-mono mt-1 text-white">{scannedCert}</span>
            </div>
          )}
        </div>

        {/* Interactive Quick Scan Simulator for Demonstration */}
        <div className="space-y-2">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block text-center">
            Tap a demo instrument sticker to scan:
          </span>
          <div className="space-y-1.5 max-h-36 overflow-y-auto">
            {certificates.map((cert) => (
              <button
                key={cert.id}
                onClick={() => handleSimulateScan(cert.certificateNumber)}
                className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-left text-xs transition-colors group"
              >
                <div>
                  <div className="font-semibold text-slate-200 group-hover:text-emerald-400 transition-colors">
                    {cert.instrument.categoryName}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    {cert.certificateNumber} ({cert.status})
                  </div>
                </div>
                <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 text-[10px] font-semibold rounded-md flex items-center gap-1 group-hover:bg-emerald-500 group-hover:text-slate-950 transition-colors">
                  <Zap className="w-3 h-3" />
                  Scan
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
