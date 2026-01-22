const { chromium } = require('playwright');
const fs = require('fs');

const BASE_URL = 'http://localhost:3000';
const TEST_USER = 'admin';
const TEST_PASSWORD = 'admin123';

let results = {
  passed: [],
  failed: [],
  startTime: new Date().toISOString()
};

async function log(message, type = 'INFO') {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${type}] ${message}`);
}

async function test(name, fn) {
  try {
    await log(`Testing: ${name}`, 'TEST');
    await fn();
    results.passed.push(name);
    await log(`✓ PASSED: ${name}`, 'PASS');
  } catch (error) {
    results.failed.push({ name, error: error.message });
    await log(`✗ FAILED: ${name} - ${error.message}`, 'FAIL');
  }
}

async function runTests() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    // ============ LOGIN TESTS ============
    await log('=== LOGIN TESTS ===', 'SECTION');
    
    await test('Navigate to login page', async () => {
      await page.goto(`${BASE_URL}/login.html`);
      await page.waitForLoadState('networkidle');
      const loginBtn = await page.$('button:has-text("Login")');
      if (!loginBtn) throw new Error('Login button not found');
    });

    await test('Enter credentials and login', async () => {
      await page.fill('input[type="text"]', TEST_USER);
      await page.fill('input[type="password"]', TEST_PASSWORD);
      await page.click('button:has-text("Login")');
      await page.waitForNavigation();
      const token = await page.evaluate(() => localStorage.getItem('token'));
      if (!token) throw new Error('Token not set after login');
    });

    // ============ DASHBOARD TESTS ============
    await log('=== DASHBOARD TESTS ===', 'SECTION');
    
    await test('Dashboard loads successfully', async () => {
      await page.goto(`${BASE_URL}/dashboard.html`);
      await page.waitForLoadState('networkidle');
      const title = await page.title();
      if (!title.includes('Dashboard') && !title.includes('Agentic')) {
        throw new Error(`Unexpected page title: ${title}`);
      }
    });

    // ============ SETTINGS PAGE TESTS ============
    await log('=== SETTINGS PAGE TESTS ===', 'SECTION');
    
    await test('Navigate to settings page', async () => {
      await page.goto(`${BASE_URL}/settings.html`);
      await page.waitForLoadState('networkidle');
      const heading = await page.$('text=⚙️ System Settings');
      if (!heading) throw new Error('Settings page heading not found');
    });

    await test('RAG Memory section visible and always-on', async () => {
      const ragCard = await page.$('text=🧠 RAG Memory (Always Active)');
      if (!ragCard) throw new Error('RAG Memory card not found');
      
      // Check that there's no toggle for RAG enabled
      const ragToggle = await page.$('#ragEnabledToggle');
      if (ragToggle) throw new Error('RAG toggle should not exist (should always be on)');
    });

    await test('RAG chunk size input works', async () => {
      const chunkInput = await page.$('#ragChunkSize');
      if (!chunkInput) throw new Error('Chunk size input not found');
      
      await chunkInput.fill('2048');
      const value = await chunkInput.inputValue();
      if (value !== '2048') throw new Error(`Chunk size not updated: got ${value}`);
    });

    await test('RAG chunk overlap input works', async () => {
      const overlapInput = await page.$('#ragOverlap');
      if (!overlapInput) throw new Error('Overlap input not found');
      
      await overlapInput.fill('200');
      const value = await overlapInput.inputValue();
      if (value !== '200') throw new Error(`Overlap not updated: got ${value}`);
    });

    await test('RAG max results input works', async () => {
      const maxInput = await page.$('#ragMaxResults');
      if (!maxInput) throw new Error('Max results input not found');
      
      await maxInput.fill('10');
      const value = await maxInput.inputValue();
      if (value !== '10') throw new Error(`Max results not updated: got ${value}`);
    });

    await test('RAG Fine-Tuning button visible and clickable', async () => {
      const finetuneBtn = await page.$('button:has-text("Start RAG Fine-Tuning")');
      if (!finetuneBtn) throw new Error('Fine-tuning button not found');
      
      await finetuneBtn.click();
      // Wait for success alert
      await page.waitForSelector('text=started', { timeout: 5000 });
    });

    await test('LLM Temperature slider works', async () => {
      const tempSlider = await page.$('#temperature');
      if (!tempSlider) throw new Error('Temperature slider not found');
      
      await tempSlider.fill('1.2');
      const value = await tempSlider.inputValue();
      if (value !== '1.2') throw new Error(`Temperature not updated: got ${value}`);
    });

    await test('LLM Top P slider works', async () => {
      const topPSlider = await page.$('#topP');
      if (!topPSlider) throw new Error('Top P slider not found');
      
      await topPSlider.fill('0.8');
      const value = await topPSlider.inputValue();
      if (value !== '0.8') throw new Error(`Top P not updated: got ${value}`);
    });

    await test('LLM Max Tokens input works', async () => {
      const maxTokensInput = await page.$('#maxTokens');
      if (!maxTokensInput) throw new Error('Max tokens input not found');
      
      await maxTokensInput.fill('3000');
      const value = await maxTokensInput.inputValue();
      if (value !== '3000') throw new Error(`Max tokens not updated: got ${value}`);
    });

    await test('Voice toggle is ON by default', async () => {
      const voiceToggle = await page.$('#voiceEnabledToggle');
      if (!voiceToggle) throw new Error('Voice toggle not found');
      
      const hasActiveClass = await voiceToggle.evaluate(el => el.classList.contains('active'));
      if (!hasActiveClass) throw new Error('Voice toggle should be active (ON) by default');
    });

    await test('Voice toggle can be toggled OFF', async () => {
      const voiceToggle = await page.$('#voiceEnabledToggle');
      await voiceToggle.click();
      
      const isActive = await voiceToggle.evaluate(el => el.classList.contains('active'));
      if (isActive) throw new Error('Voice toggle should be OFF after clicking');
    });

    await test('Voice toggle can be toggled back ON', async () => {
      const voiceToggle = await page.$('#voiceEnabledToggle');
      await voiceToggle.click();
      
      const isActive = await voiceToggle.evaluate(el => el.classList.contains('active'));
      if (!isActive) throw new Error('Voice toggle should be ON after clicking again');
    });

    await test('Voice model dropdown works', async () => {
      const voiceModel = await page.$('#voiceModel');
      if (!voiceModel) throw new Error('Voice model select not found');
      
      await voiceModel.selectOption('echo');
      const value = await voiceModel.inputValue();
      if (value !== 'echo') throw new Error(`Voice model not updated: got ${value}`);
    });

    await test('Voice speed slider works', async () => {
      const speedSlider = await page.$('#voiceSpeed');
      if (!speedSlider) throw new Error('Voice speed slider not found');
      
      await speedSlider.fill('1.5');
      const value = await speedSlider.inputValue();
      if (value !== '1.5') throw new Error(`Voice speed not updated: got ${value}`);
    });

    // ============ RAG DOCUMENTS TESTS ============
    await log('=== RAG DOCUMENTS TESTS ===', 'SECTION');
    
    await test('RAG Knowledge Base section visible', async () => {
      const ragDocSection = await page.$('text=📚 RAG Knowledge Base');
      if (!ragDocSection) throw new Error('RAG Knowledge Base section not found');
    });

    await test('Drag-drop zone is visible', async () => {
      const dragDropZone = await page.$('.drag-drop-zone');
      if (!dragDropZone) throw new Error('Drag-drop zone not found');
    });

    await test('Browse Files button works', async () => {
      const browseBtn = await page.$('button:has-text("Browse Files")');
      if (!browseBtn) throw new Error('Browse Files button not found');
      
      // Check that file input exists
      const fileInput = await page.$('#ragFileInput');
      if (!fileInput) throw new Error('File input element not found');
    });

    await test('Document list container exists', async () => {
      const docsList = await page.$('#ragDocumentsList');
      if (!docsList) throw new Error('Documents list container not found');
    });

    // ============ TOOL INTEGRATIONS TESTS ============
    await log('=== TOOL INTEGRATIONS TESTS ===', 'SECTION');
    
    await test('Tool integration cards visible', async () => {
      const toolCards = await page.$$('.tool-card');
      if (toolCards.length === 0) throw new Error('No tool cards found');
      
      await log(`Found ${toolCards.length} tool cards`, 'INFO');
    });

    await test('Tool cards are clickable', async () => {
      const emailTool = await page.$('[data-tool="email"]');
      if (!emailTool) throw new Error('Email tool card not found');
      
      await emailTool.click();
      const isEnabled = await emailTool.evaluate(el => el.classList.contains('enabled'));
      if (!isEnabled) throw new Error('Tool should be enabled after clicking');
    });

    // ============ SAVE SETTINGS TESTS ============
    await log('=== SAVE SETTINGS TESTS ===', 'SECTION');
    
    await test('Save Settings button visible and clickable', async () => {
      const saveBtn = await page.$('button:has-text("Save Settings")');
      if (!saveBtn) throw new Error('Save Settings button not found');
      
      await saveBtn.click();
      // Wait for success message
      await page.waitForSelector('.alert-success', { timeout: 5000 });
    });

    await test('Settings persist after reload', async () => {
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      const tempSlider = await page.$('#temperature');
      const value = await tempSlider.inputValue();
      if (value !== '1.2') throw new Error(`Temperature not persisted: got ${value}`);
    });

    // ============ API ENDPOINT TESTS ============
    await log('=== API ENDPOINT TESTS ===', 'SECTION');
    
    await test('GET /api/settings works', async () => {
      const token = await page.evaluate(() => localStorage.getItem('token'));
      const response = await page.request.get(`${BASE_URL}/api/settings`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.status() !== 200) {
        throw new Error(`Expected 200, got ${response.status()}`);
      }
      
      const data = await response.json();
      if (!data.rag_enabled) throw new Error('RAG should be enabled in response');
    });

    await test('POST /api/settings works', async () => {
      const token = await page.evaluate(() => localStorage.getItem('token'));
      const response = await page.request.post(`${BASE_URL}/api/settings`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        data: {
          rag_enabled: true,
          rag_chunk_size: 1024,
          rag_overlap: 100,
          rag_max_results: 5,
          tuning_temperature: 0.7,
          tuning_top_p: 0.9,
          tuning_max_tokens: 2000,
          voice_enabled: true,
          voice_model: 'alloy',
          voice_speed: 1.0,
          tool_email_enabled: false,
          tool_websearch_enabled: false,
          tool_playwright_enabled: false,
          tool_crm_enabled: false,
          tool_api_enabled: false,
          tool_banking_enabled: false,
          tool_payment_enabled: false
        }
      });
      
      if (response.status() !== 200) {
        throw new Error(`Expected 200, got ${response.status()}`);
      }
    });

    await test('GET /api/rag/documents works', async () => {
      const token = await page.evaluate(() => localStorage.getItem('token'));
      const response = await page.request.get(`${BASE_URL}/api/rag/documents`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.status() !== 200) {
        throw new Error(`Expected 200, got ${response.status()}`);
      }
      
      const data = await response.json();
      if (!Array.isArray(data)) throw new Error('Response should be an array');
    });

    await test('POST /api/rag/fine-tune works', async () => {
      const token = await page.evaluate(() => localStorage.getItem('token'));
      const response = await page.request.post(`${BASE_URL}/api/rag/fine-tune`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        data: {}
      });
      
      if (response.status() !== 200) {
        throw new Error(`Expected 200, got ${response.status()}`);
      }
      
      const data = await response.json();
      if (!data.job_id) throw new Error('Response should include job_id');
    });

    // ============ SUMMARY ============
    await log('=== TEST SUMMARY ===', 'SECTION');
    results.endTime = new Date().toISOString();
    
    const passed = results.passed.length;
    const failed = results.failed.length;
    const total = passed + failed;
    
    await log(`Total Tests: ${total}`, 'SUMMARY');
    await log(`Passed: ${passed}`, 'SUMMARY');
    await log(`Failed: ${failed}`, 'SUMMARY');
    await log(`Duration: ${new Date(results.endTime) - new Date(results.startTime)}ms`, 'SUMMARY');
    
    if (failed > 0) {
      await log('=== FAILED TESTS ===', 'SECTION');
      results.failed.forEach(f => {
        console.log(`  ✗ ${f.name}: ${f.error}`);
      });
    }
    
    // Save results to file
    fs.writeFileSync('test-results.json', JSON.stringify(results, null, 2));
    await log('Test results saved to test-results.json', 'INFO');

  } catch (error) {
    await log(`Fatal error: ${error.message}`, 'ERROR');
    console.error(error);
  } finally {
    await browser.close();
  }
}

runTests().then(() => {
  const failed = results.failed.length;
  process.exit(failed > 0 ? 1 : 0);
}).catch(err => {
  console.error('Test runner error:', err);
  process.exit(1);
});
