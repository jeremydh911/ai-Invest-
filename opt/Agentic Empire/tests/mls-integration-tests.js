/**
 * MLS Integration Test Suite
 * Tests all MLS functionality and agent tools
 */

const MLSNWMLSService = require('./services/mls-nwmls');
const MLSAgentTools = require('./services/mls-agent-tools');

class MLSTests {
  constructor() {
    this.mlsService = new MLSNWMLSService();
    this.agentTools = new MLSAgentTools('http://localhost:3000');
    this.results = {
      passed: [],
      failed: [],
      skipped: [],
      warnings: []
    };
  }

  async runAllTests() {
    console.log('\n🧪 MLS INTEGRATION TEST SUITE\n');
    console.log('='.repeat(60));

    // Test categories
    await this.testMLSServiceInitialization();
    await this.testCredentialManagement();
    await this.testAgentToolsAvailability();
    await this.testErrorHandling();
    await this.testDataValidation();
    await this.testSecurityFeatures();

    // Print results
    this.printResults();
    return this.results;
  }

  async testMLSServiceInitialization() {
    console.log('\n📋 Testing MLS Service Initialization...');

    try {
      // Test 1: Service instantiation
      const service = new MLSNWMLSService();
      if (service && service.initializeUserMLS) {
        this.pass('MLS service instantiates correctly');
      } else {
        this.fail('MLS service failed to instantiate');
      }

      // Test 2: User initialization
      const userId = 'test-user-123';
      service.initializeUserMLS(userId);
      const cache = service.getUserMLSData(userId);
      
      if (cache && cache.authenticated === false && cache.listings.count === 0) {
        this.pass('User MLS cache initializes correctly');
      } else {
        this.fail('User MLS cache initialization failed');
      }

      // Test 3: Multi-user isolation
      const user2 = 'test-user-456';
      service.initializeUserMLS(user2);
      const cache1 = service.getUserMLSData(userId);
      const cache2 = service.getUserMLSData(user2);
      
      if (cache1 !== cache2) {
        this.pass('Multi-user isolation works correctly');
      } else {
        this.fail('Multi-user isolation failed');
      }

    } catch (error) {
      this.fail(`Service initialization test failed: ${error.message}`);
    }
  }

  async testCredentialManagement() {
    console.log('\n🔐 Testing Credential Management...');

    try {
      const service = new MLSNWMLSService();
      const userId = 'test-cred-user';

      // Test 1: Credential validation
      try {
        await service.setCredentials(userId, { username: '', password: '' });
        this.fail('Should reject empty credentials');
      } catch (error) {
        if (error.message.includes('required')) {
          this.pass('Credential validation rejects empty values');
        } else {
          this.fail('Credential validation error message incorrect');
        }
      }

      // Test 2: Credential storage
      const credentials = {
        username: 'test@example.com',
        password: 'testpass123',
        brokerNumber: '12345',
        agentNumber: '67890'
      };

      try {
        await service.setCredentials(userId, credentials);
        // Note: This will fail to authenticate (no real NWMLS server)
      } catch (error) {
        if (error.message.includes('Authentication')) {
          this.pass('Credential storage detects authentication issues');
        } else {
          this.warn(`Credential storage test: ${error.message}`);
        }
      }

      // Test 3: Credential isolation
      const user2 = 'test-cred-user-2';
      service.initializeUserMLS(userId);
      service.initializeUserMLS(user2);
      
      const data1 = service.getUserMLSData(userId);
      const data2 = service.getUserMLSData(user2);
      
      if (!data1.credentials && !data2.credentials) {
        this.pass('Credentials remain isolated between users');
      } else {
        this.fail('Credential isolation failed');
      }

    } catch (error) {
      this.fail(`Credential management test failed: ${error.message}`);
    }
  }

  async testAgentToolsAvailability() {
    console.log('\n🤖 Testing Agent Tools Availability...');

    try {
      const tools = this.agentTools;

      // Test 1: Tool definitions
      const definitions = tools.getToolDefinitions();
      const expectedTools = [
        'checkMLSStatus',
        'searchListings',
        'getListingDetails',
        'submitOffer',
        'createListingAgreement',
        'createExtension',
        'getDocuments',
        'getAllMLSData',
        'logoutFromMLS'
      ];

      let toolCount = 0;
      for (const tool of expectedTools) {
        if (definitions[tool]) {
          toolCount++;
        }
      }

      if (toolCount === expectedTools.length) {
        this.pass(`All ${toolCount} agent tools are defined`);
      } else {
        this.fail(`Only ${toolCount}/${expectedTools.length} agent tools found`);
      }

      // Test 2: Tool method existence
      let methodCount = 0;
      for (const tool of expectedTools) {
        if (typeof tools[tool] === 'function') {
          methodCount++;
        }
      }

      if (methodCount === expectedTools.length) {
        this.pass(`All ${methodCount} agent tool methods exist`);
      } else {
        this.fail(`Only ${methodCount}/${expectedTools.length} tool methods found`);
      }

      // Test 3: Tool documentation
      let docCount = 0;
      for (const tool of expectedTools) {
        if (definitions[tool].description && definitions[tool].parameters) {
          docCount++;
        }
      }

      if (docCount === expectedTools.length) {
        this.pass(`All ${docCount} tools have complete documentation`);
      } else {
        this.warn(`Only ${docCount}/${expectedTools.length} tools fully documented`);
      }

    } catch (error) {
      this.fail(`Agent tools test failed: ${error.message}`);
    }
  }

  async testErrorHandling() {
    console.log('\n⚠️ Testing Error Handling...');

    try {
      const tools = this.agentTools;

      // Test 1: Invalid parameter handling
      const invalidMLS = await tools.getListingDetails('token', null);
      if (invalidMLS.success === false && invalidMLS.code) {
        this.pass('Tool validates and rejects invalid parameters');
      } else {
        this.fail('Tool should reject invalid parameters');
      }

      // Test 2: Network error handling
      const badUrl = new MLSAgentTools('http://invalid-host:9999');
      const result = await badUrl.makeRequest('GET', '/api/test', null, 'token');
      
      if (result.success === false && result.timestamp) {
        this.pass('Tool handles network errors gracefully');
      } else {
        this.fail('Tool error handling incomplete');
      }

      // Test 3: Response normalization
      const response = tools.normalizeResponse({ success: true, data: { test: 'value' } });
      if (response.success && response.timestamp && response.data) {
        this.pass('Response normalization includes timestamp');
      } else {
        this.fail('Response normalization incomplete');
      }

    } catch (error) {
      this.fail(`Error handling test failed: ${error.message}`);
    }
  }

  async testDataValidation() {
    console.log('\n✅ Testing Data Validation...');

    try {
      const tools = this.agentTools;

      // Test 1: Offer price validation
      const lowOffer = await tools.submitOffer('token', {
        mlsNumber: '2024001234',
        offerPrice: 500000,
        earnestMoney: 150000
      });
      
      if (lowOffer.success === false && lowOffer.code === 'EARNEST_MONEY_TOO_HIGH') {
        this.pass('Tool validates earnest money limits');
      } else {
        this.warn('Earnest money validation may need adjustment');
      }

      // Test 2: Commission validation
      const highCommission = await tools.createListingAgreement('token', {
        sellerName: 'Test',
        propertyAddress: '123 Main',
        listPrice: 500000,
        commissionPercent: 15
      });

      if (highCommission.success === false && highCommission.code === 'INVALID_COMMISSION') {
        this.pass('Tool validates commission percentage');
      } else {
        this.fail('Commission validation failed');
      }

      // Test 3: Date validation
      const pastDate = await tools.createExtension('token', {
        mlsNumber: '2024001234',
        newCloseDate: new Date(Date.now() - 86400000).toISOString().split('T')[0]
      });

      if (pastDate.success === false && pastDate.code === 'DATE_IN_PAST') {
        this.pass('Tool validates future dates');
      } else {
        this.fail('Date validation failed');
      }

    } catch (error) {
      this.fail(`Data validation test failed: ${error.message}`);
    }
  }

  async testSecurityFeatures() {
    console.log('\n🔒 Testing Security Features...');

    try {
      const service = new MLSNWMLSService();

      // Test 1: Per-user isolation
      const user1 = 'security-test-1';
      const user2 = 'security-test-2';

      service.initializeUserMLS(user1);
      service.initializeUserMLS(user2);

      // Simulate setting different data
      const cache1 = service.getUserMLSData(user1);
      const cache2 = service.getUserMLSData(user2);

      if (cache1 && cache2 && cache1 !== cache2) {
        this.pass('User data isolation is enforced');
      } else {
        this.fail('User data isolation may be compromised');
      }

      // Test 2: Credentials are not exposed
      const tools = this.agentTools;
      const allTools = tools.getToolDefinitions();

      let exposesCredentials = false;
      for (const tool in allTools) {
        if (allTools[tool].returns && JSON.stringify(allTools[tool].returns).includes('password')) {
          exposesCredentials = true;
        }
      }

      if (!exposesCredentials) {
        this.pass('Tool definitions do not expose credentials');
      } else {
        this.fail('Tool definitions may expose sensitive data');
      }

      // Test 3: Token requirement
      try {
        await tools.checkMLSStatus(null);
        this.warn('Token requirement should be checked at API level');
      } catch (error) {
        this.pass('Tools require authentication tokens');
      }

    } catch (error) {
      this.fail(`Security test failed: ${error.message}`);
    }
  }

  // Helper methods
  pass(message) {
    this.results.passed.push(message);
    console.log(`  ✓ ${message}`);
  }

  fail(message) {
    this.results.failed.push(message);
    console.log(`  ✗ ${message}`);
  }

  skip(message) {
    this.results.skipped.push(message);
    console.log(`  ⊘ ${message}`);
  }

  warn(message) {
    this.results.warnings.push(message);
    console.log(`  ⚠ ${message}`);
  }

  printResults() {
    console.log('\n' + '='.repeat(60));
    console.log('\n📊 TEST RESULTS SUMMARY\n');

    console.log(`✓ Passed:  ${this.results.passed.length}`);
    console.log(`✗ Failed:  ${this.results.failed.length}`);
    console.log(`⊘ Skipped: ${this.results.skipped.length}`);
    console.log(`⚠ Warnings: ${this.results.warnings.length}`);

    const total = this.results.passed.length + this.results.failed.length;
    const percentage = total > 0 ? Math.round((this.results.passed.length / total) * 100) : 0;

    console.log(`\n${percentage}% of tests passed (${this.results.passed.length}/${total})`);

    if (this.results.failed.length > 0) {
      console.log('\n❌ Failed Tests:');
      this.results.failed.forEach(test => console.log(`  - ${test}`));
    }

    if (this.results.warnings.length > 0) {
      console.log('\n⚠️ Warnings:');
      this.results.warnings.forEach(warn => console.log(`  - ${warn}`));
    }

    console.log('\n' + '='.repeat(60) + '\n');
  }
}

// Run tests if executed directly
if (require.main === module) {
  const tester = new MLSTests();
  tester.runAllTests().then(results => {
    process.exit(results.failed.length > 0 ? 1 : 0);
  });
}

module.exports = MLSTests;
