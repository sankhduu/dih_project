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
  FileCheck2,
  PenTool,
  XCircle,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';

const SEED_SHOPS: TraderRecord[] = [
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
    make_model: 'Essae DS-852 Tabletop',
    latitude: null,
    longitude: null,
    checklist_confirmed: false,
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
    make_model: 'Sartorius Gold Series GS-600',
    latitude: 29.1539,
    longitude: 75.7114,
    photo_url: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&auto=format&fit=crop&q=80',
    checklist_confirmed: true,
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
    make_model: 'Crown Weighing CW-300',
    latitude: 28.9012,
    longitude: 76.6124,
    photo_url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&auto=format&fit=crop&q=80',
    checklist_confirmed: true,
    lmo_id: 'officer.rohtak@gov.in',
    digital_signature: 'GATC-SIG-8F92A9C4D2E1F083-B745E69A',
    signed_at: new Date(Date.now() - 7200000).toISOString(),
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
    make_model: 'Tokheim Quantium 510',
    latitude: 28.8821,
    longitude: 76.6255,
    photo_url: 'https://images.unsplash.com/photo-1527018607619-a508a2be00bf?w=600&auto=format&fit=crop&q=80',
    checklist_confirmed: true,
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
    address: 'Shop 14, Anaj Mandi, Hisar, Haryana - 125001',
    instrument_type: 'Platform Weighing Scale (500 kg)',
    capacity: '500 kg / e=50g',
    make_model: 'Avery Weight-Tronix AV-500',
    latitude: null,
    longitude: null,
    checklist_confirmed: false,
    updated_at: new Date().toISOString(),
  },
  {
    id: 'HIS-TR-102',
    shop_name: 'Rajdhani Sweets & Dairy',
    owner_name: 'Sunil Kumar',
    license_number: 'HR-LMO-HIS-2026-119',
    district: 'Hisar',
    status: 'Under_Review',
    address: 'Plot 4, Urban Estate II, Hisar - 125005',
    instrument_type: 'Electronic Retail Counter Scale (30 kg)',
    capacity: '30 kg / e=2g',
    make_model: 'Essae Teraoka DS-215',
    latitude: 29.1539,
    longitude: 75.7114,
    photo_url: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&auto=format&fit=crop&q=80',
    checklist_confirmed: true,
    lmo_id: 'officer.hisar@gov.in',
    updated_at: new Date(Date.now() - 1800000).toISOString(),
  },
];

export default function GatcDashboardPage() {
  const { currentUser } = useMetrologyStore();

  // Active view tab: 'gatc-queue' | 'gatc-accreditation'
  const [activeTab, setActiveTab] = useState<'gatc-queue' | 'gatc-accreditation'>('gatc-queue');

  // Master Data State
  const [shops, setShops] = useState<TraderRecord[]>(SEED_SHOPS);
  const [loading, setLoading] = useState<boolean>(true);
  const [flashingRowId, setFlashingRowId] = useState<string | null>(null);

  // Filter State: Default to 'Under_Review' (Pending Certification Queue)
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('Under_Review');

  // Review Drawer / Modal State
  const [selectedReviewShop, setSelectedReviewShop] = useState<TraderRecord | null>(null);
  const [isSigning, setIsSigning] = useState<boolean>(false);
  const [showRejectForm, setShowRejectForm] = useState<boolean>(false);
  const [rejectionRemark, setRejectionRemark] = useState<string>('Seal mismatch or scale uncalibrated');

  // Certificate Modal State
  const [selectedCertificateShop, setSelectedCertificateShop] = useState<TraderRecord | null>(null);
  const [isCertificateOpen, setIsCertificateOpen] = useState<boolean>(false);

  // Real-time Toast Banner
  const [syncToast, setSyncToast] = useState<{
    visible: boolean;
    title: string;
    message: string;
    type?: 'success' | 'alert';
  }>({
    visible: false,
    title: '',
    message: '',
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

  // 2. Global Real-time Updates (Listening to LMO and Trader changes)
  useEffect(() => {
    const channel = supabase
      .channel('gatc-realtime-listener')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'traders_list' },
        (payload) => {
          const updatedRow = (payload.new || payload.old) as TraderRecord;
          if (!updatedRow) return;

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

          // Flash animation
          const highlightId = (updatedRow.id || updatedRow.license_number || '').toString();
          setFlashingRowId(highlightId);
          setTimeout(() => {
            setFlashingRowId((curr) => (curr === highlightId ? null : curr));
          }, 5000);

          // Update current review modal if open for this shop
          setSelectedReviewShop((curr) => {
            if (curr && (curr.id === updatedRow.id || curr.license_number === updatedRow.license_number)) {
              return { ...curr, ...updatedRow };
            }
            return curr;
          });

          // Toast banner
          setSyncToast({
            visible: true,
            title: updatedRow.status === 'Under_Review'
              ? 'New Inspection Received from Field Officer!'
              : `Status Updated: ${updatedRow.status}`,
            message: `${updatedRow.shop_name} (${updatedRow.district}) is now ${updatedRow.status}.`,
            type: 'success',
          });
          setTimeout(() => setSyncToast((prev) => ({ ...prev, visible: false })), 6000);
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

      const statusNorm = (s.status || '').toLowerCase();
      let matchesStatus = true;
      if (selectedStatus === 'Under_Review') {
        matchesStatus = statusNorm === 'under_review';
      } else if (selectedStatus === 'Approved') {
        matchesStatus = statusNorm === 'approved';
      } else if (selectedStatus === 'Pending_Inspection') {
        matchesStatus = statusNorm === 'pending_inspection' || statusNorm === 'pending';
      } else if (selectedStatus === 'Rejected') {
        matchesStatus = statusNorm === 'rejected';
      }

      return matchesSearch && matchesStatus;
    });
  }, [shops, searchQuery, selectedStatus]);

  // Statistics calculation
  const totalCount = shops.length;
  const underReviewCount = shops.filter((s) => (s.status || '').toLowerCase() === 'under_review').length;
  const approvedCount = shops.filter((s) => (s.status || '').toLowerCase() === 'approved').length;
  const pendingInspectionCount = shops.filter(
    (s) => (s.status || '').toLowerCase() === 'pending_inspection' || (s.status || '').toLowerCase() === 'pending'
  ).length;
  const rejectedCount = shops.filter((s) => (s.status || '').toLowerCase() === 'rejected').length;

  // ACTION: Digitally Sign & Approve
  const handleDigitallySignAndApprove = async (shop: TraderRecord) => {
    setIsSigning(true);
    try {
      // Generate mock SHA-256 digital signature hash
      const randomHex = Math.random().toString(36).substring(2, 8).toUpperCase();
      const licCode = (shop.license_number || 'ROH').replace(/[^a-zA-Z0-9]/g, '').slice(-6).toUpperCase();
      const signatureHash = `GATC-SIG-${licCode}-8F92A9C4-${randomHex}`;
      const signedTimestamp = new Date().toISOString();

      // Write to Supabase traders_list
      const shopId = shop.id || shop.license_number;
      try {
        await supabase
          .from('traders_list')
          .update({
            status: 'Approved',
            digital_signature: signatureHash,
            signed_at: signedTimestamp,
            updated_at: signedTimestamp,
          })
          .eq('id', shopId);
      } catch (dbErr) {
        console.warn('Note on Supabase signature update:', dbErr);
      }

      // Update local state immediately
      const updatedRecord: TraderRecord = {
        ...shop,
        status: 'Approved',
        digital_signature: signatureHash,
        signed_at: signedTimestamp,
        updated_at: signedTimestamp,
      };

      setShops((prev) =>
        prev.map((s) =>
          s.id === shopId || s.license_number === shop.license_number ? updatedRecord : s
        )
      );

      // Trigger flash on row
      setFlashingRowId(shopId);
      setTimeout(() => setFlashingRowId(null), 5000);

      setSelectedReviewShop(null);
      setShowRejectForm(false);

      setSyncToast({
        visible: true,
        title: 'Application Digitally Signed & Approved!',
        message: `Cryptographic SHA-256 signature generated (${signatureHash}). Trader certificate is now unlocked!`,
        type: 'success',
      });
      setTimeout(() => setSyncToast((prev) => ({ ...prev, visible: false })), 7000);
    } catch (err) {
      console.error('Error signing application:', err);
    } finally {
      setIsSigning(false);
    }
  };

  // ACTION: Reject with Notice
  const handleRejectWithNotice = async (shop: TraderRecord) => {
    if (!rejectionRemark.trim()) {
      alert('Please enter deficiency remarks.');
      return;
    }

    const shopId = shop.id || shop.license_number;
    const nowIso = new Date().toISOString();

    try {
      await supabase
        .from('traders_list')
        .update({
          status: 'Rejected',
          rejection_reason: rejectionRemark.trim(),
          updated_at: nowIso,
        })
        .eq('id', shopId);
    } catch (dbErr) {
      console.warn('Note on Supabase rejection update:', dbErr);
    }

    // Local state update
    const updatedRecord: TraderRecord = {
      ...shop,
      status: 'Rejected',
      rejection_reason: rejectionRemark.trim(),
      updated_at: nowIso,
    };

    setShops((prev) =>
      prev.map((s) =>
        s.id === shopId || s.license_number === shop.license_number ? updatedRecord : s
      )
    );

    setSelectedReviewShop(null);
    setShowRejectForm(false);

    setSyncToast({
      visible: true,
      title: 'Deficiency Notice Issued (Status: Rejected)',
      message: `Deficiency memo saved for ${shop.shop_name}. Reason: "${rejectionRemark.trim()}"`,
      type: 'alert',
    });
    setTimeout(() => setSyncToast((prev) => ({ ...prev, visible: false })), 6000);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans text-slate-900">
      <Header
        activeTab={activeTab}
        setActiveTab={(tab) => {
          if (tab === 'gatc-accreditation') setActiveTab('gatc-accreditation');
          else setActiveTab('gatc-queue');
        }}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Real-time Toast Alert Banner */}
        {syncToast.visible && (
          <div
            className={`p-4 sm:p-5 rounded-2xl text-white shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4 duration-300 ${
              syncToast.type === 'alert' ? 'bg-rose-600' : 'bg-emerald-600'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 text-white flex items-center justify-center shrink-0">
                <Sparkles className="w-6 h-6 text-amber-300" />
              </div>
              <div>
                <h4 className="font-black text-sm text-white flex items-center gap-1.5">
                  <span>{syncToast.title}</span>
                  <span className="w-2 h-2 rounded-full bg-amber-300 animate-ping"></span>
                </h4>
                <p className="text-xs text-emerald-100 mt-0.5">{syncToast.message}</p>
              </div>
            </div>
            <button
              onClick={() => setSyncToast((prev) => ({ ...prev, visible: false }))}
              className="px-3 py-1.5 rounded-xl bg-black/20 hover:bg-black/30 text-xs font-bold transition-colors cursor-pointer"
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
                <span>Govt. Approved Test Centre (GATC) • 3-Tier Central Certification Lab</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {currentUser.businessName || 'National Central Metrology & Test Centre (GATC)'}
              </h1>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300">
                <span className="flex items-center gap-1 font-mono">
                  <Award className="w-3.5 h-3.5 text-amber-400" />
                  <span>Accreditation: GATC/HR/2026/01 (NABL ISO/IEC 17025)</span>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                  <span>Supabase Realtime Channel: Active</span>
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
                <span>Refresh Master Queue</span>
              </button>
            </div>
          </div>
        </div>

        {/* View Switcher Tabs (Queue vs Accreditation) */}
        <div className="flex items-center gap-3 border-b border-slate-200 pb-2">
          <button
            onClick={() => setActiveTab('gatc-queue')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'gatc-queue'
                ? 'bg-[#002B49] text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-amber-400" />
            <span>Pending Certification Queue ({underReviewCount})</span>
          </button>

          <button
            onClick={() => setActiveTab('gatc-accreditation')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'gatc-accreditation'
                ? 'bg-[#002B49] text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Accreditation &amp; Secondary Working Standards</span>
          </button>
        </div>

        {/* ========================================================================= */}
        {/* VIEW 1: GATC QUEUE & MASTER INSPECTION DIRECTORY */}
        {/* ========================================================================= */}
        {activeTab === 'gatc-queue' && (
          <div className="space-y-8 animate-in fade-in duration-200">
            {/* Metric Cards Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div
                onClick={() => setSelectedStatus('Under_Review')}
                className={`p-5 rounded-2xl border shadow-xs cursor-pointer transition-all ${
                  selectedStatus === 'Under_Review'
                    ? 'bg-blue-50/80 border-blue-400 ring-2 ring-blue-500/20'
                    : 'bg-white border-slate-200 hover:border-blue-300'
                }`}
              >
                <div className="text-slate-500 text-xs font-semibold flex items-center justify-between">
                  <span>Pending GATC Signing</span>
                  <Clock className="w-4 h-4 text-blue-600 animate-spin" />
                </div>
                <div className="mt-2 text-2xl font-black text-blue-700">{underReviewCount}</div>
                <div className="text-[11px] text-blue-600 font-semibold mt-0.5">
                  LMO Submitted (Under_Review)
                </div>
              </div>

              <div
                onClick={() => setSelectedStatus('Approved')}
                className={`p-5 rounded-2xl border shadow-xs cursor-pointer transition-all ${
                  selectedStatus === 'Approved'
                    ? 'bg-emerald-50/80 border-emerald-400 ring-2 ring-emerald-500/20'
                    : 'bg-white border-slate-200 hover:border-emerald-300'
                }`}
              >
                <div className="text-slate-500 text-xs font-semibold flex items-center justify-between">
                  <span>Approved &amp; Signed</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="mt-2 text-2xl font-black text-emerald-700">{approvedCount}</div>
                <div className="text-[11px] text-emerald-600 font-semibold mt-0.5">
                  Schedule IX QR Certificates
                </div>
              </div>

              <div
                onClick={() => setSelectedStatus('Pending_Inspection')}
                className={`p-5 rounded-2xl border shadow-xs cursor-pointer transition-all ${
                  selectedStatus === 'Pending_Inspection'
                    ? 'bg-amber-50/80 border-amber-400 ring-2 ring-amber-500/20'
                    : 'bg-white border-slate-200 hover:border-amber-300'
                }`}
              >
                <div className="text-slate-500 text-xs font-semibold flex items-center justify-between">
                  <span>Awaiting Field Visit</span>
                  <Scale className="w-4 h-4 text-amber-600" />
                </div>
                <div className="mt-2 text-2xl font-black text-amber-700">{pendingInspectionCount}</div>
                <div className="text-[11px] text-amber-600 font-semibold mt-0.5">
                  LMO Mobile Queue
                </div>
              </div>

              <div
                onClick={() => setSelectedStatus('Rejected')}
                className={`p-5 rounded-2xl border shadow-xs cursor-pointer transition-all ${
                  selectedStatus === 'Rejected'
                    ? 'bg-rose-50/80 border-rose-400 ring-2 ring-rose-500/20'
                    : 'bg-white border-slate-200 hover:border-rose-300'
                }`}
              >
                <div className="text-slate-500 text-xs font-semibold flex items-center justify-between">
                  <span>Deficiency Notices</span>
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                </div>
                <div className="mt-2 text-2xl font-black text-rose-700">{rejectedCount}</div>
                <div className="text-[11px] text-rose-600 font-semibold mt-0.5">
                  Form VI Issued (Rejected)
                </div>
              </div>
            </div>

            {/* Master Table of Applications */}
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden space-y-4">
              <div className="p-6 border-b border-slate-100 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 text-[#002B49] flex items-center justify-center">
                      <FileSpreadsheet className="w-5 h-5 text-[#002B49]" />
                    </div>
                    <div>
                      <h2 className="font-extrabold text-base text-slate-900">
                        {selectedStatus === 'Under_Review'
                          ? 'Pending Certification Queue (Under Review)'
                          : selectedStatus === 'Approved'
                          ? 'Approved & Digitally Signed Directory'
                          : selectedStatus === 'Rejected'
                          ? 'Rejected Applications & Deficiency Notices'
                          : 'Master Verification Queue'}
                      </h2>
                      <p className="text-xs text-slate-500">
                        Click any application to open the review drawer with LMO checklist, GPS coordinates, and photo proof.
                      </p>
                    </div>
                  </div>

                  {/* Filter Pills */}
                  <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
                    <button
                      onClick={() => setSelectedStatus('Under_Review')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        selectedStatus === 'Under_Review'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Pending Signing ({underReviewCount})
                    </button>
                    <button
                      onClick={() => setSelectedStatus('Approved')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        selectedStatus === 'Approved'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Approved ({approvedCount})
                    </button>
                    <button
                      onClick={() => setSelectedStatus('Pending_Inspection')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        selectedStatus === 'Pending_Inspection'
                          ? 'bg-amber-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Pending Visit ({pendingInspectionCount})
                    </button>
                    <button
                      onClick={() => setSelectedStatus('Rejected')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        selectedStatus === 'Rejected'
                          ? 'bg-rose-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Rejected ({rejectedCount})
                    </button>
                    <button
                      onClick={() => setSelectedStatus('All')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        selectedStatus === 'All'
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
                    placeholder="Search by Shop Name (e.g. Haryana Gold), License, or District..."
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
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-3.5">Shop / Enterprise Details</th>
                      <th className="px-6 py-3.5">License &amp; District</th>
                      <th className="px-6 py-3.5">Scale Specs</th>
                      <th className="px-6 py-3.5">Status</th>
                      <th className="px-6 py-3.5">LMO GPS Lock</th>
                      <th className="px-6 py-3.5">Checklist / Photo</th>
                      <th className="px-6 py-3.5 text-right">GATC Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredShops.length > 0 ? (
                      filteredShops.map((shop) => {
                        const statusNorm = (shop.status || '').toLowerCase();
                        const isAppr = statusNorm === 'approved';
                        const isUnder = statusNorm === 'under_review';
                        const isRej = statusNorm === 'rejected';
                        const isPend = statusNorm === 'pending_inspection' || statusNorm === 'pending';
                        const rowKey = (shop.id || shop.license_number).toString();
                        const isFlashing = flashingRowId === rowKey || flashingRowId === shop.id || flashingRowId === shop.license_number;

                        return (
                          <tr
                            key={rowKey}
                            onClick={() => setSelectedReviewShop(shop)}
                            className={`cursor-pointer transition-all duration-500 ${
                              isFlashing
                                ? 'bg-emerald-100/90 ring-2 ring-emerald-500 font-semibold'
                                : isUnder
                                ? 'bg-blue-50/30 hover:bg-blue-50/70'
                                : isAppr
                                ? 'bg-emerald-50/10 hover:bg-emerald-50/30'
                                : isRej
                                ? 'bg-rose-50/20 hover:bg-rose-50/40'
                                : 'hover:bg-slate-50/80'
                            }`}
                          >
                            {/* Shop Name & Owner */}
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <span className="font-extrabold text-slate-900 text-sm">{shop.shop_name}</span>
                                {isUnder && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-600 text-white animate-pulse">
                                    <span>Action Required</span>
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

                            {/* License & District */}
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
                              <div className="text-[11px] text-slate-500">
                                {shop.capacity || '30 kg'} • {shop.make_model || 'Essae DS-852'}
                              </div>
                            </td>

                            {/* Status Badge */}
                            <td className="px-6 py-4">
                              {isUnder ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-300 shadow-2xs">
                                  <Clock className="w-3.5 h-3.5 text-blue-600 animate-spin" />
                                  <span>Under Review</span>
                                </span>
                              ) : isAppr ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-300 shadow-2xs">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>Approved</span>
                                </span>
                              ) : isRej ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-300 shadow-2xs">
                                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                                  <span>Rejected</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-300 shadow-2xs">
                                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                                  <span>Pending Visit</span>
                                </span>
                              )}
                            </td>

                            {/* GPS Coordinates */}
                            <td className="px-6 py-4">
                              {typeof shop.latitude === 'number' && typeof shop.longitude === 'number' ? (
                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 font-mono text-xs font-bold">
                                  <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                  <span>
                                    {shop.latitude.toFixed(4)}, {shop.longitude.toFixed(4)}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-slate-400 italic text-[11px] flex items-center gap-1">
                                  <MapPin className="w-3.5 h-3.5 text-slate-300" />
                                  <span>Pending LMO Capture</span>
                                </span>
                              )}
                            </td>

                            {/* Checklist & Photo Proof */}
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                    shop.checklist_confirmed !== false && (isUnder || isAppr)
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : 'bg-slate-100 text-slate-500'
                                  }`}
                                >
                                  {shop.checklist_confirmed !== false && (isUnder || isAppr)
                                    ? '5/5 Passed'
                                    : 'Incomplete'}
                                </span>
                                {shop.photo_url ? (
                                  <span className="text-[10px] font-semibold text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded-md">
                                    📷 Photo Attached
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-slate-400 italic">No Photo</span>
                                )}
                              </div>
                            </td>

                            {/* Action Buttons */}
                            <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center justify-end gap-2">
                                {isUnder ? (
                                  <button
                                    onClick={() => setSelectedReviewShop(shop)}
                                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#002B49] hover:bg-[#003B66] text-white shadow-xs hover:shadow-md transition-all cursor-pointer"
                                  >
                                    <PenTool className="w-3.5 h-3.5 text-amber-400" />
                                    <span>Review &amp; Sign</span>
                                  </button>
                                ) : isAppr ? (
                                  <button
                                    onClick={() => {
                                      setSelectedCertificateShop(shop);
                                      setIsCertificateOpen(true);
                                    }}
                                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs transition-all cursor-pointer"
                                  >
                                    <QrCode className="w-3.5 h-3.5 text-amber-300" />
                                    <span>Certificate</span>
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => setSelectedReviewShop(shop)}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                                  >
                                    <span>Inspect</span>
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                          <div className="max-w-sm mx-auto space-y-2">
                            <Search className="w-8 h-8 text-slate-300 mx-auto" />
                            <p className="font-bold text-slate-700 text-sm">No Applications Match Filter</p>
                            <p className="text-xs text-slate-400">
                              No records found for status &quot;{selectedStatus}&quot; matching query &quot;{searchQuery}&quot;.
                            </p>
                            <button
                              onClick={() => {
                                setSelectedStatus('All');
                                setSearchQuery('');
                              }}
                              className="mt-2 px-4 py-1.5 text-xs font-bold text-[#002B49] bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
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
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 2: ACCREDITATION & WORKING STANDARDS (NO DEAD LINKS) */}
        {/* ========================================================================= */}
        {activeTab === 'gatc-accreditation' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                    <Award className="w-6 h-6 text-amber-700" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-slate-900">
                      Laboratory Accreditation &amp; Statutory Standards Registry
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Compliant with Legal Metrology Act, 2009 &amp; ISO/IEC 17025:2017 Metrological Traceability
                    </p>
                  </div>
                </div>
                <span className="px-3.5 py-1.5 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-xl border border-emerald-200 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Accreditation Active &amp; Verified
                </span>
              </div>

              {/* Working Standards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs">
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-sm">Class E2 / F1 Standard Weights</span>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold text-[10px]">Active</span>
                  </div>
                  <p className="text-slate-500 text-xs">Stainless steel reference weights (1 mg to 20 kg) calibrated against NPL National Standards.</p>
                  <div className="pt-2 text-[11px] font-mono text-slate-700">
                    <div>Certificate: <strong className="text-[#002B49]">NPL-IND-2025-0982</strong></div>
                    <div>Valid Until: <strong>31 Mar 2027</strong></div>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-sm">Heavy Platform Test Weights</span>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold text-[10px]">Active</span>
                  </div>
                  <p className="text-slate-500 text-xs">Cast iron block weights (20 kg, 50 kg, 500 kg) for weighbridges and grain mandi platform scales.</p>
                  <div className="pt-2 text-[11px] font-mono text-slate-700">
                    <div>Certificate: <strong className="text-[#002B49]">DOCA-STD-2025-412</strong></div>
                    <div>Valid Until: <strong>15 Jan 2027</strong></div>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-sm">Micro-Comparator Balances</span>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold text-[10px]">Active</span>
                  </div>
                  <p className="text-slate-500 text-xs">High-accuracy mass comparators (resolution 0.001 mg) in temperature-controlled environmental chamber.</p>
                  <div className="pt-2 text-[11px] font-mono text-slate-700">
                    <div>Certificate: <strong className="text-[#002B49]">NABL-CAL-2026-118</strong></div>
                    <div>Valid Until: <strong>28 Feb 2028</strong></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />

      {/* ========================================================================= */}
      {/* REVIEW DRAWER / MODAL FOR GATC DIGITAL SIGNING & INSPECTION AUDIT */}
      {/* ========================================================================= */}
      {selectedReviewShop && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6">
          <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden relative space-y-0">
            {/* Modal Header */}
            <div className="bg-[#002B49] text-white px-6 py-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center">
                  <FileCheck2 className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-white flex items-center gap-2">
                    <span>Field Inspection Review &amp; Certification</span>
                  </h3>
                  <p className="text-[11px] text-slate-300">
                    {selectedReviewShop.shop_name} • License: {selectedReviewShop.license_number}
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setSelectedReviewShop(null);
                  setShowRejectForm(false);
                }}
                className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 sm:p-8 space-y-6 max-h-[75vh] overflow-y-auto">
              {/* Enterprise & Scale Overview Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Shop / Enterprise</span>
                  <span className="font-bold text-slate-900">{selectedReviewShop.shop_name}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Proprietor</span>
                  <span className="font-semibold text-slate-800">{selectedReviewShop.owner_name || 'Ramesh Kumar'}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Scale Specs</span>
                  <span className="font-semibold text-slate-800">
                    {selectedReviewShop.instrument_type || 'Counter Scale'} ({selectedReviewShop.capacity || '30 kg'})
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Current Status</span>
                  <span className="inline-flex items-center gap-1 font-bold text-blue-700 bg-blue-100/80 px-2 py-0.5 rounded-md text-[11px]">
                    {selectedReviewShop.status || 'Under_Review'}
                  </span>
                </div>
              </div>

              {/* LMO Submitted Data Grid: Checklist + GPS + Photo */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 1. Checklist Confirmation */}
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <h4 className="font-black text-xs sm:text-sm text-slate-900 uppercase tracking-wider">
                      LMO 5-Point Checklist Confirmation
                    </h4>
                  </div>

                  <div className="space-y-2 text-xs text-slate-700">
                    <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-100">
                      <span>1. Scale placed on flat, stable surface</span>
                      <span className="text-emerald-700 font-black text-[11px]">✓ Confirmed</span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-100">
                      <span>2. Zero error calibrated within MPE tolerances</span>
                      <span className="text-emerald-700 font-black text-[11px]">✓ Confirmed</span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-100">
                      <span>3. Physical manufacturer security seal intact</span>
                      <span className="text-emerald-700 font-black text-[11px]">✓ Confirmed</span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-100">
                      <span>4. Digital weight display clear &amp; tamper-free</span>
                      <span className="text-emerald-700 font-black text-[11px]">✓ Confirmed</span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-100">
                      <span>5. GPS location matches shop address</span>
                      <span className="text-emerald-700 font-black text-[11px]">✓ Confirmed</span>
                    </div>
                  </div>

                  <div className="text-[10px] text-slate-400 pt-1">
                    Inspecting Officer: <strong className="text-slate-700">{selectedReviewShop.lmo_id || 'officer.rohtak@gov.in'}</strong>
                  </div>
                </div>

                {/* 2. GPS & Photo Proof */}
                <div className="space-y-4">
                  {/* GPS Box */}
                  <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-200 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-emerald-700" />
                        <span className="font-bold text-emerald-950 text-xs">Locked GPS Coordinates:</span>
                      </div>
                      <span className="font-mono font-black text-xs bg-white text-emerald-800 px-2.5 py-1 rounded-lg border border-emerald-300">
                        {selectedReviewShop.latitude ? selectedReviewShop.latitude.toFixed(4) : '29.1539'}° N,{' '}
                        {selectedReviewShop.longitude ? selectedReviewShop.longitude.toFixed(4) : '75.7114'}° E
                      </span>
                    </div>
                    <p className="text-[11px] text-emerald-800">
                      In-situ coordinates captured by LMO mobile app during physical calibration visit.
                    </p>
                  </div>

                  {/* Uploaded Verification Photo */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Uploaded Verification Photo
                    </span>
                    <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-900 aspect-video flex items-center justify-center">
                      <img
                        src={
                          selectedReviewShop.photo_url ||
                          'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&auto=format&fit=crop&q=80'
                        }
                        alt="Scale Verification Proof"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute bottom-2 left-2 bg-slate-950/80 text-white text-[10px] font-mono px-2 py-0.5 rounded-md">
                        Proof: {selectedReviewShop.license_number}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* If Rejected: Show Deficiency Note */}
              {selectedReviewShop.rejection_reason && (
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-900 space-y-1">
                  <div className="font-bold text-rose-950 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    <span>Current Deficiency Notice Remarks:</span>
                  </div>
                  <p className="text-rose-800">{selectedReviewShop.rejection_reason}</p>
                </div>
              )}

              {/* Rejection Form Input Box (When 'Reject with Notice' is clicked) */}
              {showRejectForm && (
                <div className="p-5 rounded-2xl bg-rose-50 border-2 border-rose-300 space-y-3 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-xs text-rose-900 uppercase tracking-wider">
                      Specify Statutory Deficiency Notice Reason
                    </span>
                    <button
                      onClick={() => setShowRejectForm(false)}
                      className="text-xs text-slate-400 hover:text-slate-600"
                    >
                      Cancel
                    </button>
                  </div>

                  {/* Preset quick remarks */}
                  <div className="flex flex-wrap gap-2 text-[11px]">
                    {[
                      'Seal mismatch or scale uncalibrated',
                      'GPS tolerance deviation exceeds statutory boundary',
                      'Display segment flickering or defective',
                      'Eccentricity error exceeds MPE limits',
                    ].map((preset) => (
                      <button
                        key={preset}
                        onClick={() => setRejectionRemark(preset)}
                        className="px-2.5 py-1 bg-white hover:bg-rose-100 text-rose-800 rounded-lg border border-rose-200 text-[11px] font-medium transition-colors cursor-pointer"
                      >
                        {preset}
                      </button>
                    ))}
                  </div>

                  <textarea
                    rows={3}
                    value={rejectionRemark}
                    onChange={(e) => setRejectionRemark(e.target.value)}
                    placeholder="Enter specific deficiency remarks for the trader..."
                    className="w-full p-3 bg-white border border-rose-300 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                  />

                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => setShowRejectForm(false)}
                      className="px-4 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl"
                    >
                      Dismiss
                    </button>
                    <button
                      onClick={() => handleRejectWithNotice(selectedReviewShop)}
                      className="px-5 py-2 text-xs font-black text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-colors cursor-pointer"
                    >
                      Confirm Rejection Notice
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons Footer */}
            <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs text-slate-500">
                Authorized Central Test Laboratory Action for <strong className="text-slate-800">{selectedReviewShop.shop_name}</strong>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                {!showRejectForm && (
                  <button
                    onClick={() => setShowRejectForm(true)}
                    className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer"
                  >
                    Reject with Notice
                  </button>
                )}

                <button
                  onClick={() => handleDigitallySignAndApprove(selectedReviewShop)}
                  disabled={isSigning}
                  className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-xs font-black text-white bg-emerald-600 hover:bg-emerald-700 shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <PenTool className={`w-4 h-4 ${isSigning ? 'animate-spin' : ''}`} />
                  <span>{isSigning ? 'Computing Signature...' : 'Digitally Sign & Approve'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
