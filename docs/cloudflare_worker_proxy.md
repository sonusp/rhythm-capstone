# Secure Deepgram Agent Proxy via Cloudflare Workers

This guide provides the exact script and step-by-step instructions to deploy a zero-cost, edge-optimized WebSocket proxy on Cloudflare Workers. This completely hides your `DEEPGRAM_API_KEY` from the React frontend.

## 🚀 Step 1: Create the Cloudflare Worker
1. Go to [dash.cloudflare.com](https://dash.cloudflare.com) and create a free account.
2. On the left sidebar, click **Workers & Pages**.
3. Click the blue **Create Application** button, then click **Create Worker**.
4. Name it something like `rhythm-voice-proxy` and click **Deploy**.
5. Click **Edit Code** to open the web editor.

## 📝 Step 2: Paste the Proxy Code
Replace the default code in the editor (`worker.js`) with this exact proxy script:

```javascript
export default {
  async fetch(request, env) {
    const upgradeHeader = request.headers.get('Upgrade');
    if (!upgradeHeader || upgradeHeader !== 'websocket') {
      return new Response('Expected Upgrade: websocket', { status: 426 });
    }

    // Connect to the Deepgram Beta Agent API
    const deepgramUrl = 'wss://agent.deepgram.com/v1/agent/converse';

    // Fetch the secret Master API Key securely from Cloudflare's environment variables
    const DEEPGRAM_API_KEY = env.DEEPGRAM_API_KEY;

    if (!DEEPGRAM_API_KEY) {
      return new Response('Server Error: Missing API Key in Cloudflare', { status: 500 });
    }

    // Initiate the WebSocket connection to Deepgram
    const deepgramResponse = await fetch(deepgramUrl, {
      headers: {
        'Authorization': `Token ${DEEPGRAM_API_KEY}`,
      },
    });

    // Cloudflare handles the WebSockets by extracting them from the responses
    const deepgramWebSocket = deepgramResponse.webSocket;
    
    // Create the WebSocket pair for the client
    const [client, server] = Object.values(new WebSocketPair());

    // Connect them together
    server.accept();
    deepgramWebSocket.accept();

    // Pass messages from the Client (React App) -> Deepgram
    server.addEventListener('message', event => {
      deepgramWebSocket.send(event.data);
    });

    // Pass messages from Deepgram -> Client (React App)
    deepgramWebSocket.addEventListener('message', event => {
      server.send(event.data);
    });

    // Handle closures securely
    server.addEventListener('close', () => deepgramWebSocket.close());
    deepgramWebSocket.addEventListener('close', () => server.close());
    server.addEventListener('error', () => deepgramWebSocket.close());
    deepgramWebSocket.addEventListener('error', () => server.close());

    // Return the response, upgrading the client's connection to the proxy
    return new Response(null, {
      status: 101,
      webSocket: client,
    });
  },
};
```

## 🔑 Step 3: Add Your Secret API Key
1. Save and Deploy the code in the editor, then hit the back button to return to the Worker's dashboard.
2. Go to the **Settings** tab of your Worker, then select **Variables**.
3. Under **Environment Variables**, click **Add variable**.
4. Set the Variable name to `DEEPGRAM_API_KEY`.
5. Paste your real Deepgram API key into the Value field.
6. **Important:** Click the **Encrypt** button to permanently hide it.
7. Click **Deploy**.

## 🔌 Step 4: Update Google Rhythm (React App)
Your Cloudflare Worker is now live! It will give you a URL like `rhythm-voice-proxy.yourname.workers.dev`.

In your React app (`src/components/RhythmAssistant.jsx`), simply change the WebSocket connection string:

```diff
- const ws = new WebSocket('wss://agent.deepgram.com/v1/agent/converse', ['token', import.meta.env.VITE_DEEPGRAM_API_KEY]);
+ // Connect directly to your secure Cloudflare proxy without passing any keys!
+ const ws = new WebSocket('wss://rhythm-voice-proxy.yourname.workers.dev');
```

That's it! The browser never touches the key, and Cloudflare acts as an invisible, instantaneous bridge.
