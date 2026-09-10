import fs from 'fs';
import path from 'path';

export interface TraderRecord {
  id?: string | number;
  trader_name: string;
  owner_name?: string;
  license_number: string;
  latitude?: number;
  longitude?: number;
  inspection_status: 'Passed' | 'Pending' | 'Failed' | string;
  instrument_type: string;
  assigned_officer?: string;
}

export const INITIAL_MOCK_TRADERS: Record<string, TraderRecord> = {
  'LMO/2026/10001': {
    id: 1,
    trader_name: 'Apex Supermarket & Grocery Store',
    owner_name: 'Ramesh Kumar',
    license_number: 'LMO/2026/10001',
    latitude: 28.5494,
    longitude: 77.2001,
    inspection_status: 'Passed',
    instrument_type: 'Electronic Counter Scale',
    assigned_officer: 'Inspector Sharma',
  },
  'LMO/2026/10002': {
    id: 2,
    trader_name: 'Precision Pharma & Diagnostic Labs',
    owner_name: 'Dr. Priya Sharma',
    license_number: 'LMO/2026/10002',
    latitude: 28.5284,
    longitude: 77.2711,
    inspection_status: 'Passed',
    instrument_type: 'Analytical Precision Balance',
    assigned_officer: 'Inspector Gupta',
  },
  'LMO/2026/10003': {
    id: 3,
    trader_name: 'Haryana Agro Flour Mill & Grain Depot',
    owner_name: 'Haskell Hahn',
    license_number: 'LMO/2026/10003',
    latitude: 29.3911,
    longitude: 77.2275,
    inspection_status: 'Pending',
    instrument_type: 'Platform Scale',
    assigned_officer: '',
  },
  'LMO/2026/10004': {
    id: 4,
    trader_name: 'Karnal Cotton & Ginning Mill',
    owner_name: 'Wallace Hintz',
    license_number: 'LMO/2026/10004',
    latitude: 29.6901,
    longitude: 77.2151,
    inspection_status: 'Failed',
    instrument_type: 'Weighbridge',
    assigned_officer: 'Inspector Reddy',
  },
  'LMO/2026/10005': {
    id: 5,
    trader_name: 'Delhi NCR Fuel Station & Logistics',
    owner_name: 'Ms. Marian Spinka',
    license_number: 'LMO/2026/10005',
    latitude: 28.4298,
    longitude: 77.0028,
    inspection_status: 'Passed',
    instrument_type: 'Fuel Dispenser',
    assigned_officer: 'Inspector Sharma',
  },
  'LMO/2026/10006': {
    id: 6,
    trader_name: 'Gurugram Cold Storage & Dairy',
    owner_name: 'Mrs. Alysa Bahringer',
    license_number: 'LMO/2026/10006',
    latitude: 28.9025,
    longitude: 76.6863,
    inspection_status: 'Pending',
    instrument_type: 'Electronic Weighing Scale',
    assigned_officer: '',
  },
  'LMO/2026/10007': {
    id: 7,
    trader_name: 'Schowalter - Abshire Kirana Store',
    owner_name: 'Wilbert Dare',
    license_number: 'LMO/2026/10007',
    latitude: 28.5063,
    longitude: 76.6764,
    inspection_status: 'Pending',
    instrument_type: 'Platform Scale',
    assigned_officer: '',
  },
  'LMO/2026/10008': {
    id: 8,
    trader_name: 'Greenfelder Hoeger and Howe Cold Storage',
    owner_name: 'Mrs. Alysa Bahringer',
    license_number: 'LMO/2026/10008',
    latitude: 28.9025,
    longitude: 76.6863,
    inspection_status: 'Failed',
    instrument_type: 'Electronic Counter Scale',
    assigned_officer: 'Inspector Gupta',
  },
  'LMO/2026/10009': {
    id: 9,
    trader_name: 'Rohan and Sons Supermarket',
    owner_name: 'Roderick Runolfsdottir',
    license_number: 'LMO/2026/10009',
    latitude: 29.0859,
    longitude: 76.5489,
    inspection_status: 'Passed',
    instrument_type: 'Non-Automatic Weighing Instrument',
    assigned_officer: 'Inspector Reddy',
  },
};

// In-memory cache
const memoryCache: Record<string, TraderRecord> = { ...INITIAL_MOCK_TRADERS };

// Populate from CSV if running in Node environment
try {
  const csvPath = path.join(process.cwd(), 'lmo_mock_traders.csv');
  if (fs.existsSync(csvPath)) {
    const content = fs.readFileSync(csvPath, 'utf8');
    const rows = content.split(/\r?\n/);
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i].trim();
      if (!row) continue;
      const cols = row.split(',');
      if (cols.length >= 7) {
        const [trader_name, owner_name, license_number, latitude, longitude, inspection_status, instrument_type] = cols;
        const lic = license_number.trim();
        if (!memoryCache[lic]) {
          memoryCache[lic] = {
            id: i,
            trader_name: trader_name.trim(),
            owner_name: owner_name.trim(),
            license_number: lic,
            latitude: parseFloat(latitude) || 28.6139,
            longitude: parseFloat(longitude) || 77.2090,
            inspection_status: inspection_status.trim(),
            instrument_type: instrument_type.trim(),
          };
        }
      }
    }
  }
} catch {
  // Fallback to built-in records
}

export function getMockTradersList(limit: number = 100, status?: string | null): TraderRecord[] {
  let list = Object.values(memoryCache);
  if (status && status !== 'All') {
    list = list.filter((t) => (t.inspection_status || '').toLowerCase() === status.toLowerCase());
  }
  return list.slice(0, limit);
}

export function getMockTraderById(idOrLicense: string): TraderRecord | undefined {
  const clean = decodeURIComponent(idOrLicense).trim();
  if (memoryCache[clean]) return memoryCache[clean];
  return Object.values(memoryCache).find(
    (t) => String(t.id) === clean || t.license_number === clean
  );
}

export function updateMockTrader(
  idOrLicense: string,
  updates: { assigned_officer?: string; inspection_status?: string }
): TraderRecord | undefined {
  const trader = getMockTraderById(idOrLicense);
  if (trader) {
    if (updates.assigned_officer !== undefined) trader.assigned_officer = updates.assigned_officer;
    if (updates.inspection_status !== undefined) trader.inspection_status = updates.inspection_status;
    memoryCache[trader.license_number] = trader;
    return trader;
  }
  return undefined;
}
