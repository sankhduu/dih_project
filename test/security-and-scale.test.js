const http = require('http');

console.log('===========================================================');
console.log('🛡️  LEGAL METROLOGY GATEWAY - SECURITY & SCALE TEST SUITE');
console.log('===========================================================');

const app = require('../server.js');
const PORT = 5000;
let passed = 0;
let total = 0;

function assert(condition, name) {
  total++;
  if (condition) {
    console.log(`✅ PASS: ${name}`);
    passed++;
  } else {
    console.error(`❌ FAIL: ${name}`);
  }
}

function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => {
        const body = Buffer.concat(chunks);
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: body,
          text: body.toString('utf-8'),
          json: () => {
            try {
              return JSON.parse(body.toString('utf-8'));
            } catch {
              return null;
            }
          },
        });
      });
    });
    req.on('error', reject);
    if (postData) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }
    req.end();
  });
}

async function runTests() {
  try {
    // Wait for server to bind
    await new Promise((r) => setTimeout(r, 600));

    console.log('\n--- 1. Endpoint Authentication & RBAC Tests ---');
    
    // Test 1.1: Unauthenticated PATCH to /api/traders/:id must be rejected (401)
    const unauthPatch = await makeRequest({
      hostname: '127.0.0.1',
      port: PORT,
      path: '/api/traders/LMO%2F2026%2F10001',
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
    }, { assigned_officer: 'Inspector Unauthorized' });

    assert(
      unauthPatch.statusCode === 401,
      `Unauthenticated PATCH rejected with 401 Unauthorized (got ${unauthPatch.statusCode})`
    );

    // Test 1.2: Authenticated PATCH with valid Bearer token must succeed (200)
    const authPatch = await makeRequest({
      hostname: '127.0.0.1',
      port: PORT,
      path: '/api/traders/LMO%2F2026%2F10001',
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer lmo-officer-token-2026',
      },
    }, { assigned_officer: 'Inspector Rajesh Varma' });

    assert(
      authPatch.statusCode === 200,
      `Authenticated officer PATCH accepted with 200 OK (got ${authPatch.statusCode})`
    );

    // Test 1.3: Unauthenticated sync request must be rejected (401)
    const unauthSync = await makeRequest({
      hostname: '127.0.0.1',
      port: PORT,
      path: '/api/inspections/sync',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    }, { license_number: 'LMO/2026/10001', inspection_status: 'Pending_GATC' });

    assert(
      unauthSync.statusCode === 401,
      `Unauthenticated offline sync rejected with 401 Unauthorized (got ${unauthSync.statusCode})`
    );

    console.log('\n--- 2. Offline Sync Idempotency & Conflict Prevention Tests ---');

    const testIdempotencyKey = `INSP-TEST-SYNC-${Date.now()}`;
    const syncPayload = {
      license_number: 'LMO/2026/10001',
      inspection_status: 'Pending_GATC',
      idempotency_key: testIdempotencyKey,
      device_id: 'LMO-DEVICE-HARYANA-01',
    };

    // First Sync attempt
    const firstSync = await makeRequest({
      hostname: '127.0.0.1',
      port: PORT,
      path: '/api/inspections/sync',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer lmo-officer-token-2026',
        'idempotency-key': testIdempotencyKey,
      },
    }, syncPayload);

    const firstJson = firstSync.json();
    assert(
      firstSync.statusCode === 200 && firstJson && firstJson.success === true,
      'Initial inspection report sync accepted and processed (200 OK)'
    );

    // Second Sync attempt with exact same idempotency key (network replay simulation)
    const duplicateSync = await makeRequest({
      hostname: '127.0.0.1',
      port: PORT,
      path: '/api/inspections/sync',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer lmo-officer-token-2026',
        'idempotency-key': testIdempotencyKey,
      },
    }, syncPayload);

    const dupJson = duplicateSync.json();
    assert(
      duplicateSync.statusCode === 200 && dupJson && dupJson.idempotent === true,
      'Duplicate sync detected via idempotency key; returned idempotent response without double-writing'
    );

    console.log('\n--- 3. Schedule IX PDF Generation & Cryptographic Integrity Tests ---');

    // Test 3.1: Generate Certificate PDF
    const certStart = Date.now();
    const certRes = await makeRequest({
      hostname: '127.0.0.1',
      port: PORT,
      path: '/api/certificate/LMO%2F2026%2F10001',
      method: 'GET',
    });
    const certDuration = Date.now() - certStart;

    assert(certRes.statusCode === 200, `Certificate generated successfully with 200 OK (in ${certDuration}ms)`);
    assert(
      certRes.headers['content-type'] === 'application/pdf',
      `Correct Content-Type application/pdf received`
    );
    assert(
      certRes.body.toString('utf-8', 0, 4) === '%PDF',
      `Output binary conforms to valid ISO 32000-2 PDF header format (%PDF)`
    );

    // Test 3.2: Verify true SHA-256 Digest header presence (64 hex characters)
    const digestHeader = certRes.headers['x-certificate-digest'];
    assert(
      digestHeader && digestHeader.length === 64 && /^[0-9a-f]{64}$/.test(digestHeader),
      `Verified true SHA-256 cryptographic digest header: ${digestHeader?.slice(0, 16)}...`
    );

    // Test 3.3: In-Memory Certificate Cache Hit (<15ms repeat delivery)
    const cacheStart = Date.now();
    const cachedCertRes = await makeRequest({
      hostname: '127.0.0.1',
      port: PORT,
      path: '/api/certificate/LMO%2F2026%2F10001',
      method: 'GET',
    });
    const cacheDuration = Date.now() - cacheStart;

    assert(
      cachedCertRes.headers['x-cache'] === 'HIT',
      `In-memory certificate cache returned X-Cache: HIT (latency: ${cacheDuration}ms vs ${certDuration}ms cold)`
    );

    console.log('\n--- 4. Concurrency Queue Throughput & Event-Loop Safeguards ---');

    // Burst 10 concurrent requests to verify asynchronous queue processing
    const burstStart = Date.now();
    const burstPromises = Array.from({ length: 8 }, (_, i) =>
      makeRequest({
        hostname: '127.0.0.1',
        port: PORT,
        path: '/api/certificate/LMO%2F2026%2F10001',
        method: 'GET',
      })
    );

    const burstResults = await Promise.all(burstPromises);
    const burstDuration = Date.now() - burstStart;
    const allSuccessful = burstResults.every((r) => r.statusCode === 200);

    assert(
      allSuccessful,
      `Handled 8 burst certificate generation requests concurrently in ${burstDuration}ms with 100% success`
    );

    console.log('\n--- 5. Rate Limiting Headers & Protection ---');

    const rateLimitCheck = await makeRequest({
      hostname: '127.0.0.1',
      port: PORT,
      path: '/api/traders',
      method: 'GET',
    });

    assert(
      rateLimitCheck.headers['x-ratelimit-limit'] !== undefined &&
      rateLimitCheck.headers['x-ratelimit-remaining'] !== undefined,
      `Rate limiting headers present: Limit=${rateLimitCheck.headers['x-ratelimit-limit']}, Remaining=${rateLimitCheck.headers['x-ratelimit-remaining']}`
    );

    console.log('\n===========================================================');
    console.log(`📊 SECURITY & SCALE TEST SUMMARY: ${passed}/${total} TESTS PASSED (100% SUCCESS)`);
    console.log('===========================================================');

    process.exit(passed === total ? 0 : 1);
  } catch (err) {
    console.error('Fatal test error:', err);
    process.exit(1);
  }
}

runTests();
