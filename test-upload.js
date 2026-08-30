require('dotenv').config();
const http = require('http');
const fs = require('fs');
const path = require('path');

const app = require('./server');

const server = app.listen(5002, async () => {
  console.log('🧪 Test server running on port 5002');

  try {
    const FormData = require('form-data');
    const form = new FormData();

    // Create a dummy image buffer
    const testImageBuffer = Buffer.from('FAKE_JPEG_IMAGE_CONTENT_FOR_TESTING_PURPOSES');
    form.append('image', testImageBuffer, {
      filename: 'scale_seal_photo.jpg',
      contentType: 'image/jpeg',
    });

    const licenseNumber = encodeURIComponent('LMO/2026/10001');

    const req = http.request(
      {
        host: 'localhost',
        port: 5002,
        path: `/api/inspections/${licenseNumber}/upload`,
        method: 'POST',
        headers: form.getHeaders(),
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

    form.pipe(req);
  } catch (err) {
    console.error('Test error:', err);
    server.close();
    process.exit(1);
  }
});
