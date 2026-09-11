'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase-client';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { BackButton } from '@/components/common/BackButton';
import {
  Building2,
  ShieldCheck,
  CheckCircle2,
  Clock,
  XCircle,
  Search,
  RefreshCw,
  Filter,
  Sliders,
  FileSpreadsheet,
  MapPin,
  Award,
  AlertTriangle,
  X,
  ExternalLink,
  ChevronRight,
  Scale,
  FileBadge,
  UserCheck,
} from 'lucide-react';

export interface DocaTraderRecord {
  id: string;
  shop_name: string;
  owner_name?: string;
  license_number: string;
  district: string;
  status: 'Pending_Inspection' | 'Under_Review' | 'Approved' | 'Rejected' | string;
  address?: string;
  instrument_type?: string;
  capacity?: string;
  lmo_id?: string;
  digital_signature?: string;
  rejection_reason?: string;
  updated_at?: string;
}

const SEED_DOCA_RECORDS: DocaTraderRecord[] = [
  {
    id: 'ROH-TR-001',
    shop_name: 'Sharma Kirana & General Store',
    owner_name: 'Ramesh Kumar Sharma',
    license_number: 'HR-LMO-ROH-2026-042',
    district: 'Rohtak',
    status: 'Pending_Inspection',
    address: 'Booth 12, Main Market, Model Town, Rohtak - 124001',
    instrument_type: 'Electronic Tabletop Scale (30 kg Class III)',
    capacity: '30 kg / e=2g',
    lmo_id: 'officer.rohtak@gov.in',
    updated_at: new Date().toISOString(),
  },
  {
    id: 'ROH-TR-002',
    shop_name: 'Haryana Gold & Diamond Jewelers',
    owner_name: 'Vikram Soni',
    license_number: 'HR-LMO-ROH-2026-057',
    district: 'Rohtak',
    status: 'Under_Review',
    address: 'Sarafa Bazar, Near Quilla Mohalla, Rohtak - 124001',
    instrument_type: 'High Precision Gold Balance (Class II)',
    capacity: '600 g / e=0.01g',
    lmo_id: 'officer.rohtak@gov.in',
    updated_at: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'ROH-TR-003',
    shop_name: 'Kisan Krishi Agro Mandi Depot',
    owner_name: 'Dharmender Hooda',
    license_number: 'HR-LMO-ROH-2026-093',
    district: 'Rohtak',
    status: 'Approved',
    address: 'Shed No. 7, New Grain Market, Rohtak - 124001',
    instrument_type: 'Platform Scale (300 kg)',
    capacity: '300 kg / e=50g',
    lmo_id: 'officer.rohtak@gov.in',
    digital_signature: 'GATC-SIG-8F92A9C4D2E1F083-B745E69A',
    updated_at: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: 'ROH-TR-004',
    shop_name: 'Delhi Bypass Petrol & Diesel Fuel Station',
    owner_name: 'Baljeet Singh',
    license_number: 'HR-LMO-ROH-2026-112',
    district: 'Rohtak',
    status: 'Rejected',
    address: 'NH-9 Delhi Road, Rohtak - 124021',
    instrument_type: 'Fuel Dispensing Unit (Flow Meter)',
    capacity: '50 L/min standard flow',
    lmo_id: 'officer.rohtak@gov.in',
    rejection_reason: 'Seal mismatch or scale uncalibrated. Calibration drift exceeded permitted statutory limits.',
    updated_at: new Date(Date.now() - 10800000).toISOString(),
  },
  {
    id: 'HIS-TR-101',
    shop_name: 'Hisar Agro Mill & Grain Store',
    owner_name: 'Suresh Chand Bishnoi',
    license_number: 'HR-LMO-HIS-2026-081',
    district: 'Hisar',
    status: 'Pending_Inspection',
    address: 'Shop 14, Anaj Mandi, Hisar - 125001',
    instrument_type: 'Heavy Duty Platform Scale (500 kg)',
    capacity: '500 kg / e=100g',
    lmo_id: 'officer.hisar@gov.in',
    updated_at: new Date(Date.now() - 1800000).toISOString(),
  },
  {
    id: 'HIS-TR-102',
    shop_name: 'Jindal Steel & Alloys Weighbridge',
    owner_name: 'Navin Jindal',
    license_number: 'HR-LMO-HIS-2026-104',
    district: 'Hisar',
    status: 'Under_Review',
    address: 'Industrial Area Phase II, Hisar - 125005',
    instrument_type: 'Electronic Truck Weighbridge (Class IV)',
    capacity: '50 Ton / e=10kg',
    lmo_id: 'officer.hisar@gov.in',
    updated_at: new Date(Date.now() - 4200000).toISOString(),
  },
  {
    id: 'GUR-TR-201',
    shop_name: 'Cyber City Hypermarket & Deli',
    owner_name: 'Ananya Deshmukh',
    license_number: 'HR-LMO-GUR-2026-215',
    district: 'Gurugram',
    status: 'Approved',
    address: 'DLF Phase 2, Sector 25, Gurugram - 122002',
    instrument_type: 'Barcode Printing Scale (Class III)',
    capacity: '15 kg / e=5g',
    lmo_id: 'officer.gurugram@gov.in',
    digital_signature: 'GATC-SIG-GUR215-99A1C-84B2',
    updated_at: new Date(Date.now() - 8400000).toISOString(),
  },
  {
    id: 'FAR-TR-301',
    shop_name: 'Faridabad Cold Storage & Ice Depot',
    owner_name: 'Rajendra Prasad',
    license_number: 'HR-LMO-FAR-2026-309',
    district: 'Faridabad',
    status: 'Rejected',
    address: 'Plot 45, NH-19 Industrial Zone, Faridabad - 121003',
    instrument_type: 'Mechanical Platform Scale',
    capacity: '1000 kg / e=200g',
    lmo_id: 'officer.faridabad@gov.in',
    rejection_reason: 'Knife-edge pivot corrosion beyond allowable tolerance limits. Requires complete overhaul.',
    updated_at: new Date(Date.now() - 14400000).toISOString(),
  },
];

type TabType = 'Pending' | 'Verified' | 'Approved' | 'Rejected' | 'All';

export default function DocaDashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('Pending');
  const [users, setUsers] = useState<DocaTraderRecord[]>(SEED_DOCA_RECORDS);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Fetch real-time data from Supabase traders_list
  const fetchDocaData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('traders_list')
        .select('*')
        .order('created_at', { ascending: false });

      if (data && !error && data.length > 0) {
        const fetchedMap = new Map(data.map((d) => [d.id || d.license_number, d]));
        const merged = [...data];
        for (const seed of SEED_DOCA_RECORDS) {
          if (!fetchedMap.has(seed.id) && !fetchedMap.has(seed.license_number)) {
            merged.push(seed);
          }
        }
        setUsers(merged as DocaTraderRecord[]);
      } else {
        setUsers(SEED_DOCA_RECORDS);
      }
    } catch (err) {
      console.warn('Note on Supabase traders_list fetch for DoCA:', err);
      setUsers(SEED_DOCA_RECORDS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocaData();
  }, []);

  // Compute status counts across all records
  const totalCount = users.length;
  const pendingCount = users.filter((u) => {
    const s = (u.status || '').toLowerCase();
    return s === 'pending' || s === 'pending_inspection';
  }).length;

  const verifiedCount = users.filter((u) => {
    const s = (u.status || '').toLowerCase();
    return s === 'under_review' || s === 'verified';
  }).length;

  const approvedCount = users.filter((u) => {
    const s = (u.status || '').toLowerCase();
    return s === 'approved' || s === 'passed';
  }).length;

  const rejectedCount = users.filter((u) => {
    const s = (u.status || '').toLowerCase();
    return s === 'rejected' || s === 'failed';
  }).length;

  // Conditionally filter the displayed list based on activeTab
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      // 1. Tab filtering (strict match based on activeTab)
      const statusNorm = (u.status || '').toLowerCase();
      let matchesTab = true;

      if (activeTab === 'Pending') {
        matchesTab = statusNorm === 'pending' || statusNorm === 'pending_inspection';
      } else if (activeTab === 'Verified') {
        matchesTab = statusNorm === 'under_review' || statusNorm === 'verified';
      } else if (activeTab === 'Approved') {
        matchesTab = statusNorm === 'approved' || statusNorm === 'passed';
      } else if (activeTab === 'Rejected') {
        matchesTab = statusNorm === 'rejected' || statusNorm === 'failed';
      } else if (activeTab === 'All') {
        matchesTab = true;
      }

      // 2. Search query filtering
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        q === '' ||
        (u.shop_name && u.shop_name.toLowerCase().includes(q)) ||
        (u.owner_name && u.owner_name.toLowerCase().includes(q)) ||
        (u.license_number && u.license_number.toLowerCase().includes(q)) ||
        (u.district && u.district.toLowerCase().includes(q)) ||
        (u.instrument_type && u.instrument_type.toLowerCase().includes(q));

      return matchesTab && matchesSearch;
    });
  }, [users, activeTab, searchQuery]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans text-slate-900">
      <Header activeTab="doca-command" setActiveTab={() => {}} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* DoCA Central Directorate Banner */}
        <div className="bg-[#002B49] text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
          <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none">
            <Building2 className="w-64 h-64 text-white" />
          </div>

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <BackButton label="Back" variant="header" />
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs font-bold border border-amber-400/30">
                  <Award className="w-3.5 h-3.5 text-amber-400" />
                  <span>Department of Consumer Affairs (DoCA) • Central Metrology Command</span>
                </div>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                National Legal Metrology Verification &amp; Registry Portal
              </h1>
              <p className="text-xs text-slate-300 max-w-2xl">
                Real-time central regulatory oversight over jurisdictional LMO inspections, GATC lab test sign-offs, and statewide merchant compliance.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <button
                onClick={fetchDocaData}
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-amber-400 hover:bg-amber-300 text-[#002B49] font-black text-xs shadow-md transition-all cursor-pointer whitespace-nowrap disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh National Registry</span>
              </button>
            </div>
          </div>
        </div>

        {/* KPI Metrics Cards (Clickable to switch tab) */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Pending Inspection */}
          <button
            type="button"
            onClick={() => setActiveTab('Pending')}
            className={`p-5 rounded-2xl border text-left transition-all cursor-pointer shadow-xs ${
              activeTab === 'Pending'
                ? 'bg-amber-50/90 border-amber-400 ring-2 ring-amber-500/20 shadow-sm'
                : 'bg-white border-slate-200 hover:border-amber-300'
            }`}
          >
            <div className="text-slate-500 text-xs font-semibold flex items-center justify-between">
              <span>Pending Inspection</span>
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
            <div className="mt-2 text-2xl font-black text-amber-700">{pendingCount}</div>
            <div className="text-[11px] text-amber-600 font-semibold mt-0.5">Awaiting LMO Visit</div>
          </button>

          {/* Verified / Under Review */}
          <button
            type="button"
            onClick={() => setActiveTab('Verified')}
            className={`p-5 rounded-2xl border text-left transition-all cursor-pointer shadow-xs ${
              activeTab === 'Verified'
                ? 'bg-blue-50/90 border-blue-400 ring-2 ring-blue-500/20 shadow-sm'
                : 'bg-white border-slate-200 hover:border-blue-300'
            }`}
          >
            <div className="text-slate-500 text-xs font-semibold flex items-center justify-between">
              <span>Verified / Review</span>
              <UserCheck className="w-4 h-4 text-blue-600" />
            </div>
            <div className="mt-2 text-2xl font-black text-blue-700">{verifiedCount}</div>
            <div className="text-[11px] text-blue-600 font-semibold mt-0.5">Under GATC Review</div>
          </button>

          {/* Approved / Passed */}
          <button
            type="button"
            onClick={() => setActiveTab('Approved')}
            className={`p-5 rounded-2xl border text-left transition-all cursor-pointer shadow-xs ${
              activeTab === 'Approved'
                ? 'bg-emerald-50/90 border-emerald-400 ring-2 ring-emerald-500/20 shadow-sm'
                : 'bg-white border-slate-200 hover:border-emerald-300'
            }`}
          >
            <div className="text-slate-500 text-xs font-semibold flex items-center justify-between">
              <span>Approved &amp; Stamped</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="mt-2 text-2xl font-black text-emerald-700">{approvedCount}</div>
            <div className="text-[11px] text-emerald-600 font-semibold mt-0.5">Digitally Signed</div>
          </button>

          {/* Rejected / Deficiency */}
          <button
            type="button"
            onClick={() => setActiveTab('Rejected')}
            className={`p-5 rounded-2xl border text-left transition-all cursor-pointer shadow-xs ${
              activeTab === 'Rejected'
                ? 'bg-rose-50/90 border-rose-400 ring-2 ring-rose-500/20 shadow-sm'
                : 'bg-white border-slate-200 hover:border-rose-300'
            }`}
          >
            <div className="text-slate-500 text-xs font-semibold flex items-center justify-between">
              <span>Deficiency / Rejected</span>
              <XCircle className="w-4 h-4 text-rose-600" />
            </div>
            <div className="mt-2 text-2xl font-black text-rose-700">{rejectedCount}</div>
            <div className="text-[11px] text-rose-600 font-semibold mt-0.5">Notice Issued</div>
          </button>

          {/* All Applications */}
          <button
            type="button"
            onClick={() => setActiveTab('All')}
            className={`p-5 rounded-2xl border text-left transition-all cursor-pointer shadow-xs ${
              activeTab === 'All'
                ? 'bg-slate-100 border-slate-400 ring-2 ring-slate-500/20 shadow-sm'
                : 'bg-white border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="text-slate-500 text-xs font-semibold flex items-center justify-between">
              <span>All Registered</span>
              <Building2 className="w-4 h-4 text-[#002B49]" />
            </div>
            <div className="mt-2 text-2xl font-black text-slate-900">{totalCount}</div>
            <div className="text-[11px] text-slate-500 font-semibold mt-0.5">National Database</div>
          </button>
        </div>

        {/* Tab Buttons & Search Section */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden space-y-4">
          <div className="p-6 border-b border-slate-100 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                  <span>Directory View:</span>
                  <span className="text-[#002B49]">{activeTab} Applications</span>
                </h2>
                <p className="text-xs text-slate-500">
                  Showing merchants filtered strictly by the &quot;{activeTab}&quot; verification status.
                </p>
              </div>

              {/* Wire up the tab buttons so clicking them updates activeTab state */}
              <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setActiveTab('Pending')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'Pending'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Pending ({pendingCount})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('Verified')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'Verified'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Verified ({verifiedCount})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('Approved')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'Approved'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Approved ({approvedCount})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('Rejected')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'Rejected'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Rejected ({rejectedCount})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('All')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'All'
                      ? 'bg-[#002B49] text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All ({totalCount})
                </button>
              </div>
            </div>

            {/* Search Bar */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Search className="w-4 h-4 text-slate-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by Shop Name, Owner, License, District, or Scale Type..."
                className="w-full pl-10 pr-10 py-2.5 bg-slate-50 hover:bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#002B49] transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Users Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5">Enterprise / Owner</th>
                  <th className="px-6 py-3.5">License &amp; District</th>
                  <th className="px-6 py-3.5">Scale Specification</th>
                  <th className="px-6 py-3.5">Assigned LMO</th>
                  <th className="px-6 py-3.5">Verification Status</th>
                  <th className="px-6 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <Filter className="w-8 h-8 text-slate-300 stroke-[1.5]" />
                        <p className="text-sm font-bold text-slate-600">
                          No {activeTab.toLowerCase()} records found
                        </p>
                        <p className="text-xs text-slate-400">
                          {searchQuery
                            ? `No records matching "${searchQuery}" in the ${activeTab} tab.`
                            : `There are currently no users in the "${activeTab}" status category.`}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => {
                    const statusLower = (user.status || '').toLowerCase();
                    let badgeColor = 'bg-amber-100 text-amber-800 border-amber-200';
                    let statusLabel = 'Pending Inspection';

                    if (statusLower === 'approved' || statusLower === 'passed') {
                      badgeColor = 'bg-emerald-100 text-emerald-800 border-emerald-200';
                      statusLabel = 'Approved / Stamped';
                    } else if (statusLower === 'under_review' || statusLower === 'verified') {
                      badgeColor = 'bg-blue-100 text-blue-800 border-blue-200';
                      statusLabel = 'Verified (Under Review)';
                    } else if (statusLower === 'rejected' || statusLower === 'failed') {
                      badgeColor = 'bg-rose-100 text-rose-800 border-rose-200';
                      statusLabel = 'Rejected';
                    }

                    return (
                      <tr
                        key={user.id || user.license_number}
                        className="hover:bg-slate-50/80 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="font-extrabold text-slate-900 text-xs sm:text-sm">
                            {user.shop_name}
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            Owner: <span className="font-semibold text-slate-700">{user.owner_name || 'N/A'}</span>
                          </div>
                          {user.address && (
                            <div className="text-[11px] text-slate-400 truncate max-w-xs mt-0.5">
                              {user.address}
                            </div>
                          )}
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-mono text-xs font-bold text-[#002B49]">
                            {user.license_number}
                          </div>
                          <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-1">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            <span>{user.district || 'Haryana'}</span>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <div className="font-semibold text-slate-800 text-xs">
                            {user.instrument_type || 'Electronic Scale'}
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono">
                            {user.capacity || 'Standard Capacity'}
                          </div>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-[11px] font-medium border border-slate-200">
                            {user.lmo_id || 'officer.assigned@gov.in'}
                          </span>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${badgeColor}`}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                            <span>{statusLabel}</span>
                          </span>
                          {user.rejection_reason && (
                            <p className="text-[10px] text-rose-600 font-medium max-w-xs mt-1 truncate" title={user.rejection_reason}>
                              {user.rejection_reason}
                            </p>
                          )}
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-2">
                            {statusLower === 'approved' && (
                              <Link
                                href={`/certificate/${encodeURIComponent(user.id || user.license_number)}`}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold text-xs transition-colors border border-emerald-200"
                              >
                                <FileBadge className="w-3.5 h-3.5" />
                                <span>Certificate</span>
                              </Link>
                            )}
                            <Link
                              href={`/verify/${encodeURIComponent(user.id || user.license_number)}`}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold text-xs transition-colors"
                            >
                              <span>Inspect</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>
              Showing <strong className="text-slate-800">{filteredUsers.length}</strong> of{' '}
              <strong className="text-slate-800">{totalCount}</strong> national records
            </span>
            <span className="font-mono text-[11px]">
              DoCA Directorate • e-Māpan 2.0 Central Node
            </span>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
