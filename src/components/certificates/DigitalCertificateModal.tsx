'use client';

import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  Scale,
  ShieldCheck,
  CheckCircle2,
  Printer,
  X,
  MapPin,
  Clock,
  Building2,
  FileBadge,
} from 'lucide-react';

export interface TraderRecord {
  id?: string;
  shop_name: string;
  owner_name?: string;
  license_number: string;
  district?: string;
  status?: string;
  address?: string;
  instrument_type?: string;
  capacity?: string;
  make_model?: string;
  latitude?: number | null;
  longitude?: number | null;
  created_at?: string;
  updated_at?: string;
}

interface DigitalCertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  shop: TraderRecord | null;
}

export function DigitalCertificateModal({ isOpen, onClose, shop }: DigitalCertificateModalProps) {
  if (!isOpen || !shop) return null;

  const handlePrint = () => {
    window.print();
  };

  const certificateNumber = `LM/CERT/${shop.district?.toUpperCase() || 'ROH'}/${(shop.license_number || shop.id || '2026').replace(/[^a-zA-Z0-9]/g, '').slice(-8)}`;
  
  // Format the approval timestamp
  const approvalDate = shop.updated_at
    ? new Date(shop.updated_at).toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      })
    : new Date().toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      });

  const lat = typeof shop.latitude === 'number' ? shop.latitude : 28.8955;
  const lng = typeof shop.longitude === 'number' ? shop.longitude : 76.6066;

  // JSON payload encoded in QR code
  const qrPayload = JSON.stringify({
    shopId: shop.id || shop.license_number,
    shopName: shop.shop_name,
    licenseNumber: shop.license_number,
    scaleType: shop.instrument_type || 'Commercial Counter Scale',
    status: 'Approved',
    gps: {
      latitude: lat,
      longitude: lng,
    },
    approvedAt: shop.updated_at || new Date().toISOString(),
    verifier: 'Legal Metrology Officer (LMO)',
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 print:p-0 print:bg-white">
      {/* Modal Card */}
      <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden relative print:shadow-none print:border-none print:w-full print:max-w-none">
        {/* Top Control Bar (Hidden on Print) */}
        <div className="bg-[#002B49] text-white px-6 py-4 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center">
              <FileBadge className="w-4 h-4 text-amber-300" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-white">Digital Metrology Certificate</h3>
              <p className="text-[11px] text-slate-300">Schedule IX Form V • Section 24, Legal Metrology Act, 2009</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-[#002B49] font-black text-xs shadow-md transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Download PDF</span>
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
              title="Close Certificate"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Certificate Paper Body */}
        <div className="p-6 sm:p-10 bg-white text-slate-900 space-y-6">
          {/* Certificate Header with Emblem */}
          <div className="text-center space-y-2 border-b-2 border-slate-800 pb-5">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#002B49] text-amber-400 shadow-md mb-1">
              <Scale className="w-6 h-6 text-amber-400" />
            </div>
            <h2 className="text-sm sm:text-base font-black tracking-widest text-[#002B49] uppercase">
              GOVERNMENT OF INDIA
            </h2>
            <h3 className="text-xs sm:text-sm font-bold text-slate-700 uppercase">
              Ministry of Consumer Affairs, Food & Public Distribution
            </h3>
            <p className="text-[11px] text-slate-600 font-medium">
              Department of Consumer Affairs • Directorate of Legal Metrology
            </p>
            <div className="pt-2">
              <span className="inline-block bg-[#002B49] text-white text-xs sm:text-sm font-extrabold px-6 py-1.5 rounded-md tracking-wider uppercase shadow-xs">
                Certificate of Statutory Verification
              </span>
              <p className="text-[10px] text-slate-500 font-mono mt-1">
                [Form V - Rule 14, Schedule IX of Legal Metrology (General) Rules, 2011]
              </p>
            </div>
          </div>

          {/* Certificate Meta Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-400 block">Certificate Number</span>
              <span className="font-mono font-bold text-[#002B49] text-xs sm:text-sm">{certificateNumber}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-400 block">License Number</span>
              <span className="font-mono font-bold text-slate-800">{shop.license_number}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-400 block">Verification Status</span>
              <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md text-[11px]">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                Approved & Stamped
              </span>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-400 block">Jurisdiction District</span>
              <span className="font-bold text-slate-800">{shop.district || 'Rohtak'}, Haryana</span>
            </div>
          </div>

          {/* Core Specifications & QR Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            {/* Left Specs (2 Cols) */}
            <div className="md:col-span-2 space-y-4">
              <div className="border-b border-slate-200 pb-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  Commercial Enterprise & Establishment
                </span>
                <div className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2 mt-0.5">
                  <Building2 className="w-4 h-4 text-[#002B49] shrink-0" />
                  <span>{shop.shop_name}</span>
                </div>
                {shop.owner_name && (
                  <p className="text-xs text-slate-600 mt-0.5">
                    Proprietor: <strong className="text-slate-800">{shop.owner_name}</strong>
                  </p>
                )}
                {shop.address && (
                  <p className="text-[11px] text-slate-500 mt-0.5">{shop.address}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Scale / Instrument Type</span>
                  <span className="font-bold text-slate-900 text-xs mt-0.5 block">
                    {shop.instrument_type || 'Counter Scale Class III'}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Capacity: {shop.capacity || '30 kg / e=2g'} • {shop.make_model || 'Essae DS-852'}
                  </span>
                </div>

                <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block flex items-center gap-1">
                    <Clock className="w-3 h-3 text-emerald-600" />
                    LMO Approval Timestamp
                  </span>
                  <span className="font-bold text-slate-900 text-xs mt-0.5 block font-mono">
                    {approvalDate}
                  </span>
                  <span className="text-[10px] text-emerald-700 font-semibold">
                    ✓ Verified via Mobile App
                  </span>
                </div>
              </div>

              {/* GPS Coordinates Geo-Stamp Badge */}
              <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-xs flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                  <MapPin className="w-4 h-4" />
                </div>
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-emerald-900 text-xs">Verified GPS Location Coordinates:</span>
                    <span className="font-mono text-emerald-800 font-black bg-white px-2 py-0.5 rounded-md border border-emerald-300 text-[11px]">
                      {lat.toFixed(5)}° N, {lng.toFixed(5)}° E
                    </span>
                  </div>
                  <p className="text-[11px] text-emerald-700">
                    Geotagged proof captured in-situ by authorized Legal Metrology Officer via mobile device GPS sensor.
                  </p>
                </div>
              </div>
            </div>

            {/* Right: Live QR Code Card */}
            <div className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-2xl border border-slate-200 text-center shadow-xs">
              <div className="p-2.5 bg-white rounded-xl shadow-xs border border-slate-200 inline-block">
                <QRCodeSVG
                  value={qrPayload}
                  size={140}
                  level="H"
                  includeMargin={false}
                  fgColor="#002B49"
                />
              </div>
              <div className="mt-2.5 space-y-1">
                <div className="inline-flex items-center gap-1 text-emerald-700 font-black text-xs">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Scan to Verify</span>
                </div>
                <p className="text-[10px] text-slate-400 font-mono">
                  ID: {shop.id || shop.license_number}
                </p>
                <p className="text-[9px] text-slate-500 max-w-[150px]">
                  Encodes Shop ID, Status, Coordinates &amp; Approval Stamp
                </p>
              </div>
            </div>
          </div>

          {/* Bottom Authority & Seal Footnotes */}
          <div className="pt-6 border-t border-slate-200 grid grid-cols-2 gap-4 text-xs">
            <div>
              <div className="border-b border-slate-400 w-44 pb-1 mb-1">
                <span className="font-mono text-[11px] font-bold text-slate-800">Inspector R. K. Sharma</span>
              </div>
              <p className="text-[10px] font-bold uppercase text-slate-500">Legal Metrology Officer (LMO)</p>
              <p className="text-[10px] text-slate-400">Department of Legal Metrology, Haryana</p>
            </div>
            <div className="text-right flex flex-col items-end">
              <div className="w-16 h-16 rounded-full border-2 border-dashed border-[#002B49] flex items-center justify-center text-center p-1 text-[8px] font-bold text-[#002B49] uppercase leading-tight bg-slate-50">
                Statutory Stamping Seal
              </div>
              <p className="text-[9px] text-slate-400 mt-1">Valid for 12 months under Legal Metrology Act, 2009</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
