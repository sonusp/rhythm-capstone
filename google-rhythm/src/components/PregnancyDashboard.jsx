import React, { useState, useEffect } from 'react';
import { 
  Baby, Heart, Apple, Dumbbell, Brain, Activity, 
  ChevronRight, Calendar, Info, CheckCircle2, 
  Footprints, Droplet, Star
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

export default function PregnancyDashboard() {
  const { isDarkMode, userPrefs } = useAppStore();
  const isPostpartum = userPrefs?.lifecycleMode === 'postpartum';

  const [week, setWeek] = useState(16);
  const [kicks, setKicks] = useState(0);
  const [vitaminsTaken, setVitaminsTaken] = useState(false);
  const [waterGlasses, setWaterGlasses] = useState(0);

  useEffect(() => {
    if (!isPostpartum && week > 40) setWeek(40);
  }, [isPostpartum, week]);

  const totalWeeks = isPostpartum ? 52 : 40;
  
  const getMilestone = (currentWeek, isPostpartumMode) => {
    if (isPostpartumMode) {
      if (currentWeek <= 2) return { size: "Healing Phase", desc: "Your body is doing incredible work to recover." };
      if (currentWeek <= 6) return { size: "Bonding Time", desc: "Baby is becoming more alert and recognizing your voice." };
      if (currentWeek <= 12) return { size: "First Smiles", desc: "You might start seeing those precious first social smiles!" };
      if (currentWeek <= 24) return { size: "Rolling Over", desc: "Baby is getting stronger and might start rolling." };
      if (currentWeek <= 40) return { size: "Sitting Up", desc: "Supported sitting and reaching for objects." };
      return { size: "First Steps Prep", desc: "Crawling and pulling up to stand might be happening!" };
    } else {
      if (currentWeek <= 4) return { size: "Poppy Seed", desc: "The neural tube is starting to form." };
      if (currentWeek <= 8) return { size: "Raspberry", desc: "Webbed fingers and toes are forming." };
      if (currentWeek <= 12) return { size: "Plum", desc: "Almost all organ systems are formed." };
      if (currentWeek <= 16) return { size: "Avocado", desc: "Baby might start hearing your voice!" };
      if (currentWeek <= 20) return { size: "Banana", desc: "You might feel the first flutters." };
      if (currentWeek <= 24) return { size: "Ear of Corn", desc: "Baby's footprint and fingerprints are forming." };
      if (currentWeek <= 28) return { size: "Eggplant", desc: "Baby can open and close their eyes." };
      if (currentWeek <= 32) return { size: "Squash", desc: "Baby is practicing breathing movements." };
      if (currentWeek <= 36) return { size: "Papaya", desc: "Baby is gaining about an ounce a day." };
      return { size: "Watermelon", desc: "Ready to meet the world!" };
    }
  };

  const getGuidance = (currentWeek, isPostpartumMode) => {
    if (isPostpartumMode) {
      if (currentWeek <= 6) {
        return {
          nutrition: "Focus on warm, easily digestible foods. Keep taking your prenatal vitamins.",
          fitness: "Rest is your priority. Gentle pelvic floor exercises when approved.",
          mental: "Be gentle with yourself. The 'baby blues' are common—reach out for support."
        };
      } else {
        return {
          nutrition: "Hydration is key, especially if breastfeeding. Maintain nutrient-dense meals.",
          fitness: "Gradually resume light activities like walking. Listen to your body.",
          mental: "Find pockets of time for yourself. Connect with other new parents."
        };
      }
    } else {
      if (currentWeek <= 13) {
        return {
          nutrition: "Folate is crucial now. If nauseous, try small frequent meals and ginger.",
          fitness: "Gentle walks and prenatal yoga can help with fatigue.",
          mental: "It's normal to feel overwhelmed. Rest when your body asks for it."
        };
      } else if (currentWeek <= 27) {
        return {
          nutrition: "Increase iron and calcium intake to support baby's rapid growth.",
          fitness: "Swimming or prenatal pilates are great as your center of gravity shifts.",
          mental: "Many experience a 'golden energy' phase—enjoy it, but don't overdo it!"
        };
      } else {
        return {
          nutrition: "Omega-3s for brain development. Eat smaller meals to prevent heartburn.",
          fitness: "Focus on pelvic floor prep, stretching, and staying comfortable.",
          mental: "Nesting is real. Practice breathing exercises for labor prep."
        };
      }
    }
  };

  const milestone = getMilestone(week, isPostpartum);
  const guidance = getGuidance(week, isPostpartum);

  // Ring Calculation
  const radius = 90;
  const circumference = 2 * Math.PI * radius;
  const progress = week / totalWeeks;
  const strokeDashoffset = circumference - circumference * progress;

  const t1Active = !isPostpartum && week >= 1;
  const t2Active = !isPostpartum && week >= 14;
  const t3Active = !isPostpartum && week >= 28;
  
  const p1Active = isPostpartum && week >= 1;
  const p2Active = isPostpartum && week >= 7;
  const p3Active = isPostpartum && week >= 25;

  const ringColor = isPostpartum ? "#a855f7" : "#ec4899"; // purple-500 : pink-500

  const angle = (progress * 2 * Math.PI) - (Math.PI / 2);
  const thumbX = 128 + radius * Math.cos(angle);
  const thumbY = 128 + radius * Math.sin(angle);

  return (
    <div className="px-6 pt-4 space-y-8 animate-fade-in pb-8">

      {/* Current Week Visualization (Circular Ring) */}
      <section className="flex flex-col items-center justify-center mt-2 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full blur-[80px] opacity-20 pointer-events-none transition-colors duration-1000" style={{ backgroundColor: ringColor }}></div>

        <div className="relative flex items-center justify-center">
          <svg className="w-[280px] h-[280px]" viewBox="0 0 256 256">
            <defs>
              <linearGradient id="pregRingGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={ringColor} />
                <stop offset="100%" stopColor={ringColor} stopOpacity="0.4" />
              </linearGradient>
              <filter id="thumbGlowPreg" x="-20%" y="-20%" width="140%" height="140%">
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
              stroke="url(#pregRingGradient)"
              strokeWidth="10"
              fill="transparent"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              transform="rotate(-90 128 128)"
              className="transition-all duration-700 ease-out"
            />

            {/* Glowing Tracker Dot (Thumb) */}
            <circle
              cx={thumbX}
              cy={thumbY}
              r="7"
              fill={isDarkMode ? '#ffffff' : ringColor}
              stroke={isDarkMode ? ringColor : '#ffffff'}
              strokeWidth="3"
              filter="url(#thumbGlowPreg)"
              className="transition-all duration-500 ease-out"
            />
          </svg>
          
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
            {isPostpartum ? (
              <Heart className="w-8 h-8 text-purple-500 dark:text-purple-400 mb-1" />
            ) : (
              <Baby className="w-8 h-8 text-pink-500 dark:text-pink-400 mb-1" />
            )}
            <span className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Wk {week}</span>
            <span className="text-xs font-bold text-gray-400 dark:text-gray-500 mt-1 uppercase tracking-widest">
              {isPostpartum ? "Postpartum" : "Pregnancy"}
            </span>
          </div>
        </div>
        <div className="mt-6 text-center">
          <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">
            {totalWeeks - week} weeks until {isPostpartum ? "1 Year Milestone" : "Estimated Due Date"}
          </p>
        </div>

        {/* Milestone Card */}
        <div className={`mt-8 w-full rounded-[24px] p-6 flex items-center justify-between shadow-sm transition-colors duration-300 border-none ${isPostpartum ? 'bg-purple-50 dark:bg-gradient-to-r dark:from-[#2a1b38] dark:to-[#1f2038]' : 'bg-white dark:bg-[#1c1c1e]/80 backdrop-saturate-150 backdrop-blur-3xl shadow-[0_8px_30px_rgba(0,0,0,0.06)] border-[0.5px] border-slate-200/60 dark:border-white/10'}`}>
          <div className="flex-1 pr-4">
            <div className="flex items-center gap-1.5 mb-1">
              <span className={`text-xs font-bold uppercase tracking-wider ${isPostpartum ? 'text-purple-600 dark:text-purple-400' : 'text-pink-600 dark:text-pink-400'}`}>
                {isPostpartum ? "Postpartum Milestone" : "Baby's Size"}
              </span>
            </div>
            <h4 className="font-bold text-slate-900 dark:text-white text-lg mb-1">
              {isPostpartum ? milestone.size : `Like a ${milestone.size}`}
            </h4>
            <p className="text-xs text-gray-600 dark:text-[#8e918f] leading-relaxed">
              {milestone.desc}
            </p>
          </div>
          <div className="shrink-0 pl-2">
             <ChevronRight className={`w-5 h-5 ${isPostpartum ? 'text-purple-500 dark:text-purple-400' : 'text-pink-500 dark:text-pink-400'}`} />
          </div>
        </div>

        {/* INTERACTIVE WEEK SIMULATOR SLIDER */}
        <div className="mt-6 w-full bg-white dark:bg-[#1c1c1e]/80 backdrop-saturate-150 backdrop-blur-3xl shadow-[0_8px_30px_rgba(0,0,0,0.06)] border-[0.5px] border-slate-200/60 dark:border-white/10 p-6 rounded-[24px] shadow-sm transition-colors duration-300">
          <label className="flex justify-between text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
            <span>Interactive Simulator</span>
            <span className={isPostpartum ? 'text-purple-500 dark:text-purple-400' : 'text-pink-500 dark:text-pink-400'}>Week {week} / {totalWeeks}</span>
          </label>
          <input 
            type="range" 
            min="1" 
            max={totalWeeks} 
            value={week} 
            onChange={(e) => setWeek(parseInt(e.target.value))}
            className={`w-full h-2 rounded-lg appearance-none cursor-pointer bg-gray-200 dark:bg-gray-700 ${isPostpartum ? 'accent-purple-500 dark:accent-purple-400' : 'accent-pink-500 dark:accent-pink-400'}`}
          />
          <div className="flex justify-between text-xs text-gray-400 dark:text-gray-600 mt-3 font-medium">
            <span>Week 1</span>
            <span>Week {totalWeeks}</span>
          </div>
        </div>
      </section>

      {/* Timeline */}
      <div className="w-full bg-white dark:bg-[#1c1c1e]/80 backdrop-saturate-150 backdrop-blur-3xl shadow-[0_8px_30px_rgba(0,0,0,0.06)] border-[0.5px] border-slate-200/60 dark:border-white/10 rounded-[24px] p-6 shadow-sm">
        <h3 className="text-slate-900 dark:text-white font-medium mb-6 flex items-center text-lg">
          <Calendar className={`w-5 h-5 mr-2 ${isPostpartum ? 'text-purple-500 dark:text-purple-400' : 'text-pink-500 dark:text-pink-400'}`} />
          {isPostpartum ? 'Recovery Timeline' : 'Trimester Timeline'}
        </h3>
        
        <div className="relative px-2">
          {/* Background Line */}
          <div className="absolute left-[16.66%] right-[16.66%] top-4 -translate-y-1/2 h-1.5 bg-gray-100 dark:bg-[#2a2a2a] rounded-full z-0" />
          
          {/* Active Line */}
          <div 
            className={`absolute left-[16.66%] top-4 -translate-y-1/2 h-1.5 rounded-full z-0 transition-all duration-500 ${isPostpartum ? 'bg-purple-500' : 'bg-pink-500'}`}
            style={{ 
              width: `calc(66.66% * ${
                isPostpartum 
                  ? (week < 7 ? 0 : week < 25 ? 0.5 : 1)
                  : (week < 14 ? 0 : week < 28 ? 0.5 : 1)
              })`
            }}
          />
          
          {/* Nodes Container */}
          <div className="relative z-10 flex justify-between items-start">
            <div className="flex flex-col items-center w-1/3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${(isPostpartum ? p1Active : t1Active) ? (isPostpartum ? 'bg-purple-500 text-white shadow-md shadow-purple-500/30' : 'bg-pink-500 text-white shadow-md shadow-pink-500/30') : 'bg-gray-100 dark:bg-[#2a2a2a] text-gray-400 dark:text-gray-500'}`}>1</div>
              <span className={`text-sm mt-2 font-bold text-center uppercase tracking-wider ${(isPostpartum ? p1Active : t1Active) ? (isPostpartum ? 'text-purple-600 dark:text-purple-400' : 'text-pink-600 dark:text-pink-400') : 'text-gray-500 dark:text-gray-500'}`}>
                {isPostpartum ? 'Healing' : 'T1'}<br/><span className="text-xs font-medium text-gray-400">{isPostpartum ? '(Wk 1-6)' : '(Wk 1-13)'}</span>
              </span>
            </div>
            
            <div className="flex flex-col items-center w-1/3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${(isPostpartum ? p2Active : t2Active) ? (isPostpartum ? 'bg-purple-500 text-white shadow-md shadow-purple-500/30' : 'bg-pink-500 text-white shadow-md shadow-pink-500/30') : 'bg-gray-100 dark:bg-[#2a2a2a] text-gray-400 dark:text-gray-500'}`}>2</div>
              <span className={`text-sm mt-2 font-bold text-center uppercase tracking-wider ${(isPostpartum ? p2Active : t2Active) ? (isPostpartum ? 'text-purple-600 dark:text-purple-400' : 'text-pink-600 dark:text-pink-400') : 'text-gray-500 dark:text-gray-500'}`}>
                {isPostpartum ? 'Growth' : 'T2'}<br/><span className="text-xs font-medium text-gray-400">{isPostpartum ? '(Wk 7-24)' : '(Wk 14-27)'}</span>
              </span>
            </div>

            <div className="flex flex-col items-center w-1/3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${(isPostpartum ? p3Active : t3Active) ? (isPostpartum ? 'bg-purple-500 text-white shadow-md shadow-purple-500/30' : 'bg-pink-500 text-white shadow-md shadow-pink-500/30') : 'bg-gray-100 dark:bg-[#2a2a2a] text-gray-400 dark:text-gray-500'}`}>3</div>
              <span className={`text-sm mt-2 font-bold text-center uppercase tracking-wider ${(isPostpartum ? p3Active : t3Active) ? (isPostpartum ? 'text-purple-600 dark:text-purple-400' : 'text-pink-600 dark:text-pink-400') : 'text-gray-500 dark:text-gray-500'}`}>
                {isPostpartum ? 'Thriving' : 'T3'}<br/><span className="text-xs font-medium text-gray-400">{isPostpartum ? '(Wk 25-52)' : '(Wk 28-40)'}</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Guidance Cards */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-baseline">
          Today's Plan
        </h3>
        
        <div className="relative overflow-hidden bg-white dark:bg-[#1c1c1e]/80 backdrop-saturate-150 backdrop-blur-3xl border-[0.5px] border-slate-200/60 dark:border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.06)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.1)] rounded-[32px] flex flex-col">
          {/* Subtle ambient glow behind the plan stack */}
          <div className={`absolute top-1/2 left-0 w-32 h-full ${isPostpartum ? 'bg-purple-500' : 'bg-pink-500'} opacity-[0.04] dark:opacity-[0.03] blur-[60px] pointer-events-none rounded-full -translate-y-1/2`}></div>

          {/* Nutrition */}
          <div className="relative overflow-hidden p-5 flex gap-4 transition-all duration-300 hover:bg-white/10 dark:hover:bg-white/5 group border-b-[0.5px] border-black/5 dark:border-white/5">
            <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.02] bg-green-500 pointer-events-none transition-opacity group-hover:opacity-[0.05]"></div>
            <div className="w-12 h-12 rounded-2xl bg-green-50 dark:bg-green-900/20 flex items-center justify-center shrink-0 shadow-sm border-[0.5px] border-white/40 dark:border-white/5 relative z-10 mt-0.5">
              <Apple className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="relative z-10 flex-1 min-w-0">
              <p className="font-bold text-slate-900 dark:text-white text-sm tracking-tight">Nutrition</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 leading-relaxed font-medium">{guidance.nutrition}</p>
            </div>
          </div>

          {/* Fitness */}
          <div className="relative overflow-hidden p-5 flex gap-4 transition-all duration-300 hover:bg-white/10 dark:hover:bg-white/5 group border-b-[0.5px] border-black/5 dark:border-white/5">
            <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.02] bg-blue-500 pointer-events-none transition-opacity group-hover:opacity-[0.05]"></div>
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center shrink-0 shadow-sm border-[0.5px] border-white/40 dark:border-white/5 relative z-10 mt-0.5">
              <Dumbbell className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="relative z-10 flex-1 min-w-0">
              <p className="font-bold text-slate-900 dark:text-white text-sm tracking-tight">Fitness</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 leading-relaxed font-medium">{guidance.fitness}</p>
            </div>
          </div>

          {/* Mental Health */}
          <div className="relative overflow-hidden p-5 flex gap-4 transition-all duration-300 hover:bg-white/10 dark:hover:bg-white/5 group">
            <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.02] bg-purple-500 pointer-events-none transition-opacity group-hover:opacity-[0.05]"></div>
            <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center shrink-0 shadow-sm border-[0.5px] border-white/40 dark:border-white/5 relative z-10 mt-0.5">
              <Brain className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="relative z-10 flex-1 min-w-0">
              <p className="font-bold text-slate-900 dark:text-white text-sm tracking-tight">Mind & Body</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 leading-relaxed font-medium">{guidance.mental}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Log */}
      <div className="bg-white dark:bg-[#1c1c1e]/80 backdrop-saturate-150 backdrop-blur-3xl shadow-[0_8px_30px_rgba(0,0,0,0.06)] border-[0.5px] border-slate-200/60 dark:border-white/10 rounded-[24px] p-6 shadow-sm">
        <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white mb-5 flex items-center">
          <Activity className={`w-5 h-5 mr-2 ${isPostpartum ? 'text-purple-500 dark:text-purple-400' : 'text-blue-500 dark:text-blue-400'}`} />
          Daily Quick Log
        </h3>
        
        <div className="space-y-3">
          {/* Vitamins */}
          <div className="flex items-center justify-between p-4 bg-white/50 dark:bg-[#2c2c2e]/50 rounded-2xl border border-slate-200/60 dark:border-white/5 shadow-sm">
            <div className="flex items-center space-x-4">
              <div className={`p-2.5 rounded-xl ${vitaminsTaken ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' : 'bg-gray-200 dark:bg-gray-800 text-gray-500 dark:text-gray-400'}`}>
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">{isPostpartum ? 'Postnatal' : 'Prenatal'} Vitamins</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{vitaminsTaken ? 'Taken today' : 'Not taken yet'}</p>
              </div>
            </div>
            <button 
              onClick={() => setVitaminsTaken(!vitaminsTaken)}
              className={`px-5 py-2 rounded-full text-xs font-bold transition-colors ${
                vitaminsTaken ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-gray-200 dark:bg-[#333] text-gray-700 dark:text-white hover:bg-gray-300 dark:hover:bg-[#444]'
              }`}
            >
              {vitaminsTaken ? 'Logged' : 'Log'}
            </button>
          </div>

          {/* Kicks — pregnancy only */}
          {!isPostpartum && (
            <div className="flex items-center justify-between p-4 bg-white/50 dark:bg-[#2c2c2e]/50 rounded-2xl border border-slate-200/60 dark:border-white/5 shadow-sm">
              <div className="flex items-center space-x-4">
                <div className="p-2.5 rounded-xl bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400">
                  <Footprints className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">Kick Counter</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{kicks} kicks logged</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button 
                  onClick={() => setKicks(Math.max(0, kicks - 1))}
                  className="w-8 h-8 rounded-full bg-gray-200 dark:bg-[#333] text-gray-700 dark:text-white flex items-center justify-center hover:bg-gray-300 dark:hover:bg-[#444] transition-colors"
                >
                  -
                </button>
                <button 
                  onClick={() => setKicks(kicks + 1)}
                  className="w-8 h-8 rounded-full bg-pink-500 dark:bg-pink-600 text-white flex items-center justify-center hover:bg-pink-600 dark:hover:bg-pink-700 transition-colors"
                >
                  +
                </button>
              </div>
            </div>
          )}

          {/* Hydration */}
          <div className="flex items-center justify-between p-4 bg-white/50 dark:bg-[#2c2c2e]/50 rounded-2xl border border-slate-200/60 dark:border-white/5 shadow-sm">
            <div className="flex items-center space-x-4">
              <div className="p-2.5 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                <Droplet className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">Hydration</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{waterGlasses}/8 glasses</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
               <button 
                  onClick={() => setWaterGlasses(Math.max(0, waterGlasses - 1))}
                  className="w-8 h-8 rounded-full bg-gray-200 dark:bg-[#333] text-gray-700 dark:text-white flex items-center justify-center hover:bg-gray-300 dark:hover:bg-[#444] transition-colors"
                >
                  -
                </button>
                <button 
                  onClick={() => setWaterGlasses(waterGlasses + 1)}
                  className="w-8 h-8 rounded-full bg-blue-500 dark:bg-blue-600 text-white flex items-center justify-center hover:bg-blue-600 dark:hover:bg-blue-700 transition-colors"
                >
                  +
                </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
