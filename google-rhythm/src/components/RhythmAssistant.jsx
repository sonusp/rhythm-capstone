import React, { useState, useRef, useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { getLogsForRange } from '../services/db';

/**
 * RhythmAssistant — Real-time Deepgram Voice Agent
 * 
 * Uses a DIRECT WebSocket connection to wss://agent.deepgram.com/agent
 * instead of the @deepgram/sdk, because SDK v5.5.0's V1Socket.handleMessage
 * runs fromJson() on ALL incoming frames — silently crashing on the binary
 * audio data the Agent API sends back. A raw WebSocket properly handles
 * both JSON control messages and binary audio data.
 */
export default function RhythmAssistant({ isOpen, onClose }) {
  const [orbState, setOrbState] = useState('idle'); // idle, listening, thinking, speaking
  const [transcript, setTranscript] = useState('');
  
  // App Context
  const { 
    name, diagnosedConditions, dietPreference, 
    contraceptive, supplements, cycleLength, lastPeriodDate 
  } = useAppStore();

  // Refs for audio handling
  const mediaRecorderRef = useRef(null);
  const wsRef = useRef(null);
  
  // Audio Playback Refs
  const audioContextRef = useRef(null);
  const nextPlayTimeRef = useRef(0);
  const audioSourcesRef = useRef(new Set());

  const calculateCurrentDay = () => {
    if (!lastPeriodDate) return 14; // Mock fallback
    const diffTime = Math.abs(new Date() - new Date(lastPeriodDate));
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const currentDay = calculateCurrentDay();
  const currentPhase = currentDay <= 5 ? 'Menstrual' : currentDay <= 13 ? 'Follicular' : currentDay <= 17 ? 'Ovulation' : 'Luteal';

  // --- 1. Dynamic Prompt Generation ---
  const getDynamicPrompt = async () => {
    const today = new Date();
    const fifteenDaysAgo = new Date();
    fifteenDaysAgo.setDate(today.getDate() - 15);
    const recentLogs = await getLogsForRange(fifteenDaysAgo.toISOString().split('T')[0], today.toISOString().split('T')[0]);
    const historySummary = recentLogs.length > 0 ? JSON.stringify(recentLogs) : "No recent logs.";

    return `
You are Rhythm, a culturally-aware, highly empathetic women's health AI companion designed specifically for Indian women. You are having a spoken, real-time voice conversation with ${name || 'the user'}.

[USER'S PROFILE]
* Diet Preference: ${dietPreference || 'Not set'}
* Diagnosed Conditions: ${(diagnosedConditions || []).join(', ') || 'None'}
* Active Supplements: ${(supplements || []).join(', ') || 'None'}

[CURRENT HEALTH STATE]
* Cycle Phase: ${currentPhase} (Cycle Day: ${currentDay} of ${cycleLength || 28} days)
* Recent Logs (Last 15 Days): ${historySummary}

[VOICE CONVERSATION RULES - CRITICAL]
1. PERSONA: Act as a continuously engaging, supportive, sisterly confidant who understands the unique cultural pressures and local lifestyle nuances she faces. Your primary role is to offer emotional support and validate her emotions based on her cycle phase.
2. CULTURAL TONE: Be extremely warm, non-judgmental, and validating. Suggest simple, authentic Indian home remedies (like adrak chai, haldi doodh, ajwain water, or resting with a hot water bag) when she is in pain or low energy. 
3. HINGLISH CODE-SWITCHING: You MUST perfectly mirror her language. If she speaks Hindi or Hinglish, you MUST respond naturally in warm, relatable Hindi/Hinglish.
4. SIMPLICITY & PACING: Speak slowly and clearly. Use very simple, everyday words. Do NOT use complicated, formal, or overly dramatic vocabulary in any language (English, Hindi, or Hinglish).
5. EXTREME BREVITY: Limit yourself to EXACTLY 1 to 2 short sentences so it feels like a real back-and-forth conversation.
6. KEEP IT ENGAGING: If she mentions pain or discomfort, respond with immense care and ask a short, gentle follow-up question to check on her.
7. PURE TEXT ONLY: Output raw text only. No markdown or emojis.
`;
  };

  // --- CLEANUP: Close socket and streams when modal closes or component unmounts ---
  const cleanupConnections = () => {
    setOrbState('idle');
    setTranscript('');
    audioSourcesRef.current.forEach(source => { try { source.stop(); } catch(e) {} });
    audioSourcesRef.current.clear();

    if (audioContextRef.current) {
      try { audioContextRef.current.close(); } catch(e) {}
      audioContextRef.current = null;
    }

    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.socketOpen = false;
      try { mediaRecorderRef.current.stop(); } catch(e) {}
      mediaRecorderRef.current = null;
    }
    if (wsRef.current) {
      try { wsRef.current.close(); } catch(e) {}
      wsRef.current = null;
    }
  };

  useEffect(() => {
    if (!isOpen) {
      cleanupConnections();
    }
  }, [isOpen]);

  useEffect(() => {
    return () => {
      cleanupConnections();
    };
  }, []);

  // --- 2. Direct WebSocket Connection Handler ---
  const toggleListening = async () => {
    if (orbState === 'idle') {
      setOrbState('listening');
      setTranscript('Connecting...');
      if (window.navigator.vibrate) window.navigator.vibrate(50);
      
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
        
        if (!audioContextRef.current) {
          audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 24000 });
        }
        const audioCtx = audioContextRef.current;
        nextPlayTimeRef.current = 0;
        audioSourcesRef.current.clear();

        const source = audioCtx.createMediaStreamSource(stream);
        const processor = audioCtx.createScriptProcessor(2048, 1, 1);
        const dummyGain = audioCtx.createGain();
        dummyGain.gain.value = 0; 

        mediaRecorderRef.current = {
          socketOpen: false,
          stop: () => {
            processor.disconnect();
            source.disconnect();
            dummyGain.disconnect();
            stream.getTracks().forEach(t => t.stop());
          }
        };

        processor.onaudioprocess = (e) => {
          if (!mediaRecorderRef.current?.socketOpen) return;
          const ws = wsRef.current;
          if (ws && ws.readyState === WebSocket.OPEN) {
            const inputData = e.inputBuffer.getChannelData(0);
            const pcm16 = new Int16Array(inputData.length);
            for (let i = 0; i < inputData.length; i++) {
              pcm16[i] = Math.min(1, Math.max(-1, inputData[i])) * 0x7FFF;
            }
            ws.send(pcm16.buffer);
          }
        };

        source.connect(processor);
        processor.connect(dummyGain);
        dummyGain.connect(audioCtx.destination);

        // --- SECURE WEBSOCKET PROXY ---
        // The connection is proxied through our Cloudflare Worker.
        // The worker securely attaches the DEEPGRAM_API_KEY on the edge.
        // Zero-knowledge security is achieved: The browser never sees the key.
        const ws = new WebSocket('wss://rhythm-voice-proxy.sonupalak47.workers.dev');
        ws.binaryType = 'arraybuffer';
        wsRef.current = ws;

        ws.onopen = async () => {
          console.log("[Rhythm Agent] WebSocket connected");
          const dynamicPrompt = await getDynamicPrompt();
          
          // Send Settings as the first message
          ws.send(JSON.stringify({
            "type": "Settings",
            "audio": {
              "input": {
                "encoding": "linear16",
                "sample_rate": 24000
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
                  "type": "open_ai",
                  "model": "gpt-4o-mini"
                },
                "prompt": dynamicPrompt
              },
              "speak": {
                "provider": {
                  "type": "eleven_labs",
                  "voice_id": "UgBBYS2sOqTuMpoF3BR0",
                  "model_id": "eleven_multilingual_v2"
                }
              },
              "greeting": "Hello! How may I help you? I'm Rhythm, your health coach. Feel free to speak to me in English or Hindi."
            }
          }));

          if (mediaRecorderRef.current) {
            mediaRecorderRef.current.socketOpen = true;
          }
          
          setTranscript('Connected! Try speaking...');
        };

        // --- MESSAGE HANDLER: JSON control + Binary audio ---
        ws.onmessage = (event) => {
          // --- BINARY: Raw audio playback ---
          if (event.data instanceof ArrayBuffer) {
            const audioCtx = audioContextRef.current;
            if (!audioCtx) return;

            if (audioCtx.state === 'suspended') {
              audioCtx.resume();
            }

            const int16Array = new Int16Array(event.data);
            if (int16Array.length === 0) return;
            
            const float32Array = new Float32Array(int16Array.length);
            for (let i = 0; i < int16Array.length; i++) {
              float32Array[i] = int16Array[i] / 32768.0;
            }

            const audioBuffer = audioCtx.createBuffer(1, float32Array.length, 24000);
            audioBuffer.getChannelData(0).set(float32Array);

            const bufferSource = audioCtx.createBufferSource();
            bufferSource.buffer = audioBuffer;
            bufferSource.connect(audioCtx.destination);

            const currentTime = audioCtx.currentTime;
            if (nextPlayTimeRef.current < currentTime) {
              nextPlayTimeRef.current = currentTime;
            }
            
            bufferSource.start(nextPlayTimeRef.current);
            nextPlayTimeRef.current += audioBuffer.duration;
            
            audioSourcesRef.current.add(bufferSource);
            bufferSource.onended = () => {
              audioSourcesRef.current.delete(bufferSource);
            };
            return;
          }

          // --- JSON: Control messages ---
          try {
            const msg = JSON.parse(event.data);
            console.log("[Rhythm Agent]", msg.type);

            // True Barge-in (Interruption)
            if (msg.type === "UserStartedSpeaking") {
              setOrbState("listening");
              audioSourcesRef.current.forEach(source => { try { source.stop(); } catch(e) {} });
              audioSourcesRef.current.clear();
              nextPlayTimeRef.current = audioContextRef.current ? audioContextRef.current.currentTime : 0;
            }

            // Handle Agent States
            if (msg.type === "AgentStateChange") {
              if (msg.state === "Thinking") setOrbState("thinking");
              else if (msg.state === "Speaking") setOrbState("speaking");
              else if (msg.state === "Listening") setOrbState("listening");
            }
            
            // Fallbacks for direct event types
            if (msg.type === "AgentThinking") setOrbState("thinking");
            if (msg.type === "AgentStartedSpeaking") setOrbState("speaking");
            if (msg.type === "AgentAudioDone") setOrbState("listening");

            // Handle Text/Transcripts to show on screen
            if (msg.type === "ConversationText") {
              if (msg.role === "user" && msg.content) {
                setTranscript(msg.content);
              } else if (msg.role === "assistant" && msg.content) {
                setTranscript(msg.content);
              }
            }

            // Handle errors from the agent
            if (msg.type === "Error") {
              console.error("[Rhythm Agent] Error:", msg.description || msg.message);
              setTranscript(msg.description || "Connection error. Please try again.");
            }

          } catch (parseErr) {
            // Ignore unparseable messages
          }
        };

        ws.onclose = (event) => {
          console.log("[Rhythm Agent] WebSocket closed:", event.code, event.reason);
          if (mediaRecorderRef.current) {
            mediaRecorderRef.current.socketOpen = false;
          }
          setOrbState("idle");
          setTranscript("");
        };

        ws.onerror = (event) => {
          console.error("[Rhythm Agent] WebSocket error:", event);
          setTranscript("Connection error. Please try again.");
        };

      } catch (err) {
        console.error("Microphone access denied or connection failed:", err);
        setOrbState('idle');
        setTranscript("Microphone access denied.");
      }
    } else {
      // --- STOP: Clean up everything ---
      cleanupConnections();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[999] flex flex-col items-center justify-end pointer-events-none">
      
      {/* Heavy frosted backdrop for the entire screen */}
      <div 
        className="pointer-events-auto absolute inset-0 bg-black/40 dark:bg-black/80 backdrop-blur-md transition-opacity duration-700 ease-in-out" 
        onClick={onClose}
      ></div>

      {/* Massive bottom glow effect that spills across the bottom of the screen */}
      <div 
        className="absolute bottom-0 left-0 right-0 h-[60vh] opacity-60 dark:opacity-40 pointer-events-none transition-all duration-1000"
        style={{
          background: orbState !== 'idle' 
            ? 'radial-gradient(100% 100% at 50% 100%, rgba(139, 92, 246, 0.5) 0%, rgba(217, 70, 239, 0.3) 40%, transparent 100%)'
            : 'radial-gradient(100% 100% at 50% 100%, rgba(255, 255, 255, 0.2) 0%, transparent 100%)',
        }}
      ></div>

      {/* Main Content Area */}
      <div className="pointer-events-auto relative z-10 w-full h-full flex flex-col items-center justify-between pb-12 pt-24 animate-slide-up">
        
        {/* Transcript / Feedback Text Area */}
        <div className={`w-full max-w-sm px-8 transition-all duration-700 ease-out ${transcript ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <p className="text-[20px] sm:text-[22px] font-medium text-white/95 tracking-normal leading-relaxed drop-shadow-md text-center">
            {transcript || "I'm listening..."}
          </p>
        </div>

        {/* Bottom Section: Pure Siri Energy Sphere */}
        <div className="flex flex-col items-center gap-12 w-full">
          
          <div 
            onClick={toggleListening}
            className={`
              relative flex items-center justify-center cursor-pointer transition-transform duration-700 ease-in-out rounded-full
              ${orbState === 'idle' ? 'w-24 h-24' : ''}
              ${orbState === 'listening' ? 'w-32 h-32 scale-105' : ''}
              ${orbState === 'thinking' ? 'w-28 h-28' : ''}
              ${orbState === 'speaking' ? 'w-32 h-32 animate-orb-vibrate' : ''}
            `}
          >
            {/* Base Shadow / Glow */}
            <div className={`absolute inset-0 rounded-full transition-all duration-700 ${orbState !== 'idle' ? 'shadow-[0_0_100px_40px_rgba(139,92,246,0.3)]' : 'shadow-[0_0_60px_20px_rgba(255,255,255,0.08)]'}`}></div>

            {/* Translucent Siri Energy Cloud Layers */}
            {/* Cyan layer */}
            <div className={`absolute inset-0 rounded-full bg-cyan-400 mix-blend-screen opacity-80 blur-[28px] transition-all duration-700 ${orbState === 'idle' ? 'animate-siri-slow' : orbState === 'listening' ? 'animate-siri-fast scale-125' : 'animate-siri-pulse scale-110'}`} style={{ transformOrigin: '40% 60%' }}></div>
            
            {/* Fuchsia layer */}
            <div className={`absolute inset-0 rounded-full bg-fuchsia-500 mix-blend-screen opacity-80 blur-[32px] transition-all duration-700 ${orbState === 'idle' ? 'animate-siri-slow-reverse' : orbState === 'listening' ? 'animate-siri-fast-reverse scale-125' : 'animate-siri-pulse scale-110'}`} style={{ transformOrigin: '60% 40%' }}></div>
            
            {/* Violet layer */}
            <div className={`absolute inset-0 rounded-full bg-violet-600 mix-blend-screen opacity-90 blur-[36px] transition-all duration-700 ${orbState === 'idle' ? 'animate-siri-slow' : orbState === 'listening' ? 'animate-siri-fast scale-150' : 'animate-siri-pulse scale-125'}`} style={{ transformOrigin: '50% 50%' }}></div>

            {/* Core Bright Highlight (The central white glow) */}
            <div className="absolute inset-8 rounded-full bg-white/60 blur-[12px] z-10 mix-blend-overlay"></div>
          </div>

          {/* Elegant Close Button */}
          <button 
            onClick={onClose} 
            className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white/70 hover:text-white transition-all active:scale-95"
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

      </div>

      {/* Siri Energy Animations */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes siri-rotate {
          0% { transform: rotate(0deg) scale(1) translate(5%, 5%); }
          33% { transform: rotate(120deg) scale(1.1) translate(-5%, 5%); }
          66% { transform: rotate(240deg) scale(0.9) translate(5%, -5%); }
          100% { transform: rotate(360deg) scale(1) translate(5%, 5%); }
        }
        @keyframes siri-rotate-reverse {
          0% { transform: rotate(360deg) scale(1) translate(-5%, -5%); }
          33% { transform: rotate(240deg) scale(1.1) translate(5%, -5%); }
          66% { transform: rotate(120deg) scale(0.9) translate(-5%, 5%); }
          100% { transform: rotate(0deg) scale(1) translate(-5%, -5%); }
        }
        @keyframes siri-pulse {
          0%, 100% { transform: scale(1) opacity(0.7); }
          50% { transform: scale(1.05) opacity(0.9); }
        }
        .animate-siri-slow { animation: siri-rotate 8s infinite linear; }
        .animate-siri-slow-reverse { animation: siri-rotate-reverse 9s infinite linear; }
        .animate-siri-fast { animation: siri-rotate 3s infinite linear; }
        .animate-siri-fast-reverse { animation: siri-rotate-reverse 3.5s infinite linear; }
        .animate-siri-pulse { animation: siri-pulse 1.5s infinite ease-in-out; }
      `}} />
    </div>
  );
}
