/**
 * Voice Synthesis & Speech-to-Text API Routes
 * 
 * Handles text-to-speech synthesis, voice cloning, and audio management.
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const authenticate = require('./auth-middleware');
const logger = require('../services/logger');
const VoiceSynthesisService = require('../services/voice-synthesis');
const CallQualityAndMLSystem = require('../services/call-quality-ml');

const voiceService = new VoiceSynthesisService();
const mlSystem = new CallQualityAndMLSystem();
const upload = multer({ limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB limit

// Applying authentication to all voice routes
router.use(authenticate);

/**
 * POST /api/tts/synthesize
 * POST /api/voice/synthesize
 * Synthesize speech from text
 */
const handleSynthesize = async (req, res) => {
  try {
    const { text, voice, speed, model } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'Text is required for synthesis' });
    }

    logger.info(`Synthesizing voice: ${voice || 'default'} for text: ${text.substring(0, 50)}...`);

    const result = await voiceService.synthesize(text, voice, { speed, model });
    
    // Default to audio stream if frontend likely expects it, or if specifically requested
    const wantsJson = req.headers.accept === 'application/json' || req.query.format === 'json';
    
    if (!wantsJson) {
      res.set('Content-Type', 'audio/mpeg');
      res.set('Content-Length', result.audio.length);
      return res.send(Buffer.from(result.audio));
    }

    res.json({
      success: true,
      audio: result.audio.toString('base64'),
      format: 'mp3',
      provider: result.provider,
      voice: voice || 'nova'
    });
  } catch (err) {
    logger.error('Voice synthesis error:', err);
    res.status(500).json({ error: err.message });
  }
};

router.post('/synthesize', handleSynthesize);

/**
 * POST /api/voice/transcribe
 * Transcribe audio to text
 */
router.post('/transcribe', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Audio file is required' });
    }

    logger.info(`Transcribing audio, size: ${req.file.size} bytes`);

    const result = await voiceService.transcribe(req.file.buffer, {
      language: req.body.language,
      model: req.body.model
    });

    // Machine Learning: Log interaction for quality analysis
    if (result.text) {
      mlSystem.logReviewEvent('transcription_success', {
        userId: req.user.id,
        textLength: result.text.length,
        durationEstimation: result.duration
      });
    }

    res.json({
      success: true,
      text: result.text,
      language: result.language
    });
  } catch (err) {
    logger.error('Transcription error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/tts/voices
 * Get available voices and providers
 */
router.get('/voices', (req, res) => {
  try {
    res.json({
      success: true,
      voices: voiceService.voices,
      availableProviders: Object.keys(voiceService.providers).filter(p => voiceService.providers[p])
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/tts/status
 * Get status of TTS providers
 */
router.get('/status', (req, res) => {
  try {
    const status = {
      providers: {},
      totalVoices: Object.keys(voiceService.voices).length
    };

    for (const [name, provider] of Object.entries(voiceService.providers)) {
      status.providers[name] = {
        available: !!provider,
        isClientSide: provider?.isClientSide || false
      };
    }

    res.json({
      success: true,
      status
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
