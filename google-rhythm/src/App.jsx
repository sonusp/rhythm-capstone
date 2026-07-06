import React, { useState, useEffect, useRef, Suspense, lazy } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, Calendar, Droplets, Mic, Settings, 
  Moon, Sun, Sparkles, CheckCircle, BellRing, Orbit,
  Home, BarChart2, PlusCircle, Loader
} from 'lucide-react';
import { useAppStore } from './store/useAppStore';

// Utility to auto-reload the app if a Vercel chunk hash changes (prevents MIME type crash)
const lazyWithRetry = (componentImport) =>
  lazy(async () => {
    try {
      return await componentImport();
    } catch (error) {
      console.warn('Chunk load failed (likely new deployment). Reloading page...', error);
      window.location.reload(true);
      return { default: () => null };
    }
  });

const DashboardView = lazyWithRetry(() => import('./components/DashboardView'));
const PregnancyDashboard = lazyWithRetry(() => import('./components/PregnancyDashboard'));
const PerimenopauseDashboard = lazyWithRetry(() => import('./components/PerimenopauseDashboard'));
const LogView = lazyWithRetry(() => import('./components/LogView'));
const InsightsView = lazyWithRetry(() => import('./components/InsightsView'));
const SettingsView = lazyWithRetry(() => import('./components/SettingsView'));
const OnboardingWizard = lazyWithRetry(() => import('./components/OnboardingWizard'));
const VoiceRecorder = lazyWithRetry(() => import('./components/VoiceRecorder'));
import { saveLogLocally } from './services/db';
import { transcribeAudio, parseVoiceLog } from './services/nimService';
import { registerServiceWorker } from './services/notificationService';
import { initAlertManager } from './services/cycleAlertManager';

import WelcomeScreen from './components/WelcomeScreen';
import TutorialCarousel from './components/TutorialCarousel';
import LockScreen from './components/LockScreen';
import { useAutoSync } from './hooks/useAutoSync';
import RhythmAssistant from './components/RhythmAssistant';
import AdminRecoveryView from './components/AdminRecoveryView';

export default function App() {
  // Hidden Admin Route Check
  if (window.location.pathname === '/admin-rhythm-recovery') {
    return <AdminRecoveryView />;
  }

  const { activeTab, setTab, isDarkMode, toggleDarkMode, userPrefs, updatePrefs, meds, updateMed, isUnlocked, markStackTaken, syncCycleDay } = useAppStore();
  const { lifecycleMode, isOnboardingComplete, hasSeenTutorial } = userPrefs;
  
  // Mount the background auto-sync worker
  useAutoSync();

  // ── INTEGRATION 1: Sync cycle day from lastPeriodDate on every app load ──
  useEffect(() => {
    if (isOnboardingComplete && userPrefs.lastPeriodDate) {
      syncCycleDay();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOnboardingComplete, userPrefs.lastPeriodDate]);

  // ── INTEGRATION 2: Register Service Worker for background notifications ──
  useEffect(() => {
    registerServiceWorker();
  }, []);

  const alertManagerRef = useRef(null);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [showWelcome, setShowWelcome] = useState(!isOnboardingComplete);
  const [isVoiceProcessing, setIsVoiceProcessing] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [activeAlarm, setActiveAlarm] = useState(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isAiAssistantOpen, setIsAiAssistantOpen] = useState(false);

  useEffect(() => {
    if (!isOnboardingComplete) {
      setShowWelcome(true);
    }
  }, [isOnboardingComplete]);

  // ── INTEGRATION 3: Unified Alert Manager (replaces old manual setInterval) ──
  useEffect(() => {
    if (!isOnboardingComplete) return;
    const manager = initAlertManager(userPrefs, () => useAppStore.getState().meds, updateMed);
    alertManagerRef.current = manager;
    manager.onMedAlarm((firingMed) => {
      if (activeAlarm?.id !== firingMed.id) {
        setActiveAlarm(firingMed);
      }
    });
    return () => manager.cleanup();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOnboardingComplete]);

  useEffect(() => {
    // Keep a dummy ref to satisfy the old pattern — alarm logic now in cycleAlertManager
    const interval = setInterval(() => {}, 60000); // Heartbeat only
    const interval_unused = interval; // eslint-disable-line no-unused-vars
    return () => clearInterval(interval);
  }, [meds, activeAlarm]);

  const handleDismissAlarm = () => {
    if (activeAlarm) {
      updateMed(activeAlarm.id, { taken: true });
      setActiveAlarm(null);
    }
  };

  const handleProcessVoiceLog = async (blob) => {
    setIsVoiceModalOpen(false);
    if (!blob) return;

    setIsVoiceProcessing(true);
    setToastMessage('✨ AI is analyzing your voice log...');

    try {
      const transcript = await transcribeAudio(blob, setToastMessage);
      const cleanTranscript = transcript?.trim().toLowerCase() || "";
      
      // Stop early if Whisper returns silence or a common hallucination
      if (!cleanTranscript || cleanTranscript.length < 5 || cleanTranscript.includes("thanks for watching") || cleanTranscript.includes("subtitles by")) {
        throw new Error("No voice detected. Tap the mic to try again.");
      }
      
      const parsedData = await parseVoiceLog(transcript, setToastMessage);
      if (!parsedData) throw new Error("Failed to parse log");

      // Reject non-health related audio
      if (parsedData.is_health_related === false) {
        throw new Error("That didn't sound like a health log. Try mentioning your symptoms.");
      }

      const logEntry = {
        date: parsedData.target_date || new Date().toISOString().split('T')[0],
        mode: lifecycleMode || 'cycle',
        mood: parsedData.primary_emotion || parsedData.mood || '',
        flow: parsedData.flow || 'None',
        symptoms: parsedData.symptoms || [],
        giSymptoms: parsedData.gi_symptoms || [],
        emotional_analysis: parsedData.emotional_analysis || '',
        clinical_flag: parsedData.clinical_flag || false,
        note: transcript,
        timestamp: new Date().toISOString()
      };
      
      if (parsedData.pain_score != null) {
        logEntry.painDetails = {
          score: parsedData.pain_score,
          impacts: parsedData.pain_impacts || [],
          medsHelped: parsedData.meds_helped || ''
        };
      }
      
      await saveLogLocally(logEntry);
      
      // Auto-log supplements if the user mentioned taking them
      if (parsedData.supplements_taken) {
        markStackTaken();
      }
      
      setToastMessage('✅ Log saved securely!');
      setTab('insights');
      
    } catch (err) {
      console.error(err);
      setToastMessage(`❌ ${err.message || 'Error processing voice log'}`);
    } finally {
      setTimeout(() => {
        setIsVoiceProcessing(false);
        setToastMessage('');
      }, 3000);
    }
  };

  return (
    <div className={`${isDarkMode ? 'dark' : ''} fixed inset-0 w-full h-[100dvh] bg-slate-100 dark:bg-[#050505] flex items-center justify-center`}>
      {/* Desktop Background Glow (Hidden on Mobile) */}
      <div className="hidden sm:block absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="hidden sm:block absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Main App Container (Edge-to-edge on mobile, floating phone frame on desktop) */}
      <div className="w-full h-full sm:h-[92dvh] sm:max-h-[900px] sm:max-w-[430px] sm:rounded-[48px] sm:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] dark:sm:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.7)] sm:border-[8px] sm:border-slate-200 dark:sm:border-[#1c1c1e] bg-slate-50 dark:bg-black font-sans transition-all duration-300 flex flex-col relative overflow-hidden">
        {/* 0. Biometric/PIN Lock Screen */}
        {userPrefs.isLockEnabled && userPrefs.lockPin && !isUnlocked && isOnboardingComplete && <LockScreen />}

        {/* 1. Welcome Screen */}
        {!isOnboardingComplete && showWelcome && <WelcomeScreen onStart={() => setShowWelcome(false)} />}
        
        {/* 2. Onboarding Wizard */}
        {!isOnboardingComplete && !showWelcome && (
          <Suspense fallback={<div className="h-full w-full flex items-center justify-center"><Loader className="w-8 h-8 text-[#999999] dark:text-[#98989D] animate-spin" strokeWidth={2.5} /></div>}>
            <OnboardingWizard />
          </Suspense>
        )}

        {/* 3. Tutorial Carousel (After Onboarding) */}
        {isOnboardingComplete && !hasSeenTutorial && <TutorialCarousel />}

        {/* 4. Strict Alarm Overlay (iOS Native Style) */}
        {activeAlarm && (
          <div className="fixed inset-0 z-[999] bg-black/95 backdrop-blur-3xl flex flex-col justify-between items-center pt-32 pb-16 px-6">
            <div className="flex flex-col items-center">
              <BellRing className="w-8 h-8 text-white/50 mb-6 animate-pulse" />
              <h1 className="text-[80px] font-light text-white tracking-tight leading-none mb-2">
                {activeAlarm.time}
              </h1>
              <p className="text-[22px] font-medium text-white/80">
                {activeAlarm.name}
              </p>
            </div>
            
            <div className="w-full flex flex-col items-center gap-4">
              <button 
                onClick={handleDismissAlarm}
                className="w-full max-w-[340px] h-[72px] bg-[#FF3B30] text-white text-[22px] font-semibold rounded-[36px] active:opacity-70 transition-opacity flex items-center justify-center tracking-wide"
              >
                Mark as Taken
              </button>
              <p className="text-white/40 text-[15px] font-medium mt-2">
                This alarm will not stop until logged.
              </p>
            </div>
          </div>
        )}

        {/* Voice Recorder Modal */}
        {isVoiceModalOpen && (
          <Suspense fallback={null}>
            <VoiceRecorder 
              onClose={() => setIsVoiceModalOpen(false)} 
              onLogSaved={handleProcessVoiceLog} 
            />
          </Suspense>
        )}

        {/* Global Toast Notification (iOS Glass Style) */}
        {isVoiceProcessing && (
          <div className="absolute bottom-28 left-1/2 -translate-x-1/2 z-[150] animate-slide-up w-auto min-w-[280px] max-w-[90%]">
            <div className="bg-white/60 dark:bg-[#1A1C1E]/60 backdrop-saturate-[1.8] backdrop-blur-[50px] border-[0.5px] border-white/40 dark:border-white/10 px-4 py-3 rounded-full shadow-[0_8px_32px_rgba(0,0,0,0.15)] flex items-center gap-3 w-full transition-all">
              {toastMessage.includes('✅') ? (
                <div className="w-[30px] h-[30px] rounded-full bg-[#34C759]/10 dark:bg-[#34C759]/20 flex items-center justify-center shrink-0 border-[0.5px] border-[#34C759]/20">
                  <CheckCircle className="w-[18px] h-[18px] text-[#34C759] dark:text-[#30D158]" strokeWidth={2.5} />
                </div>
              ) : toastMessage.includes('❌') ? (
                <div className="w-[30px] h-[30px] rounded-full bg-[#FF3B30]/10 dark:bg-[#FF3B30]/20 flex items-center justify-center shrink-0 border-[0.5px] border-[#FF3B30]/20">
                  <Activity className="w-[18px] h-[18px] text-[#FF3B30] dark:text-[#FF453A]" strokeWidth={2.5} />
                </div>
              ) : (
                <div className="w-[30px] h-[30px] rounded-full bg-[#007AFF]/10 dark:bg-[#0A84FF]/20 flex items-center justify-center shrink-0 border-[0.5px] border-[#007AFF]/20">
                  <Sparkles className="w-[16px] h-[16px] text-[#007AFF] dark:text-[#5AC8FA] animate-pulse" strokeWidth={2.5} />
                </div>
              )}
              <span className="text-[15px] font-semibold text-black/90 dark:text-white/90 tracking-tight pr-2">
                {toastMessage.replace('✨ ', '').replace('🧠 ', '').replace('✅ ', '').replace('❌ ', '')}
              </span>
            </div>
          </div>
        )}
        
        {/* Main App UI */}
        {isOnboardingComplete && hasSeenTutorial && (
          <>
            {/* App Header */}
            <header className="absolute top-0 w-full px-6 pt-12 pb-4 flex justify-between items-center bg-white/70 backdrop-blur-2xl dark:bg-[#111114]/70 z-50 transition-colors duration-300 border-b border-black/5 dark:border-white/5">
          <div>
            <h1 className="text-[26px] font-medium tracking-tight text-[#202124] dark:text-white flex items-center gap-2">
              <Activity className="w-8 h-8 text-[#4285f4]" strokeWidth={2.5} />
              <span className="font-bold">Rhythm</span>
            </h1>
            <div className="relative inline-block mt-0.5">
              <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                {{
                  cycle: "Cycle Intelligence",
                  ttc: "Try to Conceive",
                  pregnancy: "Pregnancy",
                  postpartum: "Postpartum Recovery",
                  perimenopause: "Perimenopause",
                  childfree: "Childfree Mode"
                }[lifecycleMode] || "Cycle Intelligence"}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsAiAssistantOpen(true)}
              className="px-3 py-2 rounded-full bg-indigo-50 dark:bg-[#2a2a2a] text-indigo-600 dark:text-indigo-400 font-bold text-sm tracking-wide hover:bg-indigo-100 dark:hover:bg-[#333] transition-colors flex items-center gap-1.5"
            >
              <Orbit className="w-4 h-4" />
              AI
            </button>
            <button 
              onClick={toggleDarkMode}
              className="p-2 rounded-full bg-gray-50 dark:bg-[#1e1e1e] hover:bg-gray-100 dark:hover:bg-[#2a2a2a] transition-colors"
            >
              {isDarkMode ? <Sun className="w-6 h-6 text-[#e3e3e3]" /> : <Moon className="w-6 h-6 text-gray-600" />}
            </button>
          </div>
        </header>

        {/* Scrollable Content Area */}
        <main 
          onScroll={(e) => setIsScrolled(e.target.scrollTop > 30)}
          className="absolute inset-0 overflow-y-auto pt-[160px] hide-scrollbar bg-slate-50 dark:bg-black transition-colors duration-300 overflow-x-hidden"
        >
          <AnimatePresence mode="popLayout">
            <motion.div
              key={activeTab + lifecycleMode}
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.98 }}
              transition={{ duration: 0.25, ease: [0.2, 0, 0, 1] }}
              className="w-full pb-48"
            >
              <Suspense fallback={<div className="flex h-64 items-center justify-center"><Loader className="w-8 h-8 text-[#999999] dark:text-[#98989D] animate-spin" strokeWidth={2.5} /></div>}>
                {activeTab === 'dashboard' && (lifecycleMode === 'cycle' || lifecycleMode === 'ttc' || lifecycleMode === 'childfree') && <DashboardView />}
                {activeTab === 'dashboard' && (lifecycleMode === 'pregnancy' || lifecycleMode === 'postpartum') && <PregnancyDashboard />}
                {activeTab === 'dashboard' && lifecycleMode === 'perimenopause' && <PerimenopauseDashboard />}
                {activeTab === 'log' && <LogView />}
                {activeTab === 'insights' && <InsightsView />}
                {activeTab === 'settings' && <SettingsView />}
              </Suspense>
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Bottom Navigation (iOS Tab Bar) */}
        <nav className="absolute bottom-0 w-full bg-white/80 backdrop-saturate-150 backdrop-blur-2xl dark:bg-[#1C1C1E]/80 border-t border-[#C6C6C8]/50 dark:border-[#38383A] px-2 py-2 flex justify-between items-end pb-8 z-50 transition-colors duration-300">
          <NavItem icon={<Home />} label="Dashboard" isActive={activeTab === 'dashboard'} onClick={() => setTab('dashboard')} />
          <NavItem icon={<BarChart2 />} label="Insights" isActive={activeTab === 'insights'} onClick={() => setTab('insights')} />
          
          {/* iOS Morphing Center Action */}
          <button 
            onClick={() => setIsVoiceModalOpen(true)}
            className={`flex flex-col items-center transition-all duration-300 ease-in-out z-30 w-[72px] ${
              isScrolled 
                ? 'translate-y-0 gap-1' 
                : '-translate-y-3 gap-0'
            }`}
          >
            <div className={`flex items-center justify-center transition-all duration-300 ${
              isScrolled 
                ? 'w-full h-7 bg-transparent text-[#999999] dark:text-[#98989D] [&>svg]:w-6 [&>svg]:h-6 [&>svg]:stroke-[1.5]' 
                : 'w-[54px] h-[54px] bg-[#007AFF] dark:bg-[#0A84FF] text-white rounded-full shadow-[0_4px_14px_rgba(0,122,255,0.4)] active:scale-95 [&>svg]:w-7 [&>svg]:h-7 [&>svg]:stroke-[2]'
            }`}>
              <Mic />
            </div>
            <span className={`text-[10px] font-medium transition-all duration-300 overflow-hidden ${
              isScrolled ? 'max-h-6 opacity-100 text-[#999999] dark:text-[#98989D]' : 'max-h-0 opacity-0'
            }`}>
              Voice
            </span>
          </button>
          
          <NavItem icon={<PlusCircle />} label="Log" isActive={activeTab === 'log'} onClick={() => setTab('log')} />
          <NavItem icon={<Settings />} label="Settings" isActive={activeTab === 'settings'} onClick={() => setTab('settings')} />
        </nav>
        
        {/* Global Rhythm Voice Assistant Orb */}
        <RhythmAssistant 
          isOpen={isAiAssistantOpen} 
          onClose={() => setIsAiAssistantOpen(false)} 
        />
        </>
      )}
      </div>
    </div>
  );
}

// --- UTILITY COMPONENTS ---

function NavItem({ icon, label, isActive, onClick }) {
  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center gap-1 transition-colors w-[72px]`}
    >
      <div className={`transition-colors [&>svg]:w-[26px] [&>svg]:h-[26px] ${isActive ? 'text-[#007AFF] dark:text-[#0A84FF] [&>svg]:stroke-[2]' : 'text-[#999999] dark:text-[#98989D] [&>svg]:stroke-[1.5]'}`}>
        {icon}
      </div>
      <span className={`text-[10px] font-medium transition-colors ${isActive ? 'text-[#007AFF] dark:text-[#0A84FF]' : 'text-[#999999] dark:text-[#98989D]'}`}>
        {label}
      </span>
    </button>
  );
}
