'use client';

import React, { useState } from 'react';
import { useMetrologyStore } from '@/lib/store';
import { Certificate } from '@/types/metrology';
import { StatusBadge } from '@/components/common/StatusBadge';
import { OfficialCertificateView } from '@/components/certificates/OfficialCertificateView';
import { InteractiveScannerModal } from './InteractiveScannerModal';
import {
  Search,
  QrCode,
  ShieldCheck,
  AlertOctagon,
  CheckCircle2,
  Scale,
  FileBadge,
} from 'lucide-react';

export function PublicVerificationPortal() {
  const { verifyCertificatePublicly } = useMetrologyStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [verifiedCert, setVerifiedCert] = useState<Certificate | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [showFullCert, setShowFullCert] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  const handleSearch = (queryToUse?: string) => {
    const q = queryToUse || searchQuery;
    if (!q.trim()) return;
    const result = verifyCertificatePublicly(q);
    setVerifiedCert(result);
    setHasSearched(true);
    setShowFullCert(false);
  };

  const handleScanResult = (scannedCertNumber: string) => {
    setSearchQuery(scannedCertNumber);
    handleSearch(scannedCertNumber);
  };

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 space-y-8">
      {/* Hero Banner */}
      <div className="relative rounded-3xl bg-gradient-to-br from-[#002B49] via-[#003B66] to-[#0A192F] text-white p-8 sm:p-12 overflow-hidden shadow-xl">
        <div className="absolute -right-12 -bottom-12 opacity-10 pointer-events-none">
          <Scale className="w-80 h-80" />
        </div>

        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-500/30">
            <ShieldCheck className="w-4 h-4" />
            <span>Public Certificate Authentication Service</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            Verify Legal Metrology Stamping & Certificate
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Verify the statutory authenticity and validity of any weighing balance, fuel dispenser, or industrial weighbridge operating in India under the <span className="text-amber-400 font-semibold">Legal Metrology Act, 2009</span>.
          </p>

          {/* Search & Scan Box */}
          <div className="pt-4 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-3.5 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Enter Certificate No (e.g. IND-LM-DL-2025-78210) or Serial No..."
                className="w-full pl-11 pr-4 py-3 bg-white text-slate-900 rounded-xl text-xs sm:text-sm font-medium placeholder:text-slate-400 focus:outline-hidden focus:ring-3 focus:ring-amber-400 shadow-md"
              />
            </div>
            <button
              onClick={() => handleSearch()}
              className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs sm:text-sm rounded-xl transition-colors shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <Search className="w-4 h-4" />
              <span>Verify Now</span>
            </button>
            <button
              onClick={() => setIsScannerOpen(true)}
              className="px-5 py-3 bg-slate-800/90 hover:bg-slate-700 text-white font-semibold text-xs sm:text-sm rounded-xl transition-colors border border-slate-700 shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <QrCode className="w-4 h-4 text-emerald-400" />
              <span>Scan QR</span>
            </button>
          </div>

          {/* Quick Demo Test Searches */}
          <div className="pt-2 flex flex-wrap items-center gap-2 text-[11px] text-slate-300">
            <span className="font-semibold text-slate-400">Quick Test Lookups:</span>
            <button
              onClick={() => {
                setSearchQuery('IND-LM-DL-2025-78210');
                handleSearch('IND-LM-DL-2025-78210');
              }}
              className="px-2 py-0.5 rounded-md bg-white/10 hover:bg-white/20 text-white transition-colors underline decoration-dotted"
            >
              Active Scale (Essae)
            </button>
            <button
              onClick={() => {
                setSearchQuery('IND-LM-DL-2026-11942');
                handleSearch('IND-LM-DL-2026-11942');
              }}
              className="px-2 py-0.5 rounded-md bg-white/10 hover:bg-white/20 text-white transition-colors underline decoration-dotted"
            >
              GATC Certified (Mettler Lab)
            </button>
            <button
              onClick={() => {
                setSearchQuery('IND-LM-DL-2025-45012');
                handleSearch('IND-LM-DL-2025-45012');
              }}
              className="px-2 py-0.5 rounded-md bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 transition-colors underline decoration-dotted"
            >
              Expired Weighbridge
            </button>
            <button
              onClick={() => {
                setSearchQuery('FAKE-CERT-999');
                handleSearch('FAKE-CERT-999');
              }}
              className="px-2 py-0.5 rounded-md bg-red-500/20 hover:bg-red-500/30 text-red-300 transition-colors underline decoration-dotted"
            >
              Fake / Not Found
            </button>
          </div>
        </div>
      </div>

      {/* Verification Result Area */}
      {hasSearched && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
          {verifiedCert ? (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
              {/* Header Banner depending on active vs expired */}
              <div
                className={`p-6 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  verifiedCert.status === 'ACTIVE'
                    ? 'bg-gradient-to-r from-emerald-800 to-emerald-950'
                    : 'bg-gradient-to-r from-red-800 to-red-950'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-xs">
                    {verifiedCert.status === 'ACTIVE' ? (
                      <CheckCircle2 className="w-8 h-8 text-emerald-300" />
                    ) : (
                      <AlertOctagon className="w-8 h-8 text-rose-300" />
                    )}
                  </div>
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider text-emerald-200">
                      Central Metrology Registry Response (0.18s)
                    </div>
                    <h3 className="text-xl font-black">
                      {verifiedCert.status === 'ACTIVE'
                        ? 'AUTHENTIC & STATUTORILY VALID'
                        : 'EXPIRED / INVALID VERIFICATION'}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <StatusBadge status={verifiedCert.status} size="lg" />
                  <button
                    onClick={() => setShowFullCert(!showFullCert)}
                    className="px-4 py-2 bg-white text-slate-900 font-bold text-xs rounded-xl shadow-xs hover:bg-slate-100 transition-colors flex items-center gap-1.5"
                  >
                    <FileBadge className="w-4 h-4 text-amber-600" />
                    <span>{showFullCert ? 'Hide Certificate' : 'View Full Certificate'}</span>
                  </button>
                </div>
              </div>

              {/* Full Certificate View Modal / Inline Toggle */}
              {showFullCert ? (
                <div className="p-4 bg-slate-100">
                  <OfficialCertificateView
                    certificate={verifiedCert}
                    onClose={() => setShowFullCert(false)}
                  />
                </div>
              ) : (
                /* Compact Public Verification Card */
                <div className="p-6 sm:p-8 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Column 1: Certificate Specs */}
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                        Certificate Details
                      </span>
                      <div className="space-y-2 text-xs">
                        <div>
                          <span className="text-slate-500 block text-[10px]">Certificate Number:</span>
                          <span className="font-mono font-bold text-slate-900 text-sm">
                            {verifiedCert.certificateNumber}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[10px]">Issue Date:</span>
                          <span className="font-semibold text-slate-800">{verifiedCert.issueDate}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[10px]">Validity Period:</span>
                          <span className="font-bold text-emerald-700">{verifiedCert.validFrom} to {verifiedCert.validUntil}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[10px]">Physical Lead/Hologram Seal No:</span>
                          <span className="font-mono font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded text-[11px]">
                            {verifiedCert.physicalSealNumber}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Column 2: Equipment Particulars */}
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                        Instrument Particulars
                      </span>
                      <div className="space-y-2 text-xs">
                        <div>
                          <span className="text-slate-500 block text-[10px]">Category & Class:</span>
                          <span className="font-bold text-slate-900">
                            {verifiedCert.instrument.categoryName} ({verifiedCert.instrument.accuracyClass})
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[10px]">Make & Model:</span>
                          <span className="font-medium text-slate-800">
                            {verifiedCert.instrument.make} — {verifiedCert.instrument.model}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[10px]">Serial Number:</span>
                          <span className="font-mono font-bold text-slate-900">{verifiedCert.instrument.serialNumber}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[10px]">Max Capacity / Interval:</span>
                          <span className="font-semibold text-slate-900">
                            {verifiedCert.instrument.maxCapacity} (e = {verifiedCert.instrument.verificationScaleInterval})
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Column 3: Establishment & Issuing Authority */}
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                        Trader & Issuing Authority
                      </span>
                      <div className="space-y-2 text-xs">
                        <div>
                          <span className="text-slate-500 block text-[10px]">Commercial Establishment:</span>
                          <span className="font-bold text-slate-900">{verifiedCert.businessName}</span>
                          <span className="text-[11px] text-slate-500 block">{verifiedCert.ownerName}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[10px]">Verified Location:</span>
                          <span className="font-medium text-slate-700 text-[11px]">
                            {verifiedCert.instrument.installationAddress}, {verifiedCert.instrument.district} - {verifiedCert.instrument.pinCode}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[10px]">Verified By:</span>
                          <span className="font-semibold text-[#002B49]">{verifiedCert.issuedByOfficerName}</span>
                          <span className="text-[10px] text-slate-500 block truncate">{verifiedCert.issuingAuthority}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Cryptographic Verification Badge Footer */}
                  <div className="p-4 bg-slate-900 text-white rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                      <div>
                        <span className="font-bold">Cryptographic Tamper-Evident Digest:</span>
                        <p className="font-mono text-[10px] text-slate-400 truncate max-w-md">
                          {verifiedCert.digitalSignatureHash}
                        </p>
                      </div>
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Record matched against Central Legal Metrology Database
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Fraud / Not Found Result */
            <div className="p-8 bg-rose-50 border-2 border-rose-300 rounded-3xl text-center space-y-4 shadow-lg">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-rose-100 text-rose-600">
                <AlertOctagon className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-black text-rose-900">
                NO VERIFIED CERTIFICATE RECORD FOUND
              </h3>
              <p className="text-xs sm:text-sm text-rose-700 max-w-lg mx-auto">
                No active or historical verification certificate was found matching{' '}
                <span className="font-mono font-bold bg-rose-200 px-2 py-0.5 rounded text-rose-950">
                  {searchQuery}
                </span>{' '}
                in the central Legal Metrology repository. The certificate may be counterfeit or unregistered.
              </p>
              <div className="pt-2 flex items-center justify-center gap-3">
                <button
                  onClick={() => setSearchQuery('')}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs"
                >
                  Try Another Query
                </button>
                <a
                  href="#"
                  className="px-4 py-2 bg-white text-rose-900 border border-rose-300 font-semibold text-xs rounded-xl hover:bg-rose-100 transition-colors"
                >
                  Report Violation to DoCA
                </a>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Camera QR Scanner Modal */}
      <InteractiveScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanResult={handleScanResult}
      />
    </div>
  );
}
