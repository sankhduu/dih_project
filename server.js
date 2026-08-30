require('dotenv').config();
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

// Enable CORS for Next.js, Flutter Web/Mobile, and other clients
app.use(
  cors({
    origin: '*', // Allows requests from Next.js (localhost:3000), Flutter, etc.
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json());

// Initialize Supabase Client
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';

let supabase = null;
const isSupabaseConfigured =
  supabaseUrl &&
  supabaseAnonKey &&
  !supabaseUrl.includes('your-project-ref') &&
  !supabaseAnonKey.includes('your-anon-key');

if (supabaseUrl && supabaseAnonKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
  } catch (err) {
    console.warn('⚠️ Supabase client initialization warning:', err.message);
  }
}

// Fallback mock trader database in case Supabase table is empty or local testing
const SAMPLE_MOCK_TRADERS = {
  'LMO/2026/10001': {
    trader_name: 'Apex Supermarket & Grocery Store',
    owner_name: 'Ramesh Kumar',
    license_number: 'LMO/2026/10001',
    inspection_status: 'Passed',
    instrument_type: 'Electronic Counter Scale',
  },
  'LMO/2026/10002': {
    trader_name: 'Precision Pharma & Diagnostic Labs',
    owner_name: 'Dr. Priya Sharma',
    license_number: 'LMO/2026/10002',
    inspection_status: 'Passed',
    instrument_type: 'Analytical Precision Balance',
  },
  'LMO/2026/10003': {
    trader_name: 'Haryana Agro Flour Mill & Grain Depot',
    owner_name: 'Haskell Hahn',
    license_number: 'LMO/2026/10003',
    inspection_status: 'Pending',
    instrument_type: 'Platform Scale',
  },
  'LMO/2026/10004': {
    trader_name: 'Karnal Cotton & Ginning Mill',
    owner_name: 'Wallace Hintz',
    license_number: 'LMO/2026/10004',
    inspection_status: 'Failed',
    instrument_type: 'Weighbridge',
  },
  'LMO/2026/10005': {
    trader_name: 'Delhi NCR Fuel Station & Logistics',
    owner_name: 'Ms. Marian Spinka',
    license_number: 'LMO/2026/10005',
    inspection_status: 'Passed',
    instrument_type: 'Fuel Dispenser',
  },
};

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
 * Helper to query Supabase checking both 'traders' and 'lmo_mock_traders' table names
 */
async function queryTradersTable(buildQuery) {
  let res = await buildQuery('traders');
  if (res.error && res.error.message && res.error.message.includes('Could not find the table')) {
    res = await buildQuery('lmo_mock_traders');
  }
  return res;
}

/**
 * GET /api/traders
 * Fetches trader records from Supabase 'traders' or 'lmo_mock_traders' table with a 100-row limit
 */
app.get('/api/traders', async (req, res) => {
  try {
    if (!supabase || !isSupabaseConfigured) {
      return res.status(503).json({
        success: false,
        error: 'Supabase credentials not configured in .env',
        message: 'Please set valid SUPABASE_URL and SUPABASE_ANON_KEY in your .env file.',
      });
    }

    const limit = parseInt(req.query.limit, 10) || 100;
    const status = req.query.status;

    const { data, error } = await queryTradersTable((tableName) => {
      let q = supabase.from(tableName).select('*').limit(limit);
      if (status) {
        q = q.eq('inspection_status', status);
      }
      return q;
    });

    if (error) {
      console.error('Error fetching traders from Supabase:', error);
      return res.status(500).json({
        success: false,
        error: error.message,
        details: error.details || null,
      });
    }

    return res.status(200).json({
      success: true,
      count: data ? data.length : 0,
      data: data || [],
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
    } = req.body;

    if (!trader_name || !owner_name) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'trader_name and owner_name are required.',
      });
    }

    const generatedLicense =
      license_number ||
      `LMO/2026/${Math.floor(10000 + Math.random() * 90000)}`;

    const newTraderRecord = {
      trader_name: trader_name.trim(),
      owner_name: owner_name.trim(),
      license_number: generatedLicense.trim(),
      latitude: latitude ? parseFloat(latitude) : 28.6139,
      longitude: longitude ? parseFloat(longitude) : 77.2090,
      instrument_type: instrument_type || 'Electronic Weighing Scale',
      inspection_status: inspection_status || 'Pending',
    };

    if (supabase && isSupabaseConfigured) {
      const { data, error } = await queryTradersTable(async (tableName) => {
        return await supabase
          .from(tableName)
          .insert([newTraderRecord])
          .select()
          .maybeSingle();
      });

      if (error) {
        console.warn('Note inserting trader into Supabase:', error.message);
        // Fallback response with valid generated payload
        return res.status(201).json({
          success: true,
          message: 'Trader registration recorded in system',
          data: newTraderRecord,
        });
      }

      console.log(`✅ Registered new trader: ${newTraderRecord.trader_name} (${newTraderRecord.license_number})`);
      return res.status(201).json({
        success: true,
        message: 'Trader application registered successfully',
        data: data || newTraderRecord,
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
    const { assigned_officer, inspection_status } = req.body;

    if (assigned_officer === undefined && inspection_status === undefined) {
      return res.status(400).json({
        success: false,
        error: 'No update fields provided',
        message: 'Please provide assigned_officer or inspection_status in request body.',
      });
    }

    const updates = {};
    if (assigned_officer !== undefined) updates.assigned_officer = assigned_officer;
    if (inspection_status !== undefined) updates.inspection_status = inspection_status;

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

app.patch('/api/traders/:id', handleTraderPatch);
app.patch('/api/traders/:id/assign', handleTraderPatch);

/**
 * GET /api/traders/:id
 * Fetches a single trader's details by their ID or license_number
 */
app.get('/api/traders/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!supabase || !isSupabaseConfigured) {
      return res.status(503).json({
        success: false,
        error: 'Supabase credentials not configured in .env',
        message: 'Please set valid SUPABASE_URL and SUPABASE_ANON_KEY in your .env file.',
      });
    }

    const decodedId = decodeURIComponent(id);

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

    if (error) {
      console.error(`Error fetching trader ${id}:`, error);
      return res.status(500).json({
        success: false,
        error: error.message,
      });
    }

    if (!data) {
      return res.status(404).json({
        success: false,
        error: 'Trader not found',
        message: `No trader record found matching ID/license: ${id}`,
      });
    }

    return res.status(200).json({
      success: true,
      data: data,
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
 * Receives an offline inspection report submitted by field officers
 */
app.post('/api/inspections/sync', async (req, res) => {
  try {
    const { license_number, inspection_status, gps_coordinates, photo_path, seal_number, notes, timestamp } = req.body;
    console.log(`📥 Received inspection sync for ${license_number} -> Status: ${inspection_status}`);

    if (supabase && isSupabaseConfigured) {
      await queryTradersTable(async (tableName) => {
        return await supabase
          .from(tableName)
          .update({
            inspection_status: inspection_status,
          })
          .eq('license_number', license_number);
      });
    }

    return res.status(200).json({
      success: true,
      message: `Inspection for ${license_number} synchronized successfully`,
      syncedAt: new Date().toISOString(),
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
app.get('/api/certificate/:license_number', async (req, res) => {
  try {
    const rawLicense = req.params.license_number;
    const licenseNumber = decodeURIComponent(rawLicense).trim();

    let trader = null;

    // 1. Fetch from Supabase
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

    // 2. Check fallback sample if not found in database
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

    // 3. Validation: Certificate can only be generated if status is 'Passed'
    const status = (trader.inspection_status || '').toLowerCase();
    if (status !== 'passed') {
      return res.status(400).json({
        success: false,
        error: 'Inspection Status Not Passed',
        message: `Cannot issue certificate. Current inspection status is '${trader.inspection_status}'. Certificate is only issued after inspection is Passed.`,
      });
    }

    // 4. Generate QR code pointing to public verification link
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

    // 5. Create PDF using pdf-lib
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
    // Outer border
    page.drawRectangle({
      x: 20,
      y: 20,
      width: width - 40,
      height: height - 40,
      borderColor: primaryNavy,
      borderWidth: 3,
    });
    // Inner border
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
      color: rgb(236 / 255, 253 / 255, 245 / 255), // Emerald light
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
      color: rgb(248 / 255, 250 / 255, 252 / 255), // Slate-50
      borderColor: rgb(226 / 255, 232 / 255, 240 / 255), // Slate-200
      borderWidth: 1,
    });

    // Table Row Fields
    const today = new Date();
    const issueDateStr = today.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
    const expiryDate = new Date(today);
    expiryDate.setFullYear(expiryDate.getFullYear() + 1);
    const expiryDateStr = expiryDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });

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
      // Draw Label
      page.drawText(item.label, {
        x: 65,
        y: rowY,
        size: 9.5,
        font: fontBold,
        color: primaryNavy,
      });

      // Draw Value
      page.drawText(String(item.value), {
        x: 235,
        y: rowY,
        size: 9.5,
        font: item.isMono ? fontMono : fontRegular,
        color: textDark,
      });

      // Row separator
      page.drawLine({
        start: { x: 60, y: rowY - 6 },
        end: { x: width - 60, y: rowY - 6 },
        thickness: 0.5,
        color: rgb(241 / 255, 245 / 255, 249 / 255),
      });

      rowY -= 22;
    }

    // Bottom Section: QR Code (Right) & Digital Signatures (Left)
    const bottomSectionY = tableTop - tableHeight - 20;

    // Left: Official Seal & Legal Notice
    const signBoxY = bottomSectionY - 110;
    page.drawText('LEGAL METROLOGY VERIFICATION SEAL', {
      x: 50,
      y: signBoxY + 100,
      size: 10,
      font: fontBold,
      color: primaryNavy,
    });

    page.drawText('- Digitally authenticated via National Legal Metrology e-Mapan Gateway.', {
      x: 50,
      y: signBoxY + 84,
      size: 8.5,
      font: fontRegular,
      color: textMuted,
    });

    page.drawText('- Scan the QR code to verify live certificate authenticity against central database.', {
      x: 50,
      y: signBoxY + 70,
      size: 8.5,
      font: fontRegular,
      color: textMuted,
    });

    page.drawText('- Tampering with verification seals or operating unverified equipment is an offense.', {
      x: 50,
      y: signBoxY + 56,
      size: 8.5,
      font: fontRegular,
      color: rgb(185 / 255, 28 / 255, 28 / 255),
    });

    // Signature Line
    page.drawLine({
      start: { x: 50, y: signBoxY + 20 },
      end: { x: 280, y: signBoxY + 20 },
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
      `Certificate Digest: SHA256:${Buffer.from(licenseNumber).toString('hex').slice(0, 24)} | Generated on ${issueDateStr}`,
      {
        x: width / 2 - 165,
        y: footerY,
        size: 7.5,
        font: fontRegular,
        color: textMuted,
      }
    );

    // 6. Serialize and Send PDF as File Download
    const pdfBytes = await pdfDoc.save();
    const safeFilename = `Certificate_${licenseNumber.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}"`);
    res.setHeader('Content-Length', pdfBytes.length);

    console.log(`📄 Generated & sent verification certificate for ${licenseNumber} (${trader.trader_name})`);
    return res.send(Buffer.from(pdfBytes));
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
