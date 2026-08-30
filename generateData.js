const fs = require('fs');
const path = require('path');
const { faker } = require('@faker-js/faker');

// Geographic bounding box for Haryana / Delhi NCR region
// Lat: ~28.1000 to ~29.8000 (Covering Palwal, Faridabad, Gurugram, Delhi, Sonipat, Panipat, Rohtak, Karnal)
// Lng: ~76.2000 to ~77.5500 (Covering Rewari, Jhajjar, Gurugram, Delhi, Faridabad, Noida border)
const HARYANA_DELHI_BOUNDS = {
  minLat: 28.1500,
  maxLat: 29.7500,
  minLng: 76.3500,
  maxLng: 77.5000,
};

const INSTRUMENT_TYPES = [
  'Electronic Weighing Scale',
  'Weighbridge',
  'Platform Scale',
  'Electronic Counter Scale',
  'Fuel Dispenser',
  'Analytical Precision Balance',
  'Non-Automatic Weighing Instrument',
  'Automatic Gravimetric Filling Scale',
  'Flow Meter',
  'Crane Scale',
];

const INSPECTION_STATUSES = ['Pending', 'Passed', 'Failed'];

const TRADER_BUSINESS_TYPES = [
  'Supermarket',
  'Kirana Store',
  'Jewellers',
  'Pharma Labs',
  'Grain Market Depot',
  'Flour Mill',
  'Dairy & Sweets',
  'Cold Storage',
  'Fuel Station',
  'Logistics Hub',
  'Hardware & Steel Depot',
  'General Trading Co',
  'Cotton Ginning Mill',
  'Fertilizers & Agro Chemicals',
];

function sanitize(text) {
  if (!text) return '';
  return String(text).replace(/,/g, '').replace(/[\r\n]+/g, ' ').trim();
}

function getRandomCoordinate(min, max) {
  return (Math.random() * (max - min) + min).toFixed(6);
}

function generateMockTraders(count = 1000) {
  const records = [];

  for (let i = 1; i <= count; i++) {
    // Generate sequential or realistic 5-digit license numbers
    const licenseSeq = String(10000 + i).padStart(5, '0');
    const licenseNumber = `LMO/2026/${licenseSeq}`;

    // Clean Indian / realistic business and owner names without commas
    const ownerName = sanitize(faker.person.fullName());
    const companySuffix = faker.helpers.arrayElement(TRADER_BUSINESS_TYPES);
    const traderName = sanitize(`${faker.company.name()} ${companySuffix}`);

    const latitude = getRandomCoordinate(HARYANA_DELHI_BOUNDS.minLat, HARYANA_DELHI_BOUNDS.maxLat);
    const longitude = getRandomCoordinate(HARYANA_DELHI_BOUNDS.minLng, HARYANA_DELHI_BOUNDS.maxLng);

    // Weighted distribution: 55% Passed, 30% Pending, 15% Failed
    const statusWeight = Math.random();
    let inspectionStatus = 'Passed';
    if (statusWeight < 0.30) {
      inspectionStatus = 'Pending';
    } else if (statusWeight < 0.45) {
      inspectionStatus = 'Failed';
    }

    const instrumentType = faker.helpers.arrayElement(INSTRUMENT_TYPES);

    records.push({
      trader_name: traderName,
      owner_name: ownerName,
      license_number: licenseNumber,
      latitude: latitude,
      longitude: longitude,
      inspection_status: inspectionStatus,
      instrument_type: instrumentType,
    });
  }

  return records;
}

function exportToCSV(records, filename = 'lmo_mock_traders.csv') {
  const headers = [
    'trader_name',
    'owner_name',
    'license_number',
    'latitude',
    'longitude',
    'inspection_status',
    'instrument_type',
  ];

  const csvRows = [headers.join(',')];

  for (const row of records) {
    const values = [
      row.trader_name,
      row.owner_name,
      row.license_number,
      row.latitude,
      row.longitude,
      row.inspection_status,
      row.instrument_type,
    ];
    csvRows.push(values.join(','));
  }

  const csvContent = csvRows.join('\n');
  const filePath = path.join(__dirname, filename);
  fs.writeFileSync(filePath, csvContent, 'utf-8');
  console.log(`✅ Successfully generated ${records.length} mock trader records in ${filePath}`);
}

// Run generation
console.log('Generating 1,000 Legal Metrology (LMO) trader records for Haryana / Delhi NCR...');
const data = generateMockTraders(1000);
exportToCSV(data, 'lmo_mock_traders.csv');
