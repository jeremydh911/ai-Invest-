#!/usr/bin/env node

/**
 * Smoke Test Suite
 * Tests all connections, wiring, and functionality
 */

const fs = require('fs');
const path = require('path');

console.log('\n╔════════════════════════════════════════════════════════════╗');
console.log('║           FILE MANAGEMENT SYSTEM SMOKE TEST               ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

const tests = [];
let passed = 0;
let failed = 0;

function test(name, fn) {
  tests.push({ name, fn });
}

function assert(condition, message) {
  if (!condition) throw new Error(message || 'Assertion failed');
}

// ============ TEST 1: Dependencies ============
test('Dependencies installed', () => {
  const deps = ['express', 'bcryptjs', 'multer', 'chokidar', 'sqlite3'];
  for (const dep of deps) {
    try {
      require(dep);
    } catch (e) {
      throw new Error(`Missing dependency: ${dep}`);
    }
  }
});

// ============ TEST 2: File Structure ============
test('File structure exists', () => {
  const files = [
    'server.js',
    'services/file-management.js',
    'services/company-db.js',
    'routes/file-routes.js',
    'files.html'
  ];
  
  for (const file of files) {
    const fullPath = path.join(__dirname, file);
    assert(fs.existsSync(fullPath), `File not found: ${file}`);
  }
});

// ============ TEST 3: Module Imports ============
test('Core modules load', () => {
  try {
    const FileManagement = require('./services/file-management.js');
    assert(FileManagement, 'FileManagement service not loaded');
    
    const CompanyDB = require('./services/company-db.js');
    assert(CompanyDB, 'CompanyDB service not loaded');
  } catch (e) {
    throw new Error(`Module load error: ${e.message}`);
  }
});

// ============ TEST 4: FileManagement Service ============
test('FileManagement service methods exist', () => {
  const FileManagement = require('./services/file-management.js');
  
  const methods = [
    'createCompanyFolder',
    'uploadFile',
    'deleteFile',
    'getFile',
    'listCompanyFiles',
    'verifyFolderAccess',
    'addToRagMemory',
    'removeFromRagMemory',
    'getCompanyFolderStats',
    'getMasterPassword',
    'verifyMasterPassword'
  ];
  
  for (const method of methods) {
    assert(typeof FileManagement[method] === 'function', `Method missing: ${method}`);
  }
});

// ============ TEST 5: CompanyDB Service ============
test('CompanyDB service methods exist', () => {
  const CompanyDB = require('./services/company-db.js');
  
  const methods = ['run', 'get', 'all', 'getCompanyDb', 'initializeCompany'];
  
  for (const method of methods) {
    assert(typeof CompanyDB[method] === 'function', `Method missing: ${method}`);
  }
});

// ============ TEST 6: Master Password ============
test('Master password system works', () => {
  const FileManagement = require('./services/file-management.js');
  const masterPass = FileManagement.getMasterPassword();
  
  // Should be null if already initialized (master password exists)
  // or should be a 32-char string if newly generated
  if (masterPass) {
    assert(masterPass.length === 32, 'Master password should be 32 characters');
    assert(/^[a-f0-9]{32}$/.test(masterPass), 'Master password should be hex');
  }
});

// ============ TEST 7: Data Directory ============
test('Data directories can be created', () => {
  const dataDir = path.join(__dirname, 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  const companyFilesDir = path.join(dataDir, 'company-files');
  if (!fs.existsSync(companyFilesDir)) {
    fs.mkdirSync(companyFilesDir, { recursive: true });
  }
  
  assert(fs.existsSync(dataDir), 'Data directory not created');
  assert(fs.existsSync(companyFilesDir), 'Company files directory not created');
});

// ============ TEST 8: Routes Module ============
test('File routes module loads', () => {
  try {
    const express = require('express');
    const routes = require('./routes/file-routes.js');
    
    assert(typeof routes === 'object', 'Routes should be an Express router');
    assert(typeof routes.post === 'function', 'Router should have post method');
    assert(typeof routes.get === 'function', 'Router should have get method');
    assert(typeof routes.delete === 'function', 'Router should have delete method');
  } catch (e) {
    throw new Error(`Routes error: ${e.message}`);
  }
});

// ============ TEST 9: Server Configuration ============
test('Server.js can be parsed', () => {
  try {
    const serverCode = fs.readFileSync(path.join(__dirname, 'server.js'), 'utf8');
    
    assert(serverCode.includes('const FileManagement'), 'FileManagement not imported');
    assert(serverCode.includes('const fileRoutes'), 'File routes not imported');
    assert(serverCode.includes("app.use('/', fileRoutes)"), 'File routes not registered');
  } catch (e) {
    throw new Error(`Server config error: ${e.message}`);
  }
});

// ============ TEST 10: UI File ============
test('UI file is valid HTML', () => {
  const uiCode = fs.readFileSync(path.join(__dirname, 'files.html'), 'utf8');
  
  assert(uiCode.includes('<!DOCTYPE html>'), 'Missing DOCTYPE');
  assert(uiCode.includes('</html>'), 'Missing closing HTML tag');
  assert(uiCode.includes('drag-and-drop') || uiCode.includes('dragover'), 'Missing drag-drop code');
  assert(uiCode.includes('password'), 'Missing password field');
  assert(uiCode.includes('uploadArea'), 'Missing upload area');
});

// ============ EXECUTE TESTS ============
async function runTests() {
  for (const t of tests) {
    try {
      t.fn();
      console.log(`✅ ${t.name}`);
      passed++;
    } catch (e) {
      console.log(`❌ ${t.name}`);
      console.log(`   Error: ${e.message}`);
      failed++;
    }
  }
  
  // Summary
  console.log('\n' + '═'.repeat(60));
  console.log(`Total: ${tests.length} | Passed: ${passed} | Failed: ${failed}`);
  console.log('═'.repeat(60) + '\n');
  
  if (failed === 0) {
    console.log('✅ ALL SMOKE TESTS PASSED!\n');
    process.exit(0);
  } else {
    console.log(`❌ ${failed} TEST(S) FAILED!\n`);
    process.exit(1);
  }
}

runTests();
