'use client';

import React from 'react';
import { Certificate } from '@/types/metrology';
import { QRCodeDisplay } from '@/components/common/QRCodeDisplay';
import { StatusBadge } from '@/components/common/StatusBadge';
import { exportCertificatePDF } from '@/lib/pdf-generator';
import {
  ShieldCheck,
  Download,
  Printer,
  Scale,
  Building,
  CheckCircle2,
  Calendar,
  KeyRound,
  FileBadge,
} from 'lucide-react';

interface OfficialCertificateViewProps {
  certificate: Certificate;
  onClose?: () => void;
}

export function OfficialCertificateView({ certificate, onClose }: OfficialCertificateViewProps) {
  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    exportCertificatePDF(certificate);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-300 shadow-xl overflow-hidden max-w-4xl mx-auto my-4">
      {/* Top Action Bar */}
      <div className="bg-slate-900 text-white px-6 py-3.5 flex items-center justify-between no-print">
        <div className="flex items-center gap-2">
          <FileBadge className="w-5 h-5 text-amber-400" />
          <span className="font-semibold text-sm">Official Legal Metrology Certificate Document</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadPDF}
            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-lg flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            Download PDF
          </button>
          <button
            onClick={handlePrint}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs rounded-lg flex items-center gap-1.5 transition-colors border border-slate-700"
          >
            <Printer className="w-3.5 h-3.5" />
            Print
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="px-2.5 py-1.5 text-slate-400 hover:text-white text-xs transition-colors ml-2"
            >
              Close
            </button>
          )}
        </div>
      </div>

      {/* Official Certificate Paper Container */}
      <div className="p-8 sm:p-12 relative bg-white text-slate-900 border-8 border-[#002B49]/10 m-4 rounded-xl">
        {/* Subtle Watermark */}
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none">
          <Scale className="w-96 h-96 text-slate-900" />
        </div>

        {/* Emblems & Header */}
        <div className="text-center space-y-1.5 border-b-2 border-slate-800 pb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#002B49] text-white shadow-xs mb-2">
            <Scale className="w-7 h-7 text-amber-400" />
          </div>
          <h2 className="text-base sm:text-lg font-black tracking-wider text-[#002B49] uppercase">
            Government of India
          </h2>
          <h3 className="text-xs sm:text-sm font-bold text-slate-700 uppercase">
            Ministry of Consumer Affairs, Food & Public Distribution
          </h3>
          <p className="text-xs text-slate-600 font-medium">
            Department of Consumer Affairs — Legal Metrology Division
          </p>

          <div className="pt-3">
            <span className="inline-block bg-[#002B49] text-white text-xs sm:text-sm font-extrabold px-6 py-1.5 rounded-md tracking-wider uppercase shadow-xs">
              Certificate of Verification
            </span>
            <p className="text-[10px] text-slate-500 font-mono mt-1">
              [Issued under Section 24 of Legal Metrology Act, 2009 & Rule 14, Schedule IX (Form V) of General Rules, 2011]
            </p>
          </div>
        </div>

        {/* Certificate Identification Band */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4 border-b border-slate-200 text-xs bg-slate-50/70 px-4 rounded-lg my-4">
          <div>
            <span className="text-slate-500 block text-[10px] uppercase font-bold">Certificate No.</span>
            <span className="font-bold text-[#002B49] font-mono text-sm">{certificate.certificateNumber}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px] uppercase font-bold">Issue Date</span>
            <span className="font-semibold text-slate-800">{certificate.issueDate}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px] uppercase font-bold">Valid Until</span>
            <span className="font-bold text-emerald-700">{certificate.validUntil}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px] uppercase font-bold">Status</span>
            <StatusBadge status={certificate.status} size="sm" />
          </div>
        </div>

        {/* Legal Certification Statement */}
        <div className="my-6 text-xs sm:text-sm text-slate-700 leading-relaxed text-justify bg-amber-50/50 p-4 rounded-lg border border-amber-200/60">
          This is to certify that the weighing and measuring instrument described herein has been inspected, tested, verified, and stamped in accordance with the standards, specifications, and maximum permissible error limits prescribed under the <span className="font-semibold text-slate-900">Legal Metrology Act, 2009</span> and the <span className="font-semibold text-slate-900">Legal Metrology (General) Rules, 2011</span>.
        </div>

        {/* Instrument & Owner Specifications Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-6 items-start">
          <div className="md:col-span-2 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#002B49] border-b pb-1">
              Verified Instrument Particulars
            </h4>
            <div className="grid grid-cols-2 gap-y-2.5 text-xs">
              <div>
                <span className="text-slate-500 block text-[10px] font-bold">Owner / Trader Name:</span>
                <span className="font-bold text-slate-900">{certificate.ownerName}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] font-bold">Business Establishment:</span>
                <span className="font-bold text-slate-900">{certificate.businessName}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] font-bold">Instrument Category:</span>
                <span className="font-semibold text-slate-800">{certificate.instrument.categoryName}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] font-bold">Accuracy Class:</span>
                <span className="font-bold text-indigo-700">{certificate.instrument.accuracyClass}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] font-bold">Make & Model:</span>
                <span className="font-medium text-slate-800">{certificate.instrument.make} — {certificate.instrument.model}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] font-bold">Instrument Serial Number:</span>
                <span className="font-mono font-bold text-slate-900">{certificate.instrument.serialNumber}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] font-bold">Max Capacity / Range:</span>
                <span className="font-bold text-slate-900">{certificate.instrument.maxCapacity}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] font-bold">Scale Interval (e / d):</span>
                <span className="font-medium text-slate-800">{certificate.instrument.verificationScaleInterval}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] font-bold">Physical Lead/Hologram Seal No:</span>
                <span className="font-mono font-bold text-amber-800 bg-amber-100/60 px-2 py-0.5 rounded border border-amber-200">
                  {certificate.physicalSealNumber}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] font-bold">Installation Location:</span>
                <span className="font-medium text-slate-800 text-[11px] truncate block">
                  {certificate.instrument.installationAddress}, {certificate.instrument.district} - {certificate.instrument.pinCode}
                </span>
              </div>
            </div>
          </div>

          {/* QR Code & Cryptographic Stamp Card */}
          <div className="flex flex-col items-center justify-center p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
            <QRCodeDisplay
              value={`https://doca.gov.in/verify/${certificate.certificateNumber}`}
              size={150}
              label="Instant Scan Authentication"
            />
            <div className="mt-3 text-[10px] text-slate-500 space-y-1 w-full">
              <div className="flex items-center justify-center gap-1 text-emerald-700 font-bold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Digitally Sealed & Verifiable</span>
              </div>
              <p className="font-mono text-[9px] truncate text-slate-400" title={certificate.digitalSignatureHash}>
                {certificate.digitalSignatureHash}
              </p>
            </div>
          </div>
        </div>

        {/* Officer & Seal Authority Signatures */}
        <div className="pt-8 mt-6 border-t border-slate-300 grid grid-cols-2 gap-8 text-xs">
          <div>
            <div className="border-b border-slate-400 w-48 pb-1 mb-2">
              <span className="text-[11px] font-bold text-slate-800">{certificate.issuedByOfficerName}</span>
            </div>
            <p className="text-[10px] font-bold uppercase text-slate-500">Legal Metrology Officer / Inspector</p>
            <p className="text-[10px] text-slate-600 max-w-xs">{certificate.issuingAuthority}</p>
          </div>
          <div className="text-right flex flex-col items-end">
            <div className="w-20 h-20 rounded-full border-2 border-dashed border-[#002B49] flex items-center justify-center text-center p-1 text-[9px] font-bold text-[#002B49] uppercase leading-tight bg-slate-50">
              Department of Legal Metrology Seal
            </div>
            <p className="text-[10px] text-slate-500 font-bold uppercase mt-2">State Directorate of Legal Metrology</p>
            <p className="text-[9px] text-slate-400">Government of India</p>
          </div>
        </div>

        {/* Legal Disclaimer Footer */}
        <div className="mt-8 pt-4 border-t border-slate-200 text-[10px] text-slate-400 text-center">
          Notice: It is a statutory offense under the Legal Metrology Act, 2009 to alter, counterfeit, or use an unverified instrument. This certificate must be prominently displayed or produced upon demand by any Legal Metrology Officer.
        </div>
      </div>
    </div>
  );
}
