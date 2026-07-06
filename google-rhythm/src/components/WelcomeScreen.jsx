import React from 'react';
import { Activity, ArrowRight, Brain, Droplets, Shield } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

export default function WelcomeScreen({ onStart }) {
  const { isDarkMode } = useAppStore();

  return (
    <div className="fixed inset-0 z-[100] bg-white dark:bg-black flex flex-col overflow-y-auto animate-fade-in">
      
      {/* Dynamic Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[70%] h-[70%] rounded-full bg-blue-400/20 dark:bg-[#4285f4]/20 blur-3xl opacity-50 mix-blend-multiply dark:mix-blend-lighten animate-blob" />
        <div className="absolute top-[20%] -right-[10%] w-[60%] h-[60%] rounded-full bg-purple-400/20 dark:bg-purple-500/20 blur-3xl opacity-50 mix-blend-multiply dark:mix-blend-lighten animate-blob animation-delay-2000" />
        <div className="absolute -bottom-[20%] left-[20%] w-[80%] h-[80%] rounded-full bg-pink-400/20 dark:bg-pink-500/20 blur-3xl opacity-50 mix-blend-multiply dark:mix-blend-lighten animate-blob animation-delay-4000" />
      </div>

      <div className="flex-1 flex flex-col justify-center px-8 relative z-10">
        
        {/* Logo / Branding */}
        <div className="mb-8 mt-8 shrink-0">
          <svg width="56" height="56" viewBox="0 0 48 48" fill="none" className="mb-6">
            <path 
              d="M4 24H14L20 12L28 36L34 24H44" 
              stroke="url(#google-gradient)" 
              strokeWidth="6" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            />
            <defs>
              <linearGradient id="google-gradient" x1="0" y1="0" x2="48" y2="0">
                <stop offset="0%" stopColor="#4285f4"/>
                <stop offset="33%" stopColor="#ea4335"/>
                <stop offset="66%" stopColor="#fbbc04"/>
                <stop offset="100%" stopColor="#34a853"/>
              </linearGradient>
            </defs>
          </svg>
          <h1 className="text-[44px] leading-tight font-bold tracking-tight text-[#1f1f1f] dark:text-white mb-4">
            Rhythm
          </h1>
          <p className="text-[17px] text-gray-500 dark:text-gray-400 font-medium leading-relaxed max-w-[320px]">
            Your body has a rhythm. It's time to listen. Decode your cycle, understand your symptoms, and take back your month.
          </p>
        </div>

        {/* Feature Pills */}
        <div className="relative overflow-hidden bg-white/80 dark:bg-[#1c1c1e]/80 backdrop-saturate-150 backdrop-blur-3xl border-[0.5px] border-slate-200/60 dark:border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.06)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.1)] rounded-[32px] flex flex-col max-w-[340px] shrink-0">
          
          <div className="relative overflow-hidden p-5 flex gap-4 items-start transition-all duration-300 hover:bg-white/10 dark:hover:bg-white/5 border-b-[0.5px] border-black/5 dark:border-white/5">
            <div className="w-12 h-12 rounded-2xl bg-[#007AFF]/10 dark:bg-[#0A84FF]/10 flex items-center justify-center shrink-0 shadow-sm border-[0.5px] border-white/40 dark:border-white/5 z-10">
              <Brain className="w-6 h-6 text-[#007AFF] dark:text-[#0A84FF]" />
            </div>
            <div className="flex-1 z-10 pt-1">
              <p className="text-[16px] font-bold text-[#1f1f1f] dark:text-[#e3e3e3] mb-0.5 tracking-tight">AI-Powered Insights</p>
              <p className="text-[13px] font-medium text-gray-500 dark:text-gray-400">Know your energy drops before they happen.</p>
            </div>
          </div>
          
          <div className="relative overflow-hidden p-5 flex gap-4 items-start transition-all duration-300 hover:bg-white/10 dark:hover:bg-white/5 border-b-[0.5px] border-black/5 dark:border-white/5">
            <div className="w-12 h-12 rounded-2xl bg-[#FF2D55]/10 dark:bg-[#FF375F]/10 flex items-center justify-center shrink-0 shadow-sm border-[0.5px] border-white/40 dark:border-white/5 z-10">
              <Droplets className="w-6 h-6 text-[#FF2D55] dark:text-[#FF375F]" />
            </div>
            <div className="flex-1 z-10 pt-1">
              <p className="text-[16px] font-bold text-[#1f1f1f] dark:text-[#e3e3e3] mb-0.5 tracking-tight">Pinpoint Accuracy</p>
              <p className="text-[13px] font-medium text-gray-500 dark:text-gray-400">Never get caught off-guard by your cycle again.</p>
            </div>
          </div>

          <div className="relative overflow-hidden p-5 flex gap-4 items-start transition-all duration-300 hover:bg-white/10 dark:hover:bg-white/5">
            <div className="w-12 h-12 rounded-2xl bg-[#34C759]/10 dark:bg-[#30D158]/10 flex items-center justify-center shrink-0 shadow-sm border-[0.5px] border-white/40 dark:border-white/5 z-10">
              <Shield className="w-6 h-6 text-[#34C759] dark:text-[#30D158]" />
            </div>
            <div className="flex-1 z-10 pt-1">
              <p className="text-[16px] font-bold text-[#1f1f1f] dark:text-[#e3e3e3] mb-0.5 tracking-tight">100% Local Privacy</p>
              <p className="text-[13px] font-medium text-gray-500 dark:text-gray-400">Your health data never leaves your phone.</p>
            </div>
          </div>

        </div>

      </div>

      {/* Footer / CTA */}
      <div className="px-8 pt-6 pb-8 relative z-10 flex flex-col w-full shrink-0 mt-auto">
        <button 
          onClick={onStart}
          className="w-full py-4 bg-[#007AFF] dark:bg-[#0A84FF] text-white dark:text-[#121212] rounded-[16px] shadow-sm flex items-center justify-center gap-2 hover:scale-[0.98] transition-transform text-[17px] font-semibold tracking-tight"
        >
          Get Started <ArrowRight className="w-5 h-5" />
        </button>
        
        <div className="text-center mt-6">
          <div className="flex items-center justify-center gap-4 text-[12px] font-semibold text-gray-400 dark:text-gray-500 tracking-tight">
            <a href="/privacy.html" target="_blank" rel="noopener noreferrer" className="hover:text-[#1f1f1f] dark:hover:text-white transition-colors">Privacy Policy</a>
            <span>•</span>
            <a href="/terms.html" target="_blank" rel="noopener noreferrer" className="hover:text-[#1f1f1f] dark:hover:text-white transition-colors">Terms of Service</a>
          </div>
        </div>

        <p className="text-center text-[11px] text-gray-400 dark:text-gray-500 mt-6 font-bold tracking-widest uppercase">
          Your body. Your data. Your rules.
        </p>
      </div>

    </div>
  );
}
