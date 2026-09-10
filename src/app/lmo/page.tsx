'use client';

import React, { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { OfficerDashboard } from '@/components/officer/OfficerDashboard';

export default function LMODashboardPage() {
  const [headerTab, setHeaderTab] = useState<string>('inspection_queue');

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans antialiased">
      <Header activeTab={headerTab} setActiveTab={setHeaderTab} />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <OfficerDashboard initialTab={headerTab} />
      </main>
      <Footer />
    </div>
  );
}
