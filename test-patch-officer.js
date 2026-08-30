require('dotenv').config();
const http = require('http');
const app = require('./server');

const server = app.listen(5005, () => {
  console.log('🧪 Testing PATCH /api/traders/:id on port 5005...');

  const payload = JSON.stringify({
    assigned_officer: 'Inspector Sharma',
  });

  const license = encodeURIComponent('LMO/2026/10003');

  const req = http.request(
    {
      host: 'localhost',
      port: 5005,
      path: `/api/traders/${license}`,
      method: 'PATCH',
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
