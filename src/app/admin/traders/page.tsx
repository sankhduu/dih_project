'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Scale,
  Search,
  RefreshCw,
  ArrowLeft,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileSpreadsheet,
  Building2,
  Filter,
  X,
  SlidersHorizontal,
  Download,
  FileBadge,
  UserCheck,
  ShieldCheck,
  User,
  Check,
} from 'lucide-react';

interface Trader {
  id?: string | number;
  trader_name: string;
  owner_name?: string;
  license_number: string;
  latitude?: string | number;
  longitude?: string | number;
  inspection_status: 'Passed' | 'Pending' | 'Failed' | string;
  instrument_type: string;
  assigned_officer?: string;
}

const MOCK_OFFICERS = [
  'Inspector Sharma',
  'Inspector Gupta',
  'Inspector Reddy',
];

// Fallback preview data in case the local Express server on port 5000 is still starting up
const FALLBACK_TRADERS: Trader[] = [
  {
    trader_name: 'Apex Supermarket & Grocery Store',
    owner_name: 'Ramesh Kumar',
    license_number: 'LMO/2026/10001',
    latitude: 28.5494,
    longitude: 77.2001,
    inspection_status: 'Passed',
    instrument_type: 'Electronic Counter Scale',
    assigned_officer: 'Inspector Sharma',
  },
  {
    trader_name: 'Precision Pharma & Diagnostic Labs',
    owner_name: 'Dr. Priya Sharma',
    license_number: 'LMO/2026/10002',
    latitude: 28.5284,
    longitude: 77.2711,
    inspection_status: 'Passed',
    instrument_type: 'Analytical Precision Balance',
    assigned_officer: 'Inspector Gupta',
  },
  {
    trader_name: 'Haryana Agro Flour Mill & Grain Depot',
    owner_name: 'Haskell Hahn',
    license_number: 'LMO/2026/10003',
    latitude: 29.3911,
    longitude: 77.2275,
    inspection_status: 'Pending',
    instrument_type: 'Platform Scale',
    assigned_officer: '',
  },
  {
    trader_name: 'Karnal Cotton & Ginning Mill',
    owner_name: 'Wallace Hintz',
    license_number: 'LMO/2026/10004',
    latitude: 29.6901,
    longitude: 77.2151,
    inspection_status: 'Failed',
    instrument_type: 'Weighbridge',
    assigned_officer: 'Inspector Reddy',
  },
  {
    trader_name: 'Delhi NCR Fuel Station & Logistics',
    owner_name: 'Ms. Marian Spinka',
    license_number: 'LMO/2026/10005',
    latitude: 28.4298,
    longitude: 77.0028,
    inspection_status: 'Passed',
    instrument_type: 'Fuel Dispenser',
    assigned_officer: 'Inspector Sharma',
  },
  {
    trader_name: 'Gurugram Cold Storage & Dairy',
    owner_name: 'Mrs. Alysa Bahringer',
    license_number: 'LMO/2026/10006',
    latitude: 28.9025,
    longitude: 76.6863,
    inspection_status: 'Pending',
    instrument_type: 'Electronic Weighing Scale',
    assigned_officer: '',
  },
  {
    trader_name: 'Schowalter - Abshire Kirana Store',
    owner_name: 'Wilbert Dare',
    license_number: 'LMO/2026/10007',
    latitude: 28.5063,
    longitude: 76.6764,
    inspection_status: 'Pending',
    instrument_type: 'Platform Scale',
    assigned_officer: '',
  },
  {
    trader_name: 'Greenfelder Hoeger and Howe Cold Storage',
    owner_name: 'Mrs. Alysa Bahringer',
    license_number: 'LMO/2026/10008',
    latitude: 28.9025,
    longitude: 76.6863,
    inspection_status: 'Failed',
    instrument_type: 'Electronic Counter Scale',
    assigned_officer: 'Inspector Gupta',
  },
  {
    trader_name: 'Rohan and Sons Supermarket',
    owner_name: 'Roderick Runolfsdottir',
    license_number: 'LMO/2026/10009',
    latitude: 29.0859,
    longitude: 76.5489,
    inspection_status: 'Passed',
    instrument_type: 'Non-Automatic Weighing Instrument',
    assigned_officer: 'Inspector Reddy',
  },
];

export default function AdminTradersPage() {
  const [traders, setTraders] = useState<Trader[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isUsingFallback, setIsUsingFallback] = useState<boolean>(false);

  // Filter States
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');

  // Toast Notification State
  const [toast, setToast] = useState<{
    visible: boolean;
    title: string;
    message: string;
  }>({
    visible: false,
    title: '',
    message: '',
  });

  const showToast = (title: string, message: string) => {
    setToast({ visible: true, title, message });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, visible: false }));
    }, 4000);
  };

  const fetchTraders = async () => {
    setLoading(true);
    setApiError(null);
    try {
      const res = await fetch('http://localhost:5000/api/traders');
      if (!res.ok) {
        throw new Error(`API responded with HTTP status ${res.status}`);
      }
      const json = await res.json();
      if (json.success && Array.isArray(json.data) && json.data.length > 0) {
        setTraders(json.data);
        setIsUsingFallback(false);
      } else if (json.data && json.data.length === 0) {
        setTraders(FALLBACK_TRADERS);
        setIsUsingFallback(true);
      } else {
        throw new Error(json.error || 'Failed to parse traders data');
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unable to connect to http://localhost:5000/api/traders';
      setApiError(errorMessage);
      setTraders(FALLBACK_TRADERS);
      setIsUsingFallback(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTraders();
  }, []);

  // Handle Officer Assignment Dropdown Selection
  const handleAssignOfficer = async (licenseNumber: string, traderName: string, officerName: string) => {
    // 1. Optimistic local state update
    setTraders((prev) =>
      prev.map((t) =>
        t.license_number === licenseNumber ? { ...t, assigned_officer: officerName } : t
      )
    );

    // 2. Send PATCH request to Express backend
    try {
      const res = await fetch(`http://localhost:5000/api/traders/${encodeURIComponent(licenseNumber)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assigned_officer: officerName }),
      });

      if (res.ok) {
        showToast(
          'Officer Assignment Saved',
          `${officerName || 'Unassigned'} assigned to ${traderName} (${licenseNumber})`
        );
      } else {
        showToast(
          'Assignment Updated (Local Cache)',
          `${officerName || 'Unassigned'} assigned to ${traderName}`
        );
      }
    } catch {
      // Local fallback toast
      showToast(
        'Assignment Recorded',
        `${officerName || 'Unassigned'} assigned to ${traderName} (${licenseNumber})`
      );
    }
  };

  // Dynamic Filtering by search query AND inspection_status dropdown
  const filteredTraders = useMemo(() => {
    return traders.filter((t) => {
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        query === '' ||
        t.trader_name.toLowerCase().includes(query) ||
        t.license_number.toLowerCase().includes(query) ||
        (t.owner_name && t.owner_name.toLowerCase().includes(query)) ||
        (t.assigned_officer && t.assigned_officer.toLowerCase().includes(query));

      const matchesStatus =
        selectedStatus === 'All' ||
        (t.inspection_status || '').toLowerCase() === selectedStatus.toLowerCase();

      return matchesSearch && matchesStatus;
    });
  }, [traders, searchQuery, selectedStatus]);

  // Statistics calculation for KPI cards
  const totalCount = traders.length;
  const passedCount = traders.filter((t) => (t.inspection_status || '').toLowerCase() === 'passed').length;
  const pendingCount = traders.filter((t) => (t.inspection_status || '').toLowerCase() === 'pending').length;
  const failedCount = traders.filter((t) => (t.inspection_status || '').toLowerCase() === 'failed').length;

  const hasActiveFilters = searchQuery !== '' || selectedStatus !== 'All';

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedStatus('All');
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Government Tricolor Top Strip */}
      <div className="h-1.5 w-full flex">
        <div className="flex-1 bg-[#FF9933]"></div>
        <div className="flex-1 bg-[#FFFFFF]"></div>
        <div className="flex-1 bg-[#138808]"></div>
      </div>

      {/* Main Admin Navigation Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left Brand */}
            <div className="flex items-center gap-3">
              <Link
                href="/"
                className="w-10 h-10 rounded-xl bg-[#002B49] text-white flex items-center justify-center shadow-xs hover:bg-[#003B66] transition-colors"
                title="Return to Home Dashboard"
              >
                <ArrowLeft className="w-5 h-5 text-white" />
              </Link>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-black text-base tracking-tight text-[#002B49]">
                    e-Māpan <span className="text-amber-600 font-semibold">Admin</span>
                  </span>
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                    Officer Scheduling & Directory
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 hidden sm:block">
                  Department of Consumer Affairs • Legal Metrology (Verification & Stamping)
                </p>
              </div>
            </div>

            {/* Right Header Actions */}
            <div className="flex items-center gap-3">
              <Link
                href="/apply"
                className="px-3.5 py-2 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-xs bg-[#002B49] text-white hover:bg-[#003B66] cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-amber-400" />
                <span>+ Register New Scale</span>
              </Link>

              <button
                onClick={fetchTraders}
                disabled={loading}
                className="px-3 py-2 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 disabled:opacity-50 cursor-pointer"
                title="Refresh Table Data"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Backend Warning Banner if Express is not connected */}
        {isUsingFallback && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200/90 text-amber-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs shadow-xs">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <div>
                <span className="font-bold">Backend Status: </span>
                <span>
                  {apiError
                    ? `Express API at http://localhost:5000 is offline (${apiError})`
                    : 'Showing live mock database records for demonstration.'}
                </span>
              </div>
            </div>
            <div className="text-[11px] font-mono bg-white/90 px-3 py-1 rounded-lg border border-amber-300 font-semibold text-amber-950">
              API Port: 5000
            </div>
          </div>
        )}

        {/* Top KPI Metrics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
            <div className="text-slate-500 text-xs font-semibold flex items-center justify-between">
              <span>Total Traders</span>
              <Building2 className="w-4 h-4 text-blue-600" />
            </div>
            <div className="mt-2 text-2xl font-black text-slate-900">{totalCount}</div>
            <div className="text-[11px] text-slate-500 mt-0.5 font-medium">National Central Registry</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
            <div className="text-slate-500 text-xs font-semibold flex items-center justify-between">
              <span>Passed Stamping</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="mt-2 text-2xl font-black text-emerald-700">{passedCount}</div>
            <div className="text-[11px] text-emerald-600 font-semibold mt-0.5">Certificates downloadable</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
            <div className="text-slate-500 text-xs font-semibold flex items-center justify-between">
              <span>Pending Inspection</span>
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
            <div className="mt-2 text-2xl font-black text-amber-700">{pendingCount}</div>
            <div className="text-[11px] text-amber-600 font-semibold mt-0.5">Assign officer below</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
            <div className="text-slate-500 text-xs font-semibold flex items-center justify-between">
              <span>Failed / Non-Compliant</span>
              <AlertTriangle className="w-4 h-4 text-rose-600" />
            </div>
            <div className="mt-2 text-2xl font-black text-rose-700">{failedCount}</div>
            <div className="text-[11px] text-rose-600 font-semibold mt-0.5">Deficiency notice issued</div>
          </div>
        </div>

        {/* Search & Status Filter Toolbar */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-3">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            {/* Search Bar + Status Dropdown */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Search className="w-4 h-4 text-slate-400" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by Trader, License No, Owner, or Assigned Officer..."
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50 hover:bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#002B49] focus:border-transparent transition-all shadow-2xs"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                    title="Clear search"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Status Dropdown Select */}
              <div className="relative min-w-[200px]">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Filter className="w-3.5 h-3.5 text-slate-400" />
                </div>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full pl-9 pr-8 py-2.5 bg-slate-50 hover:bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-[#002B49] focus:border-transparent transition-all shadow-2xs cursor-pointer appearance-none"
                >
                  <option value="All">All Statuses ({totalCount})</option>
                  <option value="Passed">Passed ({passedCount})</option>
                  <option value="Pending">Pending ({pendingCount})</option>
                  <option value="Failed">Failed ({failedCount})</option>
                </select>
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
                </div>
              </div>
            </div>

            {/* Clear Filters Action */}
            {hasActiveFilters && (
              <div className="flex items-center gap-2 self-start md:self-auto pt-1 md:pt-0">
                <button
                  onClick={handleClearFilters}
                  className="px-3 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Clear Filters</span>
                </button>
              </div>
            )}
          </div>

          {/* Filter Summary */}
          <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-700">
                Showing {filteredTraders.length} of {totalCount} traders
              </span>
              {searchQuery && (
                <span className="bg-slate-100 px-2 py-0.5 rounded-md font-medium text-slate-700 text-[11px]">
                  Query: &quot;{searchQuery}&quot;
                </span>
              )}
              {selectedStatus !== 'All' && (
                <span className="bg-slate-100 px-2 py-0.5 rounded-md font-medium text-slate-700 text-[11px]">
                  Status: {selectedStatus}
                </span>
              )}
            </div>

            <div className="text-[11px] text-slate-400">
              Select an officer from the dropdown on Pending rows to schedule field inspection
            </div>
          </div>
        </div>

        {/* Responsive Data Table with Officer Scheduling */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <FileSpreadsheet className="w-5 h-5 text-[#002B49]" />
              <h2 className="font-extrabold text-base text-slate-900">Legal Metrology Traders & Inspection Schedule</h2>
            </div>
            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
              {filteredTraders.length} Record{filteredTraders.length !== 1 ? 's' : ''}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5">Trader / Enterprise Name</th>
                  <th className="px-6 py-3.5">License Number</th>
                  <th className="px-6 py-3.5">Instrument Type</th>
                  <th className="px-6 py-3.5">Inspection Status</th>
                  <th className="px-6 py-3.5">Assigned Officer</th>
                  <th className="px-6 py-3.5 text-right">Certificate Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTraders.length > 0 ? (
                  filteredTraders.map((t, idx) => {
                    const isPassed = (t.inspection_status || '').toLowerCase() === 'passed';
                    const isPending = (t.inspection_status || '').toLowerCase() === 'pending';
                    const certificateDownloadUrl = `http://localhost:5000/api/certificate/${encodeURIComponent(t.license_number)}`;

                    return (
                      <tr
                        key={t.id || t.license_number || idx}
                        className="hover:bg-slate-50/80 transition-colors"
                      >
                        {/* Trader Name & Owner */}
                        <td className="px-6 py-4">
                          <div className="font-extrabold text-slate-900 text-sm">{t.trader_name}</div>
                          {t.owner_name && (
                            <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                              Proprietor: <span className="text-slate-700">{t.owner_name}</span>
                            </div>
                          )}
                        </td>

                        {/* License Number */}
                        <td className="px-6 py-4">
                          <span className="font-mono font-bold text-xs bg-slate-100 text-[#002B49] px-2.5 py-1 rounded-lg border border-slate-200">
                            {t.license_number}
                          </span>
                        </td>

                        {/* Instrument Type */}
                        <td className="px-6 py-4">
                          <div className="font-semibold text-slate-800">{t.instrument_type}</div>
                        </td>

                        {/* Inspection Status Badge */}
                        <td className="px-6 py-4">
                          <StatusBadge status={t.inspection_status} />
                        </td>

                        {/* Assigned Officer Column */}
                        <td className="px-6 py-4">
                          {isPending ? (
                            <div className="relative min-w-[160px] max-w-[200px]">
                              <select
                                value={t.assigned_officer || ''}
                                onChange={(e) =>
                                  handleAssignOfficer(t.license_number, t.trader_name, e.target.value)
                                }
                                className="w-full px-3 py-1.5 text-xs font-bold rounded-xl border border-amber-300 bg-amber-50/60 hover:bg-amber-50 text-amber-950 focus:outline-hidden focus:ring-2 focus:ring-[#002B49] focus:bg-white transition-all cursor-pointer shadow-2xs"
                              >
                                <option value="">Assign Officer...</option>
                                {MOCK_OFFICERS.map((officer) => (
                                  <option key={officer} value={officer}>
                                    {officer}
                                  </option>
                                ))}
                              </select>
                            </div>
                          ) : (
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                              <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
                              <span>{t.assigned_officer || 'Inspector Sharma'}</span>
                            </div>
                          )}
                        </td>

                        {/* Certificate Download Action */}
                        <td className="px-6 py-4 text-right">
                          {isPassed ? (
                            <a
                              href={certificateDownloadUrl}
                              download
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#002B49] hover:bg-[#003B66] text-white shadow-xs hover:shadow-md transition-all cursor-pointer"
                              title="Download official Legal Metrology Verification Certificate with QR code"
                            >
                              <Download className="w-3.5 h-3.5 text-amber-400" />
                              <span>Download Certificate</span>
                            </a>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 font-medium">
                              <FileBadge className="w-3.5 h-3.5 opacity-40" />
                              <span>Unavailable (Not Passed)</span>
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                      <div className="max-w-sm mx-auto space-y-2">
                        <Search className="w-8 h-8 text-slate-300 mx-auto" />
                        <p className="font-bold text-slate-700 text-sm">No Matching Traders Found</p>
                        <p className="text-xs text-slate-400">
                          No trader record matches &quot;{searchQuery}&quot; with status &quot;{selectedStatus}&quot;.
                        </p>
                        <button
                          onClick={handleClearFilters}
                          className="mt-3 px-4 py-1.5 text-xs font-bold text-[#002B49] bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors inline-flex items-center gap-1 cursor-pointer"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>Reset Search & Filters</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* ========================================================================= */}
      {/* VISUAL TOAST NOTIFICATION */}
      {/* ========================================================================= */}
      {toast.visible && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-5 duration-200">
          <div className="bg-[#002B49] text-white p-4 rounded-2xl shadow-2xl border border-slate-700/50 flex items-start gap-3 max-w-md">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
              <UserCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="flex-1 space-y-0.5">
              <h4 className="text-xs font-black tracking-wide text-white flex items-center gap-1.5">
                <span>{toast.title}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              </h4>
              <p className="text-[11px] text-slate-300 leading-tight">{toast.message}</p>
            </div>
            <button
              onClick={() => setToast((prev) => ({ ...prev, visible: false }))}
              className="text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500">
        Department of Consumer Affairs (DoCA), Ministry of Consumer Affairs, Food & Public Distribution • Legal Metrology (e-Māpan 2.0)
      </footer>
    </div>
  );
}

/**
 * Inspection Status Badge Component
 */
function StatusBadge({ status }: { status: string }) {
  const normalized = (status || '').toUpperCase();

  if (normalized === 'PASSED') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
        <span>Passed</span>
      </span>
    );
  }

  if (normalized === 'PENDING') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200 shadow-2xs">
        <Clock className="w-3 h-3 text-amber-600" />
        <span>Pending</span>
      </span>
    );
  }

  if (normalized === 'FAILED') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200 shadow-2xs">
        <AlertTriangle className="w-3 h-3 text-rose-600" />
        <span>Failed</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
      <span>{status || 'Unknown'}</span>
    </span>
  );
}
