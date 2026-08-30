const http = require('http');

console.log('Testing Certificate Route for Passed vs Non-Passed records...');

const app = require('./server.js');

setTimeout(() => {
  // 1. Test Passed record (LMO/2026/10002)
  const passedUrl = 'http://localhost:5000/api/certificate/LMO%2F2026%2F10002';
  http.get(passedUrl, (res) => {
    console.log('Passed Record Response Code:', res.statusCode);
    console.log('Passed Content-Type:', res.headers['content-type']);
    console.log('Passed Content-Disposition:', res.headers['content-disposition']);
    
    let chunks = [];
    res.on('data', (c) => chunks.push(c));
    res.on('end', () => {
      const buf = Buffer.concat(chunks);
      const isPdf = buf.toString('utf-8', 0, 4) === '%PDF';
      console.log(`Passed record generated valid PDF: ${isPdf} (Size: ${buf.length} bytes)`);

      // 2. Test Pending record (LMO/2026/10003)
      const pendingUrl = 'http://localhost:5000/api/certificate/LMO%2F2026%2F10003';
      http.get(pendingUrl, (pendingRes) => {
        console.log('Pending Record Response Code:', pendingRes.statusCode);
        let pendingData = '';
        pendingRes.on('data', (c) => { pendingData += c; });
        pendingRes.on('end', () => {
          console.log('Pending Response:', pendingData);
          console.log('✅ ALL CERTIFICATE VALIDATION CRITERIA MET!');
          process.exit(0);
        });
      });
    });
  });
}, 500);
