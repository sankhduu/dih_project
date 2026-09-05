'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { useMetrologyStore } from '@/lib/store';
import { OfficialDeficiencyMemoView } from '@/components/certificates/OfficialDeficiencyMemoView';
import { FileWarning, ArrowLeft, CheckCircle2, ShieldAlert } from 'lucide-react';
import Link from 'next/link';

export default function NoticesPage() {
  const router = useRouter();
  const { currentUser, deficiencyMemos } = useMetrologyStore();
  const [activeTab, setActiveTab] = useState<string>('applicant-deficiencies');

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (tab === 'applicant-dashboard') {
      router.push('/trader/dashboard');
    } else if (tab === 'applicant-applications') {
      router.push('/tracker');
    } else if (tab === 'public-verify') {
      router.push('/auth/citizen');
    }
  };

  // User-specific deficiency notices
  const userDeficiencies =
    currentUser.role === 'LMO'
      ? deficiencyMemos.filter((memo) => memo.officerId === currentUser.id)
      : currentUser.role === 'ADMIN'
      ? deficiencyMemos
      : deficiencyMemos.filter((memo) => memo.ownerId === currentUser.id);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Header activeTab={activeTab} setActiveTab={handleTabChange} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-200/60 transition-colors"
              title="Return to Dashboard"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2.5">
                <FileWarning className="w-6 h-6 text-rose-600" />
                <span>Statutory Deficiency Notices (Form VI)</span>
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Statutory notices requiring repair, recalibration, and rectification under Rule 14 before legal cure deadlines.
              </p>
            </div>
          </div>
        </div>

        {/* Notices Section */}
        <div className="space-y-6">
          {userDeficiencies.length > 0 ? (
            <div className="space-y-4">
              <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-center gap-3 text-rose-900">
                <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />
                <div className="text-xs">
                  <span className="font-bold">Active Deficiency Notices Found: </span>
                  Please rectify the calibration deviations and submit proof of compliance within the statutory deadline.
                </div>
              </div>

              {userDeficiencies.map((memo) => (
                <OfficialDeficiencyMemoView key={memo.id} memo={memo} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-2xs space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">All Instruments In Compliance</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                There are no active deficiency notices (Form VI) issued against your registered weighing or measuring instruments.
              </p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
