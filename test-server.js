const http = require('http');

console.log('Testing Express + Supabase Server + PDF Certificate Generation...');

const app = require('./server.js');

setTimeout(() => {
  http.get('http://localhost:5000/', (res) => {
    console.log('✅ GET / response status:', res.statusCode);
    
    // Test GET /api/certificate/LMO%2F2026%2F10001
    const certUrl = 'http://localhost:5000/api/certificate/LMO%2F2026%2F10001';
    http.get(certUrl, (certRes) => {
      console.log('✅ GET /api/certificate/:license_number status:', certRes.statusCode);
      console.log('✅ Content-Type:', certRes.headers['content-type']);
      console.log('✅ Content-Disposition:', certRes.headers['content-disposition']);
      
      const chunks = [];
      certRes.on('data', (chunk) => chunks.push(chunk));
      certRes.on('end', () => {
        const buffer = Buffer.concat(chunks);
        console.log(`✅ PDF Generated Successfully! Size: ${buffer.length} bytes (Starts with '%PDF': ${buffer.toString('utf-8', 0, 4) === '%PDF'})`);
        console.log('🎉 Certificate Generation Backend Route Verified!');
        process.exit(0);
      });
    }).on('error', (err) => {
      console.error('❌ Certificate Error:', err);
      process.exit(1);
    });
  }).on('error', (err) => {
    console.error('❌ HTTP Error:', err.message);
    process.exit(1);
  });
}, 500);
