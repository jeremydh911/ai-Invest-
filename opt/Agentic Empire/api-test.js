#!/usr/bin/env node

/**
 * API Connection Test
 * Tests all file management API endpoints
 */

const http = require('http');

const BASE_URL = 'http://localhost:3000';

let passed = 0;
let failed = 0;
let testNum = 0;

function request(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port || 3000,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : null;
          resolve({ status: res.statusCode, data: parsed, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, data: data, headers: res.headers });
        }
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function test(name, fn) {
  testNum++;
  try {
    await fn();
    console.log(`✅ Test ${testNum}: ${name}`);
    passed++;
  } catch (e) {
    console.log(`❌ Test ${testNum}: ${name}`);
    console.log(`   ${e.message}`);
    failed++;
  }
}

async function runTests() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║         FILE MANAGEMENT API CONNECTION TEST               ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  // Test 1: Server is running
  await test('Server is responding', async () => {
    const res = await request('GET', '/api/files/master-status');
    if (res.status === 404 || (res.status >= 500 && res.status < 600)) {
      throw new Error(`Server error: ${res.status}`);
    }
  });

  // Test 2: Master password endpoint
  await test('Master password status endpoint', async () => {
    const res = await request('GET', '/api/files/master-status');
    if (!res.data || typeof res.data.masterPasswordSet !== 'boolean') {
      throw new Error(`Invalid response: ${JSON.stringify(res.data)}`);
    }
  });

  // Test 3: Verify access endpoint exists
  await test('Verify access endpoint accepts POST', async () => {
    const res = await request('POST', '/api/files/verify-access', {
      companyId: 1,
      password: 'test',
      isMaster: false
    });
    // Should return 200 with authorized: false or 403 depending on auth
    if (res.status !== 200 && res.status !== 403 && res.status !== 401) {
      throw new Error(`Unexpected status: ${res.status}`);
    }
  });

  // Test 4: Files page loads
  await test('Files UI page loads', async () => {
    const res = await request('GET', '/files');
    if (res.status === 404) {
      throw new Error('Files page not found (404)');
    }
    if (res.status >= 500) {
      throw new Error(`Server error: ${res.status}`);
    }
  });

  // Test 5: File upload endpoint exists
  await test('File upload endpoint exists', async () => {
    const res = await request('POST', '/api/companies/1/files/upload', {
      password: 'test'
    });
    // Should give 400/403 for missing file, not 404
    if (res.status === 404) {
      throw new Error('Endpoint not found (404)');
    }
  });

  // Test 6: File list endpoint
  await test('File list endpoint exists', async () => {
    const res = await request('GET', '/api/companies/1/files?password=test');
    if (res.status === 404) {
      throw new Error('Endpoint not found (404)');
    }
    // 200, 401, or 403 are all acceptable
  });

  // Test 7: File stats endpoint
  await test('File stats endpoint exists', async () => {
    const res = await request('GET', '/api/companies/1/files/stats?password=test');
    if (res.status === 404) {
      throw new Error('Endpoint not found (404)');
    }
  });

  // Summary
  console.log('\n' + '═'.repeat(60));
  console.log(`Total: ${testNum} | Passed: ${passed} | Failed: ${failed}`);
  console.log('═'.repeat(60) + '\n');

  if (failed === 0) {
    console.log('✅ ALL API TESTS PASSED!\n');
    process.exit(0);
  } else {
    console.log(`❌ ${failed} TEST(S) FAILED!\n`);
    process.exit(1);
  }
}

// Run tests
runTests().catch(err => {
  console.error('Test runner error:', err);
  process.exit(1);
});
