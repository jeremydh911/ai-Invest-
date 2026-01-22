/**
 * Page & Navigation Routes
 * 
 * Handles serving static HTML files and basic navigation redirects.
 * Extracted from server.js to maintain 1000 LOC limit.
 */

const express = require('express');
const router = express.Router();
const path = require('path');
const authenticate = require('./auth-middleware');

router.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'dashboard.html'));
});

router.get('/login.html', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'login.html'));
});

router.get('/login', (req, res) => {
  res.redirect('/login.html');
});

// Protected UI Pages
const protectedPages = [
  'dashboard', 'personas', 'chat', 'voice-chat', 'settings', 
  'settings-advanced', 'finetuning-setup', 'canvas', 'search',
  'logs', 'workflows', 'reports', 'system-maintenance',
  'permissions', 'org-chart', 'quotas', 'templates', 'scheduler',
  'file-manager', 'files', 'data-management', 'billing', 'team',
  'analytics', 'crm-integrations', 'crm', 'mls-nwmls', 'banking-center'
];

protectedPages.forEach(page => {
  router.get(`/${page}.html`, (req, res) => {
    res.sendFile(path.join(__dirname, '..', `${page}.html`));
  });
  
  router.get(`/${page}`, (req, res) => {
    res.redirect(`/${page}.html`);
  });
});

module.exports = router;
