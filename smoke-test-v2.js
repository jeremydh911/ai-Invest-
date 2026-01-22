const path = require('path');
const fs = require('fs');

const rootDir = __dirname;
const serviceDir = path.join(rootDir, 'opt', 'Agentic Empire', 'services');
const routeDir = path.join(rootDir, 'opt', 'Agentic Empire', 'routes');

console.log('--- Agentic Empire Comprehensive Smoke Test ---');
console.log(`Root Directory: ${rootDir}`);
console.log(`Service Directory: ${serviceDir}`);
console.log(`Route Directory: ${routeDir}`);
console.log('---------------------------------------------\n');

const modulesToCheck = [
  // Core Services
  { name: 'logger', path: path.join(serviceDir, 'logger.js') },
  { name: 'company-db', path: path.join(serviceDir, 'company-db.js') },
  { name: 'ceo-hiring-engine', path: path.join(serviceDir, 'ceo-hiring-engine.js') },
  { name: 'file-management', path: path.join(serviceDir, 'file-management.js') },
  { name: 'voice-synthesis', path: path.join(serviceDir, 'voice-synthesis.js') },
  { name: 'gpu-optimization', path: path.join(serviceDir, 'gpu-optimization.js') },
  { name: 'company-setup', path: path.join(serviceDir, 'company-setup.js') },
  { name: 'industry-templates', path: path.join(serviceDir, 'industry-templates.js') },
  { name: 'call-center', path: path.join(serviceDir, 'call-center.js') },
  { name: 'call-quality-ml', path: path.join(serviceDir, 'call-quality-ml.js') },
  
  // Routes
  { name: 'auth-middleware', path: path.join(routeDir, 'auth-middleware.js') },
  { name: 'auth-routes', path: path.join(routeDir, 'auth-routes.js') },
  { name: 'agent-routes', path: path.join(routeDir, 'agent-routes.js') },
  { name: 'hiring-routes', path: path.join(routeDir, 'hiring-routes.js') },
  { name: 'crm-routes', path: path.join(routeDir, 'crm-routes.js') },
  { name: 'billing-routes', path: path.join(routeDir, 'billing-routes.js') },
  { name: 'system-routes', path: path.join(routeDir, 'system-routes.js') },
  { name: 'data-routes', path: path.join(routeDir, 'data-routes.js') },
  { name: 'persona-routes', path: path.join(routeDir, 'persona-routes.js') },
  { name: 'company-routes', path: path.join(routeDir, 'company-routes.js') },
  { name: 'mls-routes', path: path.join(routeDir, 'mls-routes.js') },
  { name: 'banking-routes', path: path.join(routeDir, 'banking-routes.js') },
  { name: 'voice-routes', path: path.join(routeDir, 'voice-routes.js') },
  { name: 'file-routes', path: path.join(routeDir, 'file-routes.js') },
  { name: 'page-routes', path: path.join(routeDir, 'page-routes.js') }
];

let passed = 0;
let failed = 0;

modulesToCheck.forEach(mod => {
  process.stdout.write(`Checking ${mod.name}... `);
  
  if (!fs.existsSync(mod.path)) {
    console.log('\x1b[31mFAILED (File not found)\x1b[0m');
    console.log(`  Path: ${mod.path}`);
    failed++;
    return;
  }

  try {
    const instance = require(mod.path);
    if (!instance) {
        throw new Error('Module exported nothing');
    }
    console.log('\x1b[32mPASSED\x1b[0m');
    passed++;
  } catch (err) {
    console.log('\x1b[31mFAILED (Load Error)\x1b[0m');
    console.log(`  Error: ${err.message}`);
    // console.log(err.stack); // Uncomment for deep debugging
    failed++;
  }
});

console.log('\n---------------------------------------------');
console.log(`Summary: ${passed + failed} checked, ${passed} passed, ${failed} failed`);
console.log('---------------------------------------------');

if (failed > 0) {
  process.exit(1);
} else {
  console.log('✅ All modules loaded successfully!');
  process.exit(0);
}
