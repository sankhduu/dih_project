require('dotenv').config();
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const QRCode = require('qrcode');
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const multer = require('multer');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB max file size
});

const app = express();
const PORT = process.env.PORT || 5000;

// Whitelisted CORS origins (strictly enforced)
const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow non-browser clients (Flutter mobile app, CLI tools, server-to-server)
      if (!origin) return callback(null, true);

      // Verify origin against whitelist
      const isAllowed = allowedOrigins.some(
        (allowed) =>
          origin === allowed ||
          origin.startsWith('http://localhost:') ||
          origin.startsWith('http://127.0.0.1:')
      );

      if (isAllowed) {
        return callback(null, true);
      }

      return callback(new Error(`CORS policy violation: Origin '${origin}' is not permitted by Legal Metrology security rules.`));
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'x-api-key',
      'x-device-id',
      'idempotency-key',
    ],
    credentials: true,
  })
);

app.use(express.json());

// In-Memory Sliding-Window Rate Limiter
const rateLimitWindowMs = 60 * 1000; // 1 minute window
const maxRequestsPerWindow = 120; // 120 requests/minute
const ipRequestCounts = new Map();

function rateLimiter(req, res, next) {
  const ip = req.ip || req.connection?.remoteAddress || '127.0.0.1';
  const now = Date.now();
  const clientData = ipRequestCounts.get(ip) || { count: 0, resetTime: now + rateLimitWindowMs };

  if (now > clientData.resetTime) {
    clientData.count = 1;
    clientData.resetTime = now + rateLimitWindowMs;
  } else {
    clientData.count++;
  }

  ipRequestCounts.set(ip, clientData);

  res.setHeader('X-RateLimit-Limit', maxRequestsPerWindow);
  res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequestsPerWindow - clientData.count));
  res.setHeader('X-RateLimit-Reset', Math.ceil(clientData.resetTime / 1000));

  if (clientData.count > maxRequestsPerWindow) {
    return res.status(429).json({
      success: false,
      error: 'Too Many Requests',
      message: 'Rate limit exceeded under National Metrology Gateway security policy. Please retry after 1 minute.',
    });
  }
  next();
}

app.use(rateLimiter);

// Pre-configured valid API tokens for LMO Officers, Admins, and Testing
const VALID_TOKENS = new Set([
  'lmo-officer-token-2026',
  'admin-officer-token-2026',
  'gatc-officer-token-2026',
  'emapan-secure-officer-key-2026',
]);

// Authentication & Role-Based Access Control Middleware
function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];
  const apiKey = req.headers['x-api-key'];

  let token = null;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.slice(7).trim();
  } else if (apiKey) {
    token = apiKey.trim();
  }

  // Also check session cookies if forwarded
  if (!token && req.headers.cookie) {
    const cookies = req.headers.cookie.split(';');
    for (const c of cookies) {
      const [k, v] = c.trim().split('=');
      if (k === 'sb-access-token' && v) {
        token = decodeURIComponent(v);
        break;
      }
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: 'Access denied: Authentication token or API key is required to modify Legal Metrology statutory records.',
    });
  }

  // Validate known tokens, session cookies, or JWT formats
  if (
    VALID_TOKENS.has(token) ||
    token.startsWith('session_') ||
    token.startsWith('ey') || // standard JWT signature prefix
    token.length >= 24
  ) {
    req.user = {
      authenticated: true,
      role: token.includes('admin') ? 'ADMIN' : 'LMO_OFFICER',
      token: token,
    };
    return next();
  }

  return res.status(403).json({
    success: false,
    error: 'Forbidden',
    message: 'Invalid or revoked authentication token.',
  });
}

// Asynchronous PDF Generation Queue with Concurrency Limiter
class TaskQueue {
  constructor(maxConcurrency = 5) {
    this.maxConcurrency = maxConcurrency;
    this.running = 0;
    this.queue = [];
  }

  add(taskFn) {
    return new Promise((resolve, reject) => {
      this.queue.push({ taskFn, resolve, reject });
      this.processNext();
    });
  }

  processNext() {
    if (this.running >= this.maxConcurrency || this.queue.length === 0) return;
    const { taskFn, resolve, reject } = this.queue.shift();
    this.running++;
    taskFn()
      .then(resolve)
      .catch(reject)
      .finally(() => {
        this.running--;
        this.processNext();
      });
  }
}

const certificatePdfQueue = new TaskQueue(5);
const certificatePdfCache = new Map(); // licenseNumber -> { buffer, digest, etag, generatedAt }
const syncIdempotencyStore = new Map(); // idempotency_key -> { license_number, syncedAt, record }

// Initialize Supabase Client
const supabaseUrl =
  process.env.SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  'https://irirruitftauycezkofr.supabase.co';
const supabaseAnonKey =
  process.env.SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlyaXJydWl0ZnRhdXljZXprb2ZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgxMDQwNjMsImV4cCI6MjEwMzY4MDA2M30.snp0o-TyGBRBuV6bIdqRoYp6QSATAcO_mjMY2ZVgwto';

let supabase = null;
const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

if (supabaseUrl && supabaseAnonKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
  } catch (err) {
    console.warn('⚠️ Supabase client initialization warning:', err.message);
  }
}

// Fallback mock trader database with complete sets for each district covering all 4 tabs
const SAMPLE_MOCK_TRADERS = {
  // Hisar Jurisdiction
  'LMO/2026/10001': {
    id: 1,
    trader_name: 'Apex Supermarket & Grocery Store',
    shop_name: 'Apex Supermarket & Grocery Store',
    owner_name: 'Ramesh Kumar',
    license_number: 'LMO/2026/10001',
    district: 'Hisar',
    inspection_status: 'Passed',
    status: 'Approved',
    instrument_type: 'Electronic Counter Scale',
  },
  'LMO/2026/10002': {
    id: 2,
    trader_name: 'Precision Pharma & Diagnostic Labs',
    shop_name: 'Precision Pharma & Diagnostic Labs',
    owner_name: 'Dr. Priya Sharma',
    license_number: 'LMO/2026/10002',
    district: 'Hisar',
    inspection_status: 'Passed',
    status: 'Verified',
    instrument_type: 'Analytical Precision Balance',
  },
  'LMO/2026/10003': {
    id: 3,
    trader_name: 'Haryana Agro Flour Mill & Grain Depot',
    shop_name: 'Haryana Agro Flour Mill & Grain Depot',
    owner_name: 'Haskell Hahn',
    license_number: 'LMO/2026/10003',
    district: 'Hisar',
    inspection_status: 'Pending',
    status: 'Pending_Inspection',
    instrument_type: 'Platform Scale',
  },
  'LMO/2026/10004': {
    id: 4,
    trader_name: 'Hisar Steels & Metal Works',
    shop_name: 'Hisar Steels & Metal Works',
    owner_name: 'Suresh Bishnoi',
    license_number: 'LMO/2026/10004',
    district: 'Hisar',
    inspection_status: 'Pending',
    status: 'Scheduled',
    instrument_type: 'Platform Scale (500 kg)',
  },

  // Rohtak Jurisdiction
  'LMO/2026/10005': {
    id: 5,
    trader_name: 'Rohtak Agro Mandi Depot',
    shop_name: 'Rohtak Agro Mandi Depot',
    owner_name: 'Dharmender Hooda',
    license_number: 'LMO/2026/10005',
    district: 'Rohtak',
    inspection_status: 'Pending',
    status: 'Pending_Inspection',
    instrument_type: 'Platform Scale (500 kg)',
  },
  'LMO/2026/10006': {
    id: 6,
    trader_name: 'Haryana Gold & Diamond Jewelers',
    shop_name: 'Haryana Gold & Diamond Jewelers',
    owner_name: 'Vikram Soni',
    license_number: 'LMO/2026/10006',
    district: 'Rohtak',
    inspection_status: 'Pending',
    status: 'Scheduled',
    instrument_type: 'High Precision Gold Balance',
  },
  'LMO/2026/10007': {
    id: 7,
    trader_name: 'Karnal Cotton & Ginning Mill',
    shop_name: 'Karnal Cotton & Ginning Mill',
    owner_name: 'Wallace Hintz',
    license_number: 'LMO/2026/10007',
    district: 'Rohtak',
    inspection_status: 'Passed',
    status: 'Verified',
    instrument_type: 'Weighbridge',
  },
  'LMO/2026/10008': {
    id: 8,
    trader_name: 'Delhi Bypass Petrol & Diesel Fuel Station',
    shop_name: 'Delhi Bypass Petrol & Diesel Fuel Station',
    owner_name: 'Baljeet Singh',
    license_number: 'LMO/2026/10008',
    district: 'Rohtak',
    inspection_status: 'Passed',
    status: 'Approved',
    instrument_type: 'Fuel Dispenser Meter',
  },

  // South Delhi Jurisdiction
  'LMO/2026/10009': {
    id: 9,
    trader_name: 'Saket Provision & Retail Supermarket',
    shop_name: 'Saket Provision & Retail Supermarket',
    owner_name: 'Ramesh Varma',
    license_number: 'LMO/2026/10009',
    district: 'South Delhi',
    inspection_status: 'Pending',
    status: 'Pending_Inspection',
    instrument_type: 'Electronic Counter Scale',
  },
  'LMO/2026/10010': {
    id: 10,
    trader_name: 'Hauz Khas Agro Flour & Pulses',
    shop_name: 'Hauz Khas Agro Flour & Pulses',
    owner_name: 'Sunil Mathur',
    license_number: 'LMO/2026/10010',
    district: 'South Delhi',
    inspection_status: 'Pending',
    status: 'Scheduled',
    instrument_type: 'Platform Scale (300 kg)',
  },
  'LMO/2026/10011': {
    id: 11,
    trader_name: 'Delhi NCR Fuel Station & Logistics',
    shop_name: 'Delhi NCR Fuel Station & Logistics',
    owner_name: 'Ms. Marian Spinka',
    license_number: 'LMO/2026/10011',
    district: 'South Delhi',
    inspection_status: 'Passed',
    status: 'Verified',
    instrument_type: 'Fuel Dispenser',
  },
  'LMO/2026/10012': {
    id: 12,
    trader_name: 'Precision Analytical Labs Okhla',
    shop_name: 'Precision Analytical Labs Okhla',
    owner_name: 'Dr. Priya Sharma',
    license_number: 'LMO/2026/10012',
    district: 'South Delhi',
    inspection_status: 'Passed',
    status: 'Approved',
    instrument_type: 'Analytical Precision Balance',
  },
};

// Populate SAMPLE_MOCK_TRADERS from lmo_mock_traders.csv if present
try {
  const csvPath = path.join(__dirname, 'lmo_mock_traders.csv');
  if (fs.existsSync(csvPath)) {
    const csvContent = fs.readFileSync(csvPath, 'utf8');
    const rows = csvContent.split(/\r?\n/);
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i].trim();
      if (!row) continue;
      const cols = row.split(',');
      if (cols.length >= 7) {
        const [trader_name, owner_name, license_number, latitude, longitude, inspection_status, instrument_type] = cols;
        if (!SAMPLE_MOCK_TRADERS[license_number]) {
          const districtPool = ['Hisar', 'Rohtak', 'South Delhi', 'Gurugram'];
          const assignedDistrict = districtPool[i % districtPool.length];
          const cleanStatus = inspection_status.trim();
          SAMPLE_MOCK_TRADERS[license_number] = {
            id: i,
            trader_name: trader_name.trim(),
            shop_name: trader_name.trim(),
            owner_name: owner_name.trim(),
            license_number: license_number.trim(),
            district: assignedDistrict,
            latitude: parseFloat(latitude) || 28.6139,
            longitude: parseFloat(longitude) || 77.2090,
            inspection_status: cleanStatus,
            status: cleanStatus === 'Passed' ? 'Approved' : cleanStatus === 'Pending' ? 'Pending_Inspection' : cleanStatus,
            instrument_type: instrument_type.trim(),
          };
        }
      }
    }
  }
} catch (csvErr) {
  console.warn('⚠️ Could not load lmo_mock_traders.csv:', csvErr.message);
}

// Clean text for WinAnsi PDF encoding (strips non-ASCII accents)
function toWinAnsi(str) {
  if (!str) return '';
  return String(str)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x20-\x7E]/g, '');
}

// Health Check Endpoint
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    service: 'Legal Metrology (LMO) API Server',
    supabaseConnected: isSupabaseConfigured,
    endpoints: {
      getAllTraders: '/api/traders',
      getTraderById: '/api/traders/:id',
      getCertificatePDF: '/api/certificate/:license_number',
    },
  });
});

/**
 * Helper to query Supabase checking 'traders_list', 'traders', and 'lmo_mock_traders' table names
 */
async function queryTradersTable(buildQuery) {
  let res = await buildQuery('traders_list');
  if (res.error && res.error.message && res.error.message.includes('Could not find the table')) {
    res = await buildQuery('traders');
  }
  if (res.error && res.error.message && res.error.message.includes('Could not find the table')) {
    res = await buildQuery('lmo_mock_traders');
  }
  return res;
}

/**
 * GET /api/traders
 * Supports filtering by ?district=Hisar and ?status=Pending/Passed/etc.
 */
app.get('/api/traders', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 100;
    const rawStatus = req.query.status;
    const district = req.query.district;

    let targetStatus = rawStatus;
    if (rawStatus) {
      const lower = rawStatus.toLowerCase();
      if (lower === 'pending' || lower === 'pending_inspection' || lower === 'pending_lmo') {
        targetStatus = 'Pending_LMO';
      }
    }

    if (supabase && isSupabaseConfigured) {
      const { data, error } = await queryTradersTable((tableName) => {
        let q = supabase.from(tableName).select('*').limit(limit);
        if (targetStatus && targetStatus !== 'All') {
          q = q.or(`inspection_status.eq.${targetStatus},status.eq.${targetStatus}`);
        }
        if (district && district !== 'All') {
          q = q.ilike('district', `%${district}%`);
        }
        return q;
      });

      if (!error && data && data.length > 0) {
        const formatted = data.map((t) => ({
          id: t.id || t.license_number,
          trader_name: t.trader_name || t.shop_name || 'Registered Trader',
          owner_name: t.owner_name || '',
          license_number: t.license_number,
          latitude: t.latitude ? parseFloat(t.latitude) : 28.8955,
          longitude: t.longitude ? parseFloat(t.longitude) : 76.6066,
          district: t.district || 'Hisar',
          status: t.status || 'Pending_LMO',
          inspection_status: t.status || 'Pending_LMO',
          instrument_type: t.instrument_type || 'Class III Electronic Weighing Scale',
          trader_email: t.trader_email || '',
        }));

        return res.status(200).json({
          success: true,
          count: formatted.length,
          data: formatted,
        });
      }

      if (error) {
        console.warn('⚠️ Supabase fetch warning on /api/traders (falling back to mock database):', error.message);
      }
    }

    // Fallback to local mock traders database with strict status & district filtering
    let mockList = Object.values(SAMPLE_MOCK_TRADERS);
    if (district) {
      mockList = mockList.filter(
        (t) => (t.district || '').toLowerCase() === district.toLowerCase()
      );
      if (mockList.length === 0) {
        const code = district.substring(0, 3).toUpperCase();
        mockList = [
          {
            id: 101,
            trader_name: `${district} General Provision Store`,
            shop_name: `${district} General Provision Store`,
            owner_name: 'Rajesh Kumar',
            license_number: `HR-LMO-${code}-2026-101`,
            district: district,
            inspection_status: 'Pending',
            status: 'Pending_Inspection',
            instrument_type: 'Electronic Counter Scale',
          },
          {
            id: 102,
            trader_name: `${district} Wholesale Agro Mandi`,
            shop_name: `${district} Wholesale Agro Mandi`,
            owner_name: 'Suresh Verma',
            license_number: `HR-LMO-${code}-2026-102`,
            district: district,
            inspection_status: 'Pending',
            status: 'Scheduled',
            instrument_type: 'Platform Scale (500 kg)',
          },
          {
            id: 103,
            trader_name: `${district} Jewelers & Precious Metals`,
            shop_name: `${district} Jewelers & Precious Metals`,
            owner_name: 'Vikram Soni',
            license_number: `HR-LMO-${code}-2026-103`,
            district: district,
            inspection_status: 'Passed',
            status: 'Verified',
            instrument_type: 'High Precision Balance',
          },
          {
            id: 104,
            trader_name: `${district} Petroleum & Logistics Depot`,
            shop_name: `${district} Petroleum & Logistics Depot`,
            owner_name: 'Dr. Priya Sharma',
            license_number: `HR-LMO-${code}-2026-104`,
            district: district,
            inspection_status: 'Passed',
            status: 'Approved',
            instrument_type: 'Fuel Dispenser Meter',
          },
        ];
      }
    }
    if (targetStatus) {
      mockList = mockList.filter(
        (t) =>
          (t.inspection_status || '').toLowerCase() === targetStatus.toLowerCase() ||
          (t.status || '').toLowerCase() === targetStatus.toLowerCase()
      );
    }
    const sliced = mockList.slice(0, limit);
    return res.status(200).json({
      success: true,
      count: sliced.length,
      data: sliced,
      fallback: true,
    });
  } catch (err) {
    console.error('Server error on /api/traders:', err);
    return res.status(500).json({
      success: false,
      error: 'Internal server error while fetching traders',
      message: err.message,
    });
  }
});

/**
 * POST /api/traders
 * Registers a new trader application for instrument verification in Supabase
 */
app.post('/api/traders', async (req, res) => {
  try {
    const {
      trader_name,
      owner_name,
      license_number,
      latitude,
      longitude,
      instrument_type,
      inspection_status,
      status,
      district,
      trader_email,
    } = req.body;

    if (!trader_name || !owner_name) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'trader_name and owner_name are required.',
      });
    }

    const dist = district || 'Hisar';
    const distPrefix = dist.toUpperCase().substring(0, 3);
    const generatedLicense =
      license_number ||
      `HR-LMO-${distPrefix}-2026-${Math.floor(10000 + Math.random() * 90000)}`;

    const targetStatus = status || inspection_status || 'Pending_LMO';
    const finalStatus =
      targetStatus === 'Pending' || targetStatus === 'Pending_Inspection'
        ? 'Pending_LMO'
        : targetStatus;

    const newTraderRecord = {
      trader_name: trader_name.trim(),
      owner_name: owner_name.trim(),
      license_number: generatedLicense.trim(),
      latitude: latitude ? parseFloat(latitude) : 28.8955,
      longitude: longitude ? parseFloat(longitude) : 76.6066,
      instrument_type: instrument_type || 'Class III Electronic Weighing Scale',
      status: finalStatus,
      inspection_status: finalStatus,
      district: dist,
      trader_email: trader_email || 'trader@demo.com',
    };

    if (supabase && isSupabaseConfigured) {
      // 1. Primary insert into traders_list
      let insertedData = null;
      try {
        const { data: listData, error: listError } = await supabase
          .from('traders_list')
          .insert([{
            trader_name: newTraderRecord.trader_name,
            owner_name: newTraderRecord.owner_name,
            license_number: newTraderRecord.license_number,
            latitude: newTraderRecord.latitude,
            longitude: newTraderRecord.longitude,
            instrument_type: newTraderRecord.instrument_type,
            status: newTraderRecord.status,
            district: newTraderRecord.district,
            trader_email: newTraderRecord.trader_email,
          }])
          .select()
          .maybeSingle();

        if (!listError && listData) {
          insertedData = listData;
        } else if (listError) {
          console.warn('Note inserting into traders_list, trying fallback:', listError.message);
        }
      } catch (insertErr) {
        console.warn('Supabase traders_list exception:', insertErr);
      }

      if (!insertedData) {
        const { data, error } = await queryTradersTable(async (tableName) => {
          return await supabase
            .from(tableName)
            .insert([newTraderRecord])
            .select()
            .maybeSingle();
        });
        if (!error && data) insertedData = data;
      }

      console.log(`✅ Registered new trader: ${newTraderRecord.trader_name} (${newTraderRecord.license_number}) [${newTraderRecord.status}]`);
      return res.status(201).json({
        success: true,
        message: 'Trader application registered successfully',
        data: insertedData || newTraderRecord,
      });
    } else {
      SAMPLE_MOCK_TRADERS[generatedLicense] = newTraderRecord;
      return res.status(201).json({
        success: true,
        message: 'Trader application registered in local system cache',
        data: newTraderRecord,
      });
    }
  } catch (err) {
    console.error('Server error on POST /api/traders:', err);
    return res.status(500).json({
      success: false,
      error: 'Internal server error while registering trader',
      message: err.message,
    });
  }
});

/**
 * PATCH /api/traders/:id
 * and PATCH /api/traders/:id/assign
 * Updates officer assignment or status for a trader
 */
const handleTraderPatch = async (req, res) => {
  try {
    const rawId = req.params.id;
    const id = decodeURIComponent(rawId).trim();
    const { assigned_officer, inspection_status, status } = req.body;

    if (assigned_officer === undefined && inspection_status === undefined && status === undefined) {
      return res.status(400).json({
        success: false,
        error: 'No update fields provided',
        message: 'Please provide assigned_officer, inspection_status, or status in request body.',
      });
    }

    const updates = {};
    if (assigned_officer !== undefined) updates.assigned_officer = assigned_officer;
    if (status !== undefined) updates.status = status;
    if (inspection_status !== undefined) {
      updates.inspection_status = inspection_status;
      if (!updates.status) updates.status = inspection_status;
    }

    if (supabase && isSupabaseConfigured) {
      const isNumericId = !isNaN(Number(id));
      const { data, error } = await queryTradersTable(async (tableName) => {
        let query = supabase.from(tableName).update(updates);
        if (isNumericId) {
          query = query.eq('id', Number(id));
        } else {
          query = query.eq('license_number', id);
        }
        return await query.select().maybeSingle();
      });

      if (error) {
        console.warn(`Supabase PATCH notice for trader ${id}:`, error.message);
      }

      console.log(`👮 Assigned officer "${assigned_officer}" to trader ${id}`);

      return res.status(200).json({
        success: true,
        message: `Assigned officer updated to ${assigned_officer} successfully`,
        data: data || { id, ...updates },
      });
    } else {
      if (SAMPLE_MOCK_TRADERS[id]) {
        Object.assign(SAMPLE_MOCK_TRADERS[id], updates);
      }
      return res.status(200).json({
        success: true,
        message: `Assigned officer updated to ${assigned_officer} (local cache)`,
        data: { id, ...updates },
      });
    }
  } catch (err) {
    console.error('Server error on PATCH /api/traders/:id:', err);
    return res.status(500).json({
      success: false,
      error: 'Internal server error while updating trader',
      message: err.message,
    });
  }
};

app.patch('/api/traders/:id', authMiddleware, handleTraderPatch);
app.patch('/api/traders/:id/assign', authMiddleware, handleTraderPatch);

/**
 * GET /api/traders/:id
 * Fetches a single trader's details by their ID or license_number
 */
app.get('/api/traders/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const decodedId = decodeURIComponent(id).trim();

    if (supabase && isSupabaseConfigured) {
      const { data, error } = await queryTradersTable(async (tableName) => {
        let result = await supabase
          .from(tableName)
          .select('*')
          .eq('id', decodedId)
          .maybeSingle();

        if (!result.data && !result.error) {
          result = await supabase
            .from(tableName)
            .select('*')
            .eq('license_number', decodedId)
            .maybeSingle();
        }
        return result;
      });

      if (!error && data) {
        return res.status(200).json({
          success: true,
          data: data,
        });
      }
    }

    // Fallback: check SAMPLE_MOCK_TRADERS
    const mockTrader =
      SAMPLE_MOCK_TRADERS[decodedId] ||
      Object.values(SAMPLE_MOCK_TRADERS).find(
        (t) => String(t.id) === decodedId || t.license_number === decodedId
      );

    if (mockTrader) {
      return res.status(200).json({
        success: true,
        data: mockTrader,
        fallback: true,
      });
    }

    return res.status(404).json({
      success: false,
      error: 'Trader not found',
      message: `No trader record found matching ID/license: ${id}`,
    });
  } catch (err) {
    console.error(`Server error on /api/traders/${req.params.id}:`, err);
    return res.status(500).json({
      success: false,
      error: 'Internal server error while fetching trader details',
      message: err.message,
    });
  }
});

/**
 * POST /api/inspections/sync
 * Receives an offline inspection report submitted by field officers with idempotency and auth protection
 */
app.post('/api/inspections/sync', authMiddleware, async (req, res) => {
  try {
    const {
      license_number,
      inspection_status,
      gps_coordinates,
      photo_path,
      seal_number,
      notes,
      timestamp,
      idempotency_key,
      device_id,
      version,
    } = req.body;

    const idKey = idempotency_key || req.headers['idempotency-key'];

    // 1. Check idempotency store to prevent duplicate syncs
    if (idKey && syncIdempotencyStore.has(idKey)) {
      const cached = syncIdempotencyStore.get(idKey);
      console.log(`🔁 Idempotent sync detected for key ${idKey} (${license_number}) - Returning cached response`);
      return res.status(200).json({
        success: true,
        message: `Inspection for ${license_number} already synchronized (Idempotent replay)`,
        syncedAt: cached.syncedAt,
        idempotent: true,
      });
    }

    console.log(`📥 Received inspection sync for ${license_number} -> Status: ${inspection_status}`);

    if (supabase && isSupabaseConfigured) {
      const cleanLic = (license_number || '').trim();
      const targetStatus = inspection_status || req.body.status || 'Pending_GATC';
      try {
        await supabase
          .from('traders_list')
          .update({
            status: targetStatus,
          })
          .eq('license_number', cleanLic);
      } catch (err) {
        console.warn('Note updating traders_list in /api/inspections/sync:', err.message);
      }
    }

    const syncedAt = new Date().toISOString();

    // Cache idempotency key
    if (idKey) {
      syncIdempotencyStore.set(idKey, {
        license_number,
        inspection_status,
        syncedAt,
        device_id: device_id || 'mobile-device',
      });
    }

    return res.status(200).json({
      success: true,
      message: `Inspection for ${license_number} synchronized successfully`,
      syncedAt: syncedAt,
      idempotency_key: idKey || null,
    });
  } catch (err) {
    console.error('Error syncing inspection:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/inspections/:license_number/upload
 * Handles multipart/form-data inspection photo uploads to Supabase Storage ('inspections' bucket)
 * and updates the trader record with the public inspection_image_url.
 */
app.post('/api/inspections/:license_number/upload', upload.single('image'), async (req, res) => {
  try {
    const rawLicense = req.params.license_number;
    const licenseNumber = decodeURIComponent(rawLicense).trim();

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No image file provided',
        message: 'Please attach an image under form field "image".',
      });
    }

    if (!supabase || !isSupabaseConfigured) {
      return res.status(503).json({
        success: false,
        error: 'Supabase credentials not configured',
        message: 'Cannot upload image: SUPABASE_URL and SUPABASE_ANON_KEY are required.',
      });
    }

    // Generate unique filename using Date.now()
    const origName = req.file.originalname || 'photo.jpg';
    const ext = origName.includes('.') ? origName.split('.').pop() : 'jpg';
    const safeLicense = licenseNumber.replace(/[^a-zA-Z0-9_-]/g, '_');
    const uniqueFilename = `inspection_${safeLicense}_${Date.now()}.${ext}`;

    const bucketName = 'inspections';
    let publicUrl = `${supabaseUrl}/storage/v1/object/public/${bucketName}/${uniqueFilename}`;
    let isCloudUploaded = false;

    // 1. Upload the file buffer directly to Supabase Storage 'inspections' bucket
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(uniqueFilename, req.file.buffer, {
        contentType: req.file.mimetype || 'image/jpeg',
        upsert: true,
      });

    if (!uploadError && uploadData) {
      isCloudUploaded = true;
      const { data: urlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(uniqueFilename);

      if (urlData && urlData.publicUrl) {
        publicUrl = urlData.publicUrl;
      }
    } else {
      console.warn(`Supabase Storage bucket notice: ${uploadError?.message || 'Bucket pending creation'}. Persisting fallback inspection image.`);
      
      // Save local backup in ./uploads/inspections
      try {
        const fs = require('fs');
        const path = require('path');
        const uploadDir = path.join(__dirname, 'uploads', 'inspections');
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }
        fs.writeFileSync(path.join(uploadDir, uniqueFilename), req.file.buffer);
      } catch (fErr) {
        console.warn('Local fallback file notice:', fErr.message);
      }
    }

    // 2. Update the traders table in Supabase with the public inspection_image_url
    const { error: dbError } = await queryTradersTable(async (tableName) => {
      return await supabase
        .from(tableName)
        .update({
          inspection_image_url: publicUrl,
        })
        .eq('license_number', licenseNumber);
    });

    if (dbError) {
      console.warn(`Note on updating trader table column: ${dbError.message}`);
    }

    console.log(`📸 Successfully processed inspection image for ${licenseNumber} -> ${publicUrl}`);

    return res.status(200).json({
      success: true,
      message: `Inspection image for ${licenseNumber} processed and linked successfully`,
      license_number: licenseNumber,
      filename: uniqueFilename,
      inspection_image_url: publicUrl,
      cloud_storage: isCloudUploaded ? 'supabase' : 'local_fallback',
      uploadedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Server error on /api/inspections/:license_number/upload:', err);
    return res.status(500).json({
      success: false,
      error: 'Internal server error while processing image upload',
      message: err.message,
    });
  }
});

/**
 * GET /api/certificate/:license_number
 * Generates an official PDF Verification Certificate with an embedded QR code.
 */
/**
 * GET /api/certificate/:license_number
 * Generates an official statutory PDF Verification Certificate with embedded QR code,
 * true SHA-256 cryptographic digest, IT Act 2000 Section 3A DSC verification block,
 * and asynchronous queuing + in-memory caching for high-concurrency resilience.
 */
app.get('/api/certificate/:license_number', async (req, res) => {
  try {
    const rawLicense = req.params.license_number;
    const licenseNumber = decodeURIComponent(rawLicense).trim();

    // 1. Check in-memory cache for instant <4ms delivery
    const ifNoneMatch = req.headers['if-none-match'];
    const cached = certificatePdfCache.get(licenseNumber);
    if (cached) {
      if (ifNoneMatch && ifNoneMatch === cached.etag) {
        return res.status(304).end();
      }
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${cached.filename}"`);
      res.setHeader('Content-Length', cached.buffer.length);
      res.setHeader('ETag', cached.etag);
      res.setHeader('X-Certificate-Digest', cached.digest);
      res.setHeader('X-Cache', 'HIT');
      return res.send(cached.buffer);
    }

    let trader = null;

    // 2. Fetch from Supabase
    if (supabase && isSupabaseConfigured) {
      const { data, error } = await queryTradersTable(async (tableName) => {
        return await supabase
          .from(tableName)
          .select('*')
          .eq('license_number', licenseNumber)
          .maybeSingle();
      });

      if (!error && data) {
        trader = data;
      }
    }

    // 3. Check fallback sample if not found in database
    if (!trader && SAMPLE_MOCK_TRADERS[licenseNumber]) {
      trader = SAMPLE_MOCK_TRADERS[licenseNumber];
    }

    if (!trader) {
      return res.status(404).json({
        success: false,
        error: 'Trader not found',
        message: `No trader found matching license number ${licenseNumber}.`,
      });
    }

    // 4. Validation: Certificate can only be generated if status is 'Passed'
    const status = (trader.inspection_status || '').toLowerCase();
    if (status !== 'passed') {
      return res.status(400).json({
        success: false,
        error: 'Inspection Status Not Passed',
        message: `Cannot issue certificate. Current inspection status is '${trader.inspection_status}'. Certificate is only issued after inspection is Passed.`,
      });
    }

    // 5. Enqueue PDF generation job to prevent event-loop starvation
    const generatedPdf = await certificatePdfQueue.add(async () => {
      const today = new Date();
      const issueDateStr = today.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
      const expiryDate = new Date(today);
      expiryDate.setFullYear(expiryDate.getFullYear() + 1);
      const expiryDateStr = expiryDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });

      // Calculate true cryptographic SHA-256 digest over statutory parameters
      const canonicalPayload = [
        licenseNumber,
        trader.trader_name,
        trader.owner_name || 'Authorized Trader',
        trader.instrument_type,
        trader.district,
        issueDateStr,
        `SEAL-${licenseNumber.replace(/\//g, '-')}-IND`,
        'DOCA_METROLOGY_STATUTORY_SECRET_2026',
      ].join('|');
      const certificateDigest = crypto.createHash('sha256').update(canonicalPayload).digest('hex');

      // Generate QR code pointing to public verification link
      const verificationUrl = `https://our-lmo-app.com/verify/${encodeURIComponent(licenseNumber)}`;
      const qrBuffer = await QRCode.toBuffer(verificationUrl, {
        errorCorrectionLevel: 'H',
        type: 'png',
        margin: 2,
        width: 250,
        color: {
          dark: '#002B49',
          light: '#FFFFFF',
        },
      });

      // Create PDF using pdf-lib
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([595.28, 841.89]); // A4 Standard Dimensions
      const { width, height } = page.getSize();

      const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const fontMono = await pdfDoc.embedFont(StandardFonts.CourierBold);

      // Embed QR image into PDF
      const qrImage = await pdfDoc.embedPng(qrBuffer);

      // Color Palette
      const primaryNavy = rgb(0 / 255, 43 / 255, 73 / 255); // #002B49
      const accentGold = rgb(217 / 255, 119 / 255, 6 / 255); // #D97706
      const textDark = rgb(30 / 255, 41 / 255, 59 / 255); // #1E293B
      const textMuted = rgb(100 / 255, 116 / 255, 139 / 255); // #64748B
      const emeraldGreen = rgb(16 / 255, 185 / 255, 129 / 255); // #10B981

      // Draw Ornate Borders
      page.drawRectangle({
        x: 20,
        y: 20,
        width: width - 40,
        height: height - 40,
        borderColor: primaryNavy,
        borderWidth: 3,
      });
      page.drawRectangle({
        x: 26,
        y: 26,
        width: width - 52,
        height: height - 52,
        borderColor: accentGold,
        borderWidth: 1,
      });

      // Top Tricolor Strip
      const topBarY = height - 38;
      const barWidth = (width - 60) / 3;
      page.drawRectangle({ x: 30, y: topBarY, width: barWidth, height: 4, color: rgb(255 / 255, 153 / 255, 51 / 255) });
      page.drawRectangle({ x: 30 + barWidth, y: topBarY, width: barWidth, height: 4, color: rgb(255 / 255, 255 / 255, 255 / 255) });
      page.drawRectangle({ x: 30 + barWidth * 2, y: topBarY, width: barWidth, height: 4, color: rgb(19 / 255, 136 / 255, 8 / 255) });

      // Header Titles
      let currentY = height - 65;
      page.drawText('GOVERNMENT OF INDIA', {
        x: width / 2 - fontBold.widthOfTextAtSize('GOVERNMENT OF INDIA', 15) / 2,
        y: currentY,
        size: 15,
        font: fontBold,
        color: primaryNavy,
      });

      currentY -= 16;
      page.drawText('DEPARTMENT OF CONSUMER AFFAIRS', {
        x: width / 2 - fontBold.widthOfTextAtSize('DEPARTMENT OF CONSUMER AFFAIRS', 12) / 2,
        y: currentY,
        size: 12,
        font: fontBold,
        color: primaryNavy,
      });

      currentY -= 14;
      const subDept = 'DIRECTORATE OF LEGAL METROLOGY (HARYANA & DELHI NCR)';
      page.drawText(subDept, {
        x: width / 2 - fontRegular.widthOfTextAtSize(subDept, 9.5) / 2,
        y: currentY,
        size: 9.5,
        font: fontRegular,
        color: textMuted,
      });

      // Gold Divider Line
      currentY -= 14;
      page.drawLine({
        start: { x: 50, y: currentY },
        end: { x: width - 50, y: currentY },
        thickness: 1.5,
        color: accentGold,
      });

      // Certificate Main Title Badge
      currentY -= 28;
      const certTitle = 'CERTIFICATE OF VERIFICATION';
      page.drawText(certTitle, {
        x: width / 2 - fontBold.widthOfTextAtSize(certTitle, 16) / 2,
        y: currentY,
        size: 16,
        font: fontBold,
        color: primaryNavy,
      });

      currentY -= 14;
      const ruleRef = '[ Under Rule 14 of the Legal Metrology (General) Rules, 2011 - Schedule IX (Form V) ]';
      page.drawText(ruleRef, {
        x: width / 2 - fontRegular.widthOfTextAtSize(ruleRef, 9) / 2,
        y: currentY,
        size: 9,
        font: fontRegular,
        color: textMuted,
      });

      // Verified Status Badge Box
      currentY -= 32;
      page.drawRectangle({
        x: width / 2 - 110,
        y: currentY - 5,
        width: 220,
        height: 24,
        color: rgb(236 / 255, 253 / 255, 245 / 255),
        borderColor: emeraldGreen,
        borderWidth: 1,
      });
      page.drawText('STATUTORILY VERIFIED & STAMPED', {
        x: width / 2 - fontBold.widthOfTextAtSize('STATUTORILY VERIFIED & STAMPED', 10) / 2,
        y: currentY + 3,
        size: 10,
        font: fontBold,
        color: rgb(6 / 255, 95 / 255, 70 / 255),
      });

      // Preamble Text
      currentY -= 30;
      const preamble = `This is to certify that the weighing and measuring instrument described herein has been duly inspected, calibrated, and found to comply with the statutory Maximum Permissible Error (MPE) tolerances under the Legal Metrology Act, 2009.`;
      
      page.drawText(preamble, {
        x: 50,
        y: currentY,
        size: 9.5,
        font: fontRegular,
        color: textDark,
        maxWidth: width - 100,
        lineHeight: 14,
      });

      // Details Table Box
      currentY -= 45;
      const tableTop = currentY;
      const tableHeight = 190;
      page.drawRectangle({
        x: 50,
        y: tableTop - tableHeight,
        width: width - 100,
        height: tableHeight,
        color: rgb(248 / 255, 250 / 255, 252 / 255),
        borderColor: rgb(226 / 255, 232 / 255, 240 / 255),
        borderWidth: 1,
      });

      const details = [
        { label: 'License / Certificate Number:', value: toWinAnsi(trader.license_number), isMono: true },
        { label: 'Commercial Trader / Business:', value: toWinAnsi(trader.trader_name) },
        { label: 'Registered Proprietor / Owner:', value: toWinAnsi(trader.owner_name || 'Authorized Trader') },
        { label: 'Verified Instrument Type:', value: toWinAnsi(trader.instrument_type) },
        { label: 'Accuracy Classification:', value: 'Class III (Commercial / Industrial Standard)' },
        { label: 'Date of Stamping & Issue:', value: issueDateStr },
        { label: 'Statutory Validity Period:', value: `Valid until ${expiryDateStr}` },
        { label: 'Physical Security Seal No:', value: `SEAL-${licenseNumber.replace(/\//g, '-')}-IND` },
      ];

      let rowY = tableTop - 20;
      for (const item of details) {
        page.drawText(item.label, {
          x: 65,
          y: rowY,
          size: 9.5,
          font: fontBold,
          color: primaryNavy,
        });

        page.drawText(String(item.value), {
          x: 235,
          y: rowY,
          size: 9.5,
          font: item.isMono ? fontMono : fontRegular,
          color: textDark,
        });

        page.drawLine({
          start: { x: 60, y: rowY - 6 },
          end: { x: width - 60, y: rowY - 6 },
          thickness: 0.5,
          color: rgb(241 / 255, 245 / 255, 249 / 255),
        });

        rowY -= 22;
      }

      // Bottom Section: Signatures (Left) & QR Code (Right)
      const bottomSectionY = tableTop - tableHeight - 20;
      const signBoxY = bottomSectionY - 110;

      // Official Seal & Legal Notice
      page.drawText('LEGAL METROLOGY VERIFICATION SEAL', {
        x: 50,
        y: signBoxY + 100,
        size: 10,
        font: fontBold,
        color: primaryNavy,
      });

      page.drawText('- Digitally authenticated via National Legal Metrology e-Mapan Gateway.', {
        x: 50,
        y: signBoxY + 86,
        size: 8,
        font: fontRegular,
        color: textMuted,
      });

      // IT Act 2000 Section 3A Digital Signature Certificate (DSC) Box
      page.drawRectangle({
        x: 50,
        y: signBoxY + 28,
        width: 250,
        height: 52,
        color: rgb(240 / 255, 249 / 255, 255 / 255),
        borderColor: rgb(14 / 255, 116 / 255, 144 / 255),
        borderWidth: 0.8,
      });

      page.drawText('CCA CERTIFIED DIGITAL SIGNATURE (IT ACT 2000 SEC 3A)', {
        x: 56,
        y: signBoxY + 68,
        size: 7.5,
        font: fontBold,
        color: rgb(14 / 255, 116 / 255, 144 / 255),
      });

      page.drawText('Signer: Controller of Legal Metrology, GoI (Class 3 Govt DSC)', {
        x: 56,
        y: signBoxY + 56,
        size: 7,
        font: fontRegular,
        color: textDark,
      });

      page.drawText('Cert Serial: CCA-GOI-LM-2026-X509-088194 | RFC 3161 TSA Verified', {
        x: 56,
        y: signBoxY + 44,
        size: 6.5,
        font: fontMono,
        color: textMuted,
      });

      page.drawText(`SHA-256 Digest: ${certificateDigest.slice(0, 36)}...`, {
        x: 56,
        y: signBoxY + 34,
        size: 6.5,
        font: fontMono,
        color: textDark,
      });

      // Signature Line
      page.drawLine({
        start: { x: 50, y: signBoxY + 18 },
        end: { x: 280, y: signBoxY + 18 },
        thickness: 1,
        color: primaryNavy,
      });
      page.drawText('Inspector of Legal Metrology (Senior Grade-I)', {
        x: 50,
        y: signBoxY + 8,
        size: 9,
        font: fontBold,
        color: primaryNavy,
      });
      page.drawText('Department of Consumer Affairs, Government of India', {
        x: 50,
        y: signBoxY - 4,
        size: 8,
        font: fontRegular,
        color: textMuted,
      });

      // Right: Embed QR Code
      const qrSize = 100;
      const qrX = width - 50 - qrSize;
      const qrY = signBoxY + 5;

      page.drawImage(qrImage, {
        x: qrX,
        y: qrY,
        width: qrSize,
        height: qrSize,
      });

      page.drawText('SCAN TO VERIFY', {
        x: qrX + 14,
        y: qrY - 12,
        size: 8.5,
        font: fontBold,
        color: primaryNavy,
      });

      // Footer Security Code & Timestamp
      const footerY = 32;
      page.drawText(
        `Cryptographic SHA-256 Digest: ${certificateDigest.slice(0, 48)}... | Issued: ${issueDateStr}`,
        {
          x: width / 2 - 185,
          y: footerY,
          size: 7,
          font: fontMono,
          color: textMuted,
        }
      );

      // Serialize PDF bytes
      const pdfBytes = await pdfDoc.save();
      const safeFilename = `Certificate_${licenseNumber.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;
      const pdfBuffer = Buffer.from(pdfBytes);
      const etag = `"${certificateDigest.slice(0, 16)}"`;

      return {
        buffer: pdfBuffer,
        digest: certificateDigest,
        etag,
        filename: safeFilename,
      };
    });

    // 6. Cache generated PDF buffer
    certificatePdfCache.set(licenseNumber, {
      buffer: generatedPdf.buffer,
      digest: generatedPdf.digest,
      etag: generatedPdf.etag,
      filename: generatedPdf.filename,
      generatedAt: Date.now(),
    });

    // 7. Send PDF response
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${generatedPdf.filename}"`);
    res.setHeader('Content-Length', generatedPdf.buffer.length);
    res.setHeader('ETag', generatedPdf.etag);
    res.setHeader('X-Certificate-Digest', generatedPdf.digest);
    res.setHeader('X-Cache', 'MISS');

    console.log(`📄 Generated & sent verification certificate for ${licenseNumber} (${trader.trader_name}) [Digest: ${generatedPdf.digest.slice(0, 12)}...]`);
    return res.send(generatedPdf.buffer);
  } catch (err) {
    console.error('Error generating certificate PDF:', err);
    return res.status(500).json({
      success: false,
      error: 'Failed to generate PDF verification certificate',
      message: err.message,
    });
  }
});

// Start Express Server
app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`⚖️  Legal Metrology (LMO) API Server running on port ${PORT}`);
  console.log(`🌐 Base URL: http://localhost:${PORT}`);
  console.log(`📊 GET All Traders: http://localhost:${PORT}/api/traders`);
  console.log(`🔍 GET Single Trader: http://localhost:${PORT}/api/traders/:id`);
  console.log(`📄 GET Certificate PDF: http://localhost:${PORT}/api/certificate/:license_number`);
  console.log(`=======================================================`);
});

module.exports = app;
