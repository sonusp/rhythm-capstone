import WebSocket from 'ws';

const token = process.env.VITE_DEEPGRAM_API_KEY || "your_api_key_here";

if (token === "your_api_key_here" && !process.env.VITE_DEEPGRAM_API_KEY) {
  console.log("Please run with VITE_DEEPGRAM_API_KEY set.");
  process.exit(1);
}

const ws = new WebSocket('wss://agent.deepgram.com/v1/agent/converse', ['token', token]);

ws.on('open', () => {
  console.log("WebSocket connected.");
  const settings = {
    "type": "Settings",
    "audio": {
      "input": {
        "encoding": "linear16",
        "sample_rate": 48000
      },
      "output": {
        "encoding": "linear16",
        "sample_rate": 24000,
        "container": "none"
      }
    },
    "agent": {
      "listen": {
        "provider": {
          "type": "deepgram",
          "version": "v2",
          "model": "flux-general-multi"
        }
      },
      "think": {
        "provider": {
          "type": "google",
          "model": "gemini-1.5-flash"
        },
        "prompt": "Hello! You are a helpful assistant."
      },
      "speak": {
        "provider": {
          "type": "eleven_labs",
          "voice_id": "UgBBYS2sOqTuMpoF3BR0",
          "model_id": "eleven_multilingual_v2"
        }
      }
    }
  };
  console.log("Sending settings:", JSON.stringify(settings, null, 2));
  ws.send(JSON.stringify(settings));
});

ws.on('message', (data) => {
  console.log("Message received:", data.toString());
  try {
    const msg = JSON.parse(data.toString());
    if (msg.type === 'AgentStateChange' && msg.state === 'Listening') {
      console.log("✅ SUCCESS! Agent is Listening. The schema is valid.");
      ws.close();
    }
  } catch(e) {}
});

ws.on('close', (code, reason) => {
  console.log(`WebSocket closed: ${code} ${reason}`);
});

ws.on('error', (err) => {
  console.error("WebSocket error:", err);
});
