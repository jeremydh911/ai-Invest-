
const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const TEST_TOKEN = process.env.TEST_TOKEN; // We'll need a token if auth is enabled

async function runSmokeTest() {
  console.log('🚀 Starting Voice & Chat Smoke Test...');
  
  if (!process.env.OPENAI_API_KEY) {
    console.warn('⚠️  OPENAI_API_KEY not found in environment. Tests will likely fail.');
  }

  // 1. Check Server Status
  try {
    const status = await axios.get(`${BASE_URL}/api/system/status`);
    console.log('✅ Server is up:', status.data.status);
  } catch (err) {
    console.error('❌ Server check failed:', err.message);
    // If server is not running, we could start it but better to just report
    return;
  }

  // 2. Test Voice Synthesis (TTS) - GET voices
  try {
    const res = await axios.get(`${BASE_URL}/api/voice/voices`, {
      headers: { 'Authorization': `Bearer ${TEST_TOKEN}` }
    });
    console.log('✅ Voice providers retrieved:', res.data.availableProviders);
  } catch (err) {
    console.error('❌ GET /api/voice/voices failed:', err.response?.data || err.message);
  }

  // 3. Test Synthesis (TTS) - POST
  try {
    const res = await axios.post(`${BASE_URL}/api/voice/synthesize`, {
      text: "Smoke test. Red leader standing by.",
      voice: "alloy"
    }, {
      headers: { 
        'Authorization': `Bearer ${TEST_TOKEN}`,
        'Accept': 'application/json'
      }
    });
    console.log('✅ TTS Synthesis successful (JSON response)');
    if (res.data.audio) console.log('   - Audio data received (base64 length):', res.data.audio.length);
  } catch (err) {
    console.error('❌ POST /api/voice/synthesize failed:', err.response?.data || err.message);
  }

  // 4. Test Persona Listing
  try {
    const res = await axios.get(`${BASE_URL}/api/personas`, {
      headers: { 'Authorization': `Bearer ${TEST_TOKEN}` }
    });
    console.log('✅ Personas retrieved:', res.data.length);
    if (res.data.length > 0) {
      const personaId = res.data[0].id;
      
      // 5. Test Chat with Persona
      console.log(`🤖 Testing Chat with Persona ID: ${personaId}...`);
      const chatRes = await axios.post(`${BASE_URL}/api/text-chat`, {
        persona_id: personaId,
        message: "Hello world"
      }, {
        headers: { 'Authorization': `Bearer ${TEST_TOKEN}` },
        responseType: 'stream'
      });
      
      console.log('✅ Chat SSE stream opened');
      chatRes.data.on('data', chunk => {
        // Just log the first bit
        const str = chunk.toString();
        if (str.includes('data:')) {
           console.log('   - Received chunk:', str.substring(0, 50) + '...');
           chatRes.data.destroy(); // Done
        }
      });
    }
  } catch (err) {
    console.error('❌ Chat test failed:', err.response?.data || err.message);
  }
}

if (require.main === module) {
  runSmokeTest();
}
