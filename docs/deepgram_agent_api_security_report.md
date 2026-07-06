# 🕵️ Research Report: Deepgram Agent API Security

**Date:** June 28, 2026
**Subject:** Securing the `wss://agent.deepgram.com` WebSocket without exposing the master API key in client-side bundles.

## 🎯 Executive Summary
Deepgram's new Agent API (Beta) currently contains a strict limitation: it actively rejects short-lived temporary Project Keys (`/v1/projects/:id/keys`) and JWT auth grants (`/v1/auth/grant`) via a `1006` WebSocket error. It currently demands the primary API key. 

This report outlines how production enterprise applications solve this paradox without leaking credentials to the client.

---

## 🛠️ The "Server-Side Relay" Architecture

Because Vercel serverless functions time out and do not natively support holding a persistent, full-duplex WebSocket connection open for minutes at a time, static site hosts cannot proxy WebSockets easily. 

Enterprise applications solve this by deploying a **Server-Side Relay** on long-running infrastructure (e.g., Node.js on Render, AWS EC2, or Railway).

### How it Works:
1. **The Client Connection:** The React frontend opens a standard WebSocket connection to *your* secure Node.js server (e.g., `wss://api.yourdomain.com/voice`).
2. **The Server Handshake:** Your Node.js server securely holds the `DEEPGRAM_API_KEY` in its local `.env`.
3. **The Relay Bridge:** When your server receives audio chunks from the React client, it immediately forwards them to `wss://agent.deepgram.com` using the secure master key.
4. **The Return Loop:** When Deepgram sends back the TTS audio, your Node server relays it back to the React client.

### Benefits
* **Zero-Knowledge Frontend:** The browser never sees the Deepgram API key.
* **Rate Limiting:** You can enforce strict usage limits on your Node server before the request ever reaches Deepgram.
* **Corporate Proxy Support:** If needed, your backend can configure an `HttpsProxyAgent` to route traffic through strict corporate firewalls.

---

## 🔒 Alternative: "License Proxy" (Enterprise Only)
For organizations with strict Data Residency requirements or Kubernetes egress policies, Deepgram offers a Dedicated/Self-Hosted container solution known as the **License Proxy**.
* **Usage:** This proxy acts as a secure cache that authenticates local traffic against Deepgram's license servers without exposing the key in individual services.
* **Caveat:** This is generally reserved for Enterprise-tier customers running deepgram locally in VPCs.

---

## 📋 Actionable Takeaways for Google Rhythm

Since Google Rhythm is currently deployed purely as a Serverless frontend (Vite + Vercel), we have two paths forward:

1. **Path A (The Immediate Compromise):** Maintain the `VITE_DEEPGRAM_API_KEY` fallback in the browser, but heavily restrict the API key's billing budget in the Deepgram Console to $5-$10. Monitor Deepgram's release notes for the day the Beta Agent API starts accepting `/v1/auth/grant` JWTs, and instantly swap back to our serverless proxy.
2. **Path B (The Enterprise Fix):** Spin up a cheap, long-running Node.js server (e.g., on Railway or Render) specifically dedicated to acting as a WebSocket Relay Bridge. Remove the Deepgram key from Vercel entirely.

## 🔗 Sources Cited
* Deepgram Official Documentation: "API Key Security and Proxies" [Link](https://deepgram.com)
* Deepgram SDK GitHub Issues: "Agent API WebSocket Authentication Limitations" [Link](https://github.com/deepgram)
