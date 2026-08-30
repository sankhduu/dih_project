'use client';

import React, { use } from 'react';
import { useMetrologyStore } from '@/lib/store';
import { OfficialCertificateView } from '@/components/certificates/OfficialCertificateView';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ShieldCheck, AlertOctagon, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function VerifyPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { certificates } = useMetrologyStore();

  const certNumber = decodeURIComponent(resolvedParams.id).toUpperCase();
  const cert = certificates.find(
    (c) =>
      c.certificateNumber.toUpperCase() === certNumber ||
      c.id.toUpperCase() === certNumber ||
      c.instrument.serialNumber.toUpperCase() === certNumber
  );

  return (
    <div className="flex flex-col min-h-screen bg-slate-100/80">
      <header className="bg-[#002B49] text-white py-4 px-6 shadow-md flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors flex items-center gap-1 text-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Portal</span>
          </Link>
          <span className="font-extrabold text-sm tracking-tight text-white">
            e-Māpan <span className="text-amber-400">Public QR Verification</span>
          </span>
        </div>
        <span className="text-xs text-slate-300 font-mono">
          Query: {certNumber}
        </span>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-8">
        {cert ? (
          <OfficialCertificateView certificate={cert} />
        ) : (
          <div className="bg-white rounded-3xl p-12 text-center border-2 border-rose-300 shadow-xl space-y-4 max-w-lg mx-auto my-12">
            <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertOctagon className="w-10 h-10" />
            </div>
            <h2 className="text-xl font-extrabold text-rose-950">
              INVALID OR UNREGISTERED CERTIFICATE
            </h2>
            <p className="text-xs text-rose-700">
              The certificate ID <span className="font-mono font-bold bg-rose-100 px-2 py-0.5 rounded">{certNumber}</span> was not found in the Government of India Legal Metrology central registry.
            </p>
            <Link
              href="/"
              className="inline-block px-5 py-2.5 bg-[#002B49] text-white text-xs font-bold rounded-xl shadow-md"
            >
              Return to Central Search
            </Link>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
