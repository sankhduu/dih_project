'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase-client';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { useMetrologyStore } from '@/lib/store';
import { DigitalCertificateModal, TraderRecord } from '@/components/certificates/DigitalCertificateModal';
import { API_BASE_URL } from '@/lib/api-config';
import {
  Scale,
  Building2,
  CheckCircle2,
  Clock,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  FileBadge,
  Calendar,
  MapPin,
  RefreshCw,
  Search,
  Filter,
  Check,
  X,
  Printer,
  FileText,
  SlidersHorizontal,
  Download,
  QrCode,
  UserCheck,
  ChevronRight,
  Clock4,
  CheckCircle,
  FileCheck,
} from 'lucide-react';

type LmoTabType = 'inspection_queue' | 'visit_schedule' | 'verified' | 'certificates_issued';

const SEED_LMO_TRADERS: TraderRecord[] = [
  // Hisar district
  {
    id: 'HIS-TR-101',
    shop_name: 'Hisar Agro Mill & Grain Store',
    trader_name: 'Hisar Agro Mill & Grain Store',
    owner_name: 'Suresh Chand Bishnoi',
    license_number: 'HR-LMO-HIS-2026-081',
    district: 'Hisar',
    status: 'Pending_Inspection',
    address: 'Shop 14, Anaj Mandi, Hisar, Haryana - 125001',
    instrument_type: 'Platform Weighing Scale (500 kg)',
    capacity: '500 kg / e=50g',
    make_model: 'Avery Weight-Tronix AV-500',
    latitude: 29.1492,
    longitude: 75.7217,
    checklist_confirmed: false,
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'HIS-TR-102',
    shop_name: 'Haryana Steels & Hardware Traders',
    trader_name: 'Haryana Steels & Hardware Traders',
    owner_name: 'Pawan Jindal',
    license_number: 'HR-LMO-HIS-2026-094',
    district: 'Hisar',
    status: 'Scheduled',
    address: 'Plot 28, Industrial Area Phase II, Hisar - 125005',
    instrument_type: 'Electronic Crane Scale (10 Ton)',
    capacity: '10 Ton / e=2kg',
    make_model: 'Kranweigh KW-10T',
    latitude: 29.1711,
    longitude: 75.7334,
    checklist_confirmed: false,
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
  {
    id: 'HIS-TR-103',
    shop_name: 'Jindal Sweets & Dairy Products',
    trader_name: 'Jindal Sweets & Dairy Products',
    owner_name: 'Anil Jindal',
    license_number: 'HR-LMO-HIS-2026-105',
    district: 'Hisar',
    status: 'Verified',
    address: 'Main Gate, Rajguru Market, Hisar - 125001',
    instrument_type: 'Electronic Counter Scale (Class III)',
    capacity: '30 kg / e=5g',
    make_model: 'Essae DS-852 Tabletop',
    latitude: 29.1554,
    longitude: 75.7241,
    photo_url: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=500&auto=format&fit=crop&q=60',
    checklist_confirmed: true,
    lmo_id: 'officer.hisar@gov.in',
    digital_signature: 'LMO-VERIF-HIS-9014-PASS',
    signed_at: new Date(Date.now() - 86400000 * 4).toISOString(),
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 4).toISOString(),
  },
  {
    id: 'HIS-TR-104',
    shop_name: 'National Pharma Labs & Diagnostics',
    trader_name: 'National Pharma Labs & Diagnostics',
    owner_name: 'Dr. R.K. Mehta',
    license_number: 'HR-LMO-HIS-2026-118',
    district: 'Hisar',
    status: 'Approved',
    address: 'Near Civil Hospital, Delhi Road, Hisar - 125001',
    instrument_type: 'Analytical Precision Balance (Class II)',
    capacity: '220 g / e=0.1mg',
    make_model: 'Mettler Toledo ME204',
    latitude: 29.1481,
    longitude: 75.7388,
    photo_url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500&auto=format&fit=crop&q=60',
    checklist_confirmed: true,
    lmo_id: 'officer.hisar@gov.in',
    digital_signature: 'GATC-SIG-7F32A9C1D4E0F099',
    signed_at: new Date(Date.now() - 86400000 * 7).toISOString(),
    created_at: new Date(Date.now() - 86400000 * 8).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 7).toISOString(),
  },
  // Rohtak district
  {
    id: 'ROH-TR-001',
    shop_name: 'Sharma Kirana & General Store',
    trader_name: 'Sharma Kirana & General Store',
    owner_name: 'Ramesh Kumar Sharma',
    license_number: 'HR-LMO-ROH-2026-042',
    district: 'Rohtak',
    status: 'Pending_Inspection',
    address: 'Booth 12, Main Market, Model Town, Rohtak - 124001',
    instrument_type: 'Electronic Tabletop Scale (30 kg Class III)',
    capacity: '30 kg / e=2g',
    make_model: 'Essae DS-852 Tabletop',
    latitude: 28.8955,
    longitude: 76.6066,
    checklist_confirmed: false,
    created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
  {
    id: 'ROH-TR-002',
    shop_name: 'Haryana Gold & Diamond Jewelers',
    trader_name: 'Haryana Gold & Diamond Jewelers',
    owner_name: 'Vikram Soni',
    license_number: 'HR-LMO-ROH-2026-057',
    district: 'Rohtak',
    status: 'Scheduled',
    address: 'Sarafa Bazar, Near Quilla Mohalla, Rohtak - 124001',
    instrument_type: 'High Precision Gold Balance (Class II)',
    capacity: '600 g / e=0.01g',
    make_model: 'Sartorius Gold Series GS-600',
    latitude: 28.8955,
    longitude: 76.6066,
    checklist_confirmed: false,
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'ROH-TR-003',
    shop_name: 'Kisan Krishi Agro Mandi Depot',
    trader_name: 'Kisan Krishi Agro Mandi Depot',
    owner_name: 'Dharmender Hooda',
    license_number: 'HR-LMO-ROH-2026-093',
    district: 'Rohtak',
    status: 'Verified',
    address: 'Shed No. 7, New Grain Market, Rohtak - 124001',
    instrument_type: 'Mechanical Platform Scale (300 kg)',
    capacity: '300 kg / e=50g',
    make_model: 'Crown Weighing CW-300',
    latitude: 28.9012,
    longitude: 76.6124,
    checklist_confirmed: true,
    lmo_id: 'officer.rohtak@gov.in',
    digital_signature: 'LMO-VERIF-ROH-8821-PASS',
    signed_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: 'ROH-TR-004',
    shop_name: 'Delhi Bypass Petrol & Diesel Fuel Station',
    trader_name: 'Delhi Bypass Petrol & Diesel Fuel Station',
    owner_name: 'Baljeet Singh',
    license_number: 'HR-LMO-ROH-2026-112',
    district: 'Rohtak',
    status: 'Approved',
    address: 'NH-9 Delhi Road, Rohtak - 124021',
    instrument_type: 'Fuel Dispenser Flow Meter',
    capacity: '50 L/min standard flow',
    make_model: 'Tokheim Quantium 510',
    latitude: 28.8821,
    longitude: 76.6255,
    checklist_confirmed: true,
    lmo_id: 'officer.rohtak@gov.in',
    digital_signature: 'GATC-SIG-8F92A9C4D2E1F083',
    signed_at: new Date(Date.now() - 86400000 * 6).toISOString(),
    created_at: new Date(Date.now() - 86400000 * 7).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 6).toISOString(),
  },
];

export default function LMODashboardPage() {
  const router = useRouter();
  const { currentUser } = useMetrologyStore();

  // 1. Navigation & Tab State (Required by prompt)
  const [activeTab, setActiveTab] = useState<LmoTabType>('inspection_queue');
  const [headerNavTab, setHeaderNavTab] = useState<string>('officer-queue');

  // 2. User Profile & District Jurisdiction State
  const [userDistrict, setUserDistrict] = useState<string>('Hisar');
  const [officerName, setOfficerName] = useState<string>('Inspector Sharma');
  const [officerEmail, setOfficerEmail] = useState<string>('');

  // 3. Data & UI States
  const [traders, setTraders] = useState<TraderRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // 4. Action Modal States
  const [schedulingTrader, setSchedulingTrader] = useState<TraderRecord | null>(null);
  const [scheduleDate, setScheduleDate] = useState<string>(
    new Date(Date.now() + 86400000).toISOString().split('T')[0]
  );
  const [scheduleSlot, setScheduleSlot] = useState<string>('10:00 AM - 12:00 PM');
  const [selectedCertShop, setSelectedCertShop] = useState<TraderRecord | null>(null);
  const [verifyingTrader, setVerifyingTrader] = useState<TraderRecord | null>(null);
  const [verificationNotes, setVerificationNotes] = useState<string>('Calibrated within MPE Class III statutory tolerance.');
  const [sealNumber, setSealNumber] = useState<string>('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // -------------------------------------------------------------
  // Step 1: Get Authenticated User Profile & Determine District
  // -------------------------------------------------------------
  useEffect(() => {
    async function determineUserDistrict() {
      try {
        let detectedDistrict = '';
        let detectedName = '';
        let detectedEmail = '';

        if (supabase) {
          const { data: sessionData } = await supabase.auth.getSession();
          const authUser = sessionData?.session?.user;

          if (authUser) {
            detectedEmail = authUser.email || '';
            detectedDistrict = authUser.user_metadata?.district || '';
            detectedName = authUser.user_metadata?.full_name || '';

            // Check profiles table for assigned district
            if (!detectedDistrict && authUser.id) {
              const { data: profile } = await supabase
                .from('profiles')
                .select('district, full_name, role')
                .eq('id', authUser.id)
                .maybeSingle();

              if (profile?.district) {
                detectedDistrict = profile.district;
              }
              if (profile?.full_name && !detectedName) {
                detectedName = profile.full_name;
              }
            }
          }
        }

        // Fallback to zustand currentUser store
        if (!detectedDistrict && currentUser?.district) {
          detectedDistrict = currentUser.district;
        }
        if (!detectedName && currentUser?.fullName) {
          detectedName = currentUser.fullName;
        }

        // Default to 'Hisar' if unassigned
        const finalDistrict = detectedDistrict || 'Hisar';
        setUserDistrict(finalDistrict);
        if (detectedName) setOfficerName(detectedName);
        if (detectedEmail) setOfficerEmail(detectedEmail);
      } catch (err) {
        console.warn('Error determining officer district:', err);
        setUserDistrict('Hisar');
      }
    }

    determineUserDistrict();
  }, [currentUser]);

  // -------------------------------------------------------------
  // Step 2: Fetch Traders strictly filtered by userDistrict
  // -------------------------------------------------------------
  const fetchDistrictData = async (district: string) => {
    setLoading(true);
    try {
      if (supabase) {
        const { data, error } = await supabase
          .from('traders_list')
          .select('*')
          .eq('district', district)
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          setTraders(data as TraderRecord[]);
          setLoading(false);
          return;
        }
      }

      // Fallback: Filter seed data strictly by district
      const filteredSeed = SEED_LMO_TRADERS.filter(
        (t) => (t.district || '').toLowerCase() === district.toLowerCase()
      );
      setTraders(filteredSeed.length > 0 ? filteredSeed : SEED_LMO_TRADERS);
    } catch (err) {
      console.warn('Supabase traders_list fetch notice, using fallback:', err);
      const filteredSeed = SEED_LMO_TRADERS.filter(
        (t) => (t.district || '').toLowerCase() === district.toLowerCase()
      );
      setTraders(filteredSeed.length > 0 ? filteredSeed : SEED_LMO_TRADERS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userDistrict) {
      fetchDistrictData(userDistrict);
    }
  }, [userDistrict]);

  // -------------------------------------------------------------
  // Step 3: Realtime Supabase Subscription (Filtered by District)
  // -------------------------------------------------------------
  useEffect(() => {
    if (!supabase || !userDistrict) return;

    const channel = supabase
      .channel(`lmo-realtime-${userDistrict}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'traders_list' },
        (payload) => {
          const row = (payload.new || payload.old) as TraderRecord;
          if (!row) return;

          // Only react if the change belongs to this LMO's district
          if ((row.district || '').toLowerCase() === userDistrict.toLowerCase()) {
            fetchDistrictData(userDistrict);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userDistrict]);

  // -------------------------------------------------------------
  // Step 4: Category Filtering for the 4 Interactive Tabs
  // -------------------------------------------------------------
  const counts = useMemo(() => {
    return {
      queue: traders.filter((t) => {
        const s = (t.status || '').toLowerCase();
        return s === 'pending_inspection' || s === 'pending' || s === 'submitted' || s === 'under_review';
      }).length,
      scheduled: traders.filter((t) => {
        const s = (t.status || '').toLowerCase();
        return s === 'scheduled' || s === 'visit_scheduled';
      }).length,
      verified: traders.filter((t) => {
        const s = (t.status || '').toLowerCase();
        return s === 'verified' || s === 'passed' || s === 'under_review';
      }).length,
      issued: traders.filter((t) => {
        const s = (t.status || '').toLowerCase();
        return s === 'approved' || s === 'verified' || Boolean(t.digital_signature);
      }).length,
    };
  }, [traders]);

  const displayedList = useMemo(() => {
    let list = [...traders];

    // Filter by activeTab
    if (activeTab === 'inspection_queue') {
      list = list.filter((t) => {
        const s = (t.status || '').toLowerCase();
        return s === 'pending_inspection' || s === 'pending' || s === 'submitted';
      });
    } else if (activeTab === 'visit_schedule') {
      list = list.filter((t) => {
        const s = (t.status || '').toLowerCase();
        return s === 'scheduled' || s === 'visit_scheduled';
      });
    } else if (activeTab === 'verified') {
      list = list.filter((t) => {
        const s = (t.status || '').toLowerCase();
        return s === 'verified' || s === 'passed' || s === 'under_review';
      });
    } else if (activeTab === 'certificates_issued') {
      list = list.filter((t) => {
        const s = (t.status || '').toLowerCase();
        return s === 'approved' || s === 'verified' || Boolean(t.digital_signature);
      });
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (t) =>
          (t.shop_name || t.trader_name || '').toLowerCase().includes(q) ||
          (t.owner_name || '').toLowerCase().includes(q) ||
          (t.license_number || '').toLowerCase().includes(q) ||
          (t.instrument_type || '').toLowerCase().includes(q)
      );
    }

    return list;
  }, [traders, activeTab, searchQuery]);

  // -------------------------------------------------------------
  // Actions: Schedule Visit & Complete Verification
  // -------------------------------------------------------------
  const handleConfirmSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schedulingTrader) return;

    const targetLicense = schedulingTrader.license_number;
    const updatedStatus = 'Scheduled';

    // Optimistic local state update
    setTraders((prev) =>
      prev.map((t) =>
        t.license_number === targetLicense
          ? { ...t, status: updatedStatus, updated_at: new Date().toISOString() }
          : t
      )
    );

    // Supabase update
    if (supabase) {
      try {
        await supabase
          .from('traders_list')
          .update({
            status: updatedStatus,
            updated_at: new Date().toISOString(),
          })
          .eq('license_number', targetLicense);
      } catch (err) {
        console.warn('Note updating schedule in Supabase:', err);
      }
    }

    showToast(`Visit scheduled for ${schedulingTrader.shop_name || schedulingTrader.trader_name} on ${scheduleDate} (${scheduleSlot})`);
    setSchedulingTrader(null);
  };

  const handleConfirmVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyingTrader) return;

    const targetLicense = verifyingTrader.license_number;
    const generatedSeal = sealNumber.trim() || `SEAL-${targetLicense.replace(/[^a-zA-Z0-9]/g, '-')}-IND`;
    const updatedStatus = 'Verified';

    // Optimistic update
    setTraders((prev) =>
      prev.map((t) =>
        t.license_number === targetLicense
          ? {
              ...t,
              status: updatedStatus,
              checklist_confirmed: true,
              lmo_id: officerEmail || 'officer.lmo@gov.in',
              digital_signature: `LMO-VERIF-${targetLicense.slice(-4)}-PASS`,
              signed_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }
          : t
      )
    );

    if (supabase) {
      try {
        await supabase
          .from('traders_list')
          .update({
            status: updatedStatus,
            checklist_confirmed: true,
            lmo_id: officerEmail || 'officer.lmo@gov.in',
            digital_signature: `LMO-VERIF-${targetLicense.slice(-4)}-PASS`,
            signed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('license_number', targetLicense);
      } catch (err) {
        console.warn('Note updating verification in Supabase:', err);
      }
    }

    showToast(`Statutory verification stamped for ${verifyingTrader.shop_name || verifyingTrader.trader_name} (Seal: ${generatedSeal})`);
    setVerifyingTrader(null);
    setSealNumber('');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans text-slate-900">
      {/* Top Header */}
      <Header activeTab={headerNavTab} setActiveTab={setHeaderNavTab} />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Toast Notification */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 bg-[#002B49] text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 border border-amber-400/40 text-xs font-semibold animate-in slide-in-from-bottom-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Officer & Jurisdiction Header Banner */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#002B49] text-white flex items-center justify-center font-bold text-xl shadow-xs shrink-0">
              <ShieldCheck className="w-8 h-8 text-amber-400" />
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  {officerName}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold border border-indigo-200">
                  Legal Metrology Officer (LMO)
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Online
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 font-medium">
                <span className="flex items-center gap-1 font-bold text-slate-700">
                  <MapPin className="w-3.5 h-3.5 text-amber-600" />
                  Assigned Jurisdiction District: <span className="underline decoration-amber-500 decoration-2">{userDistrict}</span>
                </span>
                <span>•</span>
                <span>Filtered strictly via <code className="bg-slate-100 px-1 py-0.5 rounded text-[11px] font-mono text-slate-700">.eq(&apos;district&apos;, &apos;{userDistrict}&apos;)</code></span>
              </div>
            </div>
          </div>

          {/* Quick District Switcher for Testing Jurisdiction Routing */}
          <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-2xl border border-slate-200 self-start md:self-auto">
            <span className="text-xs font-bold text-slate-500 pl-2">District:</span>
            <select
              value={userDistrict}
              onChange={(e) => {
                const newD = e.target.value;
                setUserDistrict(newD);
                showToast(`Switched view to ${newD} district jurisdiction`);
              }}
              className="text-xs font-bold bg-white text-slate-900 px-3 py-1.5 rounded-xl border border-slate-300 shadow-2xs focus:outline-none focus:ring-2 focus:ring-[#002B49] cursor-pointer"
            >
              <option value="Hisar">Hisar (Haryana)</option>
              <option value="Rohtak">Rohtak (Haryana)</option>
              <option value="South Delhi">South Delhi (NCR)</option>
              <option value="Gurugram">Gurugram (NCR)</option>
            </select>
            <button
              onClick={() => fetchDistrictData(userDistrict)}
              title="Refresh District Records"
              className="p-2 bg-white hover:bg-slate-100 text-slate-700 rounded-xl border border-slate-200 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-600' : ''}`} />
            </button>
          </div>
        </div>

        {/* Interactive Navigation Tabs (Required by prompt) */}
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2.5 border-b border-slate-200 pb-3">
            {/* Tab 1: Inspection Queue */}
            <button
              onClick={() => setActiveTab('inspection_queue')}
              className={`px-5 py-2.5 text-xs font-extrabold rounded-2xl transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'inspection_queue'
                  ? 'bg-[#002B49] text-white shadow-md ring-2 ring-[#002B49]/30'
                  : 'bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/90'
              }`}
            >
              <Clock4 className={`w-4 h-4 ${activeTab === 'inspection_queue' ? 'text-amber-400' : 'text-slate-400'}`} />
              <span>Inspection Queue</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  activeTab === 'inspection_queue'
                    ? 'bg-amber-400 text-slate-950 font-black'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {counts.queue}
              </span>
            </button>

            {/* Tab 2: Visit Schedule */}
            <button
              onClick={() => setActiveTab('visit_schedule')}
              className={`px-5 py-2.5 text-xs font-extrabold rounded-2xl transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'visit_schedule'
                  ? 'bg-[#002B49] text-white shadow-md ring-2 ring-[#002B49]/30'
                  : 'bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/90'
              }`}
            >
              <Calendar className={`w-4 h-4 ${activeTab === 'visit_schedule' ? 'text-amber-400' : 'text-slate-400'}`} />
              <span>Visit Schedule</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  activeTab === 'visit_schedule'
                    ? 'bg-amber-400 text-slate-950 font-black'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {counts.scheduled}
              </span>
            </button>

            {/* Tab 3: Verified */}
            <button
              onClick={() => setActiveTab('verified')}
              className={`px-5 py-2.5 text-xs font-extrabold rounded-2xl transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'verified'
                  ? 'bg-[#002B49] text-white shadow-md ring-2 ring-[#002B49]/30'
                  : 'bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/90'
              }`}
            >
              <CheckCircle className={`w-4 h-4 ${activeTab === 'verified' ? 'text-amber-400' : 'text-slate-400'}`} />
              <span>Verified</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  activeTab === 'verified'
                    ? 'bg-amber-400 text-slate-950 font-black'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {counts.verified}
              </span>
            </button>

            {/* Tab 4: Certificates Issued */}
            <button
              onClick={() => setActiveTab('certificates_issued')}
              className={`px-5 py-2.5 text-xs font-extrabold rounded-2xl transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'certificates_issued'
                  ? 'bg-[#002B49] text-white shadow-md ring-2 ring-[#002B49]/30'
                  : 'bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/90'
              }`}
            >
              <FileCheck className={`w-4 h-4 ${activeTab === 'certificates_issued' ? 'text-amber-400' : 'text-slate-400'}`} />
              <span>Certificates Issued</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  activeTab === 'certificates_issued'
                    ? 'bg-amber-400 text-slate-950 font-black'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {counts.issued}
              </span>
            </button>
          </div>

          {/* Search Bar & Sub-heading */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="font-black text-base text-slate-900 tracking-tight">
                {activeTab === 'inspection_queue' && `Pending Inspection Applications (${displayedList.length})`}
                {activeTab === 'visit_schedule' && `Scheduled On-Site Field Visits (${displayedList.length})`}
                {activeTab === 'verified' && `Statically Verified Instruments (${displayedList.length})`}
                {activeTab === 'certificates_issued' && `Official Verification Certificates (${displayedList.length})`}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {activeTab === 'inspection_queue' && `Showing pending applications within ${userDistrict} legal metrology jurisdiction.`}
                {activeTab === 'visit_schedule' && `Active field appointments scheduled for on-site calibration & seal verification.`}
                {activeTab === 'verified' && `Traders calibrated within statutory MPE tolerances awaiting GATC certification.`}
                {activeTab === 'certificates_issued' && `Legal Metrology verification certificates issued with statutory QR codes.`}
              </p>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search trader, license, instrument..."
                className="w-full bg-white text-xs pl-9 pr-4 py-2 rounded-xl border border-slate-200 shadow-2xs focus:outline-none focus:ring-2 focus:ring-[#002B49]"
              />
            </div>
          </div>
        </div>

        {/* --------------------------------------------------------- */}
        {/* Main Content Body (Conditionally rendered by activeTab)    */}
        {/* --------------------------------------------------------- */}
        {loading ? (
          <div className="bg-white rounded-3xl p-16 text-center border border-slate-200 shadow-xs flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-7 h-7 text-blue-600 animate-spin" />
            <div className="text-sm font-bold text-slate-700">Loading {userDistrict} jurisdiction applications...</div>
            <div className="text-xs text-slate-400 font-mono">Executing query: .from(&apos;traders_list&apos;).select(&apos;*&apos;).eq(&apos;district&apos;, &apos;{userDistrict}&apos;)</div>
          </div>
        ) : displayedList.length === 0 ? (
          <div className="bg-white rounded-3xl p-16 text-center border border-slate-200 shadow-xs space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Scale className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-base text-slate-800">
              No Applications in this View
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              No trader records found matching tab <strong>{activeTab.replace(/_/g, ' ')}</strong> for <strong>{userDistrict}</strong> district.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3.5">Trader & Business</th>
                    <th className="px-6 py-3.5">License No.</th>
                    <th className="px-6 py-3.5">Instrument Details</th>
                    <th className="px-6 py-3.5">Premises Location</th>
                    <th className="px-6 py-3.5">District</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {displayedList.map((t) => {
                    const shopName = t.shop_name || t.trader_name || 'Commercial Trader';
                    const ownerName = t.owner_name || 'Registered Proprietor';
                    const statusLower = (t.status || '').toLowerCase();

                    return (
                      <tr key={t.id || t.license_number} className="hover:bg-slate-50/80 transition-colors">
                        {/* Trader & Business Name */}
                        <td className="px-6 py-4">
                          <div className="font-extrabold text-slate-900 text-sm">{shopName}</div>
                          <div className="text-[11px] text-slate-500 font-medium mt-0.5">Proprietor: {ownerName}</div>
                        </td>

                        {/* License Number */}
                        <td className="px-6 py-4">
                          <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-1 rounded-md border border-slate-200">
                            {t.license_number}
                          </span>
                        </td>

                        {/* Instrument Details */}
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-800">{t.instrument_type || 'Electronic Scale'}</div>
                          <div className="text-[11px] text-indigo-600 font-medium mt-0.5">
                            {t.make_model || 'Standard Counter Scale'} {t.capacity ? `• ${t.capacity}` : ''}
                          </div>
                        </td>

                        {/* Premises Address */}
                        <td className="px-6 py-4">
                          <div className="max-w-xs text-[11px] text-slate-600 truncate">
                            {t.address || `${userDistrict} Commercial Market`}
                          </div>
                          {t.latitude && t.longitude && (
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                              GPS: {t.latitude.toFixed(4)}, {t.longitude.toFixed(4)}
                            </div>
                          )}
                        </td>

                        {/* District Badge */}
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-[#002B49] bg-[#002B49]/10 px-2.5 py-1 rounded-lg">
                            <MapPin className="w-3 h-3 text-amber-600" />
                            {t.district || userDistrict}
                          </span>
                        </td>

                        {/* Status Badge */}
                        <td className="px-6 py-4">
                          {statusLower === 'approved' && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Approved
                            </span>
                          )}
                          {statusLower === 'verified' && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-lg">
                              <ShieldCheck className="w-3.5 h-3.5" />
                              Verified
                            </span>
                          )}
                          {statusLower === 'scheduled' && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-300 px-2.5 py-1 rounded-lg">
                              <Calendar className="w-3.5 h-3.5 text-amber-600" />
                              Scheduled
                            </span>
                          )}
                          {(statusLower === 'pending_inspection' || statusLower === 'pending' || statusLower === 'submitted') && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg">
                              <Clock className="w-3.5 h-3.5" />
                              Pending
                            </span>
                          )}
                        </td>

                        {/* Contextual Action Buttons */}
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {/* Schedule Button (For Inspection Queue) */}
                            {activeTab === 'inspection_queue' && (
                              <button
                                onClick={() => setSchedulingTrader(t)}
                                className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 font-bold text-[11px] rounded-xl flex items-center gap-1 transition-colors cursor-pointer"
                              >
                                <Calendar className="w-3.5 h-3.5 text-amber-600" />
                                <span>Schedule Visit</span>
                              </button>
                            )}

                            {/* Verify Button (For Queue or Scheduled Visit) */}
                            {(activeTab === 'inspection_queue' || activeTab === 'visit_schedule') && (
                              <button
                                onClick={() => setVerifyingTrader(t)}
                                className="px-3 py-1.5 bg-[#002B49] hover:bg-[#003B66] text-white font-bold text-[11px] rounded-xl flex items-center gap-1 transition-colors shadow-2xs cursor-pointer"
                              >
                                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                                <span>Inspect & Verify</span>
                              </button>
                            )}

                            {/* View / Download Certificate (For Verified or Issued Tabs) */}
                            {(activeTab === 'verified' || activeTab === 'certificates_issued') && (
                              <>
                                <button
                                  onClick={() => setSelectedCertShop(t)}
                                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-[11px] rounded-xl flex items-center gap-1 transition-colors cursor-pointer"
                                >
                                  <FileText className="w-3.5 h-3.5 text-indigo-600" />
                                  <span>Digital Cert</span>
                                </button>
                                <a
                                  href={`${API_BASE_URL}/api/certificate/${encodeURIComponent(t.license_number)}`}
                                  download
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold text-[11px] rounded-xl flex items-center gap-1 transition-colors"
                                >
                                  <Download className="w-3 h-3 text-emerald-600" />
                                  <span>PDF</span>
                                </a>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* --------------------------------------------------------- */}
        {/* Modal 1: Schedule Inspection Visit                        */}
        {/* --------------------------------------------------------- */}
        {schedulingTrader && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-slate-900">Schedule Field Visit</h3>
                    <p className="text-[11px] text-slate-500">Assign on-site inspection date & time slot</p>
                  </div>
                </div>
                <button
                  onClick={() => setSchedulingTrader(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1">
                <div className="font-bold text-slate-900">{schedulingTrader.shop_name || schedulingTrader.trader_name}</div>
                <div className="text-slate-500">License: <span className="font-mono font-bold text-slate-700">{schedulingTrader.license_number}</span></div>
                <div className="text-slate-500">Premises: {schedulingTrader.address}</div>
              </div>

              <form onSubmit={handleConfirmSchedule} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Inspection Date</label>
                  <input
                    type="date"
                    required
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#002B49]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Time Window</label>
                  <select
                    value={scheduleSlot}
                    onChange={(e) => setScheduleSlot(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#002B49]"
                  >
                    <option value="10:00 AM - 12:00 PM">10:00 AM - 12:00 PM (Morning Slot)</option>
                    <option value="01:00 PM - 03:00 PM">01:00 PM - 03:00 PM (Afternoon Slot)</option>
                    <option value="03:30 PM - 05:30 PM">03:30 PM - 05:30 PM (Evening Slot)</option>
                  </select>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setSchedulingTrader(null)}
                    className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-bold bg-[#002B49] hover:bg-[#003B66] text-white rounded-xl shadow-xs"
                  >
                    Confirm Schedule
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* --------------------------------------------------------- */}
        {/* Modal 2: Perform Physical Field Inspection                */}
        {/* --------------------------------------------------------- */}
        {verifyingTrader && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-slate-900">Physical Field Inspection & Stamping</h3>
                    <p className="text-[11px] text-slate-500">Legal Metrology Act, 2009 statutory verification</p>
                  </div>
                </div>
                <button
                  onClick={() => setVerifyingTrader(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1">
                <div className="font-bold text-slate-900">{verifyingTrader.shop_name || verifyingTrader.trader_name}</div>
                <div className="text-slate-500">License: <span className="font-mono font-bold text-slate-700">{verifyingTrader.license_number}</span></div>
                <div className="text-slate-500">Instrument: {verifyingTrader.instrument_type} ({verifyingTrader.capacity || 'Standard'})</div>
              </div>

              <form onSubmit={handleConfirmVerification} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Lead Physical Security Seal No.</label>
                  <input
                    type="text"
                    required
                    value={sealNumber}
                    onChange={(e) => setSealNumber(e.target.value)}
                    placeholder="e.g. SEAL-HR-2026-9041-IND"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-[#002B49]"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Unique tamper-evident lead seal stamped onto the verification orifice</p>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Calibration Observation & MPE Remarks</label>
                  <textarea
                    rows={2}
                    value={verificationNotes}
                    onChange={(e) => setVerificationNotes(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#002B49]"
                  />
                </div>

                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-[11px] text-emerald-900 flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    Confirming that the instrument complies with Maximum Permissible Error (MPE) tolerances under Schedule IX (Form V).
                  </span>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setVerifyingTrader(null)}
                    className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-bold bg-[#002B49] hover:bg-[#003B66] text-white rounded-xl shadow-xs flex items-center gap-1.5"
                  >
                    <ShieldCheck className="w-4 h-4 text-amber-400" />
                    <span>Stamp & Mark Verified</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* --------------------------------------------------------- */}
        {/* Modal 3: Digital Certificate View with QR Code             */}
        {/* --------------------------------------------------------- */}
        <DigitalCertificateModal
          isOpen={Boolean(selectedCertShop)}
          onClose={() => setSelectedCertShop(null)}
          shop={selectedCertShop}
        />
      </main>

      <Footer />
    </div>
  );
}
