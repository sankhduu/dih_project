'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { OfficerDashboard, LmoTabType } from '@/components/officer/OfficerDashboard';
import { useMetrologyStore } from '@/lib/store';

function LMODashboardContent() {
  const searchParams = useSearchParams();
  const tabFromQuery = searchParams.get('tab') as LmoTabType | null;
  const [headerTab, setHeaderTab] = useState<string>(tabFromQuery || 'inspection_queue');
  const { currentUser, switchRole } = useMetrologyStore();

  useEffect(() => {
    if (currentUser.role !== 'LMO') {
      switchRole('LMO');
    }
  }, [currentUser.role, switchRole]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans antialiased">
      <Header activeTab={headerTab} setActiveTab={setHeaderTab} />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <OfficerDashboard
          initialTab={tabFromQuery || headerTab}
          onTabChange={(t) => setHeaderTab(t)}
        />
      </main>
      <Footer />
    </div>
  );
}

export default function LMODashboardPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center text-xs text-slate-500">Loading LMO Portal...</div>}>
      <LMODashboardContent />
    </Suspense>
  );
}
