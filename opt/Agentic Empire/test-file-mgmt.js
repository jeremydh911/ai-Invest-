#!/usr/bin/env node

// Direct test of FileManagement module
try {
  const FileManagement = require('./services/file-management');
  console.log('✅ FileManagement loaded');
  console.log('Methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(FileManagement)));
  
  const hasMaster = FileManagement.getMasterPassword();
  console.log('✅ Master password check:', hasMaster ? 'exists' : 'not in memory');
  
  // Test verify master password
  const verified = FileManagement.verifyMasterPassword('invalid');
  console.log('✅ Master password verification works:', verified);
  
} catch (e) {
  console.error('❌ Error:', e.message);
  console.error(e.stack);
}
