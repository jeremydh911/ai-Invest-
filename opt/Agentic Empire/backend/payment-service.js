/**
 * Payment Processing Service
 * Handles Stripe integration with multiple payment methods
 * Supports: Credit/Debit Cards, PayPal, ACH, and more
 * Low-cost processing with optimized fee structure
 */

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const logger = require('winston');

class PaymentService {
  /**
   * Initialize payment configuration
   * Stripe provides the lowest processing fees:
   * - Cards: 2.9% + 30¢
   * - ACH: 0.8% (capped at $5)
   * - PayPal: 2.99% + 30¢
   */
  constructor() {
    this.stripePublicKey = process.env.STRIPE_PUBLIC_KEY;
    this.stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    
    // Plan pricing configuration
    this.plans = {
      starter: {
        name: 'Starter',
        amount: 2900, // $29 in cents
        currency: 'usd',
        interval: 'month',
        description: '5 Users, 100 Chats/month, Basic Support',
        features: ['5 Users', '100 Chats/month', 'Basic Support', 'Community Forums']
      },
      professional: {
        name: 'Professional',
        amount: 9900, // $99 in cents
        currency: 'usd',
        interval: 'month',
        description: '50 Users, Unlimited Chats, Agents, 24/7 Support',
        features: ['50 Users', 'Unlimited Chats', 'Agents & Workflows', '24/7 Support', 'Advanced Analytics']
      },
      enterprise: {
        name: 'Enterprise',
        amount: null, // Custom pricing
        currency: 'usd',
        interval: 'month',
        description: 'Custom pricing for enterprise needs',
        features: ['Unlimited Users', 'Unlimited Chats', 'Custom Workflows', 'Dedicated Support', 'SLA Guarantee', 'On-Premise Option']
      }
    };

    // Payment method configuration (low-cost options)
    this.paymentMethods = {
      card: {
        name: 'Credit/Debit Card',
        processingFee: 0.029, // 2.9% + 30¢ per transaction
        fixedFee: 30, // cents
        supported: true,
        description: 'Visa, Mastercard, American Express, Discover'
      },
      ach_debit: {
        name: 'Bank Transfer (ACH)',
        processingFee: 0.008, // 0.8% capped at $5
        maxFee: 500, // $5 in cents
        supported: true,
        description: 'Low-cost ACH direct debit from US bank account'
      },
      paypal: {
        name: 'PayPal',
        processingFee: 0.0299, // 2.99% + 30¢
        fixedFee: 30, // cents
        supported: true,
        description: 'PayPal balance or linked accounts'
      },
      venmo: {
        name: 'Venmo',
        processingFee: 0.0299, // 2.99% + 30¢
        fixedFee: 30, // cents
        supported: true,
        description: 'Venmo balance or linked bank account'
      },
      cashapp: {
        name: 'Cash App',
        processingFee: 0.0299, // 2.99% + 30¢
        fixedFee: 30, // cents
        supported: true,
        description: 'Cash App balance'
      },
      wire_transfer: {
        name: 'Wire Transfer',
        processingFee: 0, // No per-transaction fee, only flat $10
        flatFee: 1000, // $10 in cents
        supported: true,
        description: 'International and domestic wire transfers'
      },
      check: {
        name: 'Check',
        processingFee: 0,
        flatFee: 0,
        supported: true,
        description: 'Send check by mail'
      }
    };
  }

  /**
   * Create or get Stripe customer
   */
  async createCustomer(userId, email, name, metadata = {}) {
    try {
      const customer = await stripe.customers.create({
        email,
        name,
        metadata: {
          userId,
          ...metadata
        },
        description: `Customer for AgenticEmpire: ${name}`
      });
      return customer;
    } catch (error) {
      logger.error('Failed to create Stripe customer:', error);
      throw error;
    }
  }

  /**
   * Get or create customer
   */
  async getOrCreateCustomer(userId, email, name) {
    try {
      // Search for existing customer
      const customers = await stripe.customers.list({
        email,
        limit: 1
      });

      if (customers.data.length > 0) {
        return customers.data[0];
      }

      // Create new customer
      return await this.createCustomer(userId, email, name);
    } catch (error) {
      logger.error('Error getting or creating customer:', error);
      throw error;
    }
  }

  /**
   * Create payment intent for one-time payment
   */
  async createPaymentIntent(userId, amount, currency = 'usd', paymentMethod = 'card', metadata = {}) {
    try {
      const intent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency,
        payment_method_types: [paymentMethod],
        metadata: {
          userId,
          ...metadata
        },
        statement_descriptor: 'AgenticEmpire AI',
        receipt_email: metadata.email
      });
      return intent;
    } catch (error) {
      logger.error('Failed to create payment intent:', error);
      throw error;
    }
  }

  /**
   * Create subscription with auto-renewal
   */
  async createSubscription(customerId, planKey, metadata = {}) {
    try {
      const plan = this.plans[planKey];
      if (!plan) {
        throw new Error(`Invalid plan: ${planKey}`);
      }

      // Get or create Stripe product and price
      const product = await this.getOrCreateProduct(planKey);
      const price = await this.getOrCreatePrice(product.id, planKey);

      // Create subscription
      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{
          price: price.id
        }],
        payment_behavior: 'default_incomplete',
        expand: ['latest_invoice.payment_intent'],
        metadata: {
          planKey,
          ...metadata
        },
        automatic_tax: {
          enabled: true
        }
      });

      return subscription;
    } catch (error) {
      logger.error('Failed to create subscription:', error);
      throw error;
    }
  }

  /**
   * Get or create Stripe product
   */
  async getOrCreateProduct(planKey) {
    try {
      const plan = this.plans[planKey];

      // Search for existing product
      const products = await stripe.products.search({
        query: `metadata['planKey']:'${planKey}'`,
        limit: 1
      });

      if (products.data.length > 0) {
        return products.data[0];
      }

      // Create new product
      const product = await stripe.products.create({
        name: plan.name,
        description: plan.description,
        metadata: {
          planKey
        },
        type: 'service'
      });

      return product;
    } catch (error) {
      logger.error('Error getting or creating product:', error);
      throw error;
    }
  }

  /**
   * Get or create price for product
   */
  async getOrCreatePrice(productId, planKey) {
    try {
      const plan = this.plans[planKey];

      // Search for existing price
      const prices = await stripe.prices.search({
        query: `product:'${productId}' AND metadata['planKey']:'${planKey}'`,
        limit: 1
      });

      if (prices.data.length > 0) {
        return prices.data[0];
      }

      // Create new price
      const price = await stripe.prices.create({
        product: productId,
        unit_amount: plan.amount,
        currency: plan.currency,
        recurring: {
          interval: plan.interval,
          usage_type: 'licensed'
        },
        metadata: {
          planKey
        }
      });

      return price;
    } catch (error) {
      logger.error('Error getting or creating price:', error);
      throw error;
    }
  }

  /**
   * Confirm payment intent (charge the customer)
   */
  async confirmPaymentIntent(paymentIntentId, paymentMethodId) {
    try {
      const intent = await stripe.paymentIntents.confirm(paymentIntentId, {
        payment_method: paymentMethodId
      });
      return intent;
    } catch (error) {
      logger.error('Failed to confirm payment intent:', error);
      throw error;
    }
  }

  /**
   * Save payment method to customer (for recurring billing)
   */
  async savePaymentMethod(customerId, paymentMethodId) {
    try {
      const paymentMethod = await stripe.paymentMethods.attach(paymentMethodId, {
        customer: customerId
      });
      
      // Set as default
      await stripe.customers.update(customerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId
        }
      });

      return paymentMethod;
    } catch (error) {
      logger.error('Failed to save payment method:', error);
      throw error;
    }
  }

  /**
   * Get customer's payment methods
   */
  async getPaymentMethods(customerId) {
    try {
      const methods = await stripe.paymentMethods.list({
        customer: customerId,
        type: 'card'
      });
      return methods.data;
    } catch (error) {
      logger.error('Failed to get payment methods:', error);
      throw error;
    }
  }

  /**
   * Update subscription
   */
  async updateSubscription(subscriptionId, updates) {
    try {
      const subscription = await stripe.subscriptions.update(subscriptionId, updates);
      return subscription;
    } catch (error) {
      logger.error('Failed to update subscription:', error);
      throw error;
    }
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(subscriptionId) {
    try {
      const subscription = await stripe.subscriptions.del(subscriptionId);
      return subscription;
    } catch (error) {
      logger.error('Failed to cancel subscription:', error);
      throw error;
    }
  }

  /**
   * Get subscription details
   */
  async getSubscription(subscriptionId) {
    try {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
        expand: ['latest_invoice']
      });
      return subscription;
    } catch (error) {
      logger.error('Failed to get subscription:', error);
      throw error;
    }
  }

  /**
   * Get invoice details
   */
  async getInvoice(invoiceId) {
    try {
      const invoice = await stripe.invoices.retrieve(invoiceId);
      return invoice;
    } catch (error) {
      logger.error('Failed to get invoice:', error);
      throw error;
    }
  }

  /**
   * Get customer invoices
   */
  async getCustomerInvoices(customerId, limit = 10) {
    try {
      const invoices = await stripe.invoices.list({
        customer: customerId,
        limit
      });
      return invoices.data;
    } catch (error) {
      logger.error('Failed to get customer invoices:', error);
      throw error;
    }
  }

  /**
   * Handle webhook event
   */
  async handleWebhookEvent(event) {
    try {
      const { type, data } = event;

      switch (type) {
        case 'payment_intent.succeeded':
          logger.info('Payment succeeded:', data.object.id);
          break;
        case 'payment_intent.payment_failed':
          logger.error('Payment failed:', data.object.id);
          break;
        case 'customer.subscription.created':
          logger.info('Subscription created:', data.object.id);
          break;
        case 'customer.subscription.updated':
          logger.info('Subscription updated:', data.object.id);
          break;
        case 'customer.subscription.deleted':
          logger.info('Subscription canceled:', data.object.id);
          break;
        case 'invoice.payment_succeeded':
          logger.info('Invoice paid:', data.object.id);
          break;
        case 'invoice.payment_failed':
          logger.error('Invoice payment failed:', data.object.id);
          break;
        default:
          logger.info(`Unhandled webhook event type: ${type}`);
      }

      return true;
    } catch (error) {
      logger.error('Error handling webhook:', error);
      return false;
    }
  }

  /**
   * Calculate processing fee
   */
  calculateFee(amount, paymentMethod) {
    const method = this.paymentMethods[paymentMethod];
    if (!method) return null;

    let fee = 0;

    if (method.processingFee > 0) {
      fee = Math.round(amount * method.processingFee);
    }

    if (method.fixedFee) {
      fee += method.fixedFee;
    } else if (method.maxFee && fee > method.maxFee) {
      fee = method.maxFee;
    } else if (method.flatFee) {
      fee = method.flatFee;
    }

    return {
      processingFee: fee,
      total: amount + fee,
      percentage: ((fee / amount) * 100).toFixed(2) + '%'
    };
  }

  /**
   * Get available payment methods
   */
  getAvailablePaymentMethods() {
    return Object.entries(this.paymentMethods)
      .filter(([, config]) => config.supported)
      .map(([key, config]) => ({
        id: key,
        ...config
      }));
  }

  /**
   * Get plans
   */
  getPlans() {
    return this.plans;
  }

  /**
   * Create setup intent for future payment (no immediate charge)
   */
  async createSetupIntent(customerId) {
    try {
      const intent = await stripe.setupIntents.create({
        customer: customerId,
        payment_method_types: ['card']
      });
      return intent;
    } catch (error) {
      logger.error('Failed to create setup intent:', error);
      throw error;
    }
  }

  /**
   * List all customers with pagination
   */
  async listCustomers(limit = 10, startingAfter = null) {
    try {
      const params = { limit };
      if (startingAfter) params.starting_after = startingAfter;
      
      const customers = await stripe.customers.list(params);
      return customers;
    } catch (error) {
      logger.error('Failed to list customers:', error);
      throw error;
    }
  }

  /**
   * Refund a charge
   */
  async refundCharge(paymentIntentId, amount = null) {
    try {
      const params = { payment_intent: paymentIntentId };
      if (amount) params.amount = Math.round(amount * 100); // Convert to cents

      const refund = await stripe.refunds.create(params);
      return refund;
    } catch (error) {
      logger.error('Failed to refund charge:', error);
      throw error;
    }
  }
}

module.exports = new PaymentService();
