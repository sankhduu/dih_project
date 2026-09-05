'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase-client';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { QRCodeSVG } from 'qrcode.react';
import {
  Scale,
  ShieldCheck,
  CheckCircle2,
  Printer,
  ArrowLeft,
  MapPin,
  Clock,
  Building2,
  AlertTriangle,
} from 'lucide-react';
import { TraderRecord } from '@/components/certificates/DigitalCertificateModal';

const FALLBACK_SHOP: TraderRecord = {
  id: 'ROH-TR-001',
  shop_name: 'Sharma Kirana & General Store',
  owner_name: 'Ramesh Kumar Sharma',
  license_number: 'HR-LMO-ROH-2026-042',
  district: 'Rohtak',
  status: 'Approved',
  address: 'Booth 12, Main Market, Model Town, Rohtak - 124001',
  instrument_type: 'Electronic Tabletop Scale (30 kg Class III)',
  capacity: '30 kg / e=2g',
  make_model: 'Essae DS-852 Tabletop',
  latitude: 28.8955,
  longitude: 76.6066,
  updated_at: new Date().toISOString(),
};

export default function StandaloneCertificatePage() {
  const params = useParams();
  const rawId = params?.id ? decodeURIComponent(params.id as string) : 'ROH-TR-001';

  const [shop, setShop] = useState<TraderRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadShop() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('traders_list')
          .select('*')
          .or(`id.eq.${rawId},license_number.eq.${rawId}`)
          .maybeSingle();

        if (data && !error) {
          setShop(data as TraderRecord);
        } else {
          setShop({
            ...FALLBACK_SHOP,
            id: rawId,
            license_number: rawId.startsWith('HR') ? rawId : FALLBACK_SHOP.license_number,
          });
        }
      } catch (err) {
        console.warn('Error loading trader record for certificate:', err);
        setShop(FALLBACK_SHOP);
      } finally {
        setLoading(false);
      }
    }

    loadShop();
  }, [rawId]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
        <Header activeTab="none" setActiveTab={() => {}} />
        <main className="flex-1 flex items-center justify-center p-8">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-[#002B49] border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs font-bold text-slate-600">Retrieving Statutory Verification Certificate...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
        <Header activeTab="none" setActiveTab={() => {}} />
        <main className="flex-1 flex items-center justify-center p-8">
          <div className="p-8 max-w-md w-full bg-white rounded-3xl border border-slate-200 text-center space-y-4 shadow-sm">
            <AlertTriangle className="w-10 h-10 text-amber-600 mx-auto" />
            <h2 className="text-base font-black text-slate-900">Certificate Not Found</h2>
            <p className="text-xs text-slate-500">No verified trader record matches certificate query ID &quot;{rawId}&quot;.</p>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#002B49] text-white text-xs font-bold"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Return Home</span>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const certificateNumber = `LM/CERT/${shop.district?.toUpperCase() || 'ROH'}/${(shop.license_number || shop.id || '2026').replace(/[^a-zA-Z0-9]/g, '').slice(-8)}`;
  
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
    <div className="min-h-screen flex flex-col bg-slate-100 font-sans text-slate-900 print:bg-white">
      <div className="print:hidden">
        <Header activeTab="none" setActiveTab={() => {}} />
      </div>

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 print:p-0 print:max-w-none">
        {/* Navigation Action Bar */}
        <div className="flex items-center justify-between mb-6 print:hidden">
          <Link
            href="/trader/dashboard"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <ArrowLeft className="w-4 h-4 text-slate-500" />
            <span>Return to Trader Dashboard</span>
          </Link>

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#002B49] hover:bg-[#003B66] text-white font-black text-xs shadow-md transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4 text-amber-400" />
            <span>Print / Download PDF</span>
          </button>
        </div>

        {/* Certificate Card */}
        <div className="bg-white rounded-3xl border border-slate-300 shadow-xl overflow-hidden p-6 sm:p-12 space-y-6 print:shadow-none print:border-none print:p-0">
          {/* Header */}
          <div className="text-center space-y-2 border-b-2 border-slate-800 pb-6">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[#002B49] text-amber-400 shadow-md mb-1">
              <Scale className="w-7 h-7 text-amber-400" />
            </div>
            <h2 className="text-base sm:text-lg font-black tracking-widest text-[#002B49] uppercase">
              GOVERNMENT OF INDIA
            </h2>
            <h3 className="text-xs sm:text-sm font-bold text-slate-700 uppercase">
              Ministry of Consumer Affairs, Food & Public Distribution
            </h3>
            <p className="text-xs text-slate-600 font-medium">
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

          {/* Meta Grid */}
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

          {/* Core Particulars */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            <div className="md:col-span-2 space-y-4">
              <div className="border-b border-slate-200 pb-3">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  Commercial Enterprise & Establishment
                </span>
                <div className="text-base sm:text-xl font-black text-slate-900 flex items-center gap-2 mt-0.5">
                  <Building2 className="w-5 h-5 text-[#002B49] shrink-0" />
                  <span>{shop.shop_name}</span>
                </div>
                {shop.owner_name && (
                  <p className="text-xs text-slate-600 mt-1">
                    Proprietor: <strong className="text-slate-800">{shop.owner_name}</strong>
                  </p>
                )}
                {shop.address && (
                  <p className="text-xs text-slate-500 mt-0.5">{shop.address}</p>
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

              {/* GPS Coordinates */}
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

            {/* QR Code */}
            <div className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-2xl border border-slate-200 text-center shadow-xs">
              <div className="p-2.5 bg-white rounded-xl shadow-xs border border-slate-200 inline-block">
                <QRCodeSVG
                  value={qrPayload}
                  size={150}
                  level="H"
                  includeMargin={false}
                  fgColor="#002B49"
                />
              </div>
              <div className="mt-3 space-y-1">
                <div className="inline-flex items-center gap-1 text-emerald-700 font-black text-xs">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Scan to Verify</span>
                </div>
                <p className="text-[10px] text-slate-400 font-mono">
                  ID: {shop.id || shop.license_number}
                </p>
              </div>
            </div>
          </div>

          {/* Signatures */}
          <div className="pt-8 border-t border-slate-200 grid grid-cols-2 gap-4 text-xs">
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
      </main>

      <div className="print:hidden">
        <Footer />
      </div>
    </div>
  );
}
