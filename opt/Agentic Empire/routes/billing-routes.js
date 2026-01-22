/**
 * Billing, Payments & Analytics API Routes
 * 
 * Handles subscriptions, Stripe integration, and usage analytics.
 * Extracted from server.js to maintain 1000 LOC limit.
 */

const express = require('express');
const router = express.Router();
const authenticate = require('./auth-middleware');
const CompanyDB = require('../services/company-db');
const paymentService = require('../backend/payment-service');
const logger = require('../services/logger');

// Applies authentication to all routes in this file
router.use(authenticate);

// ============ BILLING API ============
router.get('/billing', (req, res) => {
  res.json({
    plan: 'Professional',
    billing_cycle: 'monthly',
    next_billing_date: '2026-02-20',
    current_usage: {
      api_calls: 45000,
      api_limit: 100000,
      storage_gb: 45.2,
      storage_limit: 150,
      users: 5,
      user_limit: 10
    },
    invoice_history: [
      { date: '2026-01-20', amount: 99.99, status: 'paid' },
      { date: '2025-12-20', amount: 99.99, status: 'paid' }
    ]
  });
});

// ============ ANALYTICS API ============
router.get('/analytics/dashboard', (req, res) => {
  res.json({
    total_conversations: 247,
    total_messages: 3142,
    total_users: 5,
    api_calls_this_month: 45000,
    active_workflows: 8,
    completed_workflows: 156,
    avg_response_time_ms: 245,
    cost_this_month: 125.47
  });
});

// ============ PAYMENT CONFIGURATION ============
router.get('/payment/config', (req, res) => {
  res.json({ publicKey: process.env.STRIPE_PUBLIC_KEY || 'pk_test_default' });
});

router.get('/payment/plans', (req, res) => {
  try {
    const plans = paymentService.getPlans();
    res.json({ plans });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get plans' });
  }
});

// ============ SUBSCRIPTIONS ============
router.get('/billing/current-plan', async (req, res) => {
  try {
    const { id: userId, companyId } = req.user;
    const row = await CompanyDB.get(companyId,
      `SELECT plan, status, next_billing_date FROM subscriptions 
       WHERE user_id = ? AND status = 'active' ORDER BY created_at DESC LIMIT 1`, [userId]);
    
    const currentPlan = row ? row.plan : 'free';
    const plans = paymentService.getPlans();
    const planDetails = plans[currentPlan] || { name: 'Free', price: 0 };
    res.json({
      currentPlan,
      ...planDetails,
      nextBillingDate: row ? row.next_billing_date : null
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get current plan' });
  }
});

router.post('/payment/subscribe', async (req, res) => {
  try {
    const { planKey, paymentMethodId } = req.body;
    const { id: userId, email, companyId } = req.user;
    
    const userEmail = email || `user${userId}@AgenticEmpire.local`;
    const customer = await paymentService.getOrCreateCustomer(userId, userEmail);
    const subscription = await paymentService.createSubscription(customer.id, planKey);
    
    const nextBillingDate = new Date();
    nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
    
    await CompanyDB.run(companyId,
      `INSERT INTO subscriptions (user_id, subscription_id, plan, status, next_billing_date, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, subscription.id, planKey, subscription.status, nextBillingDate.toISOString(), new Date().toISOString()]
    );
    
    res.json({ success: true, subscriptionId: subscription.id, plan: planKey, status: subscription.status });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to create subscription' });
  }
});

module.exports = router;
