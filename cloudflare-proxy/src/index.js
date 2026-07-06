export default {
  async fetch(request, env) {
    try {
      const origin = request.headers.get('Origin');
      const allowedOrigins = ['http://localhost:5173', 'https://google-rhythm.vercel.app'];
      
      if (origin && !allowedOrigins.includes(origin)) {
        return new Response('Forbidden', { status: 403 });
      }

      const upgradeHeader = request.headers.get('Upgrade');
      if (upgradeHeader !== 'websocket') {
        return new Response('Expected Upgrade: websocket', { status: 426 });
      }

      // MUST use https:// for Cloudflare fetch, it will upgrade it!
      const deepgramUrl = 'https://agent.deepgram.com/v1/agent/converse';
      
      const DEEPGRAM_API_KEY = env.DEEPGRAM_API_KEY;
      
      const [client, server] = Object.values(new WebSocketPair());
      server.accept();

      const dgRes = await fetch(deepgramUrl, {
        headers: {
          'Authorization': `Token ${DEEPGRAM_API_KEY}`,
          'Upgrade': 'websocket',
          'Connection': 'Upgrade'
        }
      });

      if (dgRes.status !== 101) {
        const body = await dgRes.text();
        server.send(`Upstream Error: ${dgRes.status} ${body}`);
        server.close(1011, "Upstream error");
        return new Response(null, { status: 101, webSocket: client }); // Accept locally but close it
      }

      const dgWs = dgRes.webSocket;
      if (!dgWs) {
        server.close(1011, "No websocket in upstream response");
        return new Response(null, { status: 101, webSocket: client });
      }

      dgWs.accept();
      
      // Pass messages both ways
      server.addEventListener('message', event => dgWs.send(event.data));
      dgWs.addEventListener('message', event => server.send(event.data));
      
      server.addEventListener('close', () => dgWs.close());
      dgWs.addEventListener('close', () => server.close());

      return new Response(null, { status: 101, webSocket: client });
    } catch (e) {
      console.error(e);
      return new Response('Internal Server Error', { status: 500 });
    }
  }
};
