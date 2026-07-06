import React, { useState } from 'react';
import { Activity, Moon, Droplets, Info, ChevronRight, ThermometerSun, Brain } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

const PerimenopauseDashboard = () => {
  const { isDarkMode } = useAppStore();
  const [cycleLength, setCycleLength] = useState(45);
  const [currentDay, setCurrentDay] = useState(20);
  
  const [hotFlashLog, setHotFlashLog] = useState(null);
  const [sleepLog, setSleepLog] = useState(null);

  const estrogenLevel = Math.max(10, Math.sin((currentDay / cycleLength) * Math.PI) * 100);
  let progesteroneLevel = 10;
  if (currentDay > cycleLength / 2) {
    progesteroneLevel = Math.max(5, Math.sin(((currentDay - cycleLength / 2) / (cycleLength / 2)) * Math.PI) * 80);
  }
  
  const hotFlashRisk = cycleLength > 40 ? 'High' : cycleLength < 26 ? 'Moderate' : 'Low';
  const sleepDisruption = hotFlashRisk === 'High' ? 'Severe' : cycleLength > 35 ? 'Moderate' : 'Mild';

  const radius = 90;
  const circumference = 2 * Math.PI * radius;
  const progress = currentDay / cycleLength;
  const progressOffset = circumference - progress * circumference;

  const angle = (progress * 2 * Math.PI) - (Math.PI / 2);
  const thumbX = 128 + radius * Math.cos(angle);
  const thumbY = 128 + radius * Math.sin(angle);

  return (
    <div className="px-6 pt-4 space-y-8 animate-fade-in pb-8">
      {/* Irregular Cycle Ring & Simulator */}
      <section className="flex flex-col items-center justify-center mt-2 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full blur-[80px] opacity-20 pointer-events-none transition-colors duration-1000" style={{ backgroundColor: '#f97316' }}></div>

        <div className="relative flex items-center justify-center">
          <svg className="w-[280px] h-[280px]" viewBox="0 0 256 256">
            <defs>
              <linearGradient id="cycleGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#a855f7" />
                <stop offset="100%" stopColor="#f97316" />
              </linearGradient>
              <filter id="thumbGlowPeri" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Background Track */}
            <circle 
              cx="128" cy="128" r={radius} 
              stroke={isDarkMode ? '#2a2a2c' : '#f1f5f9'} 
              strokeWidth="8" 
              fill="transparent" 
              className="transition-colors duration-300" 
            />
            
            {/* Progress Stroke */}
            <circle 
              cx="128" cy="128" r={radius} 
              stroke="url(#cycleGradient)" 
              strokeWidth="10" 
              fill="transparent" 
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={progressOffset}
              transform="rotate(-90 128 128)"
              className="transition-all duration-500 ease-out"
            />

            {/* Glowing Tracker Dot (Thumb) */}
            <circle
              cx={thumbX}
              cy={thumbY}
              r="7"
              fill={isDarkMode ? '#ffffff' : '#f97316'}
              stroke={isDarkMode ? '#f97316' : '#ffffff'}
              strokeWidth="3"
              filter="url(#thumbGlowPeri)"
              className="transition-all duration-500 ease-out"
            />
          </svg>
          
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
            <span className="text-sm font-semibold text-orange-500 dark:text-orange-400 tracking-wider mb-2">Day {currentDay}</span>
            <Activity className="w-14 h-14 text-orange-500 dark:text-orange-400 transition-colors duration-500" />
            <span className="text-xs font-bold text-gray-400 dark:text-gray-500 mt-2 uppercase tracking-widest">Irregular</span>
          </div>
        </div>

        {/* Variable Sliders */}
        <div className="mt-8 w-full bg-white dark:bg-[#1c1c1e]/80 backdrop-saturate-150 backdrop-blur-3xl shadow-[0_8px_30px_rgba(0,0,0,0.06)] border-[0.5px] border-slate-200/60 dark:border-white/10 p-6 rounded-[24px] shadow-sm transition-colors duration-300">
          <div className="mb-6">
            <label className="flex justify-between text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
              <span>Simulated Cycle Length</span>
              <span className="text-orange-500 dark:text-orange-400">{cycleLength} Days</span>
            </label>
            <input
              type="range"
              min="21"
              max="90"
              value={cycleLength}
              onChange={(e) => {
                const newLength = parseInt(e.target.value);
                setCycleLength(newLength);
                if (currentDay > newLength) setCurrentDay(newLength);
              }}
              className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-orange-500 dark:accent-orange-400"
            />
          </div>

          <div>
            <label className="flex justify-between text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
              <span>Current Day</span>
            </label>
            <input
              type="range"
              min="1"
              max={cycleLength}
              value={currentDay}
              onChange={(e) => setCurrentDay(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500 dark:accent-purple-400"
            />
          </div>
        </div>
      </section>

      {/* Hormone Fluctuation Indicator */}
      <section className="bg-white dark:bg-[#1c1c1e]/80 backdrop-saturate-150 backdrop-blur-3xl shadow-[0_8px_30px_rgba(0,0,0,0.06)] border-[0.5px] border-slate-200/60 dark:border-white/10 rounded-[24px] p-6 shadow-sm">
        <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">Hormone Fluctuations</h3>
        <div className="flex flex-col gap-4">
          <div className="w-full">
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-purple-600 dark:text-purple-400 font-bold">Estrogen</span>
              <span className="text-gray-500 dark:text-gray-400 font-medium">Variable</span>
            </div>
            <div className="w-full h-2 bg-gray-100 dark:bg-[#2a2a2a] rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-purple-500 to-purple-400 rounded-full transition-all duration-300" 
                style={{ width: `${estrogenLevel}%` }}
              />
            </div>
          </div>
          <div className="w-full">
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-orange-600 dark:text-orange-400 font-bold">Progesterone</span>
              <span className="text-gray-500 dark:text-gray-400 font-medium">{progesteroneLevel < 20 ? 'Low' : 'Surge'}</span>
            </div>
            <div className="w-full h-2 bg-gray-100 dark:bg-[#2a2a2a] rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-orange-500 to-orange-400 rounded-full transition-all duration-300" 
                style={{ width: `${progesteroneLevel}%` }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Symptom Intensity Forecast */}
      <section className="grid grid-cols-2 gap-4">
        <div className="bg-white dark:bg-[#1c1c1e]/80 backdrop-saturate-150 backdrop-blur-3xl shadow-[0_8px_30px_rgba(0,0,0,0.06)] border-[0.5px] border-slate-200/60 dark:border-white/10 p-6 rounded-[24px] shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-xl">
              <ThermometerSun className="w-5 h-5 text-red-500 dark:text-red-400" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mb-1">{hotFlashRisk}</p>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Hot Flashes</p>
        </div>
        <div className="bg-white dark:bg-[#1c1c1e]/80 backdrop-saturate-150 backdrop-blur-3xl shadow-[0_8px_30px_rgba(0,0,0,0.06)] border-[0.5px] border-slate-200/60 dark:border-white/10 p-6 rounded-[24px] shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
              <Moon className="w-5 h-5 text-blue-500 dark:text-blue-400" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mb-1">{sleepDisruption}</p>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Sleep Disruption</p>
        </div>
      </section>

      {/* Quick Log */}
      <section className="bg-white dark:bg-[#1c1c1e]/80 backdrop-saturate-150 backdrop-blur-3xl shadow-[0_8px_30px_rgba(0,0,0,0.06)] border-[0.5px] border-slate-200/60 dark:border-white/10 rounded-[24px] p-6 shadow-sm">
        <h2 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-5">Quick Daily Log</h2>
        
        <div className="mb-6">
          <label className="block text-sm font-bold text-slate-900 dark:text-white mb-3">Hot Flash Intensity</label>
          <div className="flex gap-2">
            {['None', 'Mild', 'Moderate', 'Severe'].map((level) => (
              <button
                key={level}
                onClick={() => setHotFlashLog(level)}
                className={`flex-1 py-2.5 text-xs font-bold rounded-xl border transition-all ${
                  hotFlashLog === level 
                    ? 'bg-red-50 dark:bg-red-900/20 border-red-500 dark:border-red-500/50 text-red-600 dark:text-red-400 shadow-sm' 
                    : 'bg-white/50 dark:bg-[#2c2c2e]/50 border-slate-200/60 dark:border-white/10 text-gray-500 dark:text-gray-400 hover:border-red-200 dark:hover:border-red-900/50'
                }`}
              >
                {level}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-900 dark:text-white mb-3">Sleep Quality</label>
          <div className="flex gap-2">
            {['Poor', 'Fair', 'Good', 'Excellent'].map((level) => (
              <button
                key={level}
                onClick={() => setSleepLog(level)}
                className={`flex-1 py-2.5 text-xs font-bold rounded-xl border transition-all ${
                  sleepLog === level 
                    ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500 dark:border-blue-500/50 text-blue-600 dark:text-blue-400 shadow-sm' 
                    : 'bg-white/50 dark:bg-[#2c2c2e]/50 border-slate-200/60 dark:border-white/10 text-gray-500 dark:text-gray-400 hover:border-blue-200 dark:hover:border-blue-900/50'
                }`}
              >
                {level}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Actionable Guidance */}
      <section className="space-y-4">
        <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-baseline">
          Today's Plan
        </h3>
        
        <div className="relative overflow-hidden bg-white dark:bg-[#1c1c1e]/80 backdrop-saturate-150 backdrop-blur-3xl border-[0.5px] border-slate-200/60 dark:border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.06)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.1)] rounded-[32px] flex flex-col">
          {/* Subtle ambient glow behind the plan stack */}
          <div className="absolute top-1/2 left-0 w-32 h-full bg-orange-500 opacity-[0.04] dark:opacity-[0.03] blur-[60px] pointer-events-none rounded-full -translate-y-1/2"></div>

          {/* Hormone Support */}
          <div className="relative overflow-hidden p-5 flex gap-4 transition-all duration-300 hover:bg-white/10 dark:hover:bg-white/5 group border-b-[0.5px] border-black/5 dark:border-white/5">
            <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.02] bg-green-500 pointer-events-none transition-opacity group-hover:opacity-[0.05]"></div>
            <div className="w-12 h-12 rounded-2xl bg-green-50 dark:bg-green-900/20 flex items-center justify-center shrink-0 shadow-sm border-[0.5px] border-white/40 dark:border-white/5 relative z-10 mt-0.5">
              <Droplets className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="relative z-10 flex-1 min-w-0">
              <p className="font-bold text-slate-900 dark:text-white text-sm tracking-tight">Hormone Support</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 leading-relaxed font-medium">Increase phytoestrogen intake today (flaxseeds, soy) to help stabilize erratic estrogen drops.</p>
            </div>
          </div>

          {/* Bone Health */}
          <div className="relative overflow-hidden p-5 flex gap-4 transition-all duration-300 hover:bg-white/10 dark:hover:bg-white/5 group border-b-[0.5px] border-black/5 dark:border-white/5">
            <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.02] bg-blue-500 pointer-events-none transition-opacity group-hover:opacity-[0.05]"></div>
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center shrink-0 shadow-sm border-[0.5px] border-white/40 dark:border-white/5 relative z-10 mt-0.5">
              <Activity className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="relative z-10 flex-1 min-w-0">
              <p className="font-bold text-slate-900 dark:text-white text-sm tracking-tight">Bone Health</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 leading-relaxed font-medium">Weight-bearing exercises are crucial now. Try a 20-min strength training routine.</p>
            </div>
          </div>

          {/* Sleep Hygiene */}
          <div className="relative overflow-hidden p-5 flex gap-4 transition-all duration-300 hover:bg-white/10 dark:hover:bg-white/5 group">
            <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.02] bg-purple-500 pointer-events-none transition-opacity group-hover:opacity-[0.05]"></div>
            <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center shrink-0 shadow-sm border-[0.5px] border-white/40 dark:border-white/5 relative z-10 mt-0.5">
              <Brain className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="relative z-10 flex-1 min-w-0">
              <p className="font-bold text-slate-900 dark:text-white text-sm tracking-tight">Sleep Hygiene</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 leading-relaxed font-medium">Keep bedroom temperature below 65°F (18°C) tonight to minimize hot flashes and night sweats.</p>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};

export default PerimenopauseDashboard;
