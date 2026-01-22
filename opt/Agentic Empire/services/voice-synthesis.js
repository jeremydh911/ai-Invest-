/**
 * Text-to-Speech (TTS) Voice Synthesis Service
 * Supports multiple TTS engines with fallback
 */

const fs = require('fs');
const path = require('path');

class VoiceSynthesisService {
  constructor() {
    this.providers = {
      openai: null,
      google: null,
      elevenlabs: null,
      browser: null // Web Speech API fallback
    };

    this.initializeProviders();

    this.voices = {
      nova: { provider: 'openai', voice: 'nova', speed: 1.0 },
      echo: { provider: 'openai', voice: 'echo', speed: 1.0 },
      onyx: { provider: 'openai', voice: 'onyx', speed: 1.0 },
      fable: { provider: 'openai', voice: 'fable', speed: 1.0 },
      shivers: { provider: 'elevenlabs', voice: 'shivers', speed: 1.0 },
      alloy: { provider: 'google', voice: 'alloy', speed: 1.0 },
      browser: { provider: 'browser', voice: 'default', speed: 1.0 }
    };
  }

  /**
   * Initialize TTS providers based on available API keys
   */
  initializeProviders() {
    // OpenAI TTS (most reliable)
    if (process.env.OPENAI_API_KEY) {
      this.providers.openai = {
        apiKey: process.env.OPENAI_API_KEY,
        apiUrl: 'https://api.openai.com/v1/audio/speech'
      };
      console.log('[TTS] OpenAI provider initialized');
    }

    // Google Cloud TTS
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      try {
        this.providers.google = {
          credentialsPath: process.env.GOOGLE_APPLICATION_CREDENTIALS,
          projectId: process.env.GOOGLE_PROJECT_ID
        };
        console.log('[TTS] Google Cloud provider initialized');
      } catch (err) {
        console.warn('[TTS] Google Cloud provider initialization failed:', err.message);
      }
    }

    // ElevenLabs TTS
    if (process.env.ELEVENLABS_API_KEY) {
      this.providers.elevenlabs = {
        apiKey: process.env.ELEVENLABS_API_KEY,
        apiUrl: 'https://api.elevenlabs.io/v1'
      };
      console.log('[TTS] ElevenLabs provider initialized');
    }

    // Browser/Client-side TTS (always available)
    this.providers.browser = {
      type: 'webSpeechAPI',
      isClientSide: true
    };
    console.log('[TTS] Browser Web Speech API available as fallback');
  }

  /**
   * Synthesize speech using OpenAI
   */
  async synthesizeOpenAI(text, voiceId = 'nova', speed = 1.0) {
    if (!this.providers.openai) {
      throw new Error('OpenAI API key not configured');
    }

    try {
      const axios = require('axios');
      
      const response = await axios.post(
        this.providers.openai.apiUrl,
        {
          model: 'tts-1-hd',
          input: text,
          voice: voiceId,
          speed: Math.min(Math.max(0.25, speed), 4.0) // Clamp between 0.25 and 4.0
        },
        {
          headers: {
            'Authorization': `Bearer ${this.providers.openai.apiKey}`,
            'Content-Type': 'application/json'
          },
          responseType: 'arraybuffer',
          timeout: 30000
        }
      );

      return {
        success: true,
        audio: response.data,
        format: 'mp3',
        provider: 'openai',
        voice: voiceId,
        bytesLength: response.data.length
      };
    } catch (err) {
      throw new Error(`OpenAI TTS failed: ${err.message}`);
    }
  }

  /**
   * Synthesize speech using Google Cloud
   */
  async synthesizeGoogle(text, voiceId = 'en-US-Standard-A', speed = 1.0) {
    if (!this.providers.google) {
      throw new Error('Google Cloud credentials not configured');
    }

    try {
      const textToSpeech = require('@google-cloud/text-to-speech');
      const client = new textToSpeech.TextToSpeechClient({
        keyFilename: this.providers.google.credentialsPath
      });

      const request = {
        input: { text },
        voice: {
          languageCode: 'en-US',
          name: voiceId
        },
        audioConfig: {
          audioEncoding: 'MP3',
          pitch: 0,
          speakingRate: speed
        }
      };

      const [response] = await client.synthesizeSpeech(request);

      return {
        success: true,
        audio: response.audioContent,
        format: 'mp3',
        provider: 'google',
        voice: voiceId,
        bytesLength: response.audioContent.length
      };
    } catch (err) {
      throw new Error(`Google Cloud TTS failed: ${err.message}`);
    }
  }

  /**
   * Synthesize speech using ElevenLabs
   */
  async synthesizeElevenLabs(text, voiceId = 'shivers', speed = 1.0) {
    if (!this.providers.elevenlabs) {
      throw new Error('ElevenLabs API key not configured');
    }

    try {
      const axios = require('axios');
      
      const response = await axios.post(
        `${this.providers.elevenlabs.apiUrl}/text-to-speech/${voiceId}`,
        {
          text,
          model_id: 'eleven_monolingual_v1',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75
          }
        },
        {
          headers: {
            'xi-api-key': this.providers.elevenlabs.apiKey,
            'Content-Type': 'application/json'
          },
          responseType: 'arraybuffer',
          timeout: 30000
        }
      );

      return {
        success: true,
        audio: response.data,
        format: 'mp3',
        provider: 'elevenlabs',
        voice: voiceId,
        bytesLength: response.data.length
      };
    } catch (err) {
      throw new Error(`ElevenLabs TTS failed: ${err.message}`);
    }
  }

  /**
   * Synthesize speech with automatic provider fallback
   */
  async synthesize(text, voiceId = 'nova', options = {}) {
    if (!text || text.trim().length === 0) {
      throw new Error('Text cannot be empty');
    }

    const maxLength = 4096; // OpenAI limit
    if (text.length > maxLength) {
      throw new Error(`Text exceeds maximum length of ${maxLength} characters`);
    }

    const speed = options.speed || 1.0;
    const preferredProviders = options.providers || ['openai', 'elevenlabs', 'google'];

    let lastError = null;

    for (const provider of preferredProviders) {
      try {
        switch (provider) {
          case 'openai':
            if (this.providers.openai) {
              return await this.synthesizeOpenAI(text, voiceId, speed);
            }
            break;

          case 'elevenlabs':
            if (this.providers.elevenlabs) {
              return await this.synthesizeElevenLabs(text, voiceId, speed);
            }
            break;

          case 'google':
            if (this.providers.google) {
              return await this.synthesizeGoogle(text, voiceId, speed);
            }
            break;

          case 'browser':
            return {
              success: true,
              audio: null,
              format: 'webSpeechAPI',
              provider: 'browser',
              voice: voiceId,
              clientSide: true,
              instructions: 'Use window.speechSynthesis in browser'
            };
        }
      } catch (err) {
        lastError = err;
        console.warn(`[TTS] ${provider} failed:`, err.message);
        continue;
      }
    }

    // Fallback to browser TTS
    return {
      success: true,
      audio: null,
      format: 'webSpeechAPI',
      provider: 'browser',
      voice: voiceId,
      clientSide: true,
      instructions: 'Use window.speechSynthesis in browser',
      warning: `Server-side TTS unavailable: ${lastError?.message || 'No providers configured'}`
    };
  }

  /**
   * Get available voices for each provider
   */
  getAvailableVoices() {
    return {
      openai: ['nova', 'echo', 'onyx', 'fable', 'shimmer', 'alloy'],
      google: [
        'en-US-Standard-A', 'en-US-Standard-C', 'en-US-Standard-D', 'en-US-Standard-E',
        'en-US-Neural2-A', 'en-US-Neural2-C', 'en-US-Neural2-D', 'en-US-Neural2-E'
      ],
      elevenlabs: ['shivers', 'benjamin', 'charlotte', 'josh'],
      browser: ['default']
    };
  }

  /**
   * Get provider status
   */
  getStatus() {
    return {
      openai: !!this.providers.openai,
      google: !!this.providers.google,
      elevenlabs: !!this.providers.elevenlabs,
      browser: true,
      availableProviders: Object.keys(this.providers).filter(k => this.providers[k])
    };
  }

  /**
   * Create speech chunk for streaming (server-side synthesis)
   */
  async createSpeechFile(text, voiceId = 'nova', outputPath = null) {
    const result = await this.synthesize(text, voiceId);

    if (!result.audio) {
      throw new Error('No audio data received from TTS provider');
    }

    // Generate unique filename if not provided
    if (!outputPath) {
      outputPath = path.join(
        process.cwd(),
        'audio',
        `tts_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.mp3`
      );
    }

    // Ensure directory exists
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Write audio file
    fs.writeFileSync(outputPath, Buffer.from(result.audio));

    return {
      ...result,
      filepath: outputPath,
      filename: path.basename(outputPath)
    };
  }

  /**
   * Batch synthesize multiple texts
   */
  async synthesizeBatch(texts, voiceId = 'nova', options = {}) {
    const results = [];
    const errors = [];

    for (let i = 0; i < texts.length; i++) {
      try {
        const result = await this.synthesize(texts[i], voiceId, options);
        results.push({
          index: i,
          text: texts[i],
          ...result
        });
      } catch (err) {
        errors.push({
          index: i,
          text: texts[i],
          error: err.message
        });
      }
    }

    return {
          success: results.length,
          failed: errors.length,
          results,
          errors,
          total: texts.length
        };
    }

    /**
     * Transcribe audio to text using OpenAI Whisper
     */
    async transcribe(audioBuffer, options = {}) {
        if (!process.env.OPENAI_API_KEY) {
            throw new Error('OpenAI API key not configured');
        }

        try {
            const axios = require('axios');
            
            // Use global FormData in Node v18+ or polyfill
            const formData = new (global.FormData || require('form-data'))();
            
            if (global.FormData) {
              // Global FormData (v18+) expects a Blob for files
              const blob = new Blob([audioBuffer], { type: 'audio/webm' });
              formData.append('file', blob, 'speech.webm');
            } else {
              // Legacy form-data package
              formData.append('file', audioBuffer, {
                  filename: 'speech.webm',
                  contentType: 'audio/webm',
              });
            }
            
            formData.append('model', options.model || 'whisper-1');
            if (options.language) formData.append('language', options.language);

            const headers = {
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
            };

            // Only add headers from form-data package if we're using it
            if (!global.FormData) {
              Object.assign(headers, formData.getHeaders());
            }

            const response = await axios.post(
                'https://api.openai.com/v1/audio/transcriptions',
                formData,
                { headers }
            );

            return {
                text: response.data.text,
                language: response.data.language,
                duration: response.data.duration
            };
        } catch (err) {
            console.error('[TTS] Transcription error:', err.response?.data || err.message);
            throw err;
        }
    }

module.exports = VoiceSynthesisService;
