'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase-client';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { useMetrologyStore } from '@/lib/store';
import { DigitalCertificateModal, TraderRecord } from '@/components/certificates/DigitalCertificateModal';
import {
  Scale,
  Building2,
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  PlusCircle,
  FileBadge,
  Microscope,
  FlaskConical,
  Award,
  Search,
  RefreshCw,
  MapPin,
  Sparkles,
  QrCode,
  Filter,
  X,
  Radio,
} from 'lucide-react';

const SEED_SHOPS: TraderRecord[] = [
  {
    id: 'ROH-TR-001',
    shop_name: 'Sharma Kirana & General Store',
    owner_name: 'Ramesh Kumar Sharma',
    license_number: 'HR-LMO-ROH-2026-042',
    district: 'Rohtak',
    status: 'Pending',
    address: 'Booth 12, Main Market, Model Town, Rohtak - 124001',
    instrument_type: 'Electronic Tabletop Scale (30 kg Class III)',
    capacity: '30 kg / e=2g',
    make_model: 'Essae DS-852 Tabletop',
    latitude: null,
    longitude: null,
    updated_at: new Date().toISOString(),
  },
  {
    id: 'ROH-TR-002',
    shop_name: 'Mohan Kirana Store',
    owner_name: 'Mohan Lal Verma',
    license_number: 'HR-LMO-ROH-2026-068',
    district: 'Rohtak',
    status: 'Pending',
    address: 'Shop 5, Railway Road, Rohtak - 124001',
    instrument_type: 'Counter Scale Class III',
    capacity: '20 kg / e=2g',
    make_model: 'Phoenix Scales PS-20',
    latitude: null,
    longitude: null,
    updated_at: new Date().toISOString(),
  },
  {
    id: 'ROH-TR-003',
    shop_name: 'Haryana Gold & Diamond Jewelers',
    owner_name: 'Vikram Soni',
    license_number: 'HR-LMO-ROH-2026-057',
    district: 'Rohtak',
    status: 'Pending',
    address: 'Sarafa Bazar, Near Quilla Mohalla, Rohtak - 124001',
    instrument_type: 'High Precision Gold Balance (Class II)',
    capacity: '600 g / e=0.01g',
    make_model: 'Sartorius Gold Series GS-600',
    latitude: null,
    longitude: null,
    updated_at: new Date().toISOString(),
  },
  {
    id: 'ROH-TR-004',
    shop_name: 'Kisan Krishi Agro Mandi Depot',
    owner_name: 'Dharmender Hooda',
    license_number: 'HR-LMO-ROH-2026-093',
    district: 'Rohtak',
    status: 'Pending',
    address: 'Shed No. 7, New Grain Market, Rohtak - 124001',
    instrument_type: 'Platform Scale (300 kg)',
    capacity: '300 kg / e=50g',
    make_model: 'Crown Weighing CW-300',
    latitude: null,
    longitude: null,
    updated_at: new Date().toISOString(),
  },
  {
    id: 'HIS-TR-101',
    shop_name: 'Hisar Agro Mill & Grain Store',
    owner_name: 'Suresh Chand Bishnoi',
    license_number: 'HR-LMO-HIS-2026-081',
    district: 'Hisar',
    status: 'Pending',
    address: 'Shop 14, Anaj Mandi, Hisar, Haryana - 125001',
    instrument_type: 'Platform Weighing Scale (500 kg)',
    capacity: '500 kg / e=50g',
    make_model: 'Avery Weight-Tronix AV-500',
    latitude: null,
    longitude: null,
    updated_at: new Date().toISOString(),
  },
  {
    id: 'HIS-TR-102',
    shop_name: 'Rajdhani Sweets & Dairy',
    owner_name: 'Sunil Kumar',
    license_number: 'HR-LMO-HIS-2026-119',
    district: 'Hisar',
    status: 'Pending',
    address: 'Plot 4, Urban Estate II, Hisar - 125005',
    instrument_type: 'Electronic Retail Counter Scale (30 kg)',
    capacity: '30 kg / e=2g',
    make_model: 'Essae Teraoka DS-215',
    latitude: null,
    longitude: null,
    updated_at: new Date().toISOString(),
  },
];

export default function GatcDashboardPage() {
  const { currentUser } = useMetrologyStore();

  // Master Data State
  const [shops, setShops] = useState<TraderRecord[]>(SEED_SHOPS);
  const [loading, setLoading] = useState<boolean>(true);
  const [flashingRowId, setFlashingRowId] = useState<string | null>(null);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');

  // Certificate Modal State
  const [selectedCertificateShop, setSelectedCertificateShop] = useState<TraderRecord | null>(null);
  const [isCertificateOpen, setIsCertificateOpen] = useState<boolean>(false);

  // Real-time Toast Banner
  const [syncToast, setSyncToast] = useState<{
    visible: boolean;
    shopName: string;
    lat?: number | null;
    lng?: number | null;
  }>({
    visible: false,
    shopName: '',
  });

  // 1. Initial Data Fetch from Supabase traders_list
  const fetchShops = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('traders_list')
        .select('*')
        .order('created_at', { ascending: true });

      if (data && !error && data.length > 0) {
        // Merge Supabase records with seed shops to ensure Mohan Kirana Store and others are present
        const fetchedIds = new Set(data.map((d) => d.id || d.license_number));
        const merged = [...data];
        for (const seed of SEED_SHOPS) {
          if (!fetchedIds.has(seed.id) && !fetchedIds.has(seed.license_number)) {
            merged.push(seed);
          }
        }
        setShops(merged as TraderRecord[]);
      } else {
        setShops(SEED_SHOPS);
      }
    } catch (err) {
      console.warn('Note on Supabase traders_list fetch:', err);
      setShops(SEED_SHOPS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShops();
  }, []);

  // 2. Global Real-time Updates (Listening to the Mobile App)
  useEffect(() => {
    const channel = supabase
      .channel('table-db-changes')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'traders_list' },
        (payload) => {
          const updatedRow = payload.new as TraderRecord;
          if (!updatedRow) return;

          // Instantly update the row for that specific shop (e.g. Mohan Kirana Store / Sharma Kirana)
          setShops((prev) => {
            const exists = prev.some(
              (s) => s.id === updatedRow.id || s.license_number === updatedRow.license_number
            );
            if (exists) {
              return prev.map((s) =>
                s.id === updatedRow.id || s.license_number === updatedRow.license_number
                  ? { ...s, ...updatedRow }
                  : s
              );
            }
            return [updatedRow, ...prev];
          });

          // Trigger the temporary green flash animation on the updated row
          const highlightId = (updatedRow.id || updatedRow.license_number || '').toString();
          setFlashingRowId(highlightId);
          setTimeout(() => {
            setFlashingRowId((curr) => (curr === highlightId ? null : curr));
          }, 4500);

          // Show realtime alert toast banner
          setSyncToast({
            visible: true,
            shopName: updatedRow.shop_name,
            lat: updatedRow.latitude,
            lng: updatedRow.longitude,
          });
          setTimeout(() => {
            setSyncToast((prev) => ({ ...prev, visible: false }));
          }, 7000);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Filtered Shops Calculation
  const filteredShops = useMemo(() => {
    return shops.filter((s) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        q === '' ||
        s.shop_name.toLowerCase().includes(q) ||
        (s.owner_name && s.owner_name.toLowerCase().includes(q)) ||
        s.license_number.toLowerCase().includes(q) ||
        (s.district && s.district.toLowerCase().includes(q));

      const matchesStatus =
        selectedStatus === 'All' ||
        (s.status || '').toLowerCase() === selectedStatus.toLowerCase();

      return matchesSearch && matchesStatus;
    });
  }, [shops, searchQuery, selectedStatus]);

  // Statistics calculation
  const totalCount = shops.length;
  const approvedCount = shops.filter((s) => (s.status || '').toLowerCase() === 'approved').length;
  const pendingCount = shops.filter((s) => (s.status || '').toLowerCase() === 'pending').length;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans text-slate-900">
      <Header activeTab="gatc-queue" setActiveTab={() => {}} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Real-time Sync Alert Banner */}
        {syncToast.visible && (
          <div className="p-4 sm:p-5 rounded-2xl bg-emerald-600 text-white shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 text-white flex items-center justify-center shrink-0">
                <Sparkles className="w-6 h-6 text-amber-300" />
              </div>
              <div>
                <h4 className="font-black text-sm text-white flex items-center gap-1.5">
                  <span>⚡ Real-time Sync Received from LMO Mobile App!</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-300 animate-ping"></span>
                </h4>
                <p className="text-xs text-emerald-100 mt-0.5">
                  <strong>{syncToast.shopName}</strong> has been updated to <strong>Approved</strong> with verified GPS:{' '}
                  <span className="font-mono bg-emerald-700/80 px-1.5 py-0.5 rounded text-white">
                    {syncToast.lat?.toFixed(5)}, {syncToast.lng?.toFixed(5)}
                  </span>
                </p>
              </div>
            </div>
            <button
              onClick={() => setSyncToast((prev) => ({ ...prev, visible: false }))}
              className="px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-xs font-bold transition-colors cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* GATC Laboratory Profile Banner */}
        <div className="bg-[#002B49] text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
          <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none">
            <Microscope className="w-64 h-64 text-white" />
          </div>

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-400/20 text-emerald-300 text-xs font-bold border border-emerald-400/30">
                <Award className="w-3.5 h-3.5" />
                <span>Govt. Approved Test Centre (GATC) / Admin Dashboard • DoCA Notified</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {currentUser.fullName || 'National Calibration & Central Metrology Centre (GATC)'}
              </h1>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300">
                <span className="flex items-center gap-1 font-mono">
                  <Award className="w-3.5 h-3.5 text-amber-400" />
                  <span>Accreditation: GATC/HR/2026/01</span>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                  <span>Supabase Realtime Sync: Active</span>
                </span>
                <span>•</span>
                <span>Jurisdiction: Haryana (Rohtak &amp; Hisar Districts)</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <button
                onClick={fetchShops}
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-amber-400 hover:bg-amber-300 text-[#002B49] font-black text-xs shadow-md transition-all cursor-pointer whitespace-nowrap disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh Master Data</span>
              </button>
            </div>
          </div>
        </div>

        {/* Metric Cards Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="text-slate-500 text-xs font-semibold flex items-center justify-between">
              <span>Total Registered Shops</span>
              <Building2 className="w-4 h-4 text-blue-600" />
            </div>
            <div className="mt-2 text-2xl font-black text-slate-900">{totalCount}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Central Legal Metrology Directory</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="text-slate-500 text-xs font-semibold flex items-center justify-between">
              <span>Approved &amp; Stamped</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="mt-2 text-2xl font-black text-emerald-700">{approvedCount}</div>
            <div className="text-[11px] text-emerald-600 font-semibold mt-0.5">Schedule IX QR Certificates Issued</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="text-slate-500 text-xs font-semibold flex items-center justify-between">
              <span>Awaiting Field Inspection</span>
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
            <div className="mt-2 text-2xl font-black text-amber-700">{pendingCount}</div>
            <div className="text-[11px] text-amber-600 font-semibold mt-0.5">LMO Mobile Queue Active</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="text-slate-500 text-xs font-semibold flex items-center justify-between">
              <span>Real-time Sync Status</span>
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="mt-2 text-2xl font-black text-indigo-900">Online</div>
            <div className="text-[11px] text-indigo-600 font-semibold mt-0.5">Listening to Flutter App</div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* MASTER DATA TABLE OF ALL SHOPS (REALTIME SYNC & GREEN FLASH ANIMATION) */}
        {/* ========================================================================= */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden space-y-4">
          {/* Table Header & Search Filter Bar */}
          <div className="p-6 border-b border-slate-100 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-100 text-[#002B49] flex items-center justify-center">
                  <FileSpreadsheet className="w-5 h-5 text-[#002B49]" />
                </div>
                <div>
                  <h2 className="font-extrabold text-base text-slate-900">
                    Master Shops &amp; Verification Directory
                  </h2>
                  <p className="text-xs text-slate-500">
                    Live synchronization with LMO mobile application via Supabase Realtime
                  </p>
                </div>
              </div>

              <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 self-start sm:self-auto">
                Showing {filteredShops.length} of {totalCount} Shops
              </span>
            </div>

            {/* Filter Row */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Search className="w-4 h-4 text-slate-400" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by Shop Name (e.g. Mohan Kirana), License, or District..."
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50 hover:bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#002B49] transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Status Filter */}
              <div className="relative min-w-[180px]">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Filter className="w-3.5 h-3.5 text-slate-400" />
                </div>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full pl-9 pr-8 py-2.5 bg-slate-50 hover:bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-[#002B49] transition-all cursor-pointer appearance-none"
                >
                  <option value="All">All Statuses ({totalCount})</option>
                  <option value="Approved">Approved ({approvedCount})</option>
                  <option value="Pending">Pending ({pendingCount})</option>
                </select>
              </div>
            </div>
          </div>

          {/* Master Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5">Shop / Enterprise Details</th>
                  <th className="px-6 py-3.5">License &amp; District</th>
                  <th className="px-6 py-3.5">Scale / Instrument Type</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Verified GPS Coordinates</th>
                  <th className="px-6 py-3.5">LMO Approval Timestamp</th>
                  <th className="px-6 py-3.5 text-right">Certificate Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredShops.length > 0 ? (
                  filteredShops.map((shop) => {
                    const isApproved = (shop.status || '').toLowerCase() === 'approved';
                    const rowKey = (shop.id || shop.license_number).toString();
                    const isFlashing = flashingRowId === rowKey || flashingRowId === shop.id || flashingRowId === shop.license_number;

                    // Formatted approval timestamp
                    const formattedDate = shop.updated_at && isApproved
                      ? new Date(shop.updated_at).toLocaleString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                          hour12: true,
                        })
                      : null;

                    return (
                      <tr
                        key={rowKey}
                        className={`transition-all duration-700 ${
                          isFlashing
                            ? 'bg-emerald-100/90 ring-2 ring-emerald-500 font-semibold'
                            : isApproved
                            ? 'bg-emerald-50/20 hover:bg-emerald-50/40'
                            : 'hover:bg-slate-50/80'
                        }`}
                      >
                        {/* Shop Name & Owner */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-slate-900 text-sm">{shop.shop_name}</span>
                            {isFlashing && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-600 text-white animate-pulse">
                                <Sparkles className="w-3 h-3" />
                                <span>Just Updated!</span>
                              </span>
                            )}
                          </div>
                          {shop.owner_name && (
                            <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                              Proprietor: <span className="text-slate-700 font-semibold">{shop.owner_name}</span>
                            </div>
                          )}
                          {shop.address && (
                            <div className="text-[10px] text-slate-400 truncate max-w-xs">{shop.address}</div>
                          )}
                        </td>

                        {/* License Number & District */}
                        <td className="px-6 py-4">
                          <div className="font-mono font-bold text-xs bg-slate-100 text-[#002B49] px-2.5 py-1 rounded-lg border border-slate-200 inline-block">
                            {shop.license_number}
                          </div>
                          <div className="text-[11px] text-slate-500 font-medium mt-1">
                            {shop.district || 'Rohtak'}, Haryana
                          </div>
                        </td>

                        {/* Instrument Type */}
                        <td className="px-6 py-4">
                          <div className="font-semibold text-slate-800">{shop.instrument_type || 'Counter Scale Class III'}</div>
                          <div className="text-[11px] text-slate-500">{shop.capacity || '30 kg'} • {shop.make_model || 'Essae DS-852'}</div>
                        </td>

                        {/* Status Badge */}
                        <td className="px-6 py-4">
                          {isApproved ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-300 shadow-2xs">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Approved</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200 shadow-2xs">
                              <Clock className="w-3.5 h-3.5 text-amber-600 animate-spin" />
                              <span>Pending</span>
                            </span>
                          )}
                        </td>

                        {/* Verified GPS Coordinates */}
                        <td className="px-6 py-4">
                          {typeof shop.latitude === 'number' && typeof shop.longitude === 'number' ? (
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 font-mono text-xs font-bold">
                              <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span>{shop.latitude.toFixed(5)}, {shop.longitude.toFixed(5)}</span>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic text-[11px] flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-slate-300" />
                              <span>Pending Capture</span>
                            </span>
                          )}
                        </td>

                        {/* LMO Approval Timestamp */}
                        <td className="px-6 py-4">
                          {formattedDate ? (
                            <div className="flex items-center gap-1.5 text-slate-700 font-mono text-xs">
                              <Clock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span>{formattedDate}</span>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic text-[11px]">—</span>
                          )}
                        </td>

                        {/* Certificate Action Button */}
                        <td className="px-6 py-4 text-right">
                          {isApproved ? (
                            <button
                              onClick={() => {
                                setSelectedCertificateShop(shop);
                                setIsCertificateOpen(true);
                              }}
                              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#002B49] hover:bg-[#003B66] text-white shadow-xs hover:shadow-md transition-all cursor-pointer"
                              title="View and print official Schedule IX verification certificate with QR code"
                            >
                              <QrCode className="w-3.5 h-3.5 text-amber-400" />
                              <span>View Certificate</span>
                            </button>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 font-medium">
                              <FileBadge className="w-3.5 h-3.5 opacity-40" />
                              <span>Pending LMO Stamping</span>
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                      <div className="max-w-sm mx-auto space-y-2">
                        <Search className="w-8 h-8 text-slate-300 mx-auto" />
                        <p className="font-bold text-slate-700 text-sm">No Matching Shops Found</p>
                        <p className="text-xs text-slate-400">
                          No shop record matches &quot;{searchQuery}&quot; with status &quot;{selectedStatus}&quot;.
                        </p>
                        <button
                          onClick={() => {
                            setSearchQuery('');
                            setSelectedStatus('All');
                          }}
                          className="mt-3 px-4 py-1.5 text-xs font-bold text-[#002B49] bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                        >
                          Reset Filters
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Action Navigation Panels */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link
            href="/admin/traders"
            className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs hover:shadow-md transition-all group flex flex-col justify-between space-y-4"
          >
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center group-hover:scale-110 transition-transform">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base group-hover:text-blue-700 transition-colors">
                Officer Assignment &amp; Scheduling
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Assign authorized Legal Metrology field officers to pending shops across Rohtak and Hisar zones.
              </p>
            </div>
            <div className="text-xs font-bold text-blue-700 flex items-center gap-1">
              <span>Open Assignment Queue</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          <Link
            href="/apply"
            className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs hover:shadow-md transition-all group flex flex-col justify-between space-y-4"
          >
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:scale-110 transition-transform">
              <PlusCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base group-hover:text-emerald-700 transition-colors">
                Register Laboratory Equipment
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Add secondary working standards, standard weights (Class E1-F2), and test mass comparators.
              </p>
            </div>
            <div className="text-xs font-bold text-emerald-700 flex items-center gap-1">
              <span>Add Equipment</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          <Link
            href="/verify/LMO-2026-10001"
            className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs hover:shadow-md transition-all group flex flex-col justify-between space-y-4"
          >
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center group-hover:scale-110 transition-transform">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base group-hover:text-indigo-700 transition-colors">
                Public Certificate Authenticator
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Authenticate stamped Schedule IX verification certificates and inspect tamper-evident security seal serial numbers.
              </p>
            </div>
            <div className="text-xs font-bold text-indigo-700 flex items-center gap-1">
              <span>Verify Certificate</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </div>
      </main>

      <Footer />

      {/* Digital Certificate Modal */}
      <DigitalCertificateModal
        isOpen={isCertificateOpen}
        onClose={() => {
          setIsCertificateOpen(false);
          setSelectedCertificateShop(null);
        }}
        shop={selectedCertificateShop}
      />
    </div>
  );
}
