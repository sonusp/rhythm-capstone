const ALLOWED_ORIGINS = ['http://localhost:5173', 'https://google-rhythm.vercel.app'];

export default async function handler(req, res) {
  // CORS setup
  res.setHeader('Access-Control-Allow-Credentials', true);
  
  const origin = req.headers.origin;
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else if (!origin) {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const apiKey = process.env.DEEPGRAM_API_KEY || process.env.VITE_DEEPGRAM_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "Missing Deepgram API Key on Server" });
    }

    // Generate a secure JWT temporary token (lives for 60 seconds)
    const keyRes = await fetch(`https://api.deepgram.com/v1/auth/grant`, {
      method: 'POST',
      headers: {
        Authorization: `Token ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ttl_seconds: 60
      })
    });
    
    const keyData = await keyRes.json();

    if (!keyRes.ok) {
      console.error("Deepgram Auth Error:", keyData);
      return res.status(500).json({ error: keyData.err_msg || "Failed to generate JWT" });
    }

    // Return the JWT access token to the client
    res.status(200).json({ key: keyData.access_token });
  } catch (error) {
    console.error("Error vending token:", error);
    res.status(500).json({ error: error.message });
  }
}
