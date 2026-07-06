import WebSocket from 'ws';

console.log("Connecting to proxy...");
const ws = new WebSocket('wss://rhythm-voice-proxy.sonupalak47.workers.dev/');

ws.on('open', () => {
  console.log("Connected successfully!");
  ws.send(JSON.stringify({ type: 'KeepAlive' }));
});

ws.on('message', (data) => {
  console.log("Received:", data.toString());
});

ws.on('close', (code, reason) => {
  console.log("Closed:", code, reason.toString());
});

ws.on('error', (err) => {
  console.error("Error:", err.message);
});
