import React, { useState, useRef, useEffect } from 'react';
import { 
  Zap, Stethoscope, FileText, Download, Activity, CheckCircle, 
  MessageSquare, Send, Apple, Heart, Share2, Pill, CheckSquare, Users, Sparkles, BarChart2, AlignLeft, CalendarPlus, Loader, Bot
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

import { askNIMInsights, generateCustomPlan, generateInsightsSummary } from '../services/nimService';
import { getLocalLogs, getCachedInsight, saveCachedInsight } from '../services/db';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, ScatterChart, Scatter, ZAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart, ReferenceLine
} from 'recharts';
import DoctorReportModal from './DoctorReportModal';

// ─── MOCK DATA ───────────────────────────────────────────────────────────────
const CYCLE_HISTORY = [
  { month: 'August 2025',  length: 28, tags: ['Normal'] },
  { month: 'July 2025',    length: 29, tags: ['Normal'] },
  { month: 'June 2025',    length: 27, tags: ['Normal'] },
  { month: 'May 2025',     length: 35, tags: ['Outlier Ignored'] },
];

const PREGNANCY_HISTORY = [
  { month: 'Week 12',  length: '110/70', tags: ['Normal'], subtitle: 'Blood Pressure' },
  { month: 'Week 11',  length: '112/72', tags: ['Normal'], subtitle: 'Blood Pressure' },
  { month: 'Week 10',  length: '110/70', tags: ['Normal'], subtitle: 'Blood Pressure' },
  { month: 'Week 9',   length: '115/75', tags: ['Normal'], subtitle: 'Blood Pressure' },
];

const PERIMENOPAUSE_HISTORY = [
  { month: 'August 2025',  length: 45, tags: ['Highly Irregular'], subtitle: 'Days' },
  { month: 'July 2025',    length: 21, tags: ['Short'], subtitle: 'Days' },
  { month: 'June 2025',    length: 35, tags: ['Normal'], subtitle: 'Days' },
  { month: 'May 2025',     length: 28, tags: ['Normal'], subtitle: 'Days' },
];

// ─── CHART MOCK DATA ───
const HORMONE_DATA = [
  { day: 1, estrogen: 20, progesterone: 10 },
  { day: 7, estrogen: 40, progesterone: 12 },
  { day: 14, estrogen: 100, progesterone: 15 },
  { day: 21, estrogen: 60, progesterone: 90 },
  { day: 28, estrogen: 20, progesterone: 10 },
];
const CYCLE_LENGTH_DATA = [
  { month: 'Mar', length: 28 }, { month: 'Apr', length: 30 }, { month: 'May', length: 35 },
  { month: 'Jun', length: 27 }, { month: 'Jul', length: 29 }, { month: 'Aug', length: 28 }
];
const WEIGHT_DATA = [
  { week: 10, weight: 140, minBound: 138, maxBound: 142 },
  { week: 15, weight: 145, minBound: 142, maxBound: 147 },
  { week: 20, weight: 152, minBound: 148, maxBound: 155 },
  { week: 25, weight: 160, minBound: 155, maxBound: 164 },
  { week: 30, weight: 168, minBound: 162, maxBound: 172 },
  { week: 34, weight: 173, minBound: 168, maxBound: 178 },
];
const BP_DATA = [
  { week: 10, sys: 110, dia: 70 },
  { week: 20, sys: 112, dia: 72 },
  { week: 30, sys: 115, dia: 75 },
  { week: 34, sys: 118, dia: 78 },
];
const SLEEP_SWEATS_DATA = [
  { day: 'Mon', sleep: 7, sweats: 2 },
  { day: 'Tue', sleep: 5, sweats: 8 },
  { day: 'Wed', sleep: 4, sweats: 9 },
  { day: 'Thu', sleep: 6, sweats: 4 },
  { day: 'Fri', sleep: 8, sweats: 1 },
  { day: 'Sat', sleep: 7, sweats: 2 },
  { day: 'Sun', sleep: 5, sweats: 7 },
];
const CYCLE_GAP_DATA = [
  { month: 'Mar', gap: 28 },
  { month: 'Apr', gap: 35 },
  { month: 'May', gap: 21 },
  { month: 'Jun', gap: 45 },
  { month: 'Jul', gap: 60 },
  { month: 'Aug', gap: 42 },
];
const BBT_DATA = [
  { day: 1, temp: 36.2 }, { day: 5, temp: 36.3 }, { day: 10, temp: 36.2 },
  { day: 13, temp: 36.1 }, { day: 14, temp: 36.6 }, { day: 16, temp: 36.8 },
  { day: 20, temp: 36.8 }, { day: 25, temp: 36.7 }, { day: 28, temp: 36.3 }
];
const PREGNANCY_SYMPTOMS_DATA = [
  { week: 4, nausea: 2, fatigue: 4 },
  { week: 8, nausea: 8, fatigue: 9 },
  { week: 12, nausea: 6, fatigue: 7 },
  { week: 16, nausea: 2, fatigue: 4 },
  { week: 20, nausea: 0, fatigue: 3 },
  { week: 24, nausea: 0, fatigue: 5 },
];
const HOT_FLASH_DATA = [
  { day: 1, time: 2, intensity: 400 },
  { day: 3, time: 14, intensity: 800 },
  { day: 5, time: 20, intensity: 600 },
  { day: 7, time: 3, intensity: 900 },
  { day: 10, time: 18, intensity: 500 },
  { day: 12, time: 1, intensity: 700 },
];

// ─── CHARTS COMPONENTS ───
function StandardCharts({ fixedWidth, currentDay, logs }) {
  const { cycleLength } = useAppStore(state => state.userPrefs);
  const baseLength = parseInt(cycleLength) || 28;

  // Generate historical data based on user's baseline cycle length
  const dynamicCycleLengthData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    // Simulate slight natural variation for past months (-2 to +2 days)
    const variation = i === 5 ? 0 : Math.floor(Math.sin(i * 123) * 2); 
    return { month: d.toLocaleString('default', { month: 'short' }), length: baseLength + variation };
  });
  const avgLength = (dynamicCycleLengthData.reduce((acc, curr) => acc + curr.length, 0) / 6).toFixed(1);

  // Calculate dynamic symptom trend from real logs for this cycle
  const currentCycleLogs = (logs || []).filter(l => {
    const logDate = new Date(l.date || l.timestamp || new Date());
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - (currentDay || 1) + 1);
    cutoff.setHours(0, 0, 0, 0);
    return logDate >= cutoff;
  });

  const SYMPTOM_TREND_DATA = Array.from({ length: 28 }, (_, i) => {
    const day = i + 1;
    
    // Don't draw flat 0s for future days that haven't happened yet
    if (currentDay && day > currentDay) {
      return { day, symptoms: null, flow: null };
    }

    const logForDay = currentCycleLogs.find(l => parseInt(l.cycleDay) === day);
    const symptomCount = logForDay?.symptoms?.length || 0;
    
    let flowLevel = 0;
    if (logForDay?.flow === 'Light') flowLevel = 1;
    if (logForDay?.flow === 'Medium') flowLevel = 2;
    if (logForDay?.flow === 'Heavy') flowLevel = 3;

    // Mood & Energy parsing
    let energyScore = 3; // Baseline
    if (logForDay?.energy) {
      const e = logForDay.energy.toLowerCase();
      if (e.includes('exhausted')) energyScore = 1;
      else if (e.includes('low')) energyScore = 2;
      else if (e.includes('normal')) energyScore = 3;
      else if (e.includes('high')) energyScore = 4;
      else if (e.includes('bursting')) energyScore = 5;
    }
    
    let moodScore = 3; // Baseline
    if (logForDay?.moods?.length) {
      const moods = logForDay.moods.map(m => m.toLowerCase());
      if (moods.includes('sad') || moods.includes('anxious') || moods.includes('angry')) moodScore = 1;
      else if (moods.includes('happy') || moods.includes('excited')) moodScore = 5;
      else if (moods.includes('calm')) moodScore = 4;
      else moodScore = 3;
    }

    return { 
      day, 
      symptoms: symptomCount,
      flow: flowLevel,
      energy: energyScore,
      mood: moodScore
    };
  });

  return (
    <div className="space-y-6 animate-fade-in">


      <div className="relative overflow-hidden bg-white/60 dark:bg-[#1A1C1E]/60 backdrop-saturate-[1.8] backdrop-blur-[50px] border-[0.5px] border-white/40 dark:border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.15)] p-6 rounded-[32px] transition-all duration-300 hover:shadow-[0_8px_32px_rgba(0,0,0,0.2)]">
        <div className="absolute top-1/2 left-0 w-32 h-full bg-blue-500/10 dark:bg-blue-400/10 blur-[60px] pointer-events-none rounded-full -translate-y-1/2"></div>
        <h3 className="font-black text-xl tracking-tight text-slate-900 dark:text-white mb-4">Your Logged Symptoms & Flow</h3>
        <div className="-mx-2 sm:-mx-4" style={{ height: 320 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={SYMPTOM_TREND_DATA} margin={{ top: 20, right: 10, left: -20, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#8e8e93" strokeOpacity={0.15} vertical={false} />
              <XAxis axisLine={false} tickLine={false} dataKey="day" height={35} tick={{fontSize: 12, fill: '#8e8e93', fontWeight: 600}} tickMargin={12} minTickGap={20} />
              <YAxis axisLine={false} tickLine={false} allowDecimals={false} domain={[0, 'dataMax + 1']} tick={{fontSize: 12, fill: '#8e8e93', fontWeight: 600}} tickMargin={12} />
              <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', backgroundColor: 'rgba(255,255,255,0.9)', color: '#000', fontWeight: 600 }} />
              <Legend layout="horizontal" verticalAlign="bottom" align="center" iconType="circle" wrapperStyle={{ marginBottom: '-10px', paddingTop: '15px', fontSize: '13px', whiteSpace: 'nowrap', fontWeight: 500 }} />
              <Line type="monotone" dataKey="symptoms" name="Symptoms" stroke="#ff2d55" strokeWidth={4} dot={{ r: 0 }} activeDot={{ r: 6, fill: '#ff2d55', stroke: '#fff', strokeWidth: 2 }} />
              <Line type="monotone" dataKey="flow" name="Flow Level" stroke="#007aff" strokeWidth={4} dot={{ r: 0 }} activeDot={{ r: 6, fill: '#007aff', stroke: '#fff', strokeWidth: 2 }} />
              {currentDay && <ReferenceLine x={currentDay} stroke="#8e8e93" strokeWidth={2} strokeDasharray="3 3" label={{ position: 'top', value: 'Today', fill: '#8e8e93', fontSize: 12, fontWeight: 'bold' }} />}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      <div className="relative overflow-hidden bg-white/60 dark:bg-[#1A1C1E]/60 backdrop-saturate-[1.8] backdrop-blur-[50px] border-[0.5px] border-white/40 dark:border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.15)] p-6 rounded-[32px] transition-all duration-300 hover:shadow-[0_8px_32px_rgba(0,0,0,0.2)]">
        <div className="absolute top-1/2 left-0 w-32 h-full bg-blue-500/10 dark:bg-blue-400/10 blur-[60px] pointer-events-none rounded-full -translate-y-1/2"></div>
        <div className="flex justify-between items-end mb-4">
          <h3 className="font-black text-xl tracking-tight text-slate-900 dark:text-white">Cycle Length Trends</h3>
          <div className="text-right">
            <span className="text-[11px] uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400 block mb-1">Average</span>
            <div className="text-xl font-black text-[#007aff] leading-none">{avgLength} <span className="text-[10px] text-[#007aff]/70 font-bold uppercase tracking-widest ml-1">Days</span></div>
          </div>
        </div>
        <div className="-mx-2 sm:-mx-4" style={{ height: 320 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dynamicCycleLengthData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#8e8e93" strokeOpacity={0.15} vertical={false} />
              <XAxis axisLine={false} tickLine={false} dataKey="month" tick={{fontSize: 12, fill: '#8e8e93', fontWeight: 600}} tickMargin={12} />
              <YAxis axisLine={false} tickLine={false} domain={[baseLength - 8, baseLength + 8]} tick={{fontSize: 12, fill: '#8e8e93', fontWeight: 600}} tickMargin={12} />
              <Tooltip cursor={{ fill: 'rgba(142, 142, 147, 0.1)' }} contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', backgroundColor: 'rgba(255,255,255,0.9)', color: '#000', fontWeight: 600 }} />
              <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '13px', fontWeight: 500 }}/>
              <Bar dataKey="length" name="Days" fill="#ff2d55" barSize={16} radius={[10, 10, 10, 10]} />
              <ReferenceLine y={avgLength} stroke="#007aff" strokeWidth={2} strokeDasharray="4 4" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="relative overflow-hidden bg-white/60 dark:bg-[#1A1C1E]/60 backdrop-saturate-[1.8] backdrop-blur-[50px] border-[0.5px] border-white/40 dark:border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.15)] p-6 rounded-[32px] transition-all duration-300 hover:shadow-[0_8px_32px_rgba(0,0,0,0.2)]">
        <div className="absolute top-1/2 left-0 w-32 h-full bg-purple-500/10 dark:bg-purple-400/10 blur-[60px] pointer-events-none rounded-full -translate-y-1/2"></div>
        <div className="flex justify-between items-end mb-4">
          <h3 className="font-black text-xl tracking-tight text-slate-900 dark:text-white">Mood & Energy Correlation</h3>
        </div>
        <div className="-mx-2 sm:-mx-4" style={{ height: 320 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={SYMPTOM_TREND_DATA} margin={{ top: 20, right: 10, left: -20, bottom: 40 }}>
              <defs>
                <linearGradient id="colorEnergy" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorMood" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#8e8e93" strokeOpacity={0.15} vertical={false} />
              <XAxis axisLine={false} tickLine={false} dataKey="day" height={35} tick={{fontSize: 12, fill: '#8e8e93', fontWeight: 600}} tickMargin={12} minTickGap={20} />
              <YAxis axisLine={false} tickLine={false} allowDecimals={false} domain={[0, 5]} tick={{fontSize: 12, fill: '#8e8e93', fontWeight: 600}} tickMargin={12} />
              <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', backgroundColor: 'rgba(255,255,255,0.9)', color: '#000', fontWeight: 600 }} />
              <Legend layout="horizontal" verticalAlign="bottom" align="center" iconType="circle" wrapperStyle={{ marginBottom: '-10px', paddingTop: '15px', fontSize: '13px', whiteSpace: 'nowrap', fontWeight: 500 }} />
              <Area type="monotone" dataKey="energy" name="Energy Level" stroke="#f59e0b" strokeWidth={3} fillOpacity={1} fill="url(#colorEnergy)" activeDot={{ r: 6, fill: '#f59e0b', stroke: '#fff', strokeWidth: 2 }} />
              <Area type="monotone" dataKey="mood" name="Mood Score" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorMood)" activeDot={{ r: 6, fill: '#8b5cf6', stroke: '#fff', strokeWidth: 2 }} />
              {currentDay && <ReferenceLine x={currentDay} stroke="#8e8e93" strokeWidth={2} strokeDasharray="3 3" />}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

function PregnancyCharts({ fixedWidth }) {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="relative overflow-hidden bg-white/60 dark:bg-[#1A1C1E]/60 backdrop-saturate-[1.8] backdrop-blur-[50px] border-[0.5px] border-white/40 dark:border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.15)] p-6 rounded-[32px] transition-all duration-300 hover:shadow-[0_8px_32px_rgba(0,0,0,0.2)]">
        <div className="absolute top-1/2 left-0 w-32 h-full bg-blue-500/10 dark:bg-blue-400/10 blur-[60px] pointer-events-none rounded-full -translate-y-1/2"></div>
        <h3 className="font-black text-xl tracking-tight text-slate-900 dark:text-white mb-4">Weight Gain Tracker</h3>
        <div style={{ width: fixedWidth || '100%', height: 320 }}>
          <ResponsiveContainer width={fixedWidth || '100%'} height="100%">
            <ComposedChart data={WEIGHT_DATA} margin={{ top: 10, right: 30, left: 20, bottom: 30 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
              <XAxis dataKey="week" tick={{fontSize: 12, fill: '#6b7280'}} tickMargin={10} label={{ value: 'Pregnancy Week', position: 'bottom', offset: 0, fill: '#6b7280', fontSize: 13, fontWeight: 500 }} />
              <YAxis domain={['dataMin - 10', 'dataMax + 10']} tick={{fontSize: 12, fill: '#6b7280'}} tickMargin={10} label={{ value: 'Weight (lbs)', angle: -90, position: 'insideLeft', offset: -10, fill: '#6b7280', fontSize: 13, fontWeight: 500, style: { textAnchor: 'middle' } }} />
              <Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', backgroundColor: '#fff', color: '#000' }} />
              <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '13px' }}/>
              <Area type="monotone" name="Upper Bound" dataKey="maxBound" fill="#dbeafe" stroke="none" />
              <Area type="monotone" name="Lower Bound" dataKey="minBound" fill="#ffffff" stroke="none" />
              <Line type="monotone" name="Your Weight" dataKey="weight" stroke="#2563eb" strokeWidth={3} dot={{ r: 4 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="relative overflow-hidden bg-white/60 dark:bg-[#1A1C1E]/60 backdrop-saturate-[1.8] backdrop-blur-[50px] border-[0.5px] border-white/40 dark:border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.15)] p-6 rounded-[32px] transition-all duration-300 hover:shadow-[0_8px_32px_rgba(0,0,0,0.2)]">
        <div className="absolute top-1/2 left-0 w-32 h-full bg-blue-500/10 dark:bg-blue-400/10 blur-[60px] pointer-events-none rounded-full -translate-y-1/2"></div>
        <h3 className="font-black text-xl tracking-tight text-slate-900 dark:text-white mb-4">Symptom Intensity Tracker</h3>
        <div style={{ width: fixedWidth || '100%', height: 320 }}>
          <ResponsiveContainer width={fixedWidth || '100%'} height="100%">
            <AreaChart data={PREGNANCY_SYMPTOMS_DATA} margin={{ top: 10, right: 30, left: 20, bottom: 30 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
              <XAxis dataKey="week" tick={{fontSize: 12, fill: '#6b7280'}} tickMargin={10} label={{ value: 'Pregnancy Week', position: 'bottom', offset: 0, fill: '#6b7280', fontSize: 13, fontWeight: 500 }} />
              <YAxis domain={[0, 10]} tick={{fontSize: 12, fill: '#6b7280'}} tickMargin={10} label={{ value: 'Severity (0-10)', angle: -90, position: 'insideLeft', offset: -10, fill: '#6b7280', fontSize: 13, fontWeight: 500, style: { textAnchor: 'middle' } }} />
              <Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', backgroundColor: '#fff', color: '#000' }} />
              <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '13px' }}/>
              <Area type="monotone" name="Nausea" dataKey="nausea" stroke="#f43f5e" fill="#ffe4e6" strokeWidth={2} />
              <Area type="monotone" name="Fatigue" dataKey="fatigue" stroke="#8b5cf6" fill="#ede9fe" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

function PerimenopauseCharts({ fixedWidth }) {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="relative overflow-hidden bg-white/60 dark:bg-[#1A1C1E]/60 backdrop-saturate-[1.8] backdrop-blur-[50px] border-[0.5px] border-white/40 dark:border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.15)] p-6 rounded-[32px] transition-all duration-300 hover:shadow-[0_8px_32px_rgba(0,0,0,0.2)]">
        <div className="absolute top-1/2 left-0 w-32 h-full bg-blue-500/10 dark:bg-blue-400/10 blur-[60px] pointer-events-none rounded-full -translate-y-1/2"></div>
        <h3 className="font-black text-xl tracking-tight text-slate-900 dark:text-white mb-4">Sleep vs. Night Sweats</h3>
        <div style={{ width: fixedWidth || '100%', height: 320 }}>
          <ResponsiveContainer width={fixedWidth || '100%'} height="100%">
            <ComposedChart data={SLEEP_SWEATS_DATA} margin={{ top: 10, right: 20, left: 10, bottom: 30 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
              <XAxis dataKey="day" tick={{fontSize: 12, fill: '#6b7280'}} tickMargin={10} label={{ value: 'Day of Week', position: 'bottom', offset: 0, fill: '#6b7280', fontSize: 13, fontWeight: 500 }} />
              <YAxis yAxisId="left" tick={{fontSize: 12, fill: '#6b7280'}} tickMargin={10} label={{ value: 'Hours', angle: -90, position: 'insideLeft', offset: -5, fill: '#6b7280', fontSize: 13, fontWeight: 500, style: { textAnchor: 'middle' } }} />
              <YAxis yAxisId="right" orientation="right" domain={[0, 10]} tick={{fontSize: 12, fill: '#6b7280'}} tickMargin={10} label={{ value: 'Severity', angle: 90, position: 'insideRight', offset: -5, fill: '#6b7280', fontSize: 13, fontWeight: 500, style: { textAnchor: 'middle' } }} />
              <Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', backgroundColor: '#fff', color: '#000' }} />
              <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '13px' }}/>
              <Bar yAxisId="left" dataKey="sleep" name="Sleep (Hrs)" fill="#6366f1" radius={[4, 4, 0, 0]} />
              <Line yAxisId="right" type="monotone" name="Sweats Severity" dataKey="sweats" stroke="#f97316" strokeWidth={3} dot={{r:4}} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="relative overflow-hidden bg-white/60 dark:bg-[#1A1C1E]/60 backdrop-saturate-[1.8] backdrop-blur-[50px] border-[0.5px] border-white/40 dark:border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.15)] p-6 rounded-[32px] transition-all duration-300 hover:shadow-[0_8px_32px_rgba(0,0,0,0.2)]">
        <div className="absolute top-1/2 left-0 w-32 h-full bg-blue-500/10 dark:bg-blue-400/10 blur-[60px] pointer-events-none rounded-full -translate-y-1/2"></div>
        <h3 className="font-black text-xl tracking-tight text-slate-900 dark:text-white mb-4">Cycle Gap Tracker</h3>
        <div style={{ width: fixedWidth || '100%', height: 320 }}>
          <ResponsiveContainer width={fixedWidth || '100%'} height="100%">
            <LineChart data={CYCLE_GAP_DATA} margin={{ top: 10, right: 30, left: 20, bottom: 30 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
              <XAxis dataKey="month" tick={{fontSize: 12, fill: '#6b7280'}} tickMargin={10} label={{ value: 'Month', position: 'bottom', offset: 0, fill: '#6b7280', fontSize: 13, fontWeight: 500 }} />
              <YAxis tick={{fontSize: 12, fill: '#6b7280'}} tickMargin={10} label={{ value: 'Days Between', angle: -90, position: 'insideLeft', offset: -10, fill: '#6b7280', fontSize: 13, fontWeight: 500, style: { textAnchor: 'middle' } }} />
              <Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', backgroundColor: '#fff', color: '#000' }} />
              <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '13px' }}/>
              <Line type="monotone" name="Days Between Cycles" dataKey="gap" stroke="#8b5cf6" strokeWidth={3} dot={{r: 5, fill: '#8b5cf6', strokeWidth: 2, stroke: '#fff'}} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  )
}

// ─── PREMIUM UI COMPONENTS ───────────────────────────────────────────────────

function TypewriterText({ text, speed = 10 }) {
  const [displayedText, setDisplayedText] = useState('');
  const [done, setDone] = useState(false);
  
  useEffect(() => {
    setDisplayedText('');
    setDone(false);
    
    // Safety check for undefined/null text
    const safeText = typeof text === 'string' ? text : String(text || '');
    
    let i = 0;
    const interval = setInterval(() => {
      if (i < safeText.length) {
        setDisplayedText(safeText.substring(0, i + 1));
        i++;
      } else {
        setDone(true);
        clearInterval(interval);
      }
    }, speed);
    return () => clearInterval(interval);
  }, [text, speed]);

  return (
    <div className="leading-relaxed">
      {displayedText}
      {!done && <span className="inline-block w-1.5 h-3.5 ml-1 mb-[-2px] bg-indigo-500 animate-pulse"></span>}
    </div>
  );
}

function AIChatAssistant({ mode, userPrefs, currentDay, currentPhase }) {
  const [query, setQuery] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);
  const chatContainerRef = useRef(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [chatHistory, loading]);

  const [loadingText, setLoadingText] = useState('Thinking...');
  useEffect(() => {
    if (!loading) return;
    const texts = ["Thinking...", "Analyzing symptom patterns...", "Correlating cycle phase...", "Generating insights..."];
    let i = 0;
    const interval = setInterval(() => {
      i = (i + 1) % texts.length;
      setLoadingText(texts[i]);
    }, 1500);
    return () => clearInterval(interval);
  }, [loading]);

  const SUGGESTIONS = {
    cycle: ["Why am I so tired this week?", "When is my fertile window?", "Is my cycle length normal?"],
    pregnancy: ["Are these cramps normal?", "Foods to help with nausea?", "When should I pack my bag?"],
    perimenopause: ["How to manage night sweats?", "Is this a hot flash?", "Why is my sleep so poor?"],
    postpartum: ["When will my period return?", "Is this much hair loss normal?", "Tips for sleep deprivation?"]
  };
  const activeSuggestions = SUGGESTIONS[mode] || SUGGESTIONS.cycle;

  const handleAsk = async (e, forcedQuery = query) => {
    if (e) e.preventDefault();
    if(!forcedQuery.trim()) return;
    
    const newUserMessage = { role: "user", content: forcedQuery };
    const currentHistory = [...chatHistory, newUserMessage];
    setChatHistory(currentHistory);
    setQuery('');
    setLoading(true);
    
    try {
      const localLogs = await getLocalLogs();
      
      // Filter logs strictly to the exact current cycle based on current cycle day
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - currentDay + 1);
      cutoffDate.setHours(0, 0, 0, 0); // Start of cycle day 1
      
      const cycleLogs = localLogs.filter(log => {
        const logDate = new Date(log.date || log.timestamp || log.savedAt || new Date());
        return logDate >= cutoffDate;
      });

      let aiResponse = await askNIMInsights(forcedQuery, cycleLogs, mode, chatHistory, userPrefs, currentDay, currentPhase);
      
      // Parse Actionable AI Tag
      const logMatch = aiResponse.match(/<LOG_INTENT>([\s\S]*?)<\/LOG_INTENT>/);
      if (logMatch) {
        try {
          const logData = JSON.parse(logMatch[1]);
          const { saveDailyLog } = await import('../services/db.js');
          await saveDailyLog(new Date().toISOString().split('T')[0], logData);
          console.log("[Rythm Assistant] Auto-logged entry successfully.");
          // Dispatch a custom event so other components know data was updated
          window.dispatchEvent(new Event('rythm_log_updated'));
        } catch (e) {
          console.error("Failed to parse log intent:", e);
        }
        // Strip the tag from the final user-facing string
        aiResponse = aiResponse.replace(/<LOG_INTENT>[\s\S]*?<\/LOG_INTENT>/, '').trim();
      }
      
      setChatHistory(prev => {
        const strippedPrev = prev.map(m => ({ ...m, isNew: false }));
        return [...strippedPrev, { role: "assistant", content: aiResponse, isNew: true }];
      });
    } catch (err) {
      setChatHistory(prev => {
        const strippedPrev = prev.map(m => ({ ...m, isNew: false }));
        return [...strippedPrev, { role: "assistant", content: "AI Connection is disabled or experiencing technical difficulties. - Developer Pal_Sonu", isNew: true }];
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative overflow-hidden bg-white/60 dark:bg-[#1A1C1E]/60 backdrop-saturate-[1.8] backdrop-blur-[50px] border-[0.5px] border-white/40 dark:border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.15)] rounded-[32px] p-5 md:p-6 transition-all duration-300 hover:shadow-[0_8px_32px_rgba(0,0,0,0.2)]">
      {/* Decorative Aura */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 dark:bg-indigo-400/10 blur-[80px] pointer-events-none rounded-full -translate-y-1/2 translate-x-1/4"></div>
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/10 dark:bg-purple-400/10 blur-[60px] pointer-events-none rounded-full translate-y-1/2 -translate-x-1/4"></div>
      
      <div className="relative z-10 flex flex-col">
        <h3 className="font-black text-2xl tracking-tight text-slate-900 dark:text-white flex items-center gap-3 mb-6">
          Rythm Assistant
        </h3>
        
        {/* Chat Area */}
        <div ref={chatContainerRef} className="w-full mb-6 flex flex-col space-y-4 pt-2 overflow-y-auto max-h-[300px] [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {chatHistory.length === 0 && !loading ? (
            <div className="flex items-start gap-3 animate-fade-in">
              <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center shrink-0">
                <Activity className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div className="bg-white dark:bg-[#2a2a2a] border border-gray-100 dark:border-[#333] shadow-sm rounded-2xl rounded-tl-sm p-4 text-[14px] text-gray-700 dark:text-gray-300 break-words whitespace-pre-wrap">
                Hi! I've reviewed your recent logs. What would you like to know about your health trends?
              </div>
            </div>
          ) : (
            <>
              {chatHistory.map((msg, idx) => (
                msg.role === 'user' ? (
                  <div key={idx} className="flex justify-end animate-slide-up">
                    <div className="bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md rounded-2xl rounded-tr-sm px-5 py-3 text-[14px] max-w-[90%] break-words whitespace-pre-wrap">
                      {msg.content}
                    </div>
                  </div>
                ) : (
                  <div key={idx} className="flex items-start gap-3 animate-slide-up w-full">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center shrink-0 mt-1">
                      <Activity className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div className="bg-white dark:bg-[#2a2a2a] border border-gray-100 dark:border-[#333] shadow-sm rounded-2xl rounded-tl-sm p-4 text-[14px] text-gray-700 dark:text-gray-300 flex-1 min-w-0 break-words whitespace-pre-wrap">
                      {msg.isNew ? (
                        <TypewriterText text={msg.content} />
                      ) : (
                        <div className="leading-relaxed">{msg.content}</div>
                      )}
                    </div>
                  </div>
                )
              ))}
              
              {loading && (
                <div className="flex items-start gap-3 animate-slide-up w-full">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center shrink-0 mt-1">
                    <Activity className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div className="bg-white dark:bg-[#2a2a2a] border border-gray-100 dark:border-[#333] shadow-sm rounded-2xl rounded-tl-sm p-4 text-[14px] text-gray-700 dark:text-gray-300 flex-1 min-w-0 break-words whitespace-pre-wrap">
                    <div className="flex items-center gap-2 text-indigo-500">
                      <Loader className="w-4 h-4 animate-spin shrink-0" />
                      <span className="text-xs font-semibold uppercase tracking-wider">{loadingText}</span>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Suggested Chips */}
        {chatHistory.length === 0 && !loading && (
          <div className="flex overflow-x-auto gap-2 pb-4 mb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {activeSuggestions.map((sug, i) => (
              <button
                key={i}
                onClick={() => handleAsk(null, sug)}
                className="whitespace-nowrap px-4 py-2 rounded-full bg-white/50 dark:bg-black/20 border border-black/5 dark:border-white/5 text-[13px] font-medium text-gray-700 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-200 dark:hover:border-indigo-800 transition-all active:scale-[0.98]"
              >
                {sug}
              </button>
            ))}
          </div>
        )}

        {/* Input Form */}
        <form onSubmit={(e) => handleAsk(e)} className="relative mt-auto">
          <input 
            type="text" 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask about symptoms, trends, or predictions..." 
            className="w-full bg-white/70 dark:bg-black/30 backdrop-blur-md border border-gray-200 dark:border-white/10 rounded-full py-3.5 pl-6 pr-14 text-[15px] focus:outline-none focus:border-indigo-400 dark:focus:border-indigo-500 text-gray-900 dark:text-white shadow-sm placeholder-gray-400 dark:placeholder-gray-500 transition-all"
          />
          <button 
            type="submit"
            disabled={loading || !query.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-md transition-all disabled:opacity-50 group"
          >
            {loading ? <Loader className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </form>

      </div>
    </div>
  );
}



function InsightCard({ icon, title, desc, color }) {
  const colorMap = {
    green:  'text-green-800 dark:text-green-300 icon-bg-green',
    pink:   'text-pink-800 dark:text-pink-300 icon-bg-pink',
    blue:   'text-blue-800 dark:text-blue-300 icon-bg-blue',
    orange: 'text-orange-800 dark:text-orange-300 icon-bg-orange',
  };
  const theme = colorMap[color] || colorMap.blue;

  return (
    <div className={`p-6 transition-colors hover:bg-black/[0.02] dark:hover:bg-white/[0.02] group`}>
      <h3 className={`font-bold flex items-center gap-3 mb-2 text-[16px] tracking-tight ${theme.split(' ')[0]}`}>
        <div className="w-8 h-8 rounded-full flex items-center justify-center bg-black/5 dark:bg-white/10 shrink-0">
          {React.cloneElement(icon, { className: "w-4 h-4" })}
        </div>
        {title}
      </h3>
      <p className="text-[13px] leading-relaxed text-gray-700 dark:text-gray-300 ml-11">
        {desc}
      </p>
    </div>
  );
}

function PartnerShareCard({ text }) {
  const [copied, setCopied] = useState(false);
  
  const partnerLink = "https://google-rhythm.vercel.app/?partner=demo_token";
  const messageBody = `${text}\n\nView my secure dashboard here: ${partnerLink}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(messageBody);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-6 transition-colors hover:bg-black/[0.02] dark:hover:bg-white/[0.02]">
      <div className="flex justify-between items-start mb-3">
        <h3 className="font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-3 text-[16px]">
          <div className="w-8 h-8 rounded-full flex items-center justify-center bg-rose-50 dark:bg-rose-900/20 shrink-0">
            <Heart className="w-4 h-4 text-rose-500" />
          </div>
          Partner Summary
        </h3>
        <div className="flex items-center gap-2">
          <button onClick={handleCopy} className="text-gray-400 hover:text-[#1967d2] transition-colors p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/5" title="Copy to clipboard">
            {copied ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Share2 className="w-4 h-4" />}
          </button>
        </div>
      </div>
      <div className="bg-black/5 dark:bg-white/5 rounded-[16px] p-4 ml-11 border-[0.5px] border-black/5 dark:border-white/5">
        <p className="text-[13px] text-gray-700 dark:text-gray-300 italic leading-relaxed">"{text}"</p>
      </div>
    </div>
  );
}

function MilestoneList({ items }) {
  const handleAddToCalendar = (title, desc) => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 1);
    startDate.setHours(10, 0, 0, 0);
    const endDate = new Date(startDate);
    endDate.setHours(11, 0, 0, 0);

    const formatGCalDate = (date) => date.toISOString().replace(/-|:|\.\d\d\d/g, "");

    const fullDesc = desc 
      ? `${desc}\n\nGenerated by Google Rhythm.` 
      : `Clinical Milestone generated by Google Rhythm.`;

    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&details=${encodeURIComponent(fullDesc)}&dates=${formatGCalDate(startDate)}/${formatGCalDate(endDate)}`;
    
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="p-6 transition-colors hover:bg-black/[0.02] dark:hover:bg-white/[0.02]">
      <h3 className="font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-3 mb-5 text-[16px]">
        <div className="w-8 h-8 rounded-full flex items-center justify-center bg-teal-50 dark:bg-teal-900/20 shrink-0">
          <CheckSquare className="w-4 h-4 text-teal-600 dark:text-teal-400" />
        </div>
        Clinical Milestones
      </h3>
      <div className="space-y-4 ml-11">
        {items.map((item, i) => (
          <div key={i} className="flex flex-col sm:flex-row sm:items-start gap-3 justify-between group/item relative">
            <div className="flex items-start gap-3 flex-1">
              <div className={`mt-0.5 w-5 h-5 rounded-md flex items-center justify-center shrink-0 border-[1.5px] transition-colors ${item.done ? 'bg-teal-500 border-teal-500 text-white' : 'border-gray-300 dark:border-gray-600 bg-transparent'}`}>
                {item.done && <CheckCircle className="w-3.5 h-3.5" />}
              </div>
              <div>
                <p className={`text-[13px] font-semibold ${item.done ? 'text-gray-400 dark:text-gray-500 line-through' : 'text-gray-800 dark:text-gray-200'}`}>{item.title}</p>
                {item.desc && <p className="text-[12px] text-gray-500 dark:text-gray-400 mt-0.5">{item.desc}</p>}
                {item.subList && (
                  <ul className="mt-2 text-[12px] text-gray-600 dark:text-gray-400 list-disc pl-4 space-y-1">
                    {item.subList.map((sub, j) => <li key={j}>{sub}</li>)}
                  </ul>
                )}
              </div>
            </div>
            
            {!item.done && (
              <button 
                onClick={() => handleAddToCalendar(item.title, item.desc)}
                className="mt-2 sm:mt-0 ml-8 sm:ml-0 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-[#1967d2] dark:text-[#8ab4f8] bg-blue-50/50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 py-1.5 px-3 rounded-full transition-colors shrink-0"
                title="Add to Google Calendar"
              >
                <CalendarPlus className="w-3.5 h-3.5" />
                Add
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function DynamicInsightsCards({ userPrefs, currentPhase, currentDay, cycleLogs }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { lastLoggedTimestamp } = useAppStore();

  useEffect(() => {
    async function loadSummary() {
      setLoading(true);
      try {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - currentDay + 1);
        cutoffDate.setHours(0, 0, 0, 0);
        
        const filteredLogs = (cycleLogs || []).filter(log => {
          const logDate = new Date(log.date || log.timestamp || log.savedAt || new Date());
          return logDate >= cutoffDate;
        });

        const today = new Date().toISOString().slice(0, 10);
        const cacheKey = `insightsSummary_${today}_${lastLoggedTimestamp}`;
        const cached = await getCachedInsight(cacheKey, 'insights_summary');

        if (cached) {
          setData(cached.insight);
          setLoading(false);
          return;
        }

        const res = await generateInsightsSummary(userPrefs, currentPhase, currentDay, filteredLogs);
        if (res) {
          if (res.partnerSummary) {
            localStorage.setItem('rythm_partner_summary', res.partnerSummary);
          }
          await saveCachedInsight(cacheKey, 'insights_summary', res);
          setData(res);
        }
      } catch (e) {
        setData(null);
      }
      setLoading(false);
    }
    loadSummary();
  }, [userPrefs, currentPhase, currentDay, cycleLogs, lastLoggedTimestamp]);

  if (loading) {
    return (
      <div className="relative bg-white/60 dark:bg-[#1A1C1E]/60 backdrop-saturate-[1.8] backdrop-blur-[50px] shadow-[0_8px_32px_rgba(0,0,0,0.15)] border-[0.5px] border-white/40 dark:border-white/10 rounded-[32px] overflow-hidden p-6 flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <Loader className="w-5 h-5 animate-spin text-indigo-500" />
          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Generating personalized insights...</span>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="relative bg-white/60 dark:bg-[#1A1C1E]/60 backdrop-saturate-[1.8] backdrop-blur-[50px] shadow-[0_8px_32px_rgba(0,0,0,0.15)] border-[0.5px] border-white/40 dark:border-white/10 rounded-[32px] overflow-hidden flex flex-col [&>div]:border-b-[0.5px] [&>div]:border-black/5 dark:[&>div]:border-white/5 [&>div:last-child]:border-0">
      <div className="absolute top-1/2 left-0 w-32 h-full bg-teal-500/10 dark:bg-teal-400/10 blur-[60px] pointer-events-none rounded-full -translate-y-1/2"></div>
      
      {data.supplementEffectiveness && (
        <InsightCard 
          color="blue" 
          icon={<Pill className="w-5 h-5" />} 
          title="Supplement Effectiveness" 
          desc={data.supplementEffectiveness} 
        />
      )}
      {data.communityBenchmark && (
        <InsightCard 
          color="pink" 
          icon={<Users className="w-5 h-5" />} 
          title="Community Benchmark" 
          desc={data.communityBenchmark} 
        />
      )}
      {data.partnerSummary && (
        <PartnerShareCard text={data.partnerSummary} />
      )}
      {data.clinicalMilestones && data.clinicalMilestones.length > 0 && (
        <MilestoneList items={data.clinicalMilestones} />
      )}
    </div>
  );
}

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────

export default function InsightsView() {
  const { userPrefs, currentDay, currentPhase } = useAppStore();
  const lifecycleMode = userPrefs?.lifecycleMode || 'cycle';


  const [viewMode, setViewMode] = useState('text');
  const [logs, setLogs] = useState([]);
  const [showReportModal, setShowReportModal] = useState(false);


  React.useEffect(() => {
    getLocalLogs().then(data => {
      // Sort newest logs first based on precise timestamp
      const sorted = data.sort((a, b) => {
        const timeA = new Date(a.savedAt || a.timestamp || a.date).getTime();
        const timeB = new Date(b.savedAt || b.timestamp || b.date).getTime();
        return timeB - timeA;
      });
      setLogs(sorted);
    });
  }, []);



  const generationDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  const activeHistory = (lifecycleMode === 'pregnancy' || lifecycleMode === 'postpartum') ? PREGNANCY_HISTORY : lifecycleMode === 'perimenopause' ? PERIMENOPAUSE_HISTORY : CYCLE_HISTORY;

  return (
    <div className="px-6 pt-4 space-y-6 animate-fade-in pb-8">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-black tracking-tighter text-slate-900 dark:text-white">Insights</h2>
        
        <div className="flex bg-gray-100 dark:bg-[#2a2a2a] p-1 rounded-full border border-gray-200 dark:border-[#333]">
          <button
            onClick={() => setViewMode('text')}
            title="List View"
            className={`p-2 rounded-full transition-all ${
              viewMode === 'text' 
                ? 'bg-white dark:bg-[#333] text-[#1967d2] dark:text-[#8ab4f8] shadow-sm' 
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
          >
            <AlignLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => setViewMode('charts')}
            title="Chart View"
            className={`p-2 rounded-full transition-all ${
              viewMode === 'charts' 
                ? 'bg-white dark:bg-[#333] text-[#1967d2] dark:text-[#8ab4f8] shadow-sm' 
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
          >
            <BarChart2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {viewMode === 'charts' ? (
        <div className="animate-fade-in">
          {lifecycleMode === 'cycle' ? <StandardCharts currentDay={currentDay} logs={logs} /> : (lifecycleMode === 'pregnancy' || lifecycleMode === 'postpartum') ? <PregnancyCharts /> : lifecycleMode === 'perimenopause' ? <PerimenopauseCharts /> : <StandardCharts />}
        </div>
      ) : (
        <div className="space-y-4 animate-fade-in">
          
          {/* AI Doctor's Report Button */}
          <button 
            onClick={() => setShowReportModal(true)}
            disabled={showReportModal}
            className="relative overflow-hidden w-full bg-white/60 dark:bg-[#1A1C1E]/60 backdrop-saturate-[1.8] backdrop-blur-[50px] border-[0.5px] border-white/40 dark:border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.15)] hover:shadow-[0_8px_32px_rgba(0,0,0,0.2)] hover:-translate-y-0.5 p-6 rounded-[32px] flex items-center justify-between transition-all duration-300 active:scale-[0.98] group disabled:opacity-70 disabled:cursor-wait"
          >
            <div className="absolute top-1/2 left-0 w-32 h-full bg-blue-500/10 dark:bg-blue-400/10 blur-[60px] pointer-events-none rounded-full -translate-y-1/2 transition-opacity group-hover:opacity-100 opacity-50"></div>
            <div className="flex items-center gap-4 relative z-10">
              <div className="w-12 h-12 rounded-full bg-[#e8f0fe] dark:bg-[#1967d2]/30 flex items-center justify-center text-[#1967d2] dark:text-[#8ab4f8] shrink-0 shadow-sm border border-[#1967d2]/10 dark:border-[#8ab4f8]/10">
                <Stethoscope className="w-6 h-6" />
              </div>
              <div className="text-left">
                <p className="font-black text-xl tracking-tight text-slate-900 dark:text-white drop-shadow-sm">
                  {showReportModal ? 'Processing...' : "Generate Doctor's Report"}
                </p>
                <p className="text-[14px] text-gray-500 dark:text-gray-400 font-medium mt-0.5">
                  {showReportModal ? 'AI is formatting your history...' : 'AI compiles your last 90 days of logs'}
                </p>
              </div>
            </div>
            {showReportModal ? (
              <Loader className="w-6 h-6 text-[#1967d2] dark:text-[#8ab4f8] opacity-80 relative z-10 animate-spin" />
            ) : (
              <FileText className="w-6 h-6 text-[#1967d2] dark:text-[#8ab4f8] opacity-80 relative z-10" />
            )}
          </button>


          <AIChatAssistant mode={lifecycleMode} userPrefs={userPrefs} currentDay={currentDay} currentPhase={currentPhase} />

          <DynamicInsightsCards 
            userPrefs={userPrefs} 
            currentPhase={currentPhase} 
            currentDay={currentDay} 
            cycleLogs={logs} 
          />
        </div>
      )}



      {/* Dynamic History UI - Real Timeline Feed */}
      <div className="space-y-4 pt-4">
        <h3 className="text-xl font-black tracking-tight text-slate-900 dark:text-white mb-6">
          Complete Health Timeline
        </h3>
        
        {logs.length === 0 ? (
           <div className="text-center py-8 text-gray-500 dark:text-gray-400">No logs yet. Try logging from the Dashboard or using the Voice Recorder!</div>
        ) : (
          <div className="relative border-l-2 border-gray-200 dark:border-[#333] ml-4 pl-6 space-y-8 pb-6 pt-2">
            {(() => {
              let currentMonth = '';
              return logs.map((log, i) => {
                const logMonth = new Date(log.date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
                const isNewMonth = logMonth !== currentMonth;
                if (isNewMonth) currentMonth = logMonth;

                const logDate = new Date(log.timestamp || log.savedAt || log.date);
                const shortDay = logDate.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
                const dateString = logDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                const timeString = (log.timestamp || log.savedAt) ? logDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : '';

                const modeLabel = {
                  cycle: 'Cycle Intel',
                  ttc: 'Try to Conceive',
                  pregnancy: 'Pregnancy',
                  postpartum: 'Postpartum',
                  perimenopause: 'Perimenopause',
                  childfree: 'Childfree'
                }[log.mode] || 'Cycle';

                return (
                  <React.Fragment key={i}>
                    {isNewMonth && (
                      <div className="relative flex items-center -left-[40px] mb-2 mt-10 first:mt-0 z-10">
                        <div className="bg-white dark:bg-[#121212] px-4 py-1.5 rounded-full border border-gray-200 dark:border-[#333] shadow-sm">
                          <span className="text-[11px] font-extrabold text-[#4285f4] dark:text-[#8ab4f8] uppercase tracking-[0.2em]">{logMonth}</span>
                        </div>
                      </div>
                    )}

                    <div className="relative">
                      {/* Timeline Dot - Aligned Perfectly */}
                      <div className="absolute -left-[31px] top-1.5 w-3 h-3 rounded-full bg-[#4285f4] dark:bg-[#8ab4f8] ring-4 ring-white dark:ring-[#121212]"></div>
                      
                      <div className="bg-white dark:bg-[#1a1a1a] rounded-3xl p-5 shadow-sm border border-gray-100 dark:border-[#2a2a2a] transition-colors relative">
                        
                        <div className="mb-4">
                          <p className="font-extrabold text-[#202124] dark:text-[#e3e3e3] text-[15px] tracking-wide uppercase">
                            {shortDay}, {dateString}
                          </p>
                          <p className="font-medium text-gray-500 dark:text-gray-400 text-[13px] mt-1 flex items-center gap-1.5">
                            {timeString && <span>{timeString} •</span>}
                            <span>{modeLabel} Mode</span>
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {log.flow && log.flow !== 'None' && (
                            <span className="text-[13px] px-3.5 py-1.5 rounded-full font-medium bg-red-50 text-red-700 dark:bg-[#3b1a1f] dark:text-red-300">
                              🩸 {log.flow} Flow
                            </span>
                          )}
                          {log.mood && log.mood !== 'None' && (
                            <span className="text-[13px] px-3.5 py-1.5 rounded-full font-medium bg-indigo-50 text-indigo-700 dark:bg-[#1a1f3b] dark:text-indigo-300">
                              {log.mood}
                            </span>
                          )}
                          {Array.isArray(log.symptoms) && log.symptoms.map((sym, index) => {
                            return (
                              <span key={sym || index} className="text-[13px] px-3.5 py-1.5 rounded-full font-medium bg-gray-100 text-gray-700 dark:bg-[#2a2a2a] dark:text-gray-300">
                                {sym}
                              </span>
                            );
                          })}
                          {Array.isArray(log.giSymptoms) && log.giSymptoms.map((sym, index) => {
                            return (
                              <span key={`gi-${sym || index}`} className="text-[13px] px-3.5 py-1.5 rounded-full font-medium bg-teal-50 text-teal-700 dark:bg-[#1a3b35] dark:text-teal-300">
                                🦠 {sym}
                              </span>
                            );
                          })}
                          {log.painDetails && (
                            <span className="text-[13px] px-3.5 py-1.5 rounded-full font-medium bg-rose-50 text-rose-700 dark:bg-[#3b1a24] dark:text-rose-300">
                              ⚡ Pain Score: {log.painDetails.score}/10
                            </span>
                          )}
                          {log.painDetails?.impacts?.map(impact => (
                            <span key={impact} className="text-[13px] px-3.5 py-1.5 rounded-full font-medium bg-orange-50 text-orange-700 dark:bg-[#3b2a1a] dark:text-orange-300">
                              ⚠️ {impact}
                            </span>
                          ))}
                          {log.painDetails?.medsHelped && (
                            <span className="text-[13px] px-3.5 py-1.5 rounded-full font-medium bg-blue-50 text-blue-700 dark:bg-[#1a2a3b] dark:text-blue-300">
                              💊 Meds: {log.painDetails.medsHelped}
                            </span>
                          )}
                          {!log.flow && !log.mood && (!log.symptoms || log.symptoms.length === 0) && (!log.giSymptoms || log.giSymptoms.length === 0) && !log.painDetails && (
                            <span className="text-[13px] text-gray-400 italic">No symptoms recorded</span>
                          )}
                        </div>
                        
                        {/* Llama 3.1 Emotional Analysis */}
                        {log.emotional_analysis && (
                          <div className="mt-2 text-[13px] text-gray-600 dark:text-gray-400 font-medium italic">
                            "{log.emotional_analysis}"
                          </div>
                        )}

                        {/* Journal Note / Voice Transcript Display */}
                        {log.note && (
                          <div className="mt-4 bg-[#f8f9fa] dark:bg-[#222] rounded-2xl rounded-tl-sm p-4 flex gap-3 items-start">
                            <MessageSquare className="w-5 h-5 text-[#4285f4] dark:text-[#8ab4f8] shrink-0 mt-0.5" />
                            <p className="text-[14px] text-gray-800 dark:text-gray-200 leading-relaxed font-medium">
                              {log.note}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </React.Fragment>
                );
              });
            })()}
          </div>
        )}
      </div>

      {showReportModal && (
        <DoctorReportModal onClose={() => setShowReportModal(false)} />
      )}
    </div>
  );
}
