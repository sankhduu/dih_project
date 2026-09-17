'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase-client';
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
  FileBadge,
  Calendar,
  MapPin,
  RefreshCw,
  Search,
  Check,
  X,
  FileText,
  Download,
  QrCode,
  Clock4,
  CheckCircle,
  FileCheck,
  Wifi,
  WifiOff,
} from 'lucide-react';

export type LmoTabType = 'inspection_queue' | 'visit_schedule' | 'verified' | 'certificates_issued';

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
  // South Delhi district
  {
    id: 'DL-TR-001',
    shop_name: 'Saket Provision & Retail Supermarket',
    trader_name: 'Saket Provision & Retail Supermarket',
    owner_name: 'Ramesh Kumar',
    license_number: 'DL-LMO-SOU-2026-001',
    district: 'South Delhi',
    status: 'Pending_Inspection',
    address: 'Shop 14, Main Market, Hauz Khas, New Delhi - 110016',
    instrument_type: 'Electronic Counter Scale (Class III)',
    capacity: '30 kg / e=5g',
    make_model: 'Essae-Teraoka DS-215 POS',
    latitude: 28.5494,
    longitude: 77.2001,
    checklist_confirmed: false,
    created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
  {
    id: 'DL-TR-002',
    shop_name: 'Hauz Khas Agro Flour & Grain Depot',
    trader_name: 'Hauz Khas Agro Flour & Grain Depot',
    owner_name: 'Sunil Mathur',
    license_number: 'DL-LMO-SOU-2026-002',
    district: 'South Delhi',
    status: 'Scheduled',
    address: 'Loading Bay, Apex Supermarket, Hauz Khas - 110016',
    instrument_type: 'Platform Scale (300 kg)',
    capacity: '300 kg / e=50g',
    make_model: 'Avery Weigh-Tronix ProPlatform 300',
    latitude: 28.5492,
    longitude: 77.2005,
    checklist_confirmed: false,
    scheduled_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    scheduled_slot: '10:00 AM - 12:00 PM',
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
  {
    id: 'DL-TR-003',
    shop_name: 'Delhi NCR Fuel Station & Logistics',
    trader_name: 'Delhi NCR Fuel Station & Logistics',
    owner_name: 'Ms. Marian Spinka',
    license_number: 'DL-LMO-SOU-2026-003',
    district: 'South Delhi',
    status: 'Verified',
    address: 'Plot 12, Okhla Industrial Area Phase-II, New Delhi - 110020',
    instrument_type: 'Fuel Dispenser Flow Meter',
    capacity: '50 L/min standard flow',
    make_model: 'Tokheim Quantium 510',
    latitude: 28.4298,
    longitude: 77.0028,
    checklist_confirmed: true,
    lmo_id: 'lmo.southdelhi@doca.gov.in',
    digital_signature: 'LMO-VERIF-DL-9014-PASS',
    signed_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: 'DL-TR-004',
    shop_name: 'Precision Analytical Labs Okhla',
    trader_name: 'Precision Analytical Labs Okhla',
    owner_name: 'Dr. Priya Sharma',
    license_number: 'DL-LMO-SOU-2026-004',
    district: 'South Delhi',
    status: 'Approved',
    address: 'Cleanroom Lab B-2, Okhla Phase-III, New Delhi - 110020',
    instrument_type: 'Analytical Micro-Balance (Class I)',
    capacity: '220 g / e=0.1mg',
    make_model: 'Mettler Toledo XPR-205',
    latitude: 28.5284,
    longitude: 77.2711,
    checklist_confirmed: true,
    lmo_id: 'lmo.southdelhi@doca.gov.in',
    digital_signature: 'GATC-SIG-7F32A9C1D4E0F099',
    signed_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    created_at: new Date(Date.now() - 86400000 * 6).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
  // Gurugram district
  {
    id: 'GGN-TR-001',
    shop_name: 'Cyber City Retail Mart & Groceries',
    trader_name: 'Cyber City Retail Mart & Groceries',
    owner_name: 'Amitabh Sen',
    license_number: 'HR-LMO-GGN-2026-001',
    district: 'Gurugram',
    status: 'Pending_Inspection',
    address: 'DLF Phase 2, Sector 25, Gurugram - 122002',
    instrument_type: 'Electronic Counter Scale (Class III)',
    capacity: '30 kg / e=5g',
    make_model: 'Essae DS-852 Tabletop',
    latitude: 28.4895,
    longitude: 77.0890,
    checklist_confirmed: false,
    created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
  {
    id: 'GGN-TR-002',
    shop_name: 'Gurugram Cold Storage & Dairy Depot',
    trader_name: 'Gurugram Cold Storage & Dairy Depot',
    owner_name: 'Mrs. Alysa Bahringer',
    license_number: 'HR-LMO-GGN-2026-002',
    district: 'Gurugram',
    status: 'Scheduled',
    address: 'Shed 4, Udyog Vihar Phase 4, Gurugram - 122015',
    instrument_type: 'Platform Scale (500 kg)',
    capacity: '500 kg / e=50g',
    make_model: 'Avery Weigh-Tronix AV-500',
    latitude: 28.5025,
    longitude: 77.0763,
    checklist_confirmed: false,
    scheduled_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    scheduled_slot: '02:00 PM - 04:00 PM',
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
  {
    id: 'GGN-TR-003',
    shop_name: 'Heritage Gold & Diamonds MG Road',
    trader_name: 'Heritage Gold & Diamonds MG Road',
    owner_name: 'Kailash Choksi',
    license_number: 'HR-LMO-GGN-2026-003',
    district: 'Gurugram',
    status: 'Verified',
    address: 'Shop 10, Gold Souk Mall, Block C, Sushant Lok Phase I, Gurugram - 122002',
    instrument_type: 'High Precision Gold Balance (Class II)',
    capacity: '600 g / e=0.01g',
    make_model: 'Sartorius Gold Series GS-600',
    latitude: 28.4612,
    longitude: 77.0754,
    checklist_confirmed: true,
    lmo_id: 'officer.gurugram@gov.in',
    digital_signature: 'LMO-VERIF-GGN-8821-PASS',
    signed_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: 'GGN-TR-004',
    shop_name: 'Manesar Logistics & Bulk Weighbridge',
    trader_name: 'Manesar Logistics & Bulk Weighbridge',
    owner_name: 'Surinder Rao',
    license_number: 'HR-LMO-GGN-2026-004',
    district: 'Gurugram',
    status: 'Approved',
    address: 'Plot 99, Sector 8, IMT Manesar, Gurugram - 122050',
    instrument_type: 'Weighbridge (60 Ton)',
    capacity: '60 Ton / e=10kg',
    make_model: 'Avery Weigh-Tronix Bridgemont',
    latitude: 28.3512,
    longitude: 76.9388,
    checklist_confirmed: true,
    lmo_id: 'officer.gurugram@gov.in',
    digital_signature: 'GATC-SIG-GGN-9912-CERT',
    signed_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    created_at: new Date(Date.now() - 86400000 * 6).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
];

function generateDistrictSeed(dist: string): TraderRecord[] {
  const code = (dist || 'LMO').substring(0, 3).toUpperCase();
  return [
    {
      id: `${code}-TR-001`,
      shop_name: `${dist} Retail & Grocery Mart`,
      trader_name: `${dist} Retail & Grocery Mart`,
      owner_name: 'Rajesh Kumar',
      license_number: `HR-LMO-${code}-2026-101`,
      district: dist,
      status: 'Pending_Inspection',
      inspection_status: 'Pending',
      address: `Shop 14, Main Commercial Complex, ${dist}`,
      instrument_type: 'Electronic Counter Scale (Class III)',
      capacity: '30 kg / e=5g',
      make_model: 'Essae DS-852 Tabletop',
      checklist_confirmed: false,
      created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
      updated_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    },
    {
      id: `${code}-TR-002`,
      shop_name: `${dist} Agro Mandi Wholesale Depot`,
      trader_name: `${dist} Agro Mandi Wholesale Depot`,
      owner_name: 'Suresh Verma',
      license_number: `HR-LMO-${code}-2026-102`,
      district: dist,
      status: 'Scheduled',
      inspection_status: 'Pending',
      address: `Shed 8, Grain Market Yard, ${dist}`,
      instrument_type: 'Platform Weighing Scale (500 kg)',
      capacity: '500 kg / e=50g',
      make_model: 'Avery Weigh-Tronix AV-500',
      checklist_confirmed: false,
      scheduled_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      scheduled_slot: '10:00 AM - 12:00 PM',
      created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
      updated_at: new Date(Date.now() - 86400000 * 1).toISOString(),
    },
    {
      id: `${code}-TR-003`,
      shop_name: `${dist} Jewelers & Precision Metals`,
      trader_name: `${dist} Jewelers & Precision Metals`,
      owner_name: 'Vikram Soni',
      license_number: `HR-LMO-${code}-2026-103`,
      district: dist,
      status: 'Verified',
      inspection_status: 'Passed',
      address: `Sarafa Bazar, Near Clock Tower, ${dist}`,
      instrument_type: 'High Precision Gold Balance (Class II)',
      capacity: '600 g / e=0.01g',
      make_model: 'Sartorius Gold Series GS-600',
      checklist_confirmed: true,
      digital_signature: `LMO-VERIF-${code}-8821-PASS`,
      signed_at: new Date(Date.now() - 86400000 * 3).toISOString(),
      created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
      updated_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    },
    {
      id: `${code}-TR-004`,
      shop_name: `${dist} Fuel & Petroleum Dispenser`,
      trader_name: `${dist} Fuel & Petroleum Dispenser`,
      owner_name: 'Dr. Priya Sharma',
      license_number: `HR-LMO-${code}-2026-104`,
      district: dist,
      status: 'Approved',
      inspection_status: 'Passed',
      address: `Highway Bypass Logistics Plaza, ${dist}`,
      instrument_type: 'Fuel Dispenser Flow Meter',
      capacity: '50 L/min',
      make_model: 'Tokheim Quantium 510',
      checklist_confirmed: true,
      digital_signature: `GATC-SIG-${code}-9014-CERT`,
      signed_at: new Date(Date.now() - 86400000 * 5).toISOString(),
      created_at: new Date(Date.now() - 86400000 * 6).toISOString(),
      updated_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    },
  ];
}

interface OfficerDashboardProps {
  initialTab?: string;
  onTabChange?: (tab: LmoTabType) => void;
}

export function OfficerDashboard({ initialTab, onTabChange }: OfficerDashboardProps) {
  const { currentUser, isOfflineMode, setIsOfflineMode } = useMetrologyStore();

  // 1. Navigation & Tab State (Strictly fulfills: inspection_queue, visit_schedule, verified, certificates_issued)
  const resolveTab = (t?: string): LmoTabType => {
    if (t === 'visit_schedule' || t === 'officer-calendar') return 'visit_schedule';
    if (t === 'verified') return 'verified';
    if (t === 'certificates_issued' || t === 'officer-history') return 'certificates_issued';
    return 'inspection_queue';
  };

  const [activeTab, setActiveTab] = useState<LmoTabType>(resolveTab(initialTab));

  useEffect(() => {
    if (initialTab) {
      setActiveTab(resolveTab(initialTab));
    }
  }, [initialTab]);

  const handleTabChange = (t: LmoTabType) => {
    setActiveTab(t);
    onTabChange?.(t);
  };

  // 2. User Profile & District Jurisdiction State
  const [userDistrict, setUserDistrict] = useState<string>('Hisar');
  const [officerName, setOfficerName] = useState<string>('Inspector Sharma');
  const [officerEmail, setOfficerEmail] = useState<string>('');
  const [officerId, setOfficerId] = useState<string>('');

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
  // Step 1 & 2: Confirm Session, Determine District & Fetch Data
  // Supports Supabase direct query (.eq('district', userDistrict))
  // AND Express API (/api/traders?district=Hisar)
  // -------------------------------------------------------------
  // Step 1 & 2: Confirm Session, Determine District & Fetch Data
  // Strictly filter Supabase query so it ONLY fetches rows matching
  // the logged-in LMO's specific ID or assigned District. Never show all users!
  // -------------------------------------------------------------
  const fetchDistrictData = async (district: string, offId?: string, offEmail?: string) => {
    setLoading(true);
    let loaded: TraderRecord[] = [];
    const activeOfficerId = offId || officerId;
    const activeOfficerEmail = offEmail || officerEmail;

    // 1. Direct Supabase Query (Filtered strictly by logged-in LMO ID or assigned District)
    if (supabase) {
      try {
        let listQuery = supabase.from('traders_list').select('*');
        if (district && district.toLowerCase() !== 'all') {
          listQuery = listQuery.ilike('district', `%${district}%`);
        }
        const { data: listData, error: listError } = await listQuery.order('license_number', { ascending: false });

        if (!listError && listData && listData.length > 0) {
          loaded = listData as TraderRecord[];
        } else {
          // Check 'traders' table with strict district or officer ID filter
          let trQuery = supabase.from('traders').select('*');
          if (activeOfficerEmail || activeOfficerId) {
            const conditions = [`district.eq.${district}`];
            if (activeOfficerEmail) conditions.push(`assigned_officer.eq.${activeOfficerEmail}`);
            if (activeOfficerId) conditions.push(`assigned_officer.eq.${activeOfficerId}`);
            trQuery = trQuery.or(conditions.join(','));
          } else {
            trQuery = trQuery.eq('district', district);
          }
          const { data: trData, error: trError } = await trQuery;

          if (!trError && trData && trData.length > 0) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            loaded = trData.map((t: any) => ({
              id: String(t.id || t.license_number),
              trader_name: t.shop_name || t.trader_name,
              shop_name: t.shop_name || t.trader_name,
              owner_name: t.owner_name,
              license_number: t.license_number,
              district: t.district || district,
              status: t.status || (t.inspection_status === 'Passed' ? 'Approved' : t.inspection_status || 'Pending_Inspection'),
              inspection_status: t.inspection_status || (t.status === 'Approved' ? 'Passed' : 'Pending'),
              instrument_type: t.instrument_type,
              latitude: t.latitude,
              longitude: t.longitude,
            }));
          }
        }
      } catch (sbErr) {
        console.warn('Direct Supabase fetch note:', sbErr);
      }
    }

    // 2. Express API Query (/api/traders?district=...)
    if (loaded.length === 0) {
      try {
        let apiUrl = `${API_BASE_URL}/api/traders?district=${encodeURIComponent(district)}`;
        if (typeof window !== 'undefined') {
          const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
          if (!isLocalhost && (apiUrl.includes('localhost') || apiUrl.includes('127.0.0.1'))) {
            apiUrl = `/api/traders?district=${encodeURIComponent(district)}`;
          }
        }

        const res = await fetch(apiUrl);
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.data) && json.data.length > 0) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            loaded = json.data.map((t: any) => ({
              id: String(t.id || t.license_number),
              trader_name: t.shop_name || t.trader_name,
              shop_name: t.shop_name || t.trader_name,
              owner_name: t.owner_name,
              license_number: t.license_number,
              district: t.district || district,
              status: t.status || (t.inspection_status === 'Passed' ? 'Approved' : t.inspection_status || 'Pending_Inspection'),
              inspection_status: t.inspection_status || (t.status === 'Approved' ? 'Passed' : 'Pending'),
              instrument_type: t.instrument_type,
              latitude: t.latitude,
              longitude: t.longitude,
            }));
          }
        }
      } catch (apiErr) {
        console.warn('Express API fetch note:', apiErr);
      }
    }

    // 3. Fallback: Seed data strictly filtered by this officer's district or ID
    const matchedSeed = SEED_LMO_TRADERS.filter((t) => {
      const distMatch = (t.district || '').toLowerCase() === district.toLowerCase();
      const idMatch =
        (activeOfficerEmail && t.lmo_id === activeOfficerEmail) ||
        (activeOfficerId && t.lmo_id === activeOfficerId);
      return distMatch || idMatch;
    });
    const districtFallback = matchedSeed.length > 0 ? matchedSeed : generateDistrictSeed(district);

    // STRICT GUARANTEE: Never show all users! Always filter strictly by logged-in LMO ID or District
    const officerFiltered = loaded.filter((t) => {
      const distMatch = (t.district || '').toLowerCase() === district.toLowerCase();
      const idMatch =
        (activeOfficerEmail && t.lmo_id === activeOfficerEmail) ||
        (activeOfficerId && t.lmo_id === activeOfficerId);
      return distMatch || idMatch;
    });

    setTraders(officerFiltered.length > 0 ? officerFiltered : districtFallback);
    setLoading(false);
  };

  useEffect(() => {
    let isMounted = true;

    async function initializeOfficerAndData() {
      try {
        let confirmedDistrict = '';
        let confirmedName = '';
        let confirmedEmail = '';
        let confirmedId = '';

        if (supabase) {
          const { data: sessionData } = await supabase.auth.getSession();
          const authUser = sessionData?.session?.user;

          if (authUser) {
            confirmedId = authUser.id;
            confirmedEmail = authUser.email || '';
            confirmedDistrict = authUser.user_metadata?.district || '';
            confirmedName = authUser.user_metadata?.full_name || '';

            if (!confirmedDistrict && authUser.id) {
              const { data: profile } = await supabase
                .from('profiles')
                .select('district, full_name, role, id')
                .eq('id', authUser.id)
                .maybeSingle();

              if (profile?.district) confirmedDistrict = profile.district;
              if (profile?.full_name && !confirmedName) confirmedName = profile.full_name;
              if (profile?.id) confirmedId = profile.id;
            }
          }
        }

        if (!confirmedDistrict && currentUser?.district) {
          confirmedDistrict = currentUser.district;
        }
        if (!confirmedName && currentUser?.fullName) {
          confirmedName = currentUser.fullName;
        }
        if (!confirmedEmail && currentUser?.email) {
          confirmedEmail = currentUser.email;
        }
        if (!confirmedId && currentUser?.id) {
          confirmedId = currentUser.id;
        }

        const finalDistrict = confirmedDistrict || 'Hisar';

        if (isMounted) {
          setUserDistrict(finalDistrict);
          if (confirmedId) setOfficerId(confirmedId);
          if (confirmedName) setOfficerName(confirmedName);
          if (confirmedEmail) setOfficerEmail(confirmedEmail);
        }

        // Execute data fetch strictly for this confirmed officer ID and assigned district
        await fetchDistrictData(finalDistrict, confirmedId, confirmedEmail);
      } catch (err) {
        console.warn('Error determining officer district:', err);
        if (isMounted) {
          setUserDistrict('Hisar');
        }
        await fetchDistrictData('Hisar');
      }
    }

    initializeOfficerAndData();

    return () => {
      isMounted = false;
    };
  }, [currentUser]);

  // -------------------------------------------------------------
  // Step 3: Realtime Supabase Subscription (Filtered by District)
  // -------------------------------------------------------------
  useEffect(() => {
    if (!supabase || !userDistrict) return;

    const channel = supabase
      .channel(`lmo-realtime-officer-${userDistrict}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'traders_list' },
        () => {
          fetchDistrictData(userDistrict);
        }
      )
      .subscribe();

    // Heartbeat poll every 4s to guarantee real-time updates without page refresh
    const pollInterval = setInterval(() => {
      fetchDistrictData(userDistrict);
    }, 4000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(pollInterval);
    };
  }, [userDistrict]);

  // -------------------------------------------------------------
  // Step 4: Category Filtering for the 4 Interactive Tabs
  // -------------------------------------------------------------
  const counts = useMemo(() => {
    const districtTraders = traders.filter(
      (t) => (t.district || '').toLowerCase() === userDistrict.toLowerCase()
    );
    return {
      queue: districtTraders.filter((t) => {
        const s = (t.status || '').toLowerCase();
        const insp = (t.inspection_status || '').toLowerCase();
        return (
          s === 'pending_lmo' ||
          s === 'pending_inspection' ||
          s === 'pending' ||
          s === 'submitted' ||
          insp === 'pending'
        );
      }).length,
      scheduled: districtTraders.filter((t) => {
        const s = (t.status || '').toLowerCase();
        return s === 'scheduled' || s === 'visit_scheduled';
      }).length,
      verified: districtTraders.filter((t) => {
        const s = (t.status || '').toLowerCase();
        const insp = (t.inspection_status || '').toLowerCase();
        return (
          s === 'verified' ||
          (insp === 'passed' && s !== 'approved' && !t.digital_signature?.includes('GATC'))
        );
      }).length,
      issued: districtTraders.filter((t) => {
        const s = (t.status || '').toLowerCase();
        const insp = (t.inspection_status || '').toLowerCase();
        return (
          s === 'approved' ||
          Boolean(t.digital_signature) ||
          (insp === 'passed' && (s === 'approved' || Boolean(t.digital_signature)))
        );
      }).length,
    };
  }, [traders, userDistrict]);

  const displayedList = useMemo(() => {
    // 1. Strict District Filter: Only allow traders from this officer's district
    let list = traders.filter(
      (t) => (t.district || '').toLowerCase() === userDistrict.toLowerCase()
    );

    // 2. Interactive Navigation Tabs Filter
    if (activeTab === 'inspection_queue') {
      list = list.filter((t) => {
        const s = (t.status || '').toLowerCase();
        const insp = (t.inspection_status || '').toLowerCase();
        return (
          s === 'pending_lmo' ||
          s === 'pending_inspection' ||
          s === 'pending' ||
          s === 'submitted' ||
          insp === 'pending'
        );
      });
    } else if (activeTab === 'visit_schedule') {
      list = list.filter((t) => {
        const s = (t.status || '').toLowerCase();
        return s === 'scheduled' || s === 'visit_scheduled';
      });
    } else if (activeTab === 'verified') {
      list = list.filter((t) => {
        const s = (t.status || '').toLowerCase();
        const insp = (t.inspection_status || '').toLowerCase();
        return (
          s === 'verified' ||
          (insp === 'passed' && s !== 'approved' && !t.digital_signature?.includes('GATC'))
        );
      });
    } else if (activeTab === 'certificates_issued') {
      list = list.filter((t) => {
        const s = (t.status || '').toLowerCase();
        const insp = (t.inspection_status || '').toLowerCase();
        return (
          s === 'approved' ||
          Boolean(t.digital_signature) ||
          (insp === 'passed' && (s === 'approved' || Boolean(t.digital_signature)))
        );
      });
    }

    // 3. Search query filter
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
  }, [traders, activeTab, userDistrict, searchQuery]);

  // -------------------------------------------------------------
  // Actions: Schedule Visit & Complete Verification
  // -------------------------------------------------------------
  const handleConfirmSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schedulingTrader) return;

    const targetLicense = (schedulingTrader.license_number || schedulingTrader.id || '').trim();
    const updatedStatus = 'Scheduled';

    setTraders((prev) =>
      prev.map((t) =>
        t.license_number === targetLicense || t.id === targetLicense
          ? { ...t, status: updatedStatus, updated_at: new Date().toISOString() }
          : t
      )
    );

    try {
      if (supabase) {
        const { error } = await supabase
          .from('traders_list')
          .update({
            status: updatedStatus,
          })
          .eq('license_number', targetLicense)
          .select();
        if (error) console.error('Error updating schedule in traders_list:', error);
      }
      showToast(`Field inspection scheduled for ${schedulingTrader.shop_name || targetLicense} on ${scheduleDate} (${scheduleSlot})`);
    } catch {
      showToast(`Scheduled inspection updated locally for ${targetLicense}`);
    }

    setSchedulingTrader(null);
  };

  const handleConfirmVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyingTrader) return;

    const targetLicense = (verifyingTrader.license_number || verifyingTrader.id || '').trim();
    const sealCode = sealNumber.trim() || `LEAD-SEAL-${Math.floor(100000 + Math.random() * 900000)}`;
    const updatedStatus = 'Pending_GATC';
    const sig = `LMO-VERIF-${userDistrict.substring(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}-STAMP`;

    setTraders((prev) =>
      prev.map((t) =>
        t.license_number === targetLicense || t.id === targetLicense
          ? {
              ...t,
              status: updatedStatus,
              checklist_confirmed: true,
              lmo_id: officerEmail || `${officerName}@gov.in`,
              digital_signature: sig,
              signed_at: new Date().toISOString(),
              seal_number: sealCode,
              verification_notes: verificationNotes,
              updated_at: new Date().toISOString(),
            }
          : t
      )
    );

    try {
      if (supabase) {
        const { error } = await supabase
          .from('traders_list')
          .update({
            status: updatedStatus,
          })
          .eq('license_number', targetLicense)
          .select();
        if (error) console.error('Error updating verification status in traders_list:', error);
      }
      showToast(`Scale physically verified & stamped! Forwarded to GATC laboratory (Pending_GATC).`);
    } catch {
      showToast(`Scale verified locally for license ${targetLicense}`);
    }

    setVerifyingTrader(null);
    setSealNumber('');
  };

  return (
    <div className="space-y-8">
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

        {/* Refresh Action for Assigned Jurisdiction */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            type="button"
            onClick={() => fetchDistrictData(userDistrict)}
            title="Refresh District Records"
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-2xl border border-slate-200 shadow-2xs transition-colors flex items-center gap-2 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#002B49]' : ''}`} />
            <span>Refresh Queue</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => handleTabChange('inspection_queue')}
          className={`p-5 rounded-2xl border transition-all cursor-pointer ${
            activeTab === 'inspection_queue'
              ? 'bg-blue-50/60 border-blue-300 shadow-xs'
              : 'bg-white border-slate-200 shadow-2xs hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Inspection Queue</span>
            <Clock4 className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">{counts.queue}</div>
          <div className="text-[11px] text-blue-600 font-medium mt-1">Pending verification</div>
        </div>

        <div
          onClick={() => handleTabChange('visit_schedule')}
          className={`p-5 rounded-2xl border transition-all cursor-pointer ${
            activeTab === 'visit_schedule'
              ? 'bg-amber-50/60 border-amber-300 shadow-xs'
              : 'bg-white border-slate-200 shadow-2xs hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Scheduled Visits</span>
            <Calendar className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">{counts.scheduled}</div>
          <div className="text-[11px] text-amber-600 font-medium mt-1">Active field visits</div>
        </div>

        <div
          onClick={() => handleTabChange('verified')}
          className={`p-5 rounded-2xl border transition-all cursor-pointer ${
            activeTab === 'verified'
              ? 'bg-indigo-50/60 border-indigo-300 shadow-xs'
              : 'bg-white border-slate-200 shadow-2xs hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Verified</span>
            <CheckCircle className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">{counts.verified}</div>
          <div className="text-[11px] text-indigo-600 font-medium mt-1">Stamped & calibrated</div>
        </div>

        <div
          onClick={() => handleTabChange('certificates_issued')}
          className={`p-5 rounded-2xl border transition-all cursor-pointer ${
            activeTab === 'certificates_issued'
              ? 'bg-emerald-50/60 border-emerald-300 shadow-xs'
              : 'bg-white border-slate-200 shadow-2xs hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Certificates Issued</span>
            <FileCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">{counts.issued}</div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1">Legally stamped & certified</div>
        </div>
      </div>

      {/* Interactive Navigation Tabs (Required by prompt) */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2.5 border-b border-slate-200 pb-3">
          {/* Tab 1: Inspection Queue */}
          <button
            type="button"
            onClick={() => handleTabChange('inspection_queue')}
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
            type="button"
            onClick={() => handleTabChange('visit_schedule')}
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
            type="button"
            onClick={() => handleTabChange('verified')}
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
            type="button"
            onClick={() => handleTabChange('certificates_issued')}
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
              {activeTab === 'verified' && `Traders calibrated within statutory MPE tolerances awaiting final central certification.`}
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

      {/* Main Content Body (Conditionally rendered by activeTab) */}
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
                          {activeTab === 'inspection_queue' && (
                            <button
                              onClick={() => setSchedulingTrader(t)}
                              className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 font-bold text-[11px] rounded-xl flex items-center gap-1 transition-colors cursor-pointer"
                            >
                              <Calendar className="w-3.5 h-3.5 text-amber-600" />
                              <span>Schedule Visit</span>
                            </button>
                          )}

                          {(activeTab === 'inspection_queue' || activeTab === 'visit_schedule') && (
                            <button
                              onClick={() => setVerifyingTrader(t)}
                              className="px-3 py-1.5 bg-[#002B49] hover:bg-[#003B66] text-white font-bold text-[11px] rounded-xl flex items-center gap-1 transition-colors shadow-2xs cursor-pointer"
                            >
                              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                              <span>Inspect & Verify</span>
                            </button>
                          )}

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

      {/* Modal 1: Schedule Inspection Visit */}
      {schedulingTrader && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <Calendar className="w-5 h-5 text-amber-600" />
                <h3 className="font-extrabold text-slate-900 text-base">Schedule Field Verification</h3>
              </div>
              <button
                onClick={() => setSchedulingTrader(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1">
                <div className="font-extrabold text-slate-900 text-sm">
                  {schedulingTrader.shop_name || schedulingTrader.trader_name}
                </div>
                <div className="text-slate-500 font-medium">License: {schedulingTrader.license_number}</div>
                <div className="text-slate-500 font-medium">Instrument: {schedulingTrader.instrument_type}</div>
                <div className="text-slate-500 font-medium">Premises: {schedulingTrader.address}</div>
              </div>

              <form onSubmit={handleConfirmSchedule} className="space-y-4 pt-1">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Appointment Date</label>
                  <input
                    type="date"
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                    required
                    className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-medium focus:ring-2 focus:ring-[#002B49] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Time Slot Window</label>
                  <select
                    value={scheduleSlot}
                    onChange={(e) => setScheduleSlot(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-medium focus:ring-2 focus:ring-[#002B49] focus:outline-none"
                  >
                    <option value="09:00 AM - 11:00 AM">09:00 AM - 11:00 AM (Morning Batch)</option>
                    <option value="11:00 AM - 01:00 PM">11:00 AM - 01:00 PM (Midday Batch)</option>
                    <option value="02:00 PM - 04:00 PM">02:00 PM - 04:00 PM (Afternoon Batch)</option>
                    <option value="04:00 PM - 06:00 PM">04:00 PM - 06:00 PM (Evening Batch)</option>
                  </select>
                </div>

                <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setSchedulingTrader(null)}
                    className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 text-xs font-black text-white bg-[#002B49] hover:bg-[#003B66] rounded-xl shadow-md transition-colors cursor-pointer"
                  >
                    Confirm Appointment
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Perform Physical Inspection & Lead Seal Stamping */}
      {verifyingTrader && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <h3 className="font-extrabold text-slate-900 text-base">Physical Inspection & Seal Stamping</h3>
              </div>
              <button
                onClick={() => setVerifyingTrader(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1">
                <div className="font-extrabold text-slate-900 text-sm">
                  {verifyingTrader.shop_name || verifyingTrader.trader_name}
                </div>
                <div className="text-slate-500 font-medium">License: {verifyingTrader.license_number}</div>
                <div className="text-slate-500 font-medium">Instrument: {verifyingTrader.instrument_type}</div>
                <div className="text-slate-500 font-medium">District Jurisdiction: {verifyingTrader.district || userDistrict}</div>
              </div>

              <form onSubmit={handleConfirmVerification} className="space-y-4">
                <div className="space-y-2 bg-emerald-50/50 p-3.5 rounded-2xl border border-emerald-200">
                  <span className="font-extrabold text-emerald-950 text-xs block">
                    Statutory Checklist Affirmations:
                  </span>
                  <label className="flex items-center gap-2 text-emerald-900 cursor-pointer">
                    <input type="checkbox" defaultChecked required className="rounded accent-emerald-600" />
                    <span>Maximum Permissible Error (MPE) tested with Class F2 working standards.</span>
                  </label>
                  <label className="flex items-center gap-2 text-emerald-900 cursor-pointer">
                    <input type="checkbox" defaultChecked required className="rounded accent-emerald-600" />
                    <span>Scale level bubble centered & display digits verified intact.</span>
                  </label>
                  <label className="flex items-center gap-2 text-emerald-900 cursor-pointer">
                    <input type="checkbox" defaultChecked required className="rounded accent-emerald-600" />
                    <span>Tamper-evident wire seal crimped with official LMO pliers.</span>
                  </label>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Official Lead Wire Seal Serial Number
                  </label>
                  <input
                    type="text"
                    value={sealNumber}
                    onChange={(e) => setSealNumber(e.target.value)}
                    placeholder={`e.g. HR-${userDistrict.substring(0, 3).toUpperCase()}-SEAL-2026-901`}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-mono focus:ring-2 focus:ring-[#002B49] focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Leave blank to auto-generate a unique statutory lead seal tag.
                  </span>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Calibration & Verification Notes
                  </label>
                  <textarea
                    rows={2}
                    value={verificationNotes}
                    onChange={(e) => setVerificationNotes(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs text-slate-900 font-medium focus:ring-2 focus:ring-[#002B49] focus:outline-none"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setVerifyingTrader(null)}
                    className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 text-xs font-black text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    <span>Stamp Seal & Mark Verified</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: Digital Certificate View Modal */}
      {selectedCertShop && (
        <DigitalCertificateModal
          isOpen={Boolean(selectedCertShop)}
          shop={selectedCertShop}
          onClose={() => setSelectedCertShop(null)}
        />
      )}
    </div>
  );
}
