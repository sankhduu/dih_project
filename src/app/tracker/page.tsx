'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ApplicationTracker } from '@/components/applicant/ApplicationTracker';
import { ClipboardList, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function TrackerPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<string>('applicant-applications');

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (tab === 'applicant-dashboard') {
      router.push('/trader/dashboard');
    } else if (tab === 'applicant-deficiencies') {
      router.push('/notices');
    } else if (tab === 'public-verify') {
      router.push('/auth/citizen');
    }
  };

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
                <ClipboardList className="w-6 h-6 text-[#002B49]" />
                <span>Application Lifecycle Tracker</span>
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Monitor statutory stamping stages, scheduled field visits, and verification outcomes in real time.
              </p>
            </div>
          </div>
        </div>

        {/* Application Tracker Interactive Component */}
        <ApplicationTracker />
      </main>

      <Footer />
    </div>
  );
}

