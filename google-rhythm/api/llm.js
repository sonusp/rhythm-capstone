// POST /api/llm
// Body: { messages: [{role, content}], temperature?: number, max_tokens?: number }
// Returns: { text: string }
//
// Waterfall:
// 1. NVIDIA NIM (process.env.NVIDIA_API_KEY) -> meta/llama-3.1-70b-instruct
// 2. Groq (process.env.GROQ_API_KEY) -> llama-3.3-70b-versatile
// 3. OpenRouter (process.env.OPENROUTER_API_KEY) -> meta-llama/llama-3.1-8b-instruct:free

const ALLOWED_ORIGINS = ['http://localhost:5173', 'https://google-rhythm.vercel.app'];

function setCorsHeaders(req, res) {
  const origin = req.headers.origin;
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

async function callOpenAICompatible({ url, apiKey, model, messages, temperature, max_tokens, extraHeaders = {} }) {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      ...extraHeaders,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: temperature ?? 0.7,
      max_tokens: max_tokens ?? 1024,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`HTTP ${response.status}: ${errText}`);
  }

  const data = await response.json();
  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error('No content in response');
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

  const { messages, temperature, max_tokens } = req.body ?? {};

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'Bad Request: messages array is required' });
  }

  const providers = [
    {
      name: 'NVIDIA NIM',
      fn: () =>
        callOpenAICompatible({
          url: 'https://integrate.api.nvidia.com/v1/chat/completions',
          apiKey: process.env.NVIDIA_API_KEY,
          model: 'meta/llama-3.1-70b-instruct',
          messages,
          temperature,
          max_tokens,
        }),
      enabled: !!process.env.NVIDIA_API_KEY,
    },
    {
      name: 'Groq',
      fn: () =>
        callOpenAICompatible({
          url: 'https://api.groq.com/openai/v1/chat/completions',
          apiKey: process.env.GROQ_API_KEY,
          model: 'llama-3.3-70b-versatile',
          messages,
          temperature,
          max_tokens,
        }),
      enabled: !!process.env.GROQ_API_KEY,
    },
    {
      name: 'OpenRouter',
      fn: () =>
        callOpenAICompatible({
          url: 'https://openrouter.ai/api/v1/chat/completions',
          apiKey: process.env.OPENROUTER_API_KEY,
          model: 'meta-llama/llama-3.1-8b-instruct:free',
          messages,
          temperature,
          max_tokens,
          extraHeaders: {
            'HTTP-Referer': 'https://google-rhythm.vercel.app',
            'X-Title': 'Google Rhythm',
          },
        }),
      enabled: !!process.env.OPENROUTER_API_KEY,
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
      console.error(`[llm] ${provider.name} failed:`, err.message);
      errors.push(`${provider.name}: ${err.message}`);
    }
  }

  return res.status(500).json({
    error: 'All LLM providers failed',
    details: errors,
  });
}
