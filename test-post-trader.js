require('dotenv').config();
const http = require('http');
const app = require('./server');

const server = app.listen(5004, () => {
  console.log('🧪 Testing POST /api/traders on port 5004...');

  const payload = JSON.stringify({
    trader_name: 'Haryana Modern Mart',
    owner_name: 'Vikram Singh',
    instrument_type: 'Electronic Counter Scale (Class III)',
    latitude: 28.5494,
    longitude: 77.2001,
    inspection_status: 'Pending',
  });

  const req = http.request(
    {
      host: 'localhost',
      port: 5004,
      path: '/api/traders',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
      },
    },
    (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        console.log(`📡 Response Status: ${res.statusCode}`);
        console.log(`📦 Response Body: ${data}`);
        server.close();
        process.exit(0);
      });
    }
  );

  req.on('error', (err) => {
    console.error('Request error:', err);
    server.close();
    process.exit(1);
  });

  req.write(payload);
  req.end();
});
