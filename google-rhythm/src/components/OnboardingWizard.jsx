import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ChevronRight, ChevronLeft, X, Sparkles, Shield, Droplets,
  User, Calendar, Heart, Leaf, Dumbbell, Brain, Smile,
  Zap, Moon, Sun, Frown, Meh, AlertCircle, Baby, Activity,
  Wind, BatteryLow, Flame, CloudRain, Thermometer, FlameKindling,
  HeartPulse, ScanFace, Stethoscope, PersonStanding, Mic,
  Lock, Cloud, Ban, Pill, Anchor, Circle, Bandage, Syringe, Dna, Orbit
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { addLog } from '../services/db';

// ─── DATA ────────────────────────────────────────────────────────────────────

const JOURNEY_MODES = [
  { id: 'cycle', label: 'Track My Cycle', icon: Droplets, desc: 'Understand your monthly rhythm', color: 'text-[#4285f4] dark:text-[#8ab4f8]', bg: 'bg-[#e8f0fe] dark:bg-[#1967d2]/20', border: 'border-[#4285f4]/30 dark:border-[#8ab4f8]/30' },
  { id: 'ttc', label: 'Try to Conceive', icon: Heart, desc: 'Optimize for pregnancy', color: 'text-rose-500 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-900/20', border: 'border-rose-300/40 dark:border-rose-500/30' },
  { id: 'pregnancy', label: 'Pregnancy', icon: Baby, desc: 'Week-by-week companion', color: 'text-amber-500 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-300/40 dark:border-amber-500/30' },
  { id: 'postpartum', label: 'Postpartum', icon: PersonStanding, desc: 'Recovery and maternal care', color: 'text-pink-500 dark:text-pink-400', bg: 'bg-pink-50 dark:bg-pink-900/20', border: 'border-pink-300/40 dark:border-pink-500/30' },
  { id: 'perimenopause', label: 'Perimenopause', icon: Activity, desc: 'Navigate the transition', color: 'text-purple-500 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-900/20', border: 'border-purple-300/40 dark:border-purple-500/30' },
  { id: 'childfree', label: 'Childfree Mode', icon: Shield, desc: 'No fertility UI, just health', color: 'text-teal-500 dark:text-teal-400', bg: 'bg-teal-50 dark:bg-teal-900/20', border: 'border-teal-300/40 dark:border-teal-500/30' },
];

const DIET_OPTIONS = [
  { id: 'vegetarian', label: 'Vegetarian', icon: Leaf, color: 'text-green-600 dark:text-green-400' },
  { id: 'vegan', label: 'Vegan', icon: Sparkles, color: 'text-emerald-600 dark:text-emerald-400' },
  { id: 'non-vegetarian', label: 'Non-Veg', icon: Dumbbell, color: 'text-orange-500 dark:text-orange-400' },
  { id: 'pescatarian', label: 'Pescatarian', icon: Droplets, color: 'text-blue-500 dark:text-blue-400' },
];

const ACTIVITY_LEVELS = [
  { id: 'Light',    label: 'Light',         desc: 'Walks, casual movement',    icon: Activity,  iconColor: 'text-teal-500 dark:text-teal-400',       iconBg: 'bg-teal-50 dark:bg-teal-900/20'       },
  { id: 'Moderate', label: 'Moderate',      desc: 'Gym 3x / week',             icon: Zap,       iconColor: 'text-[#4285f4] dark:text-[#8ab4f8]',    iconBg: 'bg-[#e8f0fe] dark:bg-[#1967d2]/20'    },
  { id: 'Active',   label: 'Highly Active', desc: 'Daily intense training',    icon: Dumbbell,  iconColor: 'text-rose-500 dark:text-rose-400',       iconBg: 'bg-rose-50 dark:bg-rose-900/20'       },
];

const CONTRACEPTIVES = [
  { id: 'None', label: 'None', icon: Ban },
  { id: 'The Pill', label: 'The Pill', icon: Pill },
  { id: 'IUD (Hormonal)', label: 'IUD (Hormonal)', icon: Anchor },
  { id: 'IUD (Copper)', label: 'IUD (Copper)', icon: Anchor },
  { id: 'Ring', label: 'Ring', icon: Circle },
  { id: 'Patch', label: 'Patch', icon: Bandage },
  { id: 'Implant', label: 'Implant', icon: ScanFace },
  { id: 'Injection', label: 'Injection', icon: Syringe },
];

const CONDITIONS = [
  { id: 'PCOS', label: 'PCOS', desc: 'Irregular cycles, insulin resistance', icon: Dna, color: 'text-purple-500 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-900/20' },
  { id: 'Endometriosis', label: 'Endometriosis', desc: 'Severe pain, inflammation', icon: Flame, color: 'text-rose-500 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-900/20' },
  { id: 'PMDD', label: 'PMDD', desc: 'Severe premenstrual mood shifts', icon: Brain, color: 'text-indigo-500 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
  { id: 'Fibroids', label: 'Uterine Fibroids', desc: 'Heavy bleeding, pelvic pressure', icon: Shield, color: 'text-amber-500 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20' },
  { id: 'Thyroid', label: 'Thyroid Condition', desc: 'Hypo/Hashimoto\'s', icon: Stethoscope, color: 'text-teal-500 dark:text-teal-400', bg: 'bg-teal-50 dark:bg-teal-900/20' },
];

const AI_TONES = [
  { id: 'Warm & Supportive', label: 'Warm & Supportive', desc: 'Like a best friend or doula',    icon: Heart,      iconColor: 'text-rose-500 dark:text-rose-400',     iconBg: 'bg-rose-50 dark:bg-rose-900/20'    },
  { id: 'Clinical & Direct', label: 'Clinical & Direct', desc: 'Like a doctor, just the facts',  icon: Activity,   iconColor: 'text-[#4285f4] dark:text-[#8ab4f8]',  iconBg: 'bg-[#e8f0fe] dark:bg-[#1967d2]/20' },
  { id: 'Science-Focused',   label: 'Science-Focused',   desc: 'Explain the biology behind it', icon: Brain,      iconColor: 'text-purple-500 dark:text-purple-400', iconBg: 'bg-purple-50 dark:bg-purple-900/20' },
];

const ARCH_NEMESIS = [
  { id: 'Migraines',     label: 'Migraines',     icon: Brain,       iconColor: 'text-purple-500 dark:text-purple-400', iconBg: 'bg-purple-50 dark:bg-purple-900/20'   },
  { id: 'Severe Cramps', label: 'Severe Cramps', icon: Zap,         iconColor: 'text-rose-500 dark:text-rose-400',     iconBg: 'bg-rose-50 dark:bg-rose-900/20'       },
  { id: 'Fatigue',       label: 'Fatigue',       icon: BatteryLow,  iconColor: 'text-blue-500 dark:text-blue-400',     iconBg: 'bg-blue-50 dark:bg-blue-900/20'       },
  { id: 'Insomnia',      label: 'Insomnia',      icon: Moon,        iconColor: 'text-indigo-500 dark:text-indigo-400', iconBg: 'bg-indigo-50 dark:bg-indigo-900/20'   },
  { id: 'Brain Fog',     label: 'Brain Fog',     icon: CloudRain,   iconColor: 'text-amber-500 dark:text-amber-400',   iconBg: 'bg-amber-50 dark:bg-amber-900/20'     },
  { id: 'Mood Swings',   label: 'Mood Swings',   icon: Meh,         iconColor: 'text-orange-500 dark:text-orange-400', iconBg: 'bg-orange-50 dark:bg-orange-900/20'   },
  { id: 'Bloating',      label: 'Bloating',      icon: Wind,        iconColor: 'text-teal-500 dark:text-teal-400',     iconBg: 'bg-teal-50 dark:bg-teal-900/20'       },
  { id: 'Acne',          label: 'Acne',          icon: ScanFace,    iconColor: 'text-pink-500 dark:text-pink-400',     iconBg: 'bg-pink-50 dark:bg-pink-900/20'       },
];

const MOODS = [
  { id: 'Happy',     label: 'Happy',     icon: Smile,       iconColor: 'text-yellow-500 dark:text-yellow-400', iconBg: 'bg-yellow-50 dark:bg-yellow-900/20'   },
  { id: 'Calm',      label: 'Calm',      icon: Sun,         iconColor: 'text-sky-500 dark:text-sky-400',       iconBg: 'bg-sky-50 dark:bg-sky-900/20'         },
  { id: 'Tired',     label: 'Tired',     icon: BatteryLow,  iconColor: 'text-slate-500 dark:text-slate-400',   iconBg: 'bg-slate-50 dark:bg-slate-900/20'     },
  { id: 'Anxious',   label: 'Anxious',   icon: AlertCircle, iconColor: 'text-orange-500 dark:text-orange-400', iconBg: 'bg-orange-50 dark:bg-orange-900/20'   },
  { id: 'Crampy',    label: 'Crampy',    icon: Zap,         iconColor: 'text-rose-500 dark:text-rose-400',     iconBg: 'bg-rose-50 dark:bg-rose-900/20'       },
  { id: 'Bloated',   label: 'Bloated',   icon: Wind,        iconColor: 'text-purple-500 dark:text-purple-400', iconBg: 'bg-purple-50 dark:bg-purple-900/20'   },
  { id: 'Irritable', label: 'Irritable', icon: Frown,       iconColor: 'text-red-500 dark:text-red-400',       iconBg: 'bg-red-50 dark:bg-red-900/20'         },
  { id: 'Energetic', label: 'Energetic', icon: Sparkles,    iconColor: 'text-green-500 dark:text-green-400',   iconBg: 'bg-green-50 dark:bg-green-900/20'     },
];

const TOTAL_STEPS = 7;

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────

export default function OnboardingWizard() {
  const { updatePrefs, completeOnboarding, isDarkMode, toggleDarkMode } = useAppStore();
  const [step, setStep] = useState(0); // 0 = privacy pledge
  const [direction, setDirection] = useState('forward');

  const [form, setForm] = useState({
    name: '',
    dob: '',
    height: '',
    weight: '',
    lifecycleMode: 'cycle',
    cycleLength: 28,
    lastPeriodDate: '',
    contraceptive: 'None',
    diagnosedConditions: [],
    suspectedConditions: [],
    dietPreference: 'non-vegetarian',
    activityLevel: 'Moderate',
    aiTone: 'Warm & Supportive',
    archNemesis: [],
    selectedMood: '',
    currentFlow: '',
    currentSymptoms: [],
  });

  const update = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  const toggleItem = (key, value) => {
    setForm(prev => ({
      ...prev,
      [key]: prev[key].includes(value)
        ? prev[key].filter(v => v !== value)
        : [...prev[key], value],
    }));
  };

  const next = () => { 
    if (step < TOTAL_STEPS) {
      setDirection('forward'); 
      setStep(s => s + 1); 
    } else {
      finish();
    }
  };
  const back = () => { setDirection('back'); setStep(s => Math.max(0, s - 1)); };
  const skip = () => {
    if (step >= TOTAL_STEPS) {
      finish();
    } else {
      next();
    }
  };

  const finish = async () => {
    // Calculate current cycle day from last period
    let currentDay = 1;
    if (form.lastPeriodDate) {
      const diffMs = Date.now() - new Date(form.lastPeriodDate).getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      currentDay = Math.max(1, Math.min(diffDays + 1, form.cycleLength));
    }

    // Save all prefs
    updatePrefs({
      name: form.name,
      dob: form.dob,
      height: form.height,
      weight: form.weight,
      lifecycleMode: form.lifecycleMode,
      cycleLength: form.cycleLength,
      lastPeriodDate: form.lastPeriodDate,
      contraceptive: form.contraceptive,
      diagnosedConditions: form.diagnosedConditions,
      suspectedConditions: form.suspectedConditions,
      dietPreference: form.dietPreference,
      activityLevel: form.activityLevel,
      aiTone: form.aiTone,
      archNemesis: form.archNemesis,
      isOnboardingComplete: true,
      currentDay,
    });

    // Auto-create first log entry from mood, flow, and symptoms
    if (form.selectedMood || form.currentFlow || form.currentSymptoms.length > 0) {
      try {
        const today = new Date().toISOString().split('T')[0];
        await addLog({
          date: today,
          cycleDay: currentDay,
          phase: 'ONBOARDING',
          symptoms: form.currentSymptoms,
          mood: form.selectedMood,
          flow: form.currentFlow,
          notes: `First log created during onboarding. Mood: ${form.selectedMood}${form.currentFlow ? ', Flow: ' + form.currentFlow : ''}.`,
        });
      } catch (e) {
        console.error('Failed to save initial log:', e);
      }
    }

    completeOnboarding();
  };

  const progress = step === 0 ? 0 : Math.round((step / TOTAL_STEPS) * 100);

  return (
    <div className={`${isDarkMode ? 'dark' : ''} absolute inset-0 z-50 flex flex-col bg-white dark:bg-black overflow-hidden`}>
      {/* Progress Bar */}
      {step > 0 && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-gray-100 dark:bg-[#1e1e1e] z-10">
          <div
            className="h-full bg-[#007AFF] dark:bg-[#0A84FF] transition-all duration-500 ease-out rounded-r-full"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Global Dark Mode Toggle */}
      <button 
        onClick={toggleDarkMode}
        className="absolute top-4 right-5 z-20 p-2 rounded-full bg-black/5 dark:bg-white/10 text-gray-600 dark:text-gray-300 hover:scale-105 transition-transform"
      >
        {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
      </button>

      {/* Header Row */}
      {step > 0 && (
        <div className="flex items-center justify-between px-5 pt-8 pb-2 relative z-10 pr-16">
          <button onClick={back} className="p-2 rounded-[12px] bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 transition-colors">
            <ChevronLeft className="w-5 h-5 text-[#1f1f1f] dark:text-[#e3e3e3]" />
          </button>
          <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider absolute left-1/2 -translate-x-1/2">
            Step {step} of {TOTAL_STEPS}
          </span>
          <button onClick={skip} className="text-xs font-semibold text-[#007AFF] dark:text-[#0A84FF] px-3 py-1.5 rounded-[12px] hover:bg-[#007AFF]/10 dark:hover:bg-[#0A84FF]/20 transition-colors">
            Skip
          </button>
        </div>
      )}

      {/* Step Content */}
      <div className="flex-1 overflow-y-auto hide-scrollbar">
        {step === 0 && <StepPrivacy onContinue={next} />}
        {step === 1 && <StepVoiceSplash onContinue={next} />}
        {step === 2 && <StepBasics form={form} update={update} onNext={next} />}
        {step === 3 && <StepCoreRhythm form={form} update={update} onNext={next} />}
        {step === 4 && <StepMedical form={form} update={update} toggleItem={toggleItem} onNext={next} />}
        {step === 5 && <StepLifestyle form={form} update={update} onNext={next} />}
        {step === 6 && <StepAICustom form={form} update={update} toggleItem={toggleItem} onNext={next} />}
        {step === 7 && <StepMood form={form} update={update} toggleItem={toggleItem} onFinish={finish} />}
      </div>
    </div>
  );
}

// ─── STEP 0: PRIVACY PLEDGE ───────────────────────────────────────────────────

function StepPrivacy({ onContinue }) {
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { 
      opacity: 1, 
      y: 0, 
      transition: { duration: 0.5, ease: [0.2, 0, 0, 1] } 
    }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="flex flex-col items-center justify-center min-h-full px-8 py-12 text-center"
    >
      <motion.div variants={itemVariants} className="relative mb-8 mt-4">
        <div className="w-28 h-28 rounded-full bg-[#007AFF]/10 dark:bg-[#0A84FF]/10 flex items-center justify-center shadow-inner">
          <Shield className="w-14 h-14 text-[#007AFF] dark:text-[#0A84FF]" />
        </div>
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.5, type: 'spring', stiffness: 200, damping: 15 }}
          className="absolute -bottom-1 -right-1 w-10 h-10 rounded-full bg-white dark:bg-[#121212] flex items-center justify-center shadow-sm"
        >
          <div className="w-8 h-8 rounded-full bg-[#34C759]/10 dark:bg-[#30D158]/20 flex items-center justify-center">
            <span className="text-[#34C759] dark:text-[#30D158] text-lg font-bold">✓</span>
          </div>
        </motion.div>
      </motion.div>

      <motion.div variants={itemVariants} className="space-y-4 mb-10 w-full">
        <h1 className="text-[36px] font-bold text-[#1f1f1f] dark:text-white leading-[1.1] tracking-tight">
          Your body.<br />Your data.<br />
          <span className="text-[#007AFF] dark:text-[#0A84FF]">Your rules.</span>
        </h1>
        <p className="text-[16px] font-medium text-gray-500 dark:text-gray-400 leading-relaxed mx-auto max-w-[280px]">
          Everything you log stays on your device. We have no server, no database, no way to see your data.
        </p>
      </motion.div>

      <motion.div variants={itemVariants} className="w-full mb-10">
        <div className="relative overflow-hidden bg-white/80 dark:bg-[#1c1c1e]/80 backdrop-saturate-150 backdrop-blur-3xl border-[0.5px] border-slate-200/60 dark:border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.06)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.1)] rounded-[32px] flex flex-col text-left">
          {[
            { icon: Lock, color: 'text-[#007AFF] dark:text-[#0A84FF]', bg: 'bg-[#007AFF]/10 dark:bg-[#0A84FF]/10', text: 'Stored strictly on your device' },
            { icon: Cloud, color: 'text-[#34C759] dark:text-[#30D158]', bg: 'bg-[#34C759]/10 dark:bg-[#30D158]/10', text: 'Optional backup to Google Drive' },
            { icon: Ban, color: 'text-[#FF2D55] dark:text-[#FF375F]', bg: 'bg-[#FF2D55]/10 dark:bg-[#FF375F]/10', text: 'Zero ads. Zero data selling.' },
          ].map((item, index, arr) => {
            const isLast = index === arr.length - 1;
            return (
              <div 
                key={index} 
                className={`flex items-center gap-4 p-5 hover:bg-white/10 dark:hover:bg-white/5 transition-colors ${!isLast ? 'border-b-[0.5px] border-black/5 dark:border-white/5' : ''}`}
              >
                <div className={`w-12 h-12 rounded-2xl ${item.bg} flex items-center justify-center shrink-0 shadow-sm border-[0.5px] border-white/40 dark:border-white/5`}>
                  <item.icon className={`w-6 h-6 ${item.color}`} />
                </div>
                <span className="text-[16px] text-[#1f1f1f] dark:text-[#e3e3e3] font-bold tracking-tight">{item.text}</span>
              </div>
            );
          })}
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="w-full mt-auto">
        <button
          onClick={onContinue}
          className="w-full py-4 rounded-[16px] bg-[#007AFF] dark:bg-[#0A84FF] text-white dark:text-[#121212] font-semibold text-[17px] flex items-center justify-center gap-2 shadow-sm hover:scale-[0.98] transition-transform tracking-tight"
        >
          I understand — Let's begin <ChevronRight className="w-5 h-5" />
        </button>
        <p className="text-[12px] text-gray-500 dark:text-gray-500 text-center mt-6">
          Unlike Flo (fined $56M for sharing health data with Meta), your data never leaves your device.
        </p>
      </motion.div>
    </motion.div>
  );
}

// ─── STEP 0.5: VOICE LOGGING INTRO ────────────────────────────────────────────

function StepVoiceSplash({ onContinue }) {
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { 
      opacity: 1, 
      y: 0, 
      transition: { duration: 0.5, ease: [0.2, 0, 0, 1] } 
    }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="flex flex-col items-center justify-start min-h-full px-6 pt-12 pb-12 text-center"
    >
      <motion.div variants={itemVariants} className="relative mb-12 mt-4 flex items-center justify-center">
        {/* Outer Ripple */}
        <motion.div
          animate={{ scale: [1, 1.6], opacity: [0.4, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
          className="absolute w-32 h-32 rounded-full bg-[#4285f4]/30 dark:bg-[#8ab4f8]/20"
        />
        {/* Inner Ripple */}
        <motion.div
          animate={{ scale: [1, 1.3], opacity: [0.5, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeOut", delay: 0.4 }}
          className="absolute w-32 h-32 rounded-full bg-[#4285f4]/40 dark:bg-[#8ab4f8]/30"
        />
        {/* Core Mic */}
        <div className="w-32 h-32 rounded-full bg-[#e8f0fe] dark:bg-[#1a2b4b] flex items-center justify-center relative shadow-sm z-10">
          <motion.div
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <Mic className="w-14 h-14 text-[#007AFF] dark:text-[#0A84FF]" />
          </motion.div>
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="space-y-4 mb-8">
        <h1 className="text-[36px] font-medium text-[#202124] dark:text-[#e3e3e3] leading-[1.1] tracking-tight">
          Talk.<br />
          Don't type.
        </h1>
        <p className="text-[15px] text-gray-600 dark:text-gray-400 leading-relaxed max-w-[280px] mx-auto">
          Tracking your health shouldn't feel like a chore. Just tell the AI how you feel naturally, and we do the rest.
        </p>
      </motion.div>

      <motion.div variants={itemVariants} className="w-full space-y-3 mb-10">
        <div className="bg-white/80 dark:bg-[#1c1c1e]/80 backdrop-saturate-150 backdrop-blur-3xl border-[0.5px] border-slate-200/60 dark:border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.06)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.1)] rounded-[24px] p-5 text-left">
          <p className="text-[15px] italic text-[#202124] dark:text-[#e3e3e3] font-medium leading-relaxed">
            "I have terrible cramps today and I'm feeling really anxious. Oh, and I took an Advil."
          </p>
        </div>
        
        <div className="flex items-center justify-center gap-2 pt-2">
          <Sparkles className="w-4 h-4 text-[#007AFF] dark:text-[#0A84FF]" />
          <p className="text-xs font-bold text-[#007AFF] dark:text-[#0A84FF] uppercase tracking-widest">Auto-Logs Symptoms & Meds</p>
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="w-full mt-auto">
        <button
          onClick={onContinue}
          className="w-full py-4 rounded-[14px] bg-[#007AFF] dark:bg-[#0A84FF] text-white dark:text-[#121212] font-semibold text-[16px] flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all active:scale-[0.98]"
        >
          Sounds great <ChevronRight className="w-5 h-5" />
        </button>
      </motion.div>
    </motion.div>
  );
}

// ─── STEP 1: BASICS ──────────────────────────────────────────────────────────

function StepBasics({ form, update, onNext }) {
  const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const itemVariants = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.2, 0, 0, 1] } } };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="px-6 py-4 space-y-6">
      <motion.div variants={itemVariants} className="space-y-1 mb-4">
        <h2 className="text-[32px] leading-tight font-medium text-[#202124] dark:text-[#e3e3e3] tracking-tight">
          Let's get to<br />know you ✨
        </h2>
        <p className="text-[14px] text-gray-500 dark:text-gray-400">All fields are optional — but the more you share, the smarter the AI gets.</p>
      </motion.div>

      {/* Name */}
      <motion.div variants={itemVariants} className="pt-2">
        <label className="block mb-3 text-[13px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-2">Your Name or Nickname</label>
        <div className="relative group">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <div className="w-12 h-12 rounded-full bg-[#007AFF]/10 dark:bg-[#007AFF]/20 flex items-center justify-center">
              <User className="w-6 h-6 text-[#007AFF] dark:text-[#0A84FF]" />
            </div>
          </div>
          <input
            type="text"
            placeholder="e.g. Sarah"
            value={form.name}
            onChange={e => update('name', e.target.value)}
            className="w-full pl-[80px] pr-6 py-5 rounded-[28px] bg-white/80 dark:bg-[#1c1c1e]/80 backdrop-saturate-150 backdrop-blur-3xl border-[0.5px] border-slate-200/60 dark:border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.06)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.1)] text-[#202124] dark:text-[#e3e3e3] placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#007AFF]/30 transition-all text-[18px] font-bold hover:border-[#007AFF]/20"
          />
        </div>
      </motion.div>

      {/* DOB */}
      <motion.div variants={itemVariants} className="pt-2">
        <label className="block mb-3 text-[13px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-2">Date of Birth</label>
        <div className="relative group cursor-pointer">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <div className="w-12 h-12 rounded-full bg-[#007AFF]/10 dark:bg-[#007AFF]/20 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-[#007AFF] dark:text-[#0A84FF]" />
            </div>
          </div>
          <input
            type="date"
            value={form.dob}
            onChange={e => update('dob', e.target.value)}
            className="w-full pl-[80px] pr-6 py-5 rounded-[28px] bg-white/80 dark:bg-[#1c1c1e]/80 backdrop-saturate-150 backdrop-blur-3xl border-[0.5px] border-slate-200/60 dark:border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.06)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.1)] text-[#202124] dark:text-[#e3e3e3] focus:outline-none focus:ring-2 focus:ring-[#007AFF]/30 transition-all text-[18px] font-bold cursor-pointer hover:border-[#007AFF]/20"
          />
        </div>
        <p className="text-[13px] text-gray-400 dark:text-gray-500 ml-2 mt-3">Age 45+? We'll keep an eye out for perimenopause patterns.</p>
      </motion.div>

      {/* Height & Weight */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 gap-4 pt-2">
        <div className="relative group">
          <label className="block mb-3 text-[13px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-2 text-center">Height (cm)</label>
          <input
            type="number"
            placeholder="165"
            value={form.height}
            onChange={e => update('height', e.target.value)}
            className="w-full px-6 py-5 rounded-[28px] bg-white/80 dark:bg-[#1c1c1e]/80 backdrop-saturate-150 backdrop-blur-3xl border-[0.5px] border-slate-200/60 dark:border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.06)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.1)] text-[#202124] dark:text-[#e3e3e3] placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#007AFF]/30 transition-all text-[18px] font-bold text-center hover:border-[#007AFF]/20"
          />
        </div>
        <div className="relative group">
          <label className="block mb-3 text-[13px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-2 text-center">Weight (kg)</label>
          <input
            type="number"
            placeholder="62"
            value={form.weight}
            onChange={e => update('weight', e.target.value)}
            className="w-full px-6 py-5 rounded-[28px] bg-white/80 dark:bg-[#1c1c1e]/80 backdrop-saturate-150 backdrop-blur-3xl border-[0.5px] border-slate-200/60 dark:border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.06)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.1)] text-[#202124] dark:text-[#e3e3e3] placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#007AFF]/30 transition-all text-[18px] font-bold text-center hover:border-[#007AFF]/20"
          />
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="pt-4">
        <NavButton onClick={onNext} />
      </motion.div>
    </motion.div>
  );
}

// ─── STEP 2: CORE RHYTHM ──────────────────────────────────────────────────────

function StepCoreRhythm({ form, update, onNext }) {
  const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const itemVariants = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.2, 0, 0, 1] } } };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="px-6 py-4 space-y-8">
      <motion.div variants={itemVariants} className="space-y-1">
        <h2 className="text-[32px] leading-tight font-medium text-[#202124] dark:text-[#e3e3e3] tracking-tight">
          Your primary focus
        </h2>
        <p className="text-[14px] text-gray-500 dark:text-gray-400">This tailors your entire Rhythm experience.</p>
      </motion.div>

      {/* Journey Mode */}
      <motion.div variants={itemVariants} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          {JOURNEY_MODES.map((mode, i) => {
            const Icon = mode.icon;
            const isSelected = form.lifecycleMode === mode.id;
            const isOddTotal = JOURNEY_MODES.length % 2 !== 0;
            const isLast = i === JOURNEY_MODES.length - 1;
            const colSpanClass = (isOddTotal && isLast) ? 'col-span-2' : '';
            return (
              <button
                key={mode.id}
                onClick={() => update('lifecycleMode', mode.id)}
                className={`flex flex-col items-center justify-center gap-3 p-4 rounded-[24px] border border-transparent shadow-sm transition-all text-center ${colSpanClass} ${isSelected ? `${mode.bg} ring-2 ring-[#1967d2]/30 dark:ring-[#8ab4f8]/30 scale-[1.02]` : 'bg-white dark:bg-[#1e1e1e] hover:border-[#1967d2]/20'}`}
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${isSelected ? mode.bg : 'bg-gray-50 dark:bg-[#2a2a2a]'}`}>
                  <Icon className={`w-6 h-6 ${isSelected ? mode.color : 'text-gray-400 dark:text-gray-500'}`} />
                </div>
                <p className={`font-medium text-[15px] leading-tight ${isSelected ? mode.color : 'text-[#202124] dark:text-[#e3e3e3]'}`}>{mode.label}</p>
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* Cycle Length */}
      <motion.div variants={itemVariants} className="pt-2">
        <label className="block mb-3 text-[13px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-2">Average Cycle Length</label>
        <div className="bg-[#f8fafd] dark:bg-[#1a2b4b]/20 rounded-[32px] px-6 py-8 border border-transparent shadow-sm">
          <div className="flex justify-between items-center mb-8">
            <span className="text-[15px] font-bold text-gray-400">21d</span>
            <div className="flex flex-col items-center">
              <span className="text-[48px] leading-none font-black text-[#007AFF] dark:text-[#0A84FF] tracking-tight">{form.cycleLength}</span>
              <span className="text-[12px] font-bold text-[#007AFF]/60 dark:text-[#8ab4f8]/60 uppercase tracking-widest mt-2">Days</span>
            </div>
            <span className="text-[15px] font-bold text-gray-400">45d</span>
          </div>
          <input
            type="range" min="21" max="45" value={form.cycleLength}
            onChange={e => update('cycleLength', parseInt(e.target.value))}
            className="w-full h-4 rounded-full appearance-none cursor-pointer bg-blue-100 dark:bg-[#1e3a5f] accent-[#007AFF] dark:accent-[#8ab4f8]"
          />
        </div>
      </motion.div>

      {/* Last Period */}
      <motion.div variants={itemVariants} className="pt-2">
        <label className="block mb-3 text-[13px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-2">First Day of Last Period</label>
        <div className="relative group cursor-pointer">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <div className="w-12 h-12 rounded-full bg-[#007AFF]/10 dark:bg-[#007AFF]/20 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-[#007AFF] dark:text-[#0A84FF]" />
            </div>
          </div>
          <input
            type="date"
            value={form.lastPeriodDate}
            onChange={e => update('lastPeriodDate', e.target.value)}
            className="w-full pl-[80px] pr-6 py-5 rounded-[28px] bg-white/80 dark:bg-[#1c1c1e]/80 backdrop-saturate-150 backdrop-blur-3xl border-[0.5px] border-slate-200/60 dark:border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.06)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.1)] text-[#202124] dark:text-[#e3e3e3] focus:outline-none focus:ring-2 focus:ring-[#007AFF]/30 transition-all text-[18px] font-bold cursor-pointer hover:border-[#007AFF]/20"
          />
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="pt-4">
        <NavButton onClick={onNext} />
      </motion.div>
    </motion.div>
  );
}

// ─── STEP 3: MEDICAL BASELINES ────────────────────────────────────────────────

function StepMedical({ form, update, toggleItem, onNext }) {
  const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const itemVariants = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.2, 0, 0, 1] } } };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="px-6 py-4 space-y-6">
      <motion.div variants={itemVariants} className="space-y-1 mb-4">
        <h2 className="text-[32px] leading-tight font-medium text-[#202124] dark:text-[#e3e3e3] tracking-tight">
          Your Health<br />Profile 🩺
        </h2>
        <p className="text-[14px] text-gray-500 dark:text-gray-400">This makes the AI dramatically more accurate. Skip if you prefer.</p>
      </motion.div>

      {/* Contraceptive */}
      <motion.div variants={itemVariants} className="pt-2">
        <label className="block mb-3 text-[13px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-2">Contraceptive Method</label>
        <div className="flex flex-wrap gap-2">
          {CONTRACEPTIVES.map(c => {
            const isSelected = form.contraceptive === c.id;
            const Icon = c.icon;
            return (
              <button
                key={c.id}
                onClick={() => update('contraceptive', c.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-[14px] font-medium transition-colors ${isSelected ? 'bg-[#c2e7ff] dark:bg-[#004a77] text-[#001d35] dark:text-[#c2e7ff] border border-transparent' : 'bg-transparent border border-gray-400 dark:border-gray-500 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
              >
                <Icon className={`w-4 h-4 ${isSelected ? 'text-[#001d35] dark:text-[#c2e7ff]' : 'text-gray-500 dark:text-gray-400'}`} />
                {c.label}
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* Diagnosed Conditions */}
      <motion.div variants={itemVariants} className="pt-4">
        <label className="block mb-3 text-[13px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-2">Diagnosed Conditions</label>
        <div className="flex flex-wrap gap-2">
          {CONDITIONS.map(c => {
            const isSelected = form.diagnosedConditions.includes(c.id);
            const Icon = c.icon;
            return (
              <button
                key={c.id}
                onClick={() => toggleItem('diagnosedConditions', c.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-[14px] font-medium transition-colors ${isSelected ? `${c.bg} ${c.color} border border-transparent` : 'bg-transparent border border-gray-400 dark:border-gray-500 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
              >
                <Icon className={`w-4 h-4 ${isSelected ? c.color : 'text-gray-500 dark:text-gray-400'}`} />
                {c.label}
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* I Suspect */}
      <motion.div variants={itemVariants} className="pt-4">
        <label className="block mb-3 text-[13px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-2 flex items-center gap-2">
          "I Suspect…" <span className="text-[10px] bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 px-2 py-0.5 rounded-full font-bold border border-amber-200 dark:border-amber-700/50">Unique to Rhythm</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {CONDITIONS.map(c => {
            const isSelected = form.suspectedConditions.includes(c.id);
            const Icon = c.icon;
            return (
              <button
                key={c.id}
                onClick={() => toggleItem('suspectedConditions', c.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-[14px] font-medium transition-colors ${isSelected ? 'bg-[#ffdf99] dark:bg-[#7a5900] text-[#3d2c00] dark:text-[#ffdf99] border border-transparent' : 'bg-transparent border border-gray-400 dark:border-gray-500 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
              >
                <Icon className={`w-4 h-4 ${isSelected ? 'text-[#3d2c00] dark:text-[#ffdf99]' : 'text-gray-500 dark:text-gray-400'}`} />
                {c.label}
              </button>
            );
          })}
        </div>
      </motion.div>

      <motion.div variants={itemVariants}>
        <NavButton onClick={onNext} />
      </motion.div>
    </motion.div>
  );
}

// ─── STEP 4: LIFESTYLE ────────────────────────────────────────────────────────

function StepLifestyle({ form, update, onNext }) {
  const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const itemVariants = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.2, 0, 0, 1] } } };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="px-6 py-4 space-y-6">
      <motion.div variants={itemVariants} className="space-y-1 mb-4">
        <h2 className="text-[32px] leading-tight font-medium text-[#202124] dark:text-[#e3e3e3] tracking-tight">
          Your Lifestyle<br />Preferences
        </h2>
        <p className="text-[14px] text-gray-500 dark:text-gray-400">Powers the cycle-synced nutrition and fitness engine.</p>
      </motion.div>

      {/* Diet */}
      <motion.div variants={itemVariants} className="pt-2">
        <label className="block mb-3 text-[13px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-2">Dietary Preference</label>
        <div className="grid grid-cols-2 gap-3">
          {DIET_OPTIONS.map(d => {
            const Icon = d.icon;
            const isSelected = form.dietPreference === d.id;
            return (
              <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                key={d.id}
                onClick={() => update('dietPreference', d.id)}
                className={`flex items-center gap-3 p-4 rounded-[20px] shadow-sm border border-transparent transition-colors ${isSelected ? 'bg-blue-50 dark:bg-[#1967d2]/20 ring-2 ring-[#007AFF]/30 dark:ring-[#8ab4f8]/30' : 'bg-white/80 dark:bg-[#1c1c1e]/80 backdrop-saturate-150 backdrop-blur-3xl border-[0.5px] border-slate-200/60 dark:border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.06)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.1)] hover:border-[#007AFF]/20 hover:shadow-md'}`}
              >
                <motion.div
                  animate={{ rotate: isSelected ? [0, -15, 10, -5, 0] : 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <Icon className={`w-5 h-5 ${d.color}`} />
                </motion.div>
                <span className={`text-[15px] font-medium ${isSelected ? 'text-[#007AFF] dark:text-[#0A84FF]' : 'text-[#202124] dark:text-[#e3e3e3]'}`}>{d.label}</span>
              </motion.button>
            );
          })}
        </div>
      </motion.div>

      {/* Activity */}
      <motion.div variants={itemVariants} className="pt-4">
        <label className="block mb-3 text-[13px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-2">Activity Level</label>
        <div className="space-y-3">
          {ACTIVITY_LEVELS.map(a => {
            const isSelected = form.activityLevel === a.id;
            return (
              <motion.button
                whileHover={{ scale: 1.01, x: 2 }}
                whileTap={{ scale: 0.99 }}
                key={a.id}
                onClick={() => update('activityLevel', a.id)}
                className={`w-full flex items-center gap-4 p-4 rounded-[20px] shadow-sm border border-transparent transition-colors text-left ${isSelected ? 'bg-blue-50 dark:bg-[#1967d2]/20 ring-2 ring-[#007AFF]/30 dark:ring-[#8ab4f8]/30' : 'bg-white/80 dark:bg-[#1c1c1e]/80 backdrop-saturate-150 backdrop-blur-3xl border-[0.5px] border-slate-200/60 dark:border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.06)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.1)] hover:border-[#007AFF]/20 hover:shadow-md'}`}
              >
                <motion.div 
                  animate={{ scale: isSelected ? [1, 1.15, 1] : 1 }}
                  transition={{ duration: 0.3 }}
                  className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${a.iconBg}`}
                >
                  <a.icon className={`w-5 h-5 ${a.iconColor}`} />
                </motion.div>
                <div className="text-left flex-1">
                  <p className={`font-medium text-[16px] ${isSelected ? 'text-[#007AFF] dark:text-[#0A84FF]' : 'text-[#202124] dark:text-[#e3e3e3]'}`}>{a.label}</p>
                  <p className="text-[13px] text-gray-500 dark:text-gray-400 mt-0.5">{a.desc}</p>
                </div>
                {isSelected && (
                  <motion.div 
                    initial={{ scale: 0, opacity: 0, rotate: -180 }} 
                    animate={{ scale: 1, opacity: 1, rotate: 0 }} 
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className="ml-auto w-6 h-6 rounded-[14px] bg-[#007AFF] dark:bg-[#0A84FF] flex items-center justify-center shrink-0"
                  >
                    <span className="text-white dark:text-[#121212] text-xs font-bold">✓</span>
                  </motion.div>
                )}
              </motion.button>
            );
          })}
        </div>
      </motion.div>

      <motion.div variants={itemVariants}>
        <NavButton onClick={onNext} />
      </motion.div>
    </motion.div>
  );
}

// ─── STEP 5: AI CUSTOMIZATION ─────────────────────────────────────────────────

function StepAICustom({ form, update, toggleItem, onNext }) {
  const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const itemVariants = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.2, 0, 0, 1] } } };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="px-6 py-4 space-y-6">
      <motion.div variants={itemVariants} className="space-y-1 mb-4">
        <h2 className="text-[32px] leading-tight font-medium text-[#202124] dark:text-[#e3e3e3] tracking-tight">
          Personalise<br />Your AI
        </h2>
        <p className="text-[14px] text-gray-500 dark:text-gray-400">Every user gets a completely different AI personality.</p>
      </motion.div>

      {/* AI Tone */}
      <motion.div variants={itemVariants} className="pt-2">
        <label className="block mb-3 text-[13px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-2">How should Rhythm talk to you?</label>
        <div className="space-y-3">
          {AI_TONES.map(t => {
            const isSelected = form.aiTone === t.id;
            return (
              <button
                key={t.id}
                onClick={() => update('aiTone', t.id)}
                className={`w-full flex items-center gap-4 p-4 rounded-[20px] shadow-sm border border-transparent transition-all ${isSelected ? 'bg-blue-50 dark:bg-[#1967d2]/20 ring-2 ring-[#007AFF]/30 dark:ring-[#8ab4f8]/30' : 'bg-white/80 dark:bg-[#1c1c1e]/80 backdrop-saturate-150 backdrop-blur-3xl border-[0.5px] border-slate-200/60 dark:border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.06)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.1)] hover:border-[#007AFF]/20'}`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${t.iconBg}`}>
                  <t.icon className={`w-5 h-5 ${t.iconColor}`} />
                </div>
                <div className="text-left">
                  <p className={`font-medium text-[16px] ${isSelected ? 'text-[#007AFF] dark:text-[#0A84FF]' : 'text-[#202124] dark:text-[#e3e3e3]'}`}>{t.label}</p>
                  <p className="text-[13px] text-gray-500 dark:text-gray-400 mt-0.5">{t.desc}</p>
                </div>
                {isSelected && <div className="ml-auto w-6 h-6 rounded-[14px] bg-[#007AFF] dark:bg-[#0A84FF] flex items-center justify-center shrink-0"><span className="text-white dark:text-[#121212] text-xs font-bold">✓</span></div>}
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* Voice Logging Ad */}
      <motion.div variants={itemVariants} className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-[#1967d2]/10 dark:to-indigo-900/20 border border-blue-100 dark:border-indigo-500/20 rounded-[24px] p-5 flex items-center gap-4 shadow-sm">
        <div className="w-12 h-12 rounded-[14px] bg-[#007AFF] dark:bg-[#0A84FF] flex items-center justify-center shrink-0 shadow-md">
          <Mic className="w-6 h-6 text-white dark:text-[#121212]" />
        </div>
        <div className="space-y-0.5">
          <h4 className="text-[15px] font-bold text-blue-900 dark:text-blue-300">Voice Logging</h4>
          <p className="text-[14px] text-blue-800/80 dark:text-indigo-300/80 leading-snug">
            Tap the mic to speak your symptoms. AI will auto-tag them for you.
          </p>
        </div>
      </motion.div>

      {/* Arch Nemesis Symptoms */}
      <motion.div variants={itemVariants} className="pt-4">
        <label className="block mb-3 text-[13px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-2">Your biggest struggles (pick up to 3)</label>
        <div className="grid grid-cols-2 gap-3">
          {ARCH_NEMESIS.map(s => {
            const isSelected = form.archNemesis.includes(s.id);
            const atLimit = form.archNemesis.length >= 3 && !isSelected;
            return (
              <button
                key={s.id}
                onClick={() => !atLimit && toggleItem('archNemesis', s.id)}
                disabled={atLimit}
                className={`flex items-center gap-3 p-3 rounded-[20px] border border-transparent shadow-sm transition-all text-left ${isSelected ? `${s.iconBg} ring-2 ring-current/20` : atLimit ? 'opacity-40 bg-white dark:bg-[#1e1e1e] cursor-not-allowed border-gray-100 dark:border-[#333]' : 'bg-white dark:bg-[#1e1e1e] hover:border-gray-200 dark:hover:border-gray-600 border-gray-100 dark:border-[#333]'}`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isSelected ? s.iconBg : 'bg-gray-50 dark:bg-[#2a2a2a]'}`}>
                  <s.icon className={`w-5 h-5 ${isSelected ? s.iconColor : 'text-gray-400 dark:text-gray-500'}`} />
                </div>
                <span className={`text-[14px] font-medium ${isSelected ? s.iconColor : 'text-[#202124] dark:text-[#e3e3e3]'}`}>{s.label}</span>
              </button>
            );
          })}
        </div>
      </motion.div>

      <motion.div variants={itemVariants}>
        <NavButton onClick={onNext} />
      </motion.div>
    </motion.div>
  );
}

// ─── STEP 6: MOOD + FLOW + SYMPTOMS ICEBREAKER ───────────────────────────────

const FLOW_OPTIONS = [
  { id: 'Spotting',  label: 'Spotting', icon: Droplets,    iconColor: 'text-pink-400 dark:text-pink-300',   iconBg: 'bg-pink-50 dark:bg-pink-900/20'   },
  { id: 'Light',    label: 'Light',    icon: Droplets,    iconColor: 'text-rose-400 dark:text-rose-300',   iconBg: 'bg-rose-50 dark:bg-rose-900/20'   },
  { id: 'Medium',   label: 'Medium',   icon: Droplets,    iconColor: 'text-rose-600 dark:text-rose-400',   iconBg: 'bg-rose-50 dark:bg-rose-900/20'   },
  { id: 'Heavy',    label: 'Heavy',    icon: Droplets,    iconColor: 'text-red-600 dark:text-red-400',     iconBg: 'bg-red-50 dark:bg-red-900/20'     },
  { id: 'None',     label: 'No Flow',  icon: Shield,      iconColor: 'text-gray-400 dark:text-gray-500',   iconBg: 'bg-gray-100 dark:bg-[#2a2a2a]'    },
];

const QUICK_SYMPTOMS = [
  { id: 'Cramps',            icon: Zap,         iconColor: 'text-rose-500 dark:text-rose-400',     iconBg: 'bg-rose-50 dark:bg-rose-900/20'     },
  { id: 'Headache',          icon: Brain,       iconColor: 'text-purple-500 dark:text-purple-400', iconBg: 'bg-purple-50 dark:bg-purple-900/20' },
  { id: 'Bloating',          icon: Wind,        iconColor: 'text-teal-500 dark:text-teal-400',     iconBg: 'bg-teal-50 dark:bg-teal-900/20'     },
  { id: 'Fatigue',           icon: BatteryLow,  iconColor: 'text-blue-500 dark:text-blue-400',     iconBg: 'bg-blue-50 dark:bg-blue-900/20'     },
  { id: 'Nausea',            icon: AlertCircle, iconColor: 'text-orange-500 dark:text-orange-400', iconBg: 'bg-orange-50 dark:bg-orange-900/20' },
  { id: 'Back Pain',         icon: Activity,    iconColor: 'text-amber-500 dark:text-amber-400',   iconBg: 'bg-amber-50 dark:bg-amber-900/20'   },
  { id: 'Breast Tenderness', icon: Heart,       iconColor: 'text-pink-500 dark:text-pink-400',     iconBg: 'bg-pink-50 dark:bg-pink-900/20'     },
  { id: 'Acne',              icon: Sparkles,    iconColor: 'text-indigo-500 dark:text-indigo-400', iconBg: 'bg-indigo-50 dark:bg-indigo-900/20' },
];

function StepMood({ form, update, toggleItem, onFinish }) {
  const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const itemVariants = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.2, 0, 0, 1] } } };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="px-6 py-4 space-y-6 pb-8">
      <motion.div variants={itemVariants} className="space-y-1 mb-4">
        <h2 className="text-[32px] leading-tight font-medium text-[#202124] dark:text-[#e3e3e3] tracking-tight">
          Let's log today —<br />
          <span className="text-[#007AFF] dark:text-[#0A84FF]">how are you?</span>
        </h2>
        <p className="text-[14px] text-gray-500 dark:text-gray-400">This creates your very first health log — so you won't start with an empty app!</p>
      </motion.div>

      {/* Current Mood */}
      <motion.div variants={itemVariants} className="pt-2">
        <label className="block mb-3 text-[13px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-2">Current Mood</label>
        <div className="grid grid-cols-4 gap-3">
          {MOODS.map(m => {
            const isSelected = form.selectedMood === m.id;
            return (
              <button
                key={m.id}
                onClick={() => update('selectedMood', m.id)}
                className={`flex flex-col items-center justify-center gap-2 p-3 rounded-[24px] shadow-sm border border-transparent transition-all ${
                  isSelected
                    ? `${m.iconBg} ring-2 ring-current/20 scale-105`
                    : 'bg-white/80 dark:bg-[#1c1c1e]/80 backdrop-saturate-150 backdrop-blur-3xl border-[0.5px] border-slate-200/60 dark:border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.06)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.1)] hover:border-gray-200 dark:hover:border-[#444]'
                }`}
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isSelected ? m.iconBg : 'bg-gray-50 dark:bg-[#2a2a2a]'}`}>
                  <m.icon className={`w-6 h-6 ${isSelected ? m.iconColor : 'text-gray-400 dark:text-gray-500'}`} />
                </div>
                <span className={`text-[12px] font-bold ${isSelected ? m.iconColor : 'text-gray-600 dark:text-gray-300'}`}>{m.label}</span>
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* Flow Condition */}
      <motion.div variants={itemVariants} className="pt-4">
        <label className="block mb-3 text-[13px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-2">Period Flow Today</label>
        <div className="flex gap-2 flex-wrap">
          {FLOW_OPTIONS.map(f => {
            const isSelected = form.currentFlow === f.id;
            return (
              <button
                key={f.id}
                onClick={() => update('currentFlow', f.id)}
                className={`flex items-center gap-2 px-4 py-3 rounded-full border border-transparent shadow-sm text-[14px] font-medium transition-all ${
                  isSelected
                    ? `${f.iconBg} ring-2 ring-current/30 ${f.iconColor}`
                    : 'bg-white/80 dark:bg-[#1c1c1e]/80 backdrop-saturate-150 backdrop-blur-3xl border-[0.5px] border-slate-200/60 dark:border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.06)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.1)] text-gray-600 dark:text-gray-400 hover:border-gray-200 dark:hover:border-[#444]'
                }`}
              >
                <f.icon className={`w-4 h-4 ${isSelected ? f.iconColor : 'text-gray-400'}`} />
                {f.label}
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* Quick Symptoms — only show if on period OR always for context */}
      <motion.div variants={itemVariants} className="pt-4">
        <label className="block mb-3 text-[13px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-2">Any Symptoms Right Now? <span className="normal-case font-normal">(optional)</span></label>
        <div className="grid grid-cols-2 gap-3">
          {QUICK_SYMPTOMS.map(s => {
            const isSelected = form.currentSymptoms.includes(s.id);
            return (
              <button
                key={s.id}
                onClick={() => toggleItem('currentSymptoms', s.id)}
                className={`flex items-center gap-3 p-3 rounded-[20px] border border-transparent shadow-sm transition-all text-left ${
                  isSelected
                    ? `${s.iconBg} ring-2 ring-current/20`
                    : 'bg-white/80 dark:bg-[#1c1c1e]/80 backdrop-saturate-150 backdrop-blur-3xl border-[0.5px] border-slate-200/60 dark:border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.06)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.1)] hover:border-gray-200 dark:hover:border-[#444]'
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isSelected ? s.iconBg : 'bg-gray-50 dark:bg-[#2a2a2a]'}`}>
                  <s.icon className={`w-4 h-4 ${isSelected ? s.iconColor : 'text-gray-400 dark:text-gray-500'}`} />
                </div>
                <span className={`text-[14px] font-medium ${
                  isSelected ? s.iconColor : 'text-[#202124] dark:text-[#e3e3e3]'
                }`}>{s.id}</span>
              </button>
            );
          })}
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="pt-4 space-y-3 mt-auto">
        <motion.button
          whileHover={(form.selectedMood || form.currentFlow) ? { scale: 1.01 } : {}}
          whileTap={(form.selectedMood || form.currentFlow) ? { scale: 0.98 } : {}}
          onClick={onFinish}
          disabled={!form.selectedMood && !form.currentFlow}
          className={`w-full py-4 rounded-full font-medium text-[15px] tracking-wide flex items-center justify-center gap-2.5 transition-colors relative overflow-hidden ${
            (form.selectedMood || form.currentFlow)
              ? 'bg-[#0b57d0] dark:bg-[#a8c7fa] text-white dark:text-[#062e6f]'
              : 'bg-[#1f1f1f]/10 dark:bg-white/10 text-[#1f1f1f]/30 dark:text-white/30 cursor-not-allowed'
          }`}
        >
          <Activity className={`w-5 h-5 ${
            (form.selectedMood || form.currentFlow)
              ? 'text-white dark:text-[#062e6f]'
              : 'text-[#1f1f1f]/50 dark:text-white/50'
          }`} strokeWidth={2.5} />
          Enter Rhythm
        </motion.button>
        {(!form.selectedMood && !form.currentFlow) && (
          <button onClick={onFinish} className="w-full text-center text-[13px] font-medium text-gray-500 dark:text-gray-400 py-2 hover:text-[#0b57d0] dark:hover:text-[#a8c7fa] transition-colors">
            Skip and enter anyway
          </button>
        )}
      </motion.div>
    </motion.div>
  );
}

// ─── SHARED NAV BUTTON ────────────────────────────────────────────────────────

function NavButton({ onClick, label = 'Continue' }) {
  return (
    <div className="pb-6 pt-4">
      <button
        onClick={onClick}
        className="w-full py-3.5 rounded-[14px] bg-[#007AFF] dark:bg-[#0A84FF] text-white dark:text-[#121212] font-semibold text-[15px] flex items-center justify-center gap-2 hover:bg-[#1557B0] dark:hover:bg-[#9cbdf9] transition-all active:scale-[0.98]"
      >
        {label} <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
}
