/**
 * Comprehensive Smoke Test for Agentic Empire
 * Verifies that all modules, routes, and services can be loaded.
 */

const path = require('path');
const fs = require('fs');

console.log('--- STARTING COMPREHENSIVE SMOKE TEST ---');

// Mock environment
process.env.JWT_SECRET = 'smoke-test-secret';
process.env.PORT = 9999;
process.env.OPENAI_API_KEY = 'sk-smoke-test';

const modulesToTest = [
  './opt/Agentic Empire/services/logger',
  './opt/Agentic Empire/services/company-db',
  './opt/Agentic Empire/services/company-registry',
  './opt/Agentic Empire/services/company-setup',
  './opt/Agentic Empire/services/voice-synthesis',
  './opt/Agentic Empire/services/gpu-optimization',
  './opt/Agentic Empire/services/file-management',
  './opt/Agentic Empire/services/ceo-hiring-engine',
  './opt/Agentic Empire/services/workflow-engine',
  './opt/Agentic Empire/services/call-quality-ml',
  './opt/Agentic Empire/routes/auth-middleware',
  './opt/Agentic Empire/routes/auth-routes',
  './opt/Agentic Empire/routes/agent-routes',
  './opt/Agentic Empire/routes/voice-routes',
  './opt/Agentic Empire/routes/persona-routes',
  './opt/Agentic Empire/routes/company-routes',
  './opt/Agentic Empire/routes/crm-routes',
  './opt/Agentic Empire/routes/mls-routes',
  './opt/Agentic Empire/routes/billing-routes',
  './opt/Agentic Empire/routes/hiring-routes'
];

let failed = 0;

modulesToTest.forEach(modPath => {
  try {
    const fullPath = path.resolve(__dirname, modPath);
    require(fullPath);
    console.log(`✅ LOADED: ${modPath}`);
  } catch (err) {
    console.error(`❌ FAILED: ${modPath}`);
    console.error(`   Error: ${err.message}`);
    // Check if it's a missing dependency error
    if (err.code === 'MODULE_NOT_FOUND') {
      console.error(`   Likely missing npm package.`);
    }
    failed++;
  }
});

console.log('\n--- VERIFYING STATIC FILES ---');
const staticFiles = [
  'index.html',
  'login.html',
  'dashboard.html',
  'voice-chat.html',
  'crm.html',
  'billing.html',
  'mls-nwmls.html'
];

staticFiles.forEach(file => {
  const filePath = path.resolve(__dirname, 'opt/Agentic Empire', file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ FOUND: ${file}`);
  } else {
    console.error(`❌ MISSING: ${file}`);
    failed++;
  }
});

if (failed === 0) {
  console.log('\n🌟 SMOKE TEST PASSED: System is structurally sound.');
  process.exit(0);
} else {
  console.log(`\n🛑 SMOKE TEST FAILED: ${failed} issues found.`);
  process.exit(1);
}
