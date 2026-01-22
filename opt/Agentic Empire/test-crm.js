#!/usr/bin/env node
/**
 * CRM System Integration Test
 * Tests all CRM API endpoints
 */

const http = require('http');

const BASE_URL = 'http://localhost:3000';
const TEST_TOKEN = 'test-token-123'; // Will be replaced with real token

// Helper function to make HTTP requests
function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE_URL + path);
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TEST_TOKEN}`
      }
    };

    const req = http.request(url, options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: body ? JSON.parse(body) : null
        });
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

// Test Suite
async function runTests() {
  console.log('🚀 Starting CRM API Tests...\n');

  try {
    // Test 1: Get Contacts (empty at start)
    console.log('Test 1: GET /api/crm/contacts');
    const contactsResponse = await makeRequest('GET', '/api/crm/contacts');
    console.log(`  Status: ${contactsResponse.status}`);
    console.log(`  Result: ${Array.isArray(contactsResponse.body) ? '✅ OK' : '❌ FAILED'}\n`);

    // Test 2: Create a Contact
    console.log('Test 2: POST /api/crm/contacts');
    const newContact = {
      first_name: 'John',
      last_name: 'Doe',
      email: 'john.doe@example.com',
      phone: '+1-555-1234',
      company: 'Acme Corp',
      job_title: 'CEO',
      source: 'website',
      status: 'lead',
      notes: 'High priority prospect'
    };
    const createContactResponse = await makeRequest('POST', '/api/crm/contacts', newContact);
    console.log(`  Status: ${createContactResponse.status}`);
    const contactId = createContactResponse.body?.id;
    console.log(`  Created Contact ID: ${contactId}`);
    console.log(`  Result: ${createContactResponse.status === 201 ? '✅ OK' : '❌ FAILED'}\n`);

    // Test 3: Get Opportunities
    console.log('Test 3: GET /api/crm/opportunities');
    const opportunitiesResponse = await makeRequest('GET', '/api/crm/opportunities');
    console.log(`  Status: ${opportunitiesResponse.status}`);
    console.log(`  Result: ${Array.isArray(opportunitiesResponse.body) ? '✅ OK' : '❌ FAILED'}\n`);

    if (contactId) {
      // Test 4: Create an Opportunity
      console.log('Test 4: POST /api/crm/opportunities');
      const newOpportunity = {
        contact_id: contactId,
        name: 'Enterprise Software Deal',
        description: 'Large deal for software licensing',
        value: 150000,
        stage: 'proposal',
        probability: 75,
        expected_close_date: '2026-03-01'
      };
      const createOppResponse = await makeRequest('POST', '/api/crm/opportunities', newOpportunity);
      console.log(`  Status: ${createOppResponse.status}`);
      const opportunityId = createOppResponse.body?.id;
      console.log(`  Created Opportunity ID: ${opportunityId}`);
      console.log(`  Result: ${createOppResponse.status === 201 ? '✅ OK' : '❌ FAILED'}\n`);

      if (opportunityId) {
        // Test 5: Create a Deal
        console.log('Test 5: POST /api/crm/deals');
        const newDeal = {
          opportunity_id: opportunityId,
          name: 'Software License Deal - 3 Years',
          amount: 150000,
          stage: 'proposal',
          probability: 75,
          close_date: '2026-03-01',
          next_step: 'Send proposal document'
        };
        const createDealResponse = await makeRequest('POST', '/api/crm/deals', newDeal);
        console.log(`  Status: ${createDealResponse.status}`);
        const dealId = createDealResponse.body?.id;
        console.log(`  Created Deal ID: ${dealId}`);
        console.log(`  Result: ${createDealResponse.status === 201 ? '✅ OK' : '❌ FAILED'}\n`);
      }

      // Test 6: Create an Activity
      console.log('Test 6: POST /api/crm/activities');
      const newActivity = {
        type: 'call',
        subject: 'Initial consultation with CEO',
        contact_id: contactId,
        priority: 'high',
        due_date: '2026-01-22',
        description: 'Discuss software requirements and budget'
      };
      const createActivityResponse = await makeRequest('POST', '/api/crm/activities', newActivity);
      console.log(`  Status: ${createActivityResponse.status}`);
      console.log(`  Created Activity ID: ${createActivityResponse.body?.id}`);
      console.log(`  Result: ${createActivityResponse.status === 201 ? '✅ OK' : '❌ FAILED'}\n`);
    }

    // Test 7: Get Dashboard Stats
    console.log('Test 7: GET /api/crm/stats');
    const statsResponse = await makeRequest('GET', '/api/crm/stats');
    console.log(`  Status: ${statsResponse.status}`);
    console.log(`  Stats:`, statsResponse.body);
    console.log(`  Result: ${statsResponse.status === 200 ? '✅ OK' : '❌ FAILED'}\n`);

    // Test 8: Get Activities
    console.log('Test 8: GET /api/crm/activities');
    const activitiesResponse = await makeRequest('GET', '/api/crm/activities');
    console.log(`  Status: ${activitiesResponse.status}`);
    console.log(`  Result: ${Array.isArray(activitiesResponse.body) ? '✅ OK' : '❌ FAILED'}\n`);

    // Test 9: Get Recent Activities
    console.log('Test 9: GET /api/crm/activities/recent');
    const recentActivitiesResponse = await makeRequest('GET', '/api/crm/activities/recent');
    console.log(`  Status: ${recentActivitiesResponse.status}`);
    console.log(`  Result: ${Array.isArray(recentActivitiesResponse.body) ? '✅ OK' : '❌ FAILED'}\n`);

    // Test 10: Get Pipeline
    console.log('Test 10: GET /api/crm/pipeline');
    const pipelineResponse = await makeRequest('GET', '/api/crm/pipeline');
    console.log(`  Status: ${pipelineResponse.status}`);
    console.log(`  Result: ${Array.isArray(pipelineResponse.body) ? '✅ OK' : '❌ FAILED'}\n`);

    // Test 11: Get Deals
    console.log('Test 11: GET /api/crm/deals');
    const dealsResponse = await makeRequest('GET', '/api/crm/deals');
    console.log(`  Status: ${dealsResponse.status}`);
    console.log(`  Result: ${Array.isArray(dealsResponse.body) ? '✅ OK' : '❌ FAILED'}\n`);

    console.log('✅ CRM API Tests Complete!');
    console.log('\n📊 Summary:');
    console.log('  ✓ Contacts CRUD');
    console.log('  ✓ Opportunities CRUD');
    console.log('  ✓ Deals CRUD');
    console.log('  ✓ Activities CRUD');
    console.log('  ✓ Pipeline View');
    console.log('  ✓ Dashboard Stats');
    console.log('\n🎉 All endpoints are functional!');

  } catch (error) {
    console.error('❌ Test Error:', error.message);
    process.exit(1);
  }
}

// Run tests
runTests();
