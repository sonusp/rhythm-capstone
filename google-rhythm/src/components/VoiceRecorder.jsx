import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, MicOff, X, Sparkles, CheckCircle } from 'lucide-react';

export default function VoiceRecorder({ onClose, onLogSaved }) {
  const [recorderState, setRecorderState] = useState('idle'); // 'idle' | 'recording' | 'paused'
  const canvasRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const sourceRef = useRef(null);
  const animationFrameRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);

  // Setup Microphone and Canvas Visualizer
  const initializeAudio = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      audioContextRef.current = audioContext;

      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;

      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      sourceRef.current = source;

      // Start MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        chunksRef.current = []; // Reset
        // Hand off the blob for processing here
        handleBlobProcessing(blob);
      };

      mediaRecorder.start();
      setRecorderState('recording');
      drawVisualizer();

    } catch (err) {
      console.error("Microphone access denied or failed", err);
      alert("Please allow microphone access to use voice logging.");
      onClose();
    }
  }, []);

  useEffect(() => {
    // Automatically start recording when modal opens
    initializeAudio();

    return () => {
      // Cleanup all audio resources to prevent memory leaks!
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    };
  }, [initializeAudio]);

  const drawVisualizer = () => {
    if (!canvasRef.current || !analyserRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const analyser = analyserRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animationFrameRef.current = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);

      ctx.fillStyle = 'transparent';
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const centerY = canvas.height / 2;

      // If paused, draw a straight line
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
        ctx.fillStyle = '#007AFF';
        ctx.beginPath();
        ctx.roundRect(10, centerY - 1, canvas.width - 20, 2, 2);
        ctx.fill();
        return;
      }

      const barWidth = (canvas.width / bufferLength) * 2.5;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * (canvas.height / 2);
        
        // Gradient color for bars (iOS Siri-like Blue/Purple)
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
        gradient.addColorStop(0, '#5AC8FA');
        gradient.addColorStop(0.5, '#007AFF');
        gradient.addColorStop(1, '#5856D6');
        ctx.fillStyle = gradient;

        // Draw centered bar
        ctx.beginPath();
        ctx.roundRect(x, centerY - barHeight / 2, barWidth - 1.5, barHeight || 2, 4);
        ctx.fill();

        x += barWidth;
      }
    };
    draw();
  };

  const togglePause = () => {
    if (!mediaRecorderRef.current) return;

    if (recorderState === 'recording') {
      mediaRecorderRef.current.pause();
      if (audioContextRef.current) audioContextRef.current.suspend();
      setRecorderState('paused');
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    } else if (recorderState === 'paused') {
      mediaRecorderRef.current.resume();
      if (audioContextRef.current) audioContextRef.current.resume();
      setRecorderState('recording');
      drawVisualizer();
    }
  };

  const handleSave = () => {
    if (mediaRecorderRef.current && recorderState !== 'idle') {
      mediaRecorderRef.current.stop(); // This triggers the onstop handler
    }
  };

  const handleBlobProcessing = async (blob) => {
    console.log("Blob saved to background process. Size:", blob.size);
    if (onLogSaved) {
      onLogSaved(blob);
    }
    onClose();
  };

  return (
    <div className="absolute inset-0 z-[100] bg-black/30 backdrop-blur-md flex flex-col justify-end transition-all">
      {/* iOS Glass Bottom Sheet */}
      <div className="bg-white/60 dark:bg-[#1A1C1E]/60 backdrop-saturate-[1.8] backdrop-blur-[50px] w-full h-auto min-h-[55vh] rounded-t-[32px] flex flex-col animate-slide-up relative overflow-hidden shadow-[0_-10px_40px_rgba(0,0,0,0.15)] border-t-[0.5px] border-white/40 dark:border-white/10 pb-12">
        
        {/* iOS Drag Handle */}
        <div className="w-10 h-[5px] bg-[#C6C6C8] dark:bg-[#5C5C5E] rounded-full mx-auto mt-3"></div>
        
        {/* Header */}
        <div className="w-full flex justify-between items-center px-6 pt-4 pb-2 z-10">
          <div className="flex items-center gap-1.5 px-3 py-1">
            <Sparkles className="w-[14px] h-[14px] text-[#007AFF] dark:text-[#0A84FF]" />
            <span className="text-[11px] font-semibold text-[#8E8E93] dark:text-[#EBEBF5]/60 tracking-widest uppercase">AI Voice Log</span>
          </div>
          <button aria-label="Close Voice Recorder" onClick={onClose} className="w-[30px] h-[30px] rounded-full bg-[#E5E5EA] dark:bg-[#38383A] flex items-center justify-center active:scale-95 transition-transform">
            <X className="w-4 h-4 text-[#8E8E93] dark:text-[#8E8E93]" strokeWidth={2.5} />
          </button>
        </div>

        <div className="flex-1 flex flex-col items-center justify-between pb-6 px-6 mt-2">
          
          {/* Status Text */}
          <div className="w-full flex flex-col items-center text-center">
            <h2 className="text-[34px] font-bold text-black/90 dark:text-white/90 tracking-tight leading-none drop-shadow-sm">
              {recorderState === 'recording' ? 'Listening...' : recorderState === 'paused' ? 'Paused' : 'Starting...'}
            </h2>
            <p className="text-[17px] text-black/60 dark:text-white/60 mt-3 font-medium">
              {recorderState === 'recording' ? 'Speak freely about your symptoms and mood.' : 'Resume when you are ready.'}
            </p>
          </div>

          {/* Canvas Voice Graph */}
          <div className="w-full h-32 flex items-center justify-center relative my-4">
            <canvas 
              ref={canvasRef} 
              width={300} 
              height={100} 
              className="transition-opacity duration-300 opacity-100"
            />
          </div>

          {/* Controls */}
          <div className="w-full flex flex-col items-center gap-6 mt-auto">
            
            <div className="flex items-center justify-center relative">
              {/* Central Mic Toggle - Glowing Glass Orb */}
              <button 
                aria-label={recorderState === 'recording' ? 'Pause Recording' : 'Resume Recording'}
                onClick={togglePause}
                className="active:scale-95 transition-transform cursor-pointer relative group"
              >
                {/* Glowing Aura Behind */}
                <div className={`absolute inset-0 rounded-full transition-all duration-700 blur-[20px] ${
                  recorderState === 'recording' 
                    ? 'bg-gradient-to-tr from-[#007AFF] via-[#5856D6] to-[#5AC8FA] opacity-70 animate-pulse-slow scale-110' 
                    : 'bg-transparent opacity-0'
                }`}></div>

                {/* Glass Orb */}
                <div className={`relative w-[84px] h-[84px] rounded-full flex items-center justify-center transition-all duration-300 backdrop-blur-xl border-[0.5px] ${
                  recorderState === 'recording' 
                    ? 'bg-white/10 dark:bg-black/20 border-white/30 dark:border-white/10 shadow-inner' 
                    : 'bg-black/5 dark:bg-white/5 border-black/5 dark:border-white/5'
                }`}>
                  {recorderState === 'recording' ? (
                    <Mic className="w-9 h-9 text-[#007AFF] dark:text-[#5AC8FA] drop-shadow-md" strokeWidth={1.5} />
                  ) : (
                    <MicOff className="w-9 h-9 text-black/40 dark:text-white/40" strokeWidth={1.5} />
                  )}
                </div>
              </button>
            </div>

            {/* Save to Log Button - iOS Glass Primary Button */}
            <button 
              aria-label="Save Recording to Health Log"
              onClick={handleSave}
              className={`w-[85%] py-4 rounded-[16px] font-semibold text-[17px] tracking-tight transition-all duration-300 backdrop-blur-md border-[0.5px] ${
                recorderState === 'idle' 
                  ? 'opacity-0 translate-y-4 pointer-events-none' 
                  : 'opacity-100 translate-y-0 bg-[#007AFF]/90 dark:bg-[#0A84FF]/80 text-white border-white/20 shadow-[0_8px_24px_rgba(0,122,255,0.25)] active:scale-[0.98]'
              }`}
            >
              Save to Health Log
            </button>

          </div>
        </div>
      </div>
    </div>
  );
}
