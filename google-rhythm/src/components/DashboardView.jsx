import React from 'react';
import { motion } from 'framer-motion';
import { 
  Droplets, Zap, Heart, Moon, 
  Apple, Dumbbell, Brain, Play,
  Info, ShoppingCart, Pill, Sparkles, CheckSquare, Square, Baby, Loader2, Dna, Cpu, Wand2
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { PHASES } from '../utils/constants';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.4, ease: [0.2, 0, 0, 1] }
  }
};

export default function DashboardView() {
  const { currentDay, currentPhase: phaseId, isDarkMode, userPrefs, meds, toggleMed, setDay, markStackTaken, lastLoggedTimestamp } = useAppStore();
  const currentPhase = PHASES[phaseId] || PHASES.MENSTRUAL;
  const { dietPreference, nonVegDays = [], cycleLength = 28, diagnosedConditions, contraceptive } = userPrefs;
  
  const hasPCOS = diagnosedConditions?.includes('PCOS');
  
  const birthControlMed = meds.find(m => m.name === 'Birth Control');
  const isPillUser = contraceptive === 'The Pill';
  const missedPill = isPillUser && birthControlMed && !birthControlMed.taken;
  
  const isLate = currentDay > cycleLength;
  const radius = 96; // Increased slightly for a larger, more premium feel
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(currentDay / cycleLength, 1);
  const strokeDashoffset = circumference - progress * circumference;

  // Calculate coordinates for the glowing tracker dot at the end of the stroke
  const angle = (progress * 2 * Math.PI) - (Math.PI / 2); // -90 deg offset for SVG
  const thumbX = 128 + radius * Math.cos(angle);
  const thumbY = 128 + radius * Math.sin(angle);

  const FORECAST_PHASES = [
    { id: 'menstrual', name: 'Menstrual Phase', startDay: 1, icon: Droplets, color: 'text-red-500 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20', desc: 'Low energy, potential cramps. Prioritize rest and hydration.' },
    { id: 'follicular', name: 'Follicular Phase', startDay: 6, icon: Zap, color: 'text-blue-500 dark:text-[#8ab4f8]', bg: 'bg-blue-50 dark:bg-blue-900/20', desc: 'Rising energy and creativity. Great time for new physical activities.' },
    { id: 'ovulation', name: 'Ovulation Window', startDay: cycleLength - 16, icon: Heart, color: 'text-amber-500 dark:text-[#fde293]', bg: 'bg-amber-50 dark:bg-amber-900/20', desc: 'Peak energy, high sociability, and maximum fertility window.' },
    { id: 'luteal', name: 'Luteal Phase', startDay: cycleLength - 11, icon: Moon, color: 'text-green-500 dark:text-[#81c995]', bg: 'bg-green-50 dark:bg-green-900/20', desc: 'Winding down. You may experience PMS, cravings, or mild fatigue.' }
  ];

  // CHILDFREE MODE ENFORCEMENT
  const isChildfree = userPrefs.lifecycleMode === 'childfree';
  const displayPhase = { ...currentPhase };
  if (isChildfree && displayPhase.id === 'OVULATION') {
    displayPhase.name = 'Mid-Cycle';
    displayPhase.message = 'Peak energy and sociability';
  }

  const upcomingPhases = FORECAST_PHASES
    .filter(phase => !(isChildfree && phase.id === 'ovulation'))
    .map(phase => {
    let daysUntil = (phase.startDay - currentDay) % cycleLength;
    if (daysUntil < 0) daysUntil += cycleLength;
    
    const phaseDate = new Date();
    phaseDate.setDate(phaseDate.getDate() + daysUntil);
    const dateString = phaseDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    return { ...phase, daysUntil, dateString };
  }).sort((a, b) => a.daysUntil - b.daysUntil);

  const activeHex = isDarkMode ? currentPhase.hexDark : currentPhase.hexLight;

  // --- SMART RESTOCK LOGIC ---
  const isRestockTime = currentDay >= cycleLength - 3 && currentDay <= cycleLength;
  const daysUntilPeriod = (cycleLength + 1) - currentDay;

  // --- REAL AI PREDICTION WITH CACHING ---
  const [aiData, setAiData] = React.useState({ symptom: "analyzing biology...", prob: 0, context: "Running predictive analysis..." });
  
  const [customPlan, setCustomPlan] = React.useState(null);
  const [isGeneratingPlan, setIsGeneratingPlan] = React.useState(false);

  React.useEffect(() => {
    async function fetchCustomPlan() {
      const today = new Date().toISOString().slice(0, 10);
      try {
        const { getCachedInsight, saveCachedInsight, getLocalLogs } = await import('../services/db.js');
        const { generateCustomPlan } = await import('../services/nimService.js');
        
        const cacheKey = `customPlan_${today}_${lastLoggedTimestamp}`;
        const cached = await getCachedInsight(cacheKey, 'dashboard_plan');
        
        if (cached) {
          setCustomPlan(cached.insight);
          if (cached.insight.forecast) setAiData(cached.insight.forecast);
          return;
        }

        setIsGeneratingPlan(true);
        
        // Wrap the actual fetch in its own promise
        const fetchPromise = (async () => {
          const localLogs = await getLocalLogs();
          const recentLogs = localLogs.slice(-15);
          return generateCustomPlan(userPrefs, displayPhase.name, currentDay, recentLogs);
        })();

        // Create a 15-second artificial delay promise for the theatrical UX effect
        const minWaitPromise = new Promise(resolve => setTimeout(resolve, 15000));

        // Wait for BOTH the AI to return AND the 15 seconds to pass
        const [plan] = await Promise.all([fetchPromise, minWaitPromise]);
        
        if (plan) {
          await saveCachedInsight(cacheKey, 'dashboard_plan', plan);
          setCustomPlan(plan);
          if (plan.forecast) setAiData(plan.forecast);
        }
      } catch (e) {
        console.warn("Failed to fetch custom plan:", e);
      } finally {
        setIsGeneratingPlan(false);
      }
    }
    fetchCustomPlan();
  }, [lastLoggedTimestamp, currentDay]);

  // --- PHASE & DIET BASED ACTIONABLE HEALTH GUIDANCE ---
  const currentWeekday = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  const allowsMeat = dietPreference === 'non-vegetarian' && nonVegDays.includes(currentWeekday);

  const getPhaseGuidance = (phaseName) => {
    switch(phaseName) {
      case 'Menstrual': return {
        nutrition: { 
          title: "Iron-Rich Foods", 
          desc: allowsMeat ? "Replenish iron levels with red meat or spinach to combat fatigue." : "Replenish iron levels with lentils, fortified tofu, or spinach to combat fatigue.", 
          icon: Apple, color: "text-red-500 dark:text-red-400", bg: "bg-red-50 dark:bg-red-900/20" 
        },
        fitness: { title: "Restorative Movement", desc: "Opt for restorative yoga or light walking. Avoid overexertion.", icon: Dumbbell, color: "text-red-500 dark:text-red-400", bg: "bg-red-50 dark:bg-red-900/20" },
        mental: { title: "Gentle Self-Care", desc: "Your body is working hard. Rest and practice self-compassion.", icon: Brain, color: "text-red-500 dark:text-red-400", bg: "bg-red-50 dark:bg-red-900/20" }
      };
      case 'Follicular': return {
        nutrition: { 
          title: "Fresh & Fermented", 
          desc: allowsMeat ? "Lean proteins like chicken or fish, and probiotic foods to support rising estrogen." : "Plant-based proteins like tempeh, and probiotic foods to support rising estrogen.", 
          icon: Apple, color: "text-blue-500 dark:text-[#8ab4f8]", bg: "bg-blue-50 dark:bg-blue-900/20" 
        },
        fitness: { title: "High-Intensity (HIIT)", desc: "Energy is peaking! Great time for HIIT, cardio, or heavy lifting.", icon: Dumbbell, color: "text-blue-500 dark:text-[#8ab4f8]", bg: "bg-blue-50 dark:bg-blue-900/20" },
        mental: { title: "Set Intentions", desc: "Tackle complex tasks and brain-storming. Cognitive function is high.", icon: Brain, color: "text-blue-500 dark:text-[#8ab4f8]", bg: "bg-blue-50 dark:bg-blue-900/20" }
      };
      case 'Ovulation': return {
        nutrition: { title: "Antioxidants", desc: "Berries and nuts to help your liver process peak hormones efficiently.", icon: Apple, color: "text-amber-500 dark:text-[#fde293]", bg: "bg-amber-50 dark:bg-amber-900/20" },
        fitness: { title: "Group & Endurance", desc: "Capitalize on peak stamina and sociability with group classes.", icon: Dumbbell, color: "text-amber-500 dark:text-[#fde293]", bg: "bg-amber-50 dark:bg-amber-900/20" },
        mental: { title: "Social Connection", desc: "You're likely feeling confident. Great time for presentations or dates.", icon: Brain, color: "text-amber-500 dark:text-[#fde293]", bg: "bg-amber-50 dark:bg-amber-900/20" }
      };
      case 'Luteal': return {
        nutrition: { 
          title: "Complex Carbs", 
          desc: allowsMeat ? "Sweet potatoes, turkey, and dark chocolate to combat energy dips and cravings." : "Sweet potatoes, beans, and dark chocolate to combat energy dips and cravings.", 
          icon: Apple, color: "text-green-500 dark:text-[#81c995]", bg: "bg-green-50 dark:bg-green-900/20" 
        },
        fitness: { title: "Strength & Pilates", desc: "Taper down intensity. Focus on form, strength training, and longer rests.", icon: Dumbbell, color: "text-green-500 dark:text-[#81c995]", bg: "bg-green-50 dark:bg-green-900/20" },
        mental: { title: "Mindfulness Triggered", desc: "Historical mood drop detected. Try a guided meditation to ease PMS anxiety.", icon: Play, color: "text-[#1967d2] dark:text-[#8ab4f8]", bg: "bg-[#e8f0fe] dark:bg-[#1967d2]/30", isAction: true }
      };
      case 'PCOS': return {
        nutrition: { title: "Low-Glycemic Focus", desc: "Prioritize protein and healthy fats to stabilize insulin and energy.", icon: Apple, color: "text-pink-500 dark:text-pink-400", bg: "bg-pink-50 dark:bg-pink-900/20" },
        fitness: { title: "Strength & Consistency", desc: "Focus on consistent strength training over high-stress cardio.", icon: Dumbbell, color: "text-pink-500 dark:text-pink-400", bg: "bg-pink-50 dark:bg-pink-900/20" },
        mental: { title: "Be Kind to Yourself", desc: "Managing PCOS is a marathon, not a sprint. Consistency is key.", icon: Brain, color: "text-pink-500 dark:text-pink-400", bg: "bg-pink-50 dark:bg-pink-900/20" }
      };
      case 'Late': return {
        nutrition: { title: "Nourishing Foods", desc: "Eat balanced meals to support your body while you wait.", icon: Apple, color: "text-orange-500 dark:text-orange-400", bg: "bg-orange-50 dark:bg-orange-900/20" },
        fitness: { title: "Gentle Movement", desc: "Opt for light walking or yoga. Listen closely to your body.", icon: Dumbbell, color: "text-orange-500 dark:text-orange-400", bg: "bg-orange-50 dark:bg-orange-900/20" },
        mental: { title: "Manage Uncertainty", desc: "Uncertainty causes stress. Breathe, or take a test if appropriate.", icon: Brain, color: "text-orange-500 dark:text-orange-400", bg: "bg-orange-50 dark:bg-orange-900/20" }
      };
      case 'Pregnancy': return {
        nutrition: { title: "Prenatal Power", desc: "Folate-rich greens and proteins to support fetal development.", icon: Apple, color: "text-teal-500 dark:text-teal-400", bg: "bg-teal-50 dark:bg-teal-900/20" },
        fitness: { title: "Pelvic Floor & Flow", desc: "Prenatal yoga or gentle walking. Avoid high-impact stress.", icon: Dumbbell, color: "text-teal-500 dark:text-teal-400", bg: "bg-teal-50 dark:bg-teal-900/20" },
        mental: { title: "Connect With Baby", desc: "Take a moment to breathe and focus on your growing connection.", icon: Heart, color: "text-teal-500 dark:text-teal-400", bg: "bg-teal-50 dark:bg-teal-900/20" }
      };
      case 'Perimenopause': return {
        nutrition: { title: "Bone & Hormone Health", desc: "Calcium, Vitamin D, and phytoestrogens like soy to ease transitions.", icon: Apple, color: "text-slate-500 dark:text-slate-400", bg: "bg-slate-50 dark:bg-slate-900/20" },
        fitness: { title: "Bone Density Defense", desc: "Weight-bearing exercises to maintain strength and bone health.", icon: Dumbbell, color: "text-slate-500 dark:text-slate-400", bg: "bg-slate-50 dark:bg-slate-900/20" },
        mental: { title: "Embrace the Shift", desc: "Acknowledge brain fog or mood shifts as physiological, not personal.", icon: Brain, color: "text-slate-500 dark:text-slate-400", bg: "bg-slate-50 dark:bg-slate-900/20" }
      };
      default: return {
        nutrition: { title: "Balanced Plate", desc: "Focus on whole foods, hydration, and listening to your body.", icon: Apple, color: "text-gray-500 dark:text-gray-400", bg: "bg-gray-50 dark:bg-gray-900/20" },
        fitness: { title: "Daily Movement", desc: "Move your body in a way that feels good today.", icon: Dumbbell, color: "text-gray-500 dark:text-gray-400", bg: "bg-gray-50 dark:bg-gray-900/20" },
        mental: { title: "Stay Grounded", desc: "Take a few deep breaths and check in with yourself.", icon: Brain, color: "text-gray-500 dark:text-gray-400", bg: "bg-gray-50 dark:bg-gray-900/20" }
      };
    }
  };

  const getSkincareGuidance = (phaseName) => {
    switch(phaseName) {
      case 'Menstrual': return {
        title: "Hydration Focus",
        desc: "Estrogen and progesterone are low. Skin is prone to dryness and dullness. Focus on deep hydration and avoid harsh exfoliants.",
        icon: Droplets,
        color: "text-blue-500 dark:text-[#8ab4f8]",
        bg: "bg-blue-50 dark:bg-blue-900/20"
      };
      case 'Follicular': return {
        title: "The Glow Up",
        desc: "Estrogen is rising, promoting collagen. Skin is likely looking its best. Light exfoliation and Vitamin C will boost that natural glow.",
        icon: Sparkles,
        color: "text-pink-500 dark:text-pink-400",
        bg: "bg-pink-50 dark:bg-pink-900/20"
      };
      case 'Ovulation': return {
        title: "Pore Maintenance",
        desc: "Testosterone peaks slightly, potentially increasing oil production. A gentle clay mask today can prevent luteal phase breakouts.",
        icon: Sparkles,
        color: "text-amber-500 dark:text-amber-400",
        bg: "bg-amber-50 dark:bg-amber-900/20"
      };
      case 'Luteal': return {
        title: "Breakout Prevention",
        desc: "Progesterone peaks, increasing sebum production. Use Salicylic acid (BHA) and ensure you cleanse thoroughly.",
        icon: Info,
        color: "text-teal-500 dark:text-teal-400",
        bg: "bg-teal-50 dark:bg-teal-900/20"
      };
      case 'PCOS': return {
        title: "Blemish Control", desc: "Use non-comedogenic products and a gentle BHA to manage breakouts.", icon: Droplets, color: "text-pink-500 dark:text-pink-400", bg: "bg-pink-50 dark:bg-pink-900/20"
      };
      case 'Late': return {
        title: "Calm & Hydrate", desc: "Keep it simple. Hydration is key while your hormones figure themselves out.", icon: Droplets, color: "text-orange-500 dark:text-orange-400", bg: "bg-orange-50 dark:bg-orange-900/20"
      };
      case 'Pregnancy': return {
        title: "Pregnancy Safe", desc: "Avoid retinoids. Focus on rich moisturizers and pregnancy-safe SPF.", icon: Sparkles, color: "text-teal-500 dark:text-teal-400", bg: "bg-teal-50 dark:bg-teal-900/20"
      };
      case 'Perimenopause': return {
        title: "Deep Hydration", desc: "Collagen drops rapidly. Use rich ceramides, hyaluronic acid, and gentle retinoids.", icon: Droplets, color: "text-slate-500 dark:text-slate-400", bg: "bg-slate-50 dark:bg-slate-900/20"
      };
      default: return {
        title: "Maintain Glow", desc: "Cleanse, moisturize, and wear your SPF every single day.", icon: Sparkles, color: "text-gray-500 dark:text-gray-400", bg: "bg-gray-50 dark:bg-gray-900/20"
      };
    }
  };

  const getPhaseStyles = (phaseName) => {
    switch(phaseName) {
      case 'Menstrual': return { orb1: 'bg-red-500', orb2: 'bg-rose-500', textGrad: 'from-red-600 to-rose-600 dark:from-red-400 dark:to-rose-400', icon: 'text-red-500 dark:text-red-400', underline: 'decoration-red-400 dark:decoration-red-500' };
      case 'Follicular': return { orb1: 'bg-blue-500', orb2: 'bg-cyan-500', textGrad: 'from-blue-600 to-cyan-600 dark:from-blue-400 dark:to-cyan-400', icon: 'text-blue-500 dark:text-blue-400', underline: 'decoration-blue-400 dark:decoration-blue-500' };
      case 'Ovulation': return { orb1: 'bg-amber-500', orb2: 'bg-orange-500', textGrad: 'from-amber-600 to-orange-600 dark:from-amber-400 dark:to-orange-400', icon: 'text-amber-500 dark:text-amber-400', underline: 'decoration-amber-400 dark:decoration-amber-500' };
      case 'Luteal': return { orb1: 'bg-emerald-500', orb2: 'bg-green-500', textGrad: 'from-emerald-600 to-green-600 dark:from-emerald-400 dark:to-green-400', icon: 'text-emerald-500 dark:text-emerald-400', underline: 'decoration-emerald-400 dark:decoration-emerald-500' };
      case 'Pregnancy': return { orb1: 'bg-teal-500', orb2: 'bg-emerald-500', textGrad: 'from-teal-600 to-emerald-600 dark:from-teal-400 dark:to-emerald-400', icon: 'text-teal-500 dark:text-teal-400', underline: 'decoration-teal-400 dark:decoration-teal-500' };
      case 'Perimenopause': return { orb1: 'bg-indigo-500', orb2: 'bg-slate-500', textGrad: 'from-indigo-600 to-slate-600 dark:from-indigo-400 dark:to-slate-400', icon: 'text-indigo-500 dark:text-indigo-400', underline: 'decoration-indigo-400 dark:decoration-indigo-500' };
      case 'PCOS': return { orb1: 'bg-pink-500', orb2: 'bg-fuchsia-500', textGrad: 'from-pink-600 to-fuchsia-600 dark:from-pink-400 dark:to-fuchsia-400', icon: 'text-pink-500 dark:text-pink-400', underline: 'decoration-pink-400 dark:decoration-pink-500' };
      case 'Late': return { orb1: 'bg-orange-500', orb2: 'bg-red-500', textGrad: 'from-orange-600 to-red-600 dark:from-orange-400 dark:to-red-400', icon: 'text-orange-500 dark:text-orange-400', underline: 'decoration-orange-400 dark:decoration-orange-500' };
      default: return { orb1: 'bg-teal-500', orb2: 'bg-purple-500', textGrad: 'from-teal-600 to-purple-600 dark:from-teal-400 dark:to-purple-400', icon: 'text-teal-500 dark:text-teal-400', underline: 'decoration-teal-400 dark:decoration-teal-500' };
    }
  };
  const phaseStyles = getPhaseStyles(displayPhase.name);

  const baseGuidance = getPhaseGuidance(displayPhase.name);
  const guidance = customPlan ? {
    nutrition: { ...baseGuidance.nutrition, title: customPlan.nutrition?.title || baseGuidance.nutrition.title, desc: customPlan.nutrition?.desc || baseGuidance.nutrition.desc },
    fitness: { ...baseGuidance.fitness, title: customPlan.fitness?.title || baseGuidance.fitness.title, desc: customPlan.fitness?.desc || baseGuidance.fitness.desc },
    mental: { ...baseGuidance.mental, title: customPlan.mental?.title || baseGuidance.mental.title, desc: customPlan.mental?.desc || baseGuidance.mental.desc, isAction: false }
  } : baseGuidance;
  const skincareGuidance = getSkincareGuidance(displayPhase.name);

  // Use dynamic icon mapping based on name
  const IconMap = {
    'Pill': Pill,
    'Sparkles': Sparkles
  };

  const { lifecycleMode } = userPrefs;

  if (lifecycleMode === 'pregnancy' || lifecycleMode === 'postpartum') {
    return (
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="px-6 pt-4 space-y-8 pb-8">
        
        {/* PREGNANCY VISUALIZATION */}
        <motion.section variants={itemVariants} className="flex flex-col items-center justify-center mt-2">
          <div className="relative flex items-center justify-center">
            <svg className="w-[256px] h-[256px] transform -rotate-90" viewBox="0 0 256 256">
              <circle cx="128" cy="128" r={radius} stroke={isDarkMode ? '#202124' : '#f1f5f9'} strokeWidth="16" fill="transparent" />
              <circle 
                cx="128" cy="128" r={radius} 
                stroke="#f5b041" 
                strokeWidth="16" 
                fill="transparent" 
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={circumference - (18 / 40) * circumference} // Mock Week 18 progress
                className="transition-all duration-500 ease-out"
              />
            </svg>
            
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
              <span className="text-[11px] font-bold text-amber-500 uppercase tracking-wider mb-1">Week 18</span>
              <Baby className="w-12 h-12 text-amber-400 mb-1 mt-1" />
              <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 mt-1 uppercase tracking-widest">Trimester 2</span>
            </div>
          </div>

          <div className="mt-6 px-4 py-2.5 rounded-full flex items-center gap-2 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 transition-colors duration-500">
            <Info className="w-4 h-4" />
            <span className="text-sm font-medium">Cycle predictions are paused.</span>
          </div>
        </motion.section>

        {/* BABY SIZE CARD */}
        <motion.section variants={itemVariants} className="space-y-4">
          <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Baby's Development</h3>
          <div className="bg-amber-500/10 dark:bg-amber-500/10 backdrop-saturate-[1.8] backdrop-blur-[50px] border-[0.5px] border-amber-500/30 dark:border-amber-500/20 rounded-[32px] p-5 shadow-[0_8px_32px_rgba(245,158,11,0.1)] relative overflow-hidden transition-all duration-300">
            <div className="absolute -top-4 -right-4 p-4 opacity-10">
              <Apple className="w-24 h-24 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="flex gap-4 items-start relative z-10">
              <div>
                <p className="font-bold text-amber-900 dark:text-amber-300">Size of a Bell Pepper</p>
                <p className="text-sm text-amber-800 dark:text-amber-200/80 mt-1.5 leading-relaxed font-medium">
                  Your baby is about 5.5 inches long and weighs almost 7 ounces. They are busy flexing their arms and legs!
                </p>
              </div>
            </div>
          </div>
        </motion.section>

        {/* MEDICATION & PILL TRACKER */}
        <motion.section variants={itemVariants} className="space-y-4">
          <div className="flex items-center gap-2">
            <Pill className="w-5 h-5 text-teal-500 dark:text-teal-400" />
            <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Daily Checklist</h3>
          </div>
          
          <div className="relative overflow-hidden bg-white/60 dark:bg-[#1A1C1E]/60 backdrop-saturate-[1.8] backdrop-blur-[50px] shadow-[0_8px_32px_rgba(0,0,0,0.15)] border-[0.5px] border-white/40 dark:border-white/10 rounded-[32px] flex flex-col">
            {meds.map((med, index) => {
              const MedIcon = IconMap[med.iconName] || Pill;
              return (
              <div key={med.id} className={`p-4 flex items-center justify-between transition-all duration-300 ${index !== meds.length - 1 ? 'border-b-[0.5px] border-black/5 dark:border-white/5' : ''} ${med.taken ? 'bg-white/10 dark:bg-white/5' : 'hover:bg-white/10 dark:hover:bg-white/5'}`}>
                <div className="flex items-center gap-4 relative z-10">
                  <button onClick={() => toggleMed(med.id)} className="focus:outline-none">
                    {med.taken ? (
                      <CheckSquare className="w-6 h-6 text-teal-500 dark:text-teal-400" />
                    ) : (
                      <Square className="w-6 h-6 text-gray-300 dark:text-gray-600" />
                    )}
                  </button>
                  <div>
                    <p className={`font-semibold text-sm ${med.taken ? 'text-gray-400 dark:text-gray-500 line-through' : 'text-[#202124] dark:text-[#e3e3e3]'}`}>{med.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">{med.time}</p>
                  </div>
                </div>
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-300 relative z-10 shadow-sm border-[0.5px] border-white/40 dark:border-white/5 ${med.taken ? 'bg-white/20 dark:bg-black/20 opacity-50' : 'bg-white/50 dark:bg-white/5'}`}>
                  <MedIcon className={`w-5 h-5 transition-colors ${med.taken ? 'text-gray-400 dark:text-gray-500' : 'text-teal-500 dark:text-teal-400'}`} />
                </div>
              </div>
              );
            })}
          </div>
        </motion.section>

      </motion.div>
    );
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="px-6 pt-4 space-y-8 animate-fade-in pb-8">
      
      {/* MISSED PILL ALERT & SMART RESTOCK */}
      {missedPill && (
        <motion.section variants={itemVariants} className="bg-red-500/10 dark:bg-red-500/10 backdrop-saturate-[1.8] backdrop-blur-[50px] border-[0.5px] border-red-500/30 dark:border-red-500/20 rounded-3xl p-5 shadow-[0_8px_32px_rgba(239,68,68,0.15)] relative overflow-hidden transition-all duration-300">
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-ping"></div>
                <h3 className="font-bold text-red-700 dark:text-red-400 uppercase tracking-widest text-xs">Action Required</h3>
              </div>
              <h2 className="text-2xl font-black text-[#202124] dark:text-white mb-2">Take your pill!</h2>
              <p className="text-sm font-medium text-red-900/80 dark:text-red-200/80 mb-5 leading-relaxed">
                Your 9:00 AM window is closing. Take your combination pill immediately to maintain 99% contraceptive effectiveness.
              </p>
              <button 
                onClick={() => toggleMed(birthControlMed.id)}
                className="w-full bg-red-500 hover:bg-red-600 active:scale-[0.98] transition-all text-white font-bold py-3.5 rounded-full shadow-lg shadow-red-500/30 flex items-center justify-center gap-2"
              >
                <CheckSquare className="w-5 h-5" /> I Took It Right Now
              </button>
            </div>
          </motion.section>
      )}

      {/* CYCLE VISUALIZATION (Dynamic & Beautiful) */}
      <motion.section variants={itemVariants} className="flex flex-col items-center justify-center mt-2 relative">
        
        {/* Ambient background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full blur-[80px] opacity-20 pointer-events-none transition-colors duration-1000" style={{ backgroundColor: activeHex }}></div>

        <div className="relative flex items-center justify-center">
          <svg className="w-[280px] h-[280px]" viewBox="0 0 256 256">
            <defs>
              <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={activeHex} />
                <stop offset="100%" stopColor={activeHex} stopOpacity="0.4" />
              </linearGradient>
              <filter id="thumbGlow" x="-20%" y="-20%" width="140%" height="140%">
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
              stroke="url(#ringGradient)" 
              strokeWidth="10" 
              fill="transparent" 
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              transform="rotate(-90 128 128)"
              className={`transition-all duration-500 ease-out ${isLate ? 'animate-pulse' : ''}`}
            />

            {/* Glowing Tracker Dot (Thumb) */}
            <circle
              cx={thumbX}
              cy={thumbY}
              r="7"
              fill={isDarkMode ? '#ffffff' : activeHex}
              stroke={isDarkMode ? activeHex : '#ffffff'}
              strokeWidth="3"
              filter="url(#thumbGlow)"
              className="transition-all duration-500 ease-out"
            />
          </svg>
          
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
            {isLate ? (
              <span className="text-[11px] font-bold text-orange-500 dark:text-orange-400 tracking-wider uppercase mb-1">
                Late: {currentDay - cycleLength} {currentDay - cycleLength === 1 ? 'Day' : 'Days'}
              </span>
            ) : (
              <span className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 tracking-wider uppercase mb-1">
                Day {currentDay}
              </span>
            )}
            <displayPhase.icon className={`w-12 h-12 transition-colors duration-500 ${displayPhase.color}`} />
            <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 mt-1 uppercase tracking-widest">{displayPhase.name}</span>
          </div>
        </div>

        <div className={`mt-6 px-4 py-2.5 rounded-full flex items-center gap-2 transition-colors duration-500 ${displayPhase.bg} ${displayPhase.color}`}>
          <Info className="w-4 h-4" />
          <span className="text-sm font-medium">{displayPhase.message}</span>
        </div>

        {/* INTERACTIVE SIMULATOR SLIDER */}
        <div className="mt-8 w-full relative overflow-hidden bg-white/60 dark:bg-[#1A1C1E]/60 backdrop-saturate-[1.8] backdrop-blur-[50px] shadow-[0_8px_32px_rgba(0,0,0,0.15)] border-[0.5px] border-white/40 dark:border-white/10 p-6 rounded-[32px] transition-all duration-300">
          <label className="flex justify-between text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
            <span>Cycle Day Simulator</span>
            <span className={displayPhase.color}>{currentDay} / {Math.max(cycleLength, currentDay)}</span>
          </label>
          <input
            type="range"
            min="1"
            max={Math.max(60, currentDay + 10)}
            value={currentDay}
            onChange={(e) => setDay(parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200/50 dark:bg-gray-700/50 rounded-lg appearance-none cursor-pointer accent-[#4285f4] dark:accent-[#8ab4f8]"
          />
          <div className="flex justify-between text-xs text-gray-400 dark:text-gray-500 mt-3 font-medium">
            <span>Day 1 (Menstrual)</span>
            <span>Day 60 (Late)</span>
          </div>
        </div>
      </motion.section>

      {/* SMART RESTOCK (GOOGLE SHOPPING) */}
      {isRestockTime && (
        <motion.section variants={itemVariants} className="animate-in fade-in slide-in-from-top-4">
          <div className="bg-blue-500/10 dark:bg-blue-500/10 backdrop-saturate-[1.8] backdrop-blur-[50px] border-[0.5px] border-blue-500/30 dark:border-blue-500/20 rounded-[32px] p-5 shadow-[0_8px_32px_rgba(59,130,246,0.1)] flex items-center justify-between transition-all duration-300">
            <div className="flex-1 pr-4">
              <div className="flex items-center gap-1.5 mb-1">
                <ShoppingCart className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Smart Restock</span>
              </div>
              <h4 className="font-bold text-[#202124] dark:text-[#e3e3e3] text-sm">Period starting in ~{daysUntilPeriod} days</h4>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 font-medium">Tap to auto-order tampons & pain relievers via Google Shopping.</p>
            </div>
            <button className="bg-blue-600 dark:bg-blue-500 text-white p-3 rounded-full shadow-md hover:scale-105 transition-transform">
              <span className="text-lg leading-none">+</span>
            </button>
          </div>
        </motion.section>
      )}

      {/* ── ONE-TAP DAILY STACK ── */}
      {userPrefs.supplements?.length > 0 && (
        <motion.section variants={itemVariants} className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
              <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Daily Stack</h3>
            </div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{userPrefs.supplements.length} items</span>
          </div>

          <button 
            onClick={() => markStackTaken()}
            className={`w-full relative overflow-hidden p-6 rounded-[32px] backdrop-saturate-[1.8] backdrop-blur-[50px] border-[0.5px] shadow-[0_8px_32px_rgba(0,0,0,0.03)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.1)] transition-all duration-500 flex flex-col items-start gap-4 text-left ${
              userPrefs.lastStackTakenDate === new Date().toISOString().slice(0, 10)
                ? 'bg-emerald-500/10 dark:bg-emerald-500/10 border-emerald-500/30 dark:border-emerald-500/20 shadow-[0_8px_32px_rgba(16,185,129,0.1)]'
                : 'bg-white/30 dark:bg-black/10 border-white/40 dark:border-white/5 hover:bg-white/40 dark:hover:bg-white/5 group'
            }`}
          >
            {userPrefs.lastStackTakenDate === new Date().toISOString().slice(0, 10) && (
              <div className="absolute -top-10 -right-10 p-4 opacity-10 rotate-12">
                <CheckSquare className="w-48 h-48 text-emerald-500 dark:text-emerald-400" />
              </div>
            )}
            
            <div className="relative z-10">
              <p className={`font-bold text-lg mb-1 transition-colors ${
                userPrefs.lastStackTakenDate === new Date().toISOString().slice(0, 10) 
                  ? 'text-emerald-800 dark:text-emerald-300' 
                  : 'text-[#202124] dark:text-[#e3e3e3]'
              }`}>
                {userPrefs.lastStackTakenDate === new Date().toISOString().slice(0, 10) ? 'Stack Taken ✓' : 'Morning Routine'}
              </p>
              <p className={`text-sm font-medium transition-colors ${
                userPrefs.lastStackTakenDate === new Date().toISOString().slice(0, 10) 
                  ? 'text-emerald-600/80 dark:text-emerald-400/80' 
                  : 'text-gray-500 dark:text-gray-400'
              }`}>
                {userPrefs.supplements.join(', ')}
              </p>
            </div>
            
            {userPrefs.lastStackTakenDate !== new Date().toISOString().slice(0, 10) && (
              <div className="relative z-10 w-full bg-[#f8f9fa] dark:bg-[#2a2a2a] group-hover:bg-emerald-50 dark:group-hover:bg-emerald-900/20 text-[#202124] dark:text-[#e3e3e3] group-hover:text-emerald-700 dark:group-hover:text-emerald-400 font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 transition-colors">
                <CheckSquare className="w-5 h-5" /> Mark Stack Taken
              </div>
            )}
          </button>
        </motion.section>
      )}

      {/* MEDICATION & PILL TRACKER */}
      <motion.section variants={itemVariants} className="space-y-4">
        <div className="flex items-center justify-between pl-1">
          <div className="flex items-center gap-2">
            <Pill className="w-5 h-5 text-teal-500 dark:text-teal-400" />
            <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Medications & Tasks</h3>
          </div>
        </div>
        
        <div className="relative overflow-hidden bg-white/60 dark:bg-[#1A1C1E]/60 backdrop-saturate-[1.8] backdrop-blur-[50px] shadow-[0_8px_32px_rgba(0,0,0,0.15)] border-[0.5px] border-white/40 dark:border-white/10 rounded-[32px] flex flex-col">
          {/* Ambient glow behind the meds stack */}
          <div className="absolute top-1/2 right-0 w-32 h-full bg-teal-500/10 dark:bg-teal-400/5 blur-[50px] pointer-events-none rounded-full -translate-y-1/2"></div>

          {meds
            .filter(med => !med.targetModes || med.targetModes.length === 0 || med.targetModes.includes(userPrefs.lifecycleMode))
            .map((med, index, arr) => {
            const MedIcon = IconMap[med.iconName] || Pill;
            return (
              <div 
                key={med.id} 
                className={`relative p-5 flex items-center justify-between transition-all duration-300 hover:bg-white/10 dark:hover:bg-white/5 group
                  ${index !== arr.length - 1 ? 'border-b-[0.5px] border-black/5 dark:border-white/5' : ''}
                  ${med.taken ? 'bg-white/10 dark:bg-white/5 opacity-75' : ''}
                `}
              >
                <div className="flex items-center gap-4 relative z-10">
                  <button 
                    onClick={() => toggleMed(med.id)} 
                    className={`shrink-0 w-7 h-7 rounded-full border-[2px] flex items-center justify-center transition-all duration-300 ease-out focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:ring-offset-2 dark:focus:ring-offset-[#121212]
                      ${med.taken 
                        ? 'border-teal-500 bg-teal-500 dark:border-teal-400 dark:bg-teal-400' 
                        : 'border-gray-300 dark:border-gray-600 hover:border-teal-400 dark:hover:border-teal-500 bg-white/50 dark:bg-[#2a2a2c]'
                      }`}
                  >
                     <svg className={`w-4 h-4 text-white transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${med.taken ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                     </svg>
                  </button>
                  
                  <div>
                    <p className={`font-bold text-sm tracking-tight transition-all duration-300 ${med.taken ? 'text-gray-400 dark:text-gray-500 line-through decoration-gray-300 dark:decoration-gray-600' : 'text-[#202124] dark:text-[#e3e3e3]'}`}>
                      {med.name}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md transition-colors ${med.taken ? 'bg-white/50 dark:bg-white/5 text-gray-400 dark:text-gray-500' : 'bg-teal-50/50 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400'}`}>
                        {med.time}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-300 relative z-10 shadow-sm border-[0.5px] border-white/40 dark:border-white/5
                  ${med.taken ? 'bg-white/20 dark:bg-black/20 opacity-50' : 'bg-white/50 dark:bg-white/5'}
                `}>
                  <MedIcon className={`w-5 h-5 transition-colors ${med.taken ? 'text-gray-400 dark:text-gray-500' : 'text-teal-500 dark:text-teal-400'}`} />
                </div>
              </div>
            );
          })}
        </div>
      </motion.section>

      {/* Actionable Health Guidance (Phase-Based) */}
      {isGeneratingPlan ? (
        <motion.section variants={itemVariants} className="space-y-4">
          <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-baseline">
            Today's Custom Plan
          </h3>
          <div className="relative overflow-hidden bg-white/10 dark:bg-black/10 backdrop-saturate-[1.8] backdrop-blur-[50px] rounded-[32px] p-10 flex flex-col items-center justify-center text-center border-[0.5px] border-white/20 dark:border-white/5 shadow-[0_8px_32px_rgba(0,0,0,0.04)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.2)]">
            {/* Ambient Glowing Orbs inside the glass */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none rounded-[32px]">
              <div className={`absolute -top-12 -left-12 w-48 h-48 ${phaseStyles.orb1} opacity-10 dark:opacity-5 rounded-full blur-[80px] animate-pulse`}></div>
              <div className={`absolute -bottom-12 -right-12 w-48 h-48 ${phaseStyles.orb2} opacity-10 dark:opacity-5 rounded-full blur-[80px] animate-pulse`} style={{ animationDelay: '1s' }}></div>
            </div>
            
            <div className="relative z-10 flex flex-col items-center">
              {/* Custom Premium Spinner */}
              <div className="relative w-16 h-16 mb-5 flex items-center justify-center">
                 <div className="absolute inset-0 border-4 border-gray-500/20 dark:border-gray-400/10 rounded-full"></div>
                 <div className={`absolute inset-0 border-4 border-t-current border-l-transparent border-r-transparent border-b-transparent rounded-full animate-spin ${phaseStyles.icon}`} style={{ animationDuration: '1.5s' }}></div>
                 <Sparkles className={`w-6 h-6 ${phaseStyles.icon} animate-pulse`} />
              </div>
              
              <h4 className={`font-extrabold text-transparent bg-clip-text bg-gradient-to-r ${phaseStyles.textGrad} text-xl tracking-tight mb-2`}>
                Curating Your Dashboard...
              </h4>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 max-w-[250px]">
                Cross-referencing your profile with 15 days of clinical data.
              </p>
            </div>
          </div>
        </motion.section>
      ) : guidance && (
      <motion.section variants={itemVariants} className="space-y-4">
        <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-baseline">
          Today's Plan 
          <span className="text-xs text-gray-400 font-normal ml-2">({currentWeekday})</span>
        </h3>
        
        <div className="relative overflow-hidden bg-white/60 dark:bg-[#1A1C1E]/60 backdrop-saturate-[1.8] backdrop-blur-[50px] shadow-[0_8px_32px_rgba(0,0,0,0.15)] border-[0.5px] border-white/40 dark:border-white/10 rounded-[32px] flex flex-col">
          {/* Subtle ambient glow behind the plan stack */}
          <div className={`absolute top-1/2 left-0 w-32 h-full ${phaseStyles.orb1} opacity-[0.04] dark:opacity-[0.03] blur-[60px] pointer-events-none rounded-full -translate-y-1/2`}></div>

          {/* Nutrition */}
          <div className="relative overflow-hidden p-5 flex gap-4 transition-all duration-300 hover:bg-white/10 dark:hover:bg-white/5 group border-b-[0.5px] border-black/5 dark:border-white/5">
            <div className={`absolute inset-0 opacity-[0.02] dark:opacity-[0.02] ${guidance.nutrition.bg} pointer-events-none transition-opacity group-hover:opacity-[0.05]`}></div>
            <div className={`w-12 h-12 rounded-2xl ${guidance.nutrition.bg} flex items-center justify-center shrink-0 shadow-sm border-[0.5px] border-white/40 dark:border-white/5 relative z-10 mt-0.5`}>
              <guidance.nutrition.icon className={`w-6 h-6 ${guidance.nutrition.color}`} />
            </div>
            <div className="relative z-10 flex-1 min-w-0">
              <p className="font-bold text-[#202124] dark:text-[#e3e3e3] text-sm tracking-tight">{guidance.nutrition.title}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 leading-relaxed font-medium">{guidance.nutrition.desc}</p>
            </div>
          </div>

          {/* Fitness */}
          <div className="relative overflow-hidden p-5 flex gap-4 transition-all duration-300 hover:bg-white/10 dark:hover:bg-white/5 group border-b-[0.5px] border-black/5 dark:border-white/5">
            <div className={`absolute inset-0 opacity-[0.02] dark:opacity-[0.02] ${guidance.fitness.bg} pointer-events-none transition-opacity group-hover:opacity-[0.05]`}></div>
            <div className={`w-12 h-12 rounded-2xl ${guidance.fitness.bg} flex items-center justify-center shrink-0 shadow-sm border-[0.5px] border-white/40 dark:border-white/5 relative z-10 mt-0.5`}>
              <guidance.fitness.icon className={`w-6 h-6 ${guidance.fitness.color}`} />
            </div>
            <div className="relative z-10 flex-1 min-w-0">
              <p className="font-bold text-[#202124] dark:text-[#e3e3e3] text-sm tracking-tight">{guidance.fitness.title}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 leading-relaxed font-medium">{guidance.fitness.desc}</p>
            </div>
          </div>

          {/* Mental Health */}
          <div className={`relative overflow-hidden p-5 flex gap-4 transition-all duration-300 hover:bg-white/10 dark:hover:bg-white/5 group ${guidance.mental.isAction ? 'bg-blue-500/10 dark:bg-blue-500/10' : ''}`}>
            <div className={`absolute inset-0 opacity-[0.02] dark:opacity-[0.02] ${guidance.mental.bg} pointer-events-none transition-opacity group-hover:opacity-[0.05]`}></div>
            <div className={`w-12 h-12 rounded-2xl ${guidance.mental.bg} flex items-center justify-center shrink-0 shadow-sm border-[0.5px] border-white/40 dark:border-white/5 relative z-10 mt-0.5`}>
              <guidance.mental.icon className={`w-6 h-6 ${guidance.mental.color}`} />
            </div>
            <div className="relative z-10 flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className={`font-bold text-sm tracking-tight ${guidance.mental.isAction ? 'text-blue-700 dark:text-blue-400' : 'text-[#202124] dark:text-[#e3e3e3]'}`}>{guidance.mental.title}</p>
                {guidance.mental.isAction && (
                  <span className="bg-red-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider animate-pulse">Alert</span>
                )}
              </div>
              <p className={`text-xs mt-1.5 leading-relaxed font-medium ${guidance.mental.isAction ? 'text-blue-700/80 dark:text-blue-400/80' : 'text-gray-500 dark:text-gray-400'}`}>{guidance.mental.desc}</p>
              
              {guidance.mental.isAction && (
                <button className="mt-3 flex items-center gap-1.5 text-xs font-bold text-white bg-blue-600 dark:bg-blue-500 dark:text-white px-4 py-2 rounded-full shadow-sm hover:opacity-90 transition-opacity">
                  <Play className="w-4 h-4" /> Start Meditation
                </button>
              )}
            </div>
          </div>
        </div>
      </motion.section>
      )}

      {/* Skincare & Beauty Cycle Sync */}
      {isGeneratingPlan ? (
        <motion.section variants={itemVariants} className="space-y-4">
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Skincare & Beauty</h3>
          </div>
          <div className="relative overflow-hidden bg-white/10 dark:bg-black/10 backdrop-saturate-[1.8] backdrop-blur-[50px] rounded-[32px] p-10 flex flex-col items-center justify-center text-center border-[0.5px] border-white/20 dark:border-white/5 shadow-[0_8px_32px_rgba(0,0,0,0.04)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.2)]">
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none rounded-[32px]">
              <div className={`absolute -top-12 -left-12 w-48 h-48 bg-pink-500 opacity-10 dark:opacity-5 rounded-full blur-[80px] animate-pulse`}></div>
              <div className={`absolute -bottom-12 -right-12 w-48 h-48 bg-fuchsia-500 opacity-10 dark:opacity-5 rounded-full blur-[80px] animate-pulse`} style={{ animationDelay: '1s' }}></div>
            </div>
            <div className="relative z-10 flex flex-col items-center">
              <div className="relative w-16 h-16 mb-5 flex items-center justify-center">
                 <div className="absolute inset-0 border-4 border-gray-500/20 dark:border-gray-400/10 rounded-full"></div>
                 <div className={`absolute inset-0 border-4 border-t-current border-l-transparent border-r-transparent border-b-transparent rounded-full animate-spin text-pink-500`} style={{ animationDuration: '1.5s' }}></div>
                 <Wand2 className={`w-6 h-6 text-pink-500 animate-pulse`} />
              </div>
              <h4 className={`font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-fuchsia-600 dark:from-pink-400 dark:to-fuchsia-400 text-xl tracking-tight mb-2`}>
                Analyzing Skincare Needs...
              </h4>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 max-w-[250px]">
                Formulating your bespoke skincare routine based on hormonal shifts.
              </p>
            </div>
          </div>
        </motion.section>
      ) : skincareGuidance && (
        <motion.section variants={itemVariants} className="space-y-4">
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Skincare & Beauty</h3>
          </div>
          <div className="relative overflow-hidden bg-white/60 dark:bg-[#1A1C1E]/60 backdrop-saturate-[1.8] backdrop-blur-[50px] rounded-[32px] p-8 border-[0.5px] border-white/40 dark:border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.15)] transition-all duration-300 hover:shadow-[0_8px_32px_rgba(0,0,0,0.2)] hover:-translate-y-0.5 group">
            
            {/* Ambient Glowing Orbs */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none rounded-[32px]">
              <div className={`absolute -top-10 -right-10 w-48 h-48 bg-pink-500 opacity-10 dark:opacity-5 rounded-full blur-[80px] animate-pulse`}></div>
              <div className={`absolute -bottom-10 -left-10 w-48 h-48 bg-fuchsia-500 opacity-10 dark:opacity-5 rounded-full blur-[80px] animate-pulse`} style={{ animationDelay: '1s' }}></div>
            </div>
            
            <div className="flex gap-4 items-start relative z-10">
              <div>
                <p className={`font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-fuchsia-600 dark:from-pink-400 dark:to-fuchsia-400 text-xl tracking-tighter mb-3`}>
                  {customPlan?.skincare?.title || skincareGuidance.title}
                </p>
                <p className="text-[15px] font-medium text-slate-700 dark:text-slate-300 mt-2 leading-relaxed max-w-[280px]">
                  {customPlan?.skincare?.desc || skincareGuidance.desc}
                </p>
                <p className="text-[11px] uppercase tracking-[0.2em] font-bold text-slate-400 dark:text-slate-500 mt-6 flex items-center gap-2">
                  <Wand2 className={`w-3.5 h-3.5 text-pink-500 dark:text-pink-400`} /> Cycle-Synced Protocol
                </p>
              </div>
            </div>
          </div>
        </motion.section>
      )}

      {/* AI Symptom Forecasting */}
      {isGeneratingPlan ? (
        <motion.section variants={itemVariants} className="space-y-4">
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">AI Forecast</h3>
          </div>
          <div className="relative overflow-hidden bg-white/10 dark:bg-black/10 backdrop-saturate-[1.8] backdrop-blur-[50px] rounded-[32px] p-10 flex flex-col items-center justify-center text-center border-[0.5px] border-white/20 dark:border-white/5 shadow-[0_8px_32px_rgba(0,0,0,0.04)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.2)]">
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none rounded-[32px]">
              <div className={`absolute -top-10 -right-10 w-48 h-48 ${phaseStyles.orb1} opacity-10 dark:opacity-5 rounded-full blur-[80px] animate-pulse`}></div>
              <div className={`absolute -bottom-10 -left-10 w-48 h-48 ${phaseStyles.orb2} opacity-10 dark:opacity-5 rounded-full blur-[80px] animate-pulse`} style={{ animationDelay: '1s' }}></div>
            </div>
            <div className="relative z-10 flex flex-col items-center">
              <div className="relative w-16 h-16 mb-5 flex items-center justify-center">
                 <div className="absolute inset-0 border-4 border-gray-500/20 dark:border-gray-400/10 rounded-full"></div>
                 <div className={`absolute inset-0 border-4 border-t-current border-l-transparent border-r-transparent border-b-transparent rounded-full animate-spin ${phaseStyles.icon}`} style={{ animationDuration: '1.5s' }}></div>
                 <Cpu className={`w-6 h-6 ${phaseStyles.icon} animate-pulse`} />
              </div>
              <h4 className={`font-extrabold text-transparent bg-clip-text bg-gradient-to-r ${phaseStyles.textGrad} text-xl tracking-tight mb-2`}>
                Modeling Hormonal Shifts...
              </h4>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 max-w-[250px]">
                Running predictive analysis on your upcoming phase.
              </p>
            </div>
          </div>
        </motion.section>
      ) : (
        <motion.section variants={itemVariants} className="space-y-4">
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">AI Forecast</h3>
          </div>
          <div className="relative overflow-hidden bg-white/60 dark:bg-[#1A1C1E]/60 backdrop-saturate-[1.8] backdrop-blur-[50px] rounded-[32px] p-8 border-[0.5px] border-white/40 dark:border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.15)]">
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none rounded-[32px]">
              <div className={`absolute -top-10 -right-10 w-48 h-48 ${phaseStyles.orb1} opacity-10 dark:opacity-5 rounded-full blur-[80px] animate-pulse`}></div>
              <div className={`absolute -bottom-10 -left-10 w-48 h-48 ${phaseStyles.orb2} opacity-10 dark:opacity-5 rounded-full blur-[80px] animate-pulse`} style={{ animationDelay: '1s' }}></div>
            </div>
            
            <div className="flex gap-4 items-start relative z-10">
              <div>
                <p className={`font-black text-transparent bg-clip-text bg-gradient-to-r ${phaseStyles.textGrad} text-xl tracking-tighter mb-3`}>
                  Tomorrow's Prediction
                </p>
                <p className="text-[15px] font-medium text-slate-700 dark:text-slate-300 mt-2 leading-relaxed max-w-[280px]">
                  You are <span className={`font-black ${phaseStyles.icon} text-lg`}>{aiData.prob}% likely</span> to experience <span className={`font-bold text-slate-900 dark:text-white underline decoration-[2px] underline-offset-4 ${phaseStyles.underline}`}>{aiData.symptom}</span> tomorrow.
                </p>
                <p className="text-[11px] uppercase tracking-[0.2em] font-bold text-slate-400 dark:text-slate-500 mt-6 flex items-center gap-2">
                  <Cpu className={`w-3.5 h-3.5 ${phaseStyles.icon}`} /> {aiData.context}
                </p>
              </div>
            </div>
          </div>
        </motion.section>
      )}

      {/* Forecasting Cards */}
      <motion.section variants={itemVariants} className="space-y-4">
        <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white pl-1">Phase Timeline</h3>
        
        <div className="relative overflow-hidden bg-white/60 dark:bg-[#1A1C1E]/60 backdrop-saturate-[1.8] backdrop-blur-[50px] shadow-[0_8px_32px_rgba(0,0,0,0.15)] border-[0.5px] border-white/40 dark:border-white/10 rounded-[32px] flex flex-col">
          {/* Ambient glow behind the timeline stack to enhance the frosted glass effect */}
          <div className="absolute top-1/2 left-0 w-32 h-full bg-indigo-500/10 dark:bg-indigo-400/10 blur-[60px] pointer-events-none rounded-full -translate-y-1/2"></div>
          
          {upcomingPhases.map((phase, index) => (
            <div 
              key={phase.id} 
              className={`relative overflow-hidden p-5 flex gap-4 items-start transition-all duration-300 hover:bg-white/10 dark:hover:bg-white/5 group ${index !== upcomingPhases.length - 1 ? 'border-b-[0.5px] border-black/5 dark:border-white/5' : ''}`}
            >
              {/* Subtle phase-specific tint overlay */}
              <div className={`absolute inset-0 opacity-[0.03] dark:opacity-[0.02] ${phase.bg} pointer-events-none transition-opacity group-hover:opacity-[0.06]`}></div>
              
              <div className={`w-12 h-12 rounded-2xl ${phase.bg} flex items-center justify-center shrink-0 shadow-sm border-[0.5px] border-white/40 dark:border-white/5 z-10 mt-0.5`}>
                <phase.icon className={`w-6 h-6 ${phase.color}`} />
              </div>
              
              <div className="flex-1 z-10 min-w-0">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-col">
                    <p className="font-bold text-[#202124] dark:text-[#e3e3e3] tracking-tight text-sm">{phase.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed font-medium">
                      {phase.desc}
                    </p>
                  </div>
                  
                  <div className="flex flex-col items-end shrink-0 pl-2">
                    <span className="text-sm font-black text-[#202124] dark:text-white tracking-tight">{phase.dateString}</span>
                    <span className={`text-[10px] font-bold uppercase tracking-wider mt-0.5 ${phase.daysUntil === 0 ? 'text-[#1967d2] dark:text-[#8ab4f8]' : 'text-gray-400 dark:text-gray-500'}`}>
                      {phase.daysUntil === 0 ? 'Today' : `In ${phase.daysUntil} days`}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.section>
    </motion.div>
  );
}
