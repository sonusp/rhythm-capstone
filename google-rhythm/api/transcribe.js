// POST /api/transcribe
// Body: raw audio blob (binary)
// Returns: { text: string }
//
// Waterfall:
// 1. Groq Whisper (process.env.GROQ_API_KEY) -> whisper-large-v3-turbo
// 2. Deepgram (process.env.DEEPGRAM_API_KEY) -> nova-2-medical

// Disable default body parser so we can receive raw binary audio
export const config = {
  api: {
    bodyParser: false,
    sizeLimit: '25mb',
  },
};

const ALLOWED_ORIGINS = ['http://localhost:5173', 'https://google-rhythm.vercel.app'];

function setCorsHeaders(req, res) {
  const origin = req.headers.origin;
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

/**
 * Collect all chunks from the incoming request stream into a single Buffer.
 */
function collectBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

/**
 * Transcribe via Groq Whisper (multipart/form-data upload).
 * Groq uses the OpenAI-compatible audio transcriptions endpoint.
 */
async function transcribeWithGroq(audioBuffer, contentType) {
  const boundary = `----FormBoundary${Date.now()}`;

  // Build multipart body manually (no external deps)
  const filename = 'audio.webm';
  const mimeType = contentType || 'audio/webm';

  const preamble = Buffer.from(
    `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="file"; filename="${filename}"\r\n` +
      `Content-Type: ${mimeType}\r\n\r\n`
  );
  const modelPart = Buffer.from(
    `\r\n--${boundary}\r\n` +
      `Content-Disposition: form-data; name="model"\r\n\r\n` +
      `whisper-large-v3-turbo\r\n` +
      `--${boundary}--\r\n`
  );

  const body = Buffer.concat([preamble, audioBuffer, modelPart]);

  const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
    },
    body,
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`HTTP ${response.status}: ${errText}`);
  }

  const data = await response.json();
  const text = data?.text;
  if (typeof text !== 'string') throw new Error('No text in Groq response');
  return text;
}

/**
 * Transcribe via Deepgram Nova-2-Medical (raw binary body).
 */
async function transcribeWithDeepgram(audioBuffer, contentType) {
  const mimeType = contentType || 'audio/webm';

  const response = await fetch(
    'https://api.deepgram.com/v1/listen?model=nova-2-medical&smart_format=true',
    {
      method: 'POST',
      headers: {
        Authorization: `Token ${process.env.DEEPGRAM_API_KEY}`,
        'Content-Type': mimeType,
      },
      body: audioBuffer,
    }
  );

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`HTTP ${response.status}: ${errText}`);
  }

  const data = await response.json();
  const text = data?.results?.channels?.[0]?.alternatives?.[0]?.transcript;
  if (typeof text !== 'string') throw new Error('No transcript in Deepgram response');
  return text;
}

export default async function handler(req, res) {
  setCorsHeaders(req, res);

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  let audioBuffer;
  try {
    audioBuffer = await collectBody(req);
  } catch (err) {
    console.error('[transcribe] Failed to read request body:', err.message);
    return res.status(400).json({ error: 'Failed to read audio body', details: err.message });
  }

  if (!audioBuffer || audioBuffer.length === 0) {
    return res.status(400).json({ error: 'Bad Request: empty audio body' });
  }

  const contentType = req.headers['content-type'] || 'audio/webm';

  const providers = [
    {
      name: 'Groq Whisper',
      fn: () => transcribeWithGroq(audioBuffer, contentType),
      enabled: !!process.env.GROQ_API_KEY,
    },
    {
      name: 'Deepgram Nova-2-Medical',
      fn: () => transcribeWithDeepgram(audioBuffer, contentType),
      enabled: !!process.env.DEEPGRAM_API_KEY,
    },
  ];

  const errors = [];

  for (const provider of providers) {
    if (!provider.enabled) {
      errors.push(`${provider.name}: API key not configured`);
      continue;
    }

    try {
      const text = await provider.fn();
      return res.status(200).json({ text, provider: provider.name });
    } catch (err) {
      console.error(`[transcribe] ${provider.name} failed:`, err.message);
      errors.push(`${provider.name}: ${err.message}`);
    }
  }

  return res.status(500).json({
    error: 'All transcription providers failed',
    details: errors,
  });
}
