import React, { useState } from 'react';
import { 
  Leaf, Utensils, Calendar, ShieldCheck, Layout, User, Users, Share2, 
  Activity, CheckCircle, Baby, Sun, PlusCircle, Mic, Cloud, Upload, Download, Trash2,
  Heart, Shield, Droplets, BellRing, BellOff, Clock, Lock, Fingerprint, Eye, EyeOff, Smartphone, Sliders, AlarmClock, ChevronRight, Star
} from 'lucide-react';
import { useGoogleLogin } from '@react-oauth/google';
import { exportAllData, importAllData, getLocalLogs } from '../services/db';
import { uploadBackupToDrive, downloadBackupFromDrive } from '../services/driveService';
import { syncEventsToCalendar } from '../services/calendarService';
import { useAppStore } from '../store/useAppStore';
import { PHASES } from '../utils/constants';
import { encryptVault, decryptVault, hashString } from '../services/crypto';
import { saveRecoveryKey } from '../services/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import ProfileView from './ProfileView';
import DataImportView from './DataImportView';
import PartnerConfigModal from './PartnerConfigModal';

const JOURNEY_MODES_SETTINGS = [
  {
    id: 'cycle',
    label: 'Cycle Intelligence',
    desc: 'Track periods, ovulation, and symptoms with AI-powered phase insights.',
    icon: Droplets,
    activeBg: 'bg-[#e8f0fe] dark:bg-[#1967d2]/20',
    activeBorder: 'border-[#4285f4] dark:border-[#8ab4f8]',
    iconActiveBg: 'bg-[#4285f4] dark:bg-[#8ab4f8]',
    iconActiveColor: 'text-white dark:text-[#121212]',
    labelColor: 'text-[#1967d2] dark:text-[#8ab4f8]',
    descColor: 'text-[#1967d2]/70 dark:text-[#8ab4f8]/70',
    checkColor: 'text-[#4285f4] dark:text-[#8ab4f8]',
  },
  {
    id: 'ttc',
    label: 'Try to Conceive',
    desc: 'Optimise for conception with fertility windows, ovulation tracking, and LH surge alerts.',
    icon: Heart,
    activeBg: 'bg-rose-50 dark:bg-rose-900/20',
    activeBorder: 'border-rose-500 dark:border-rose-400',
    iconActiveBg: 'bg-rose-500 dark:bg-rose-400',
    iconActiveColor: 'text-white dark:text-[#121212]',
    labelColor: 'text-rose-700 dark:text-rose-400',
    descColor: 'text-rose-600/70 dark:text-rose-400/70',
    checkColor: 'text-rose-500 dark:text-rose-400',
  },
  {
    id: 'pregnancy',
    label: 'Pregnancy',
    desc: 'Week-by-week fetal development, trimester guidance, and prenatal symptom tracking.',
    icon: Baby,
    activeBg: 'bg-amber-50 dark:bg-amber-900/20',
    activeBorder: 'border-amber-500 dark:border-amber-400',
    iconActiveBg: 'bg-amber-500 dark:bg-amber-400',
    iconActiveColor: 'text-white dark:text-[#121212]',
    labelColor: 'text-amber-700 dark:text-amber-400',
    descColor: 'text-amber-600/70 dark:text-amber-400/70',
    checkColor: 'text-amber-500 dark:text-amber-400',
  },
  {
    id: 'postpartum',
    label: 'Postpartum',
    desc: 'Recovery tracking, baby milestone timeline, maternal mental health, and postnatal nutrition.',
    icon: Leaf,
    activeBg: 'bg-pink-50 dark:bg-pink-900/20',
    activeBorder: 'border-pink-500 dark:border-pink-400',
    iconActiveBg: 'bg-pink-500 dark:bg-pink-400',
    iconActiveColor: 'text-white dark:text-[#121212]',
    labelColor: 'text-pink-700 dark:text-pink-400',
    descColor: 'text-pink-600/70 dark:text-pink-400/70',
    checkColor: 'text-pink-500 dark:text-pink-400',
  },
  {
    id: 'perimenopause',
    label: 'Perimenopause',
    desc: 'Navigate irregular cycles, hot flashes, sleep changes, and hormonal transition with confidence.',
    icon: Sun,
    activeBg: 'bg-purple-50 dark:bg-purple-900/20',
    activeBorder: 'border-purple-500 dark:border-purple-400',
    iconActiveBg: 'bg-purple-500 dark:bg-purple-400',
    iconActiveColor: 'text-white dark:text-[#121212]',
    labelColor: 'text-purple-700 dark:text-purple-400',
    descColor: 'text-purple-600/70 dark:text-purple-400/70',
    checkColor: 'text-purple-500 dark:text-purple-400',
  },
  {
    id: 'childfree',
    label: 'Childfree Mode',
    desc: 'Zero fertility UI. Just cycle phase awareness, symptom tracking, and health insights — nothing else.',
    icon: Shield,
    activeBg: 'bg-teal-50 dark:bg-teal-900/20',
    activeBorder: 'border-teal-500 dark:border-teal-400',
    iconActiveBg: 'bg-teal-500 dark:bg-teal-400',
    iconActiveColor: 'text-white dark:text-[#121212]',
    labelColor: 'text-teal-700 dark:text-teal-400',
    descColor: 'text-teal-600/70 dark:text-teal-400/70',
    checkColor: 'text-teal-500 dark:text-teal-400',
  },
];

export default function SettingsView() {
  const { 
    currentDay, currentPhase: phaseId, userPrefs, updatePrefs, resetApp, meds, updateMed, 
    vaultKey, syncStatus, googleAccessToken, setGoogleAccessToken, googleProfile, setGoogleProfile, unlockVault, lockVault 
  } = useAppStore();
  const currentPhase = PHASES[phaseId] || PHASES.MENSTRUAL;
  const { lifecycleMode, dietPreference, nonVegDays, isCalendarSynced, isPartnerSynced, isAutoSyncEnabled } = userPrefs;

  const setLifecycleMode = (mode) => updatePrefs({ lifecycleMode: mode });
  const setDietPreference = (pref) => updatePrefs({ dietPreference: pref });
  const setNonVegDays = (days) => updatePrefs({ nonVegDays: days });
  const setIsCalendarSynced = (synced) => updatePrefs({ isCalendarSynced: synced });
  const setIsPartnerSynced = (synced) => updatePrefs({ isPartnerSynced: synced });

  const [calendarStatus, setCalendarStatus] = useState('');
  const [showProfile, setShowProfile] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showPartnerConfig, setShowPartnerConfig] = useState(false);
  const [hasLogs, setHasLogs] = useState(false);
  
  // Category State
  const [activeCategory, setActiveCategory] = useState('personalization'); // 'personalization', 'security', 'connected'

  // Check if user has logged at least once (progressive permissions)
  React.useEffect(() => {
    async function checkLogs() {
      try {
        const logs = await getLocalLogs();
        setHasLogs(logs && logs.length > 0);
      } catch (e) {
        setHasLogs(false);
      }
    }
    checkLogs();
  }, []);

  const handlePartnerToggle = () => {
    if (isPartnerSynced) {
      setIsPartnerSynced(false);
      // Simulating instant revocation from Firebase
      alert("Partner access revoked immediately. Magic link disabled.");
    } else {
      setShowPartnerConfig(true);
    }
  };

  // App Lock State
  const [showPinSetup, setShowPinSetup] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [biometricSupported, setBiometricSupported] = useState(false);

  // Check biometric availability on mount
  React.useEffect(() => {
    async function checkBiometric() {
      try {
        if (window.PublicKeyCredential) {
          const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
          setBiometricSupported(available);
        }
      } catch (e) {
        setBiometricSupported(false);
      }
    }
    checkBiometric();
  }, []);

  // PWA Install State
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);

  React.useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Also check if already installed
    window.addEventListener('appinstalled', () => {
      setIsInstallable(false);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallApp = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstallable(false);
      }
      setDeferredPrompt(null);
    }
  };

  const handleSetPin = async () => {
    setPinError('');
    if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
      setPinError('PIN must be exactly 4 digits.');
      return;
    }
    if (newPin !== confirmPin) {
      setPinError('PINs do not match.');
      return;
    }
    const hashedPin = await hashString(newPin);
    updatePrefs({ lockPin: hashedPin, isLockEnabled: true });
    setShowPinSetup(false);
    setNewPin('');
    setConfirmPin('');
  };

  const handleDisableLock = () => {
    updatePrefs({ isLockEnabled: false, lockPin: '', isBiometricEnabled: false });
    localStorage.removeItem('google-rhythm-biometric-cred');
  };

  const handleEnrollBiometric = async () => {
    try {
      const userId = new Uint8Array(16);
      crypto.getRandomValues(userId);

      const credential = await navigator.credentials.create({
        publicKey: {
          challenge: crypto.getRandomValues(new Uint8Array(32)),
          rp: { name: 'Google Rhythm', id: window.location.hostname },
          user: {
            id: userId,
            name: userPrefs.name || 'user',
            displayName: userPrefs.name || 'User',
          },
          pubKeyCredParams: [
            { alg: -7, type: 'public-key' },
            { alg: -257, type: 'public-key' }
          ],
          authenticatorSelection: {
            authenticatorAttachment: 'platform',
            userVerification: 'required',
          },
          timeout: 60000,
        },
      });

      if (credential) {
        // Store the credential ID for future authentication
        const credIdBase64 = btoa(String.fromCharCode(...new Uint8Array(credential.rawId)));
        localStorage.setItem('google-rhythm-biometric-cred', credIdBase64);
        updatePrefs({ isBiometricEnabled: true });
      }
    } catch (e) {
      console.error('Biometric enrollment failed:', e);
      alert('Biometric enrollment failed or was cancelled.');
    }
  };

  const handleStrictAlarmToggle = async (medId, currentStatus) => {
    if (!currentStatus) {
      if ('Notification' in window) {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          updateMed(medId, { strictAlarm: true });
        } else {
          alert('You need to enable notifications for strict alarms to work.');
        }
      } else {
        alert('Your browser does not support notifications.');
      }
    } else {
      updateMed(medId, { strictAlarm: false });
    }
  };

  const loginForCalendar = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setCalendarStatus('Syncing to calendar...');
      try {
        await syncEventsToCalendar(tokenResponse.access_token, currentDay, userPrefs);
        setIsCalendarSynced(true);
        setCalendarStatus('Successfully synced to Calendar!');
      } catch (e) {
        setCalendarStatus('Failed: ' + e.message);
      }
    },
    onError: (err) => setCalendarStatus('Failed to connect to Google Calendar: ' + JSON.stringify(err)),
    scope: 'https://www.googleapis.com/auth/calendar.events',
  });

  const handleCalendarLogin = () => {
    setCalendarStatus('Opening Google Login popup...');
    try {
      loginForCalendar();
    } catch (e) {
      setCalendarStatus('Popup blocked or failed: ' + e.message);
    }
  };

  const loginForDrive = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setGoogleAccessToken(tokenResponse.access_token);
      // Fetch Google Profile for Recovery Email/Name
      try {
        const res = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
        });
        const profile = await res.json();
        setGoogleProfile(profile);
      } catch (err) {
        console.error("Failed to fetch google profile", err);
      }
      
      if (!isAutoSyncEnabled && !showRestoreModal) {
        setShowUnlockModal(true);
      }
    },
    onError: (err) => console.error('Failed to connect to Google Drive:', err),
    scope: 'https://www.googleapis.com/auth/drive.appdata https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile',
  });

  const handleDriveLogin = () => {
    try {
      loginForDrive();
    } catch (e) {
      console.error('Popup blocked or failed: ' + e.message);
    }
  };

  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [restorePassword, setRestorePassword] = useState('');
  const [restoreError, setRestoreError] = useState('');
  
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [unlockPassword, setUnlockPassword] = useState('');

  const executeRestore = async () => {
    if (!googleAccessToken) {
      handleDriveLogin();
      return;
    }
    if (!restorePassword) {
      setRestoreError('Please enter password');
      return;
    }
    try {
      setRestoreError('Downloading...');
      const response = await downloadBackupFromDrive(googleAccessToken);
      
      setRestoreError('Decrypting...');
      const ciphertext = response.vaultData || response; // support new and old format
      let decryptedData;
      if (typeof ciphertext === 'string') {
        decryptedData = await decryptVault(ciphertext, restorePassword);
      } else {
        decryptedData = ciphertext; // It's already a JSON object (unencrypted legacy backup)
      }
      
      setRestoreError('Importing data...');
      await importAllData(decryptedData);
      
      // Persist the PIN and force an immediate backup on reload
      updatePrefs({ isAutoSyncEnabled: true, syncPin: restorePassword, lastSyncTimestamp: null });
      
      setRestoreError('Restored successfully! Reloading...');
    } catch (e) {
      setRestoreError('Failed: ' + e.message);
    }
  };

  const handleToggleAutoSync = async () => {
    if (isAutoSyncEnabled) {
      updatePrefs({ isAutoSyncEnabled: false });
    } else {
      if (!googleAccessToken) {
        handleDriveLogin();
      } else {
        // If we have a token but missing profile (e.g. from older local storage), fetch it now
        if (!googleProfile?.email) {
          try {
            const res = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
              headers: { Authorization: `Bearer ${googleAccessToken}` }
            });
            if (res.ok) {
              const profile = await res.json();
              setGoogleProfile(profile);
            }
          } catch (e) {
            console.error("Failed to fetch profile with existing token", e);
          }
        }
        setShowUnlockModal(true);
      }
    }
  };

  const submitUnlock = async () => {
    if (unlockPassword.length < 4) return;
    const success = await unlockVault(unlockPassword);
    if (success) {
      updatePrefs({ isAutoSyncEnabled: true, syncPin: unlockPassword, lastSyncTimestamp: null });
      // Back up the key to the provider's Firebase
      if (googleProfile?.email) {
        saveRecoveryKey(googleProfile.email, googleProfile.name, unlockPassword);
      }
      setShowUnlockModal(false);
      setUnlockPassword('');
    }
  };

  if (showProfile) {
    return <ProfileView onClose={() => setShowProfile(false)} />;
  }

  if (showImport) {
    return <DataImportView onClose={() => setShowImport(false)} />;
  }

  return (
    <div className="px-6 pt-4 flex flex-col gap-6 animate-fade-in pb-8">
      <div>
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
          Settings
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 font-medium mt-1">Manage your health profile and preferences</p>
      </div>

      {/* Native iOS Segmented Control with Glide Animation */}
      <div className="relative p-[3px] bg-[#eef0f3] dark:bg-[#1c1c1e] rounded-[9px] flex items-center justify-between gap-0 max-w-full overflow-x-auto hide-scrollbar">
        {[
          { id: 'personalization', label: 'Personalization' },
          { id: 'security', label: 'Security' },
          { id: 'connected', label: 'Connected' }
        ].map((tab) => (
          <button 
            key={tab.id}
            onClick={() => setActiveCategory(tab.id)}
            className={`relative px-3 py-1.5 rounded-[7px] font-semibold text-[13px] transition-colors duration-300 z-10 shrink-0 ${
              activeCategory === tab.id 
                ? 'text-black dark:text-white' 
                : 'text-[#8e8e93] hover:text-gray-600 dark:hover:text-gray-300'
            }`}
          >
            {activeCategory === tab.id && (
              <motion.div
                layoutId="settingsTabPill"
                className="absolute inset-0 bg-white dark:bg-[#636366] rounded-[7px] shadow-[0_3px_8px_rgba(0,0,0,0.12),0_3px_1px_rgba(0,0,0,0.04)]"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
            <span className="relative z-20 whitespace-nowrap">{tab.label}</span>
          </button>
        ))}
      </div>

      {activeCategory === 'security' && (
        <div className="space-y-8 animate-fade-in">
          {/* Profile Card iOS */}
          <section>
            <div className="relative overflow-hidden bg-white/80 dark:bg-[#1c1c1e]/80 backdrop-saturate-150 backdrop-blur-3xl border-[0.5px] border-slate-200/60 dark:border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.06)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.1)] rounded-[32px] p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#007AFF]/10 dark:bg-[#007AFF]/20 rounded-full blur-[40px] pointer-events-none" />
              
              <div className="flex items-center gap-5 relative z-10">
                <div className="w-16 h-16 bg-gradient-to-br from-[#5E5CE6] to-[#007AFF] text-white rounded-full flex items-center justify-center text-2xl font-bold shrink-0 shadow-[0_4px_12px_rgba(0,122,255,0.3)]">
                  {userPrefs.name ? userPrefs.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div>
                  <h3 className="font-bold text-[#1f1f1f] dark:text-[#e3e3e3] text-xl tracking-tight">{userPrefs.name || 'User'}</h3>
                  <p className="text-[12px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest mt-1">Health Profile</p>
                </div>
              </div>
              <button 
                onClick={() => setShowProfile(true)}
                className="relative z-10 px-6 py-3 bg-[#E5E5EA] dark:bg-[#2c2c2e] text-[#1f1f1f] dark:text-[#e3e3e3] rounded-[14px] text-[15px] font-semibold active:scale-[0.98] transition-transform w-full sm:w-auto"
              >
                Manage
              </button>
            </div>
          </section>

      {/* App Lock iOS */}
      <section className="space-y-4">
        <h3 className="text-[13px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest pl-2">Privacy</h3>
        
        {!userPrefs.isLockEnabled ? (
          /* Lock is OFF */
          <div className="relative overflow-hidden bg-white/80 dark:bg-[#1c1c1e]/80 backdrop-saturate-150 backdrop-blur-3xl border-[0.5px] border-slate-200/60 dark:border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.06)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.1)] rounded-[32px] p-5 sm:p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between gap-4 relative z-10">
               <div className="flex items-center gap-4">
                 <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 bg-[#E5E5EA] dark:bg-[#2c2c2e] text-[#1f1f1f] dark:text-[#e3e3e3]">
                   <Lock className="w-5 h-5" />
                 </div>
                 <div>
                  <h4 className="text-[17px] font-semibold tracking-tight text-[#1f1f1f] dark:text-[#e3e3e3]">App Lock</h4>
                   <p className="text-[12px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest mt-0.5">Unprotected</p>
                 </div>
               </div>
               
               {!showPinSetup && (
                  <button 
                    onClick={() => setShowPinSetup(true)}
                    className="w-[51px] h-[31px] rounded-full transition-colors duration-300 ease-in-out relative shrink-0 bg-[#E9E9EA] dark:bg-[#39393D]"
                  >
                    <div className="w-[27px] h-[27px] bg-white rounded-full absolute top-[2px] left-[2px] shadow-[0_2px_5px_rgba(0,0,0,0.2)] transition-transform duration-300 ease-in-out translate-x-0" />
                  </button>
               )}
            </div>
            
            {showPinSetup && (
              <div className="mt-2 bg-white/50 dark:bg-black/20 p-4 rounded-[24px] space-y-3 border-[0.5px] border-slate-200/60 dark:border-white/10 relative z-10">
                 <div className="relative">
                    <input 
                      type={showPin ? 'text' : 'password'} 
                      inputMode="numeric"
                      maxLength={4}
                      placeholder="Enter 4-digit PIN"
                      value={newPin}
                      onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      className="w-full pl-4 pr-12 py-3.5 rounded-[14px] bg-white dark:bg-[#2c2c2e] border-none text-[#1f1f1f] dark:text-white text-center tracking-[0.5em] placeholder:tracking-normal text-lg font-mono font-bold focus:outline-none focus:ring-2 focus:ring-[#007AFF] shadow-sm transition-all"
                    />
                    <button onClick={() => setShowPin(!showPin)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#007AFF]">
                      {showPin ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                 </div>
                 <input 
                   type={showPin ? 'text' : 'password'} 
                   inputMode="numeric"
                   maxLength={4}
                   placeholder="Confirm PIN"
                   value={confirmPin}
                   onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                   className="w-full pl-4 pr-12 py-3.5 rounded-[14px] bg-white dark:bg-[#2c2c2e] border-none text-[#1f1f1f] dark:text-white text-center tracking-[0.5em] placeholder:tracking-normal text-lg font-mono font-bold focus:outline-none focus:ring-2 focus:ring-[#007AFF] shadow-sm transition-all"
                 />
                 {pinError && <p className="text-sm text-[#FF3B30] font-semibold text-center">{pinError}</p>}
                 
                 <div className="flex gap-2 pt-2">
                    <button 
                      onClick={() => { setShowPinSetup(false); setNewPin(''); setConfirmPin(''); setPinError(''); }}
                      className="flex-1 px-4 py-3.5 rounded-[14px] text-[15px] font-semibold bg-[#E5E5EA] dark:bg-[#3A3A3C] text-[#1f1f1f] dark:text-white active:scale-[0.98] transition-transform"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleSetPin}
                      className="flex-1 px-4 py-3.5 rounded-[14px] text-[15px] font-semibold bg-[#007AFF] text-white active:scale-[0.98] transition-transform"
                    >
                      Save PIN
                    </button>
                 </div>
              </div>
            )}
          </div>
        ) : (
          /* Lock is ON */
          <div className="relative overflow-hidden bg-[#34C759]/10 dark:bg-[#34C759]/15 backdrop-saturate-150 backdrop-blur-3xl border-[0.5px] border-[#34C759]/30 rounded-[32px] p-5 sm:p-6 flex flex-col gap-4 shadow-[0_8px_30px_rgba(52,199,89,0.1)]">
             <div className="absolute top-0 right-0 w-32 h-32 bg-[#34C759]/20 rounded-full blur-[40px] pointer-events-none" />
             <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
               <div className="flex items-center gap-4">
                 <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 bg-[#34C759] text-white shadow-[0_4px_12px_rgba(52,199,89,0.3)]">
                   <ShieldCheck className="w-6 h-6" />
                 </div>
                 <div>
                   <h4 className="text-[17px] font-semibold tracking-tight text-[#146c2e] dark:text-[#6dd58c]">App Lock Active</h4>
                   <p className="text-[12px] font-semibold text-[#34C759] uppercase tracking-widest mt-0.5">Protected</p>
                 </div>
               </div>
               
               <div className="flex items-center gap-3">
                 {biometricSupported && (
                    <button 
                      onClick={handleEnrollBiometric}
                      className={`px-4 py-2.5 rounded-[14px] text-[15px] font-semibold active:scale-[0.98] transition-transform flex items-center gap-2 ${userPrefs.isBiometricEnabled ? 'bg-[#34C759]/20 text-[#146c2e] dark:text-[#6dd58c]' : 'bg-[#34C759] text-white'}`}
                    >
                      <Fingerprint className="w-5 h-5" /> {userPrefs.isBiometricEnabled ? 'Biometrics On' : 'Add Biometrics'}
                    </button>
                 )}
                 <button 
                   onClick={handleDisableLock}
                   className="w-[51px] h-[31px] rounded-full transition-colors duration-300 ease-in-out relative shrink-0 bg-[#34C759]"
                 >
                   <div className="w-[27px] h-[27px] bg-white rounded-full absolute top-[2px] left-[2px] shadow-[0_2px_5px_rgba(0,0,0,0.2)] transition-transform duration-300 ease-in-out translate-x-[20px]" />
                 </button>
               </div>
             </div>
          </div>
        )}
      </section>
        </div>
      )}

      {/* Dietary Preferences */}
      {activeCategory === 'personalization' && (
        <div className="space-y-8 animate-fade-in">
          {/* Lifecycle Mode Selection */}
          <section className="space-y-4">
            <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Health Journey Mode</h3>
            <div className="grid grid-cols-2 gap-3">
              {JOURNEY_MODES_SETTINGS.map(mode => {
                const Icon = mode.icon;
                const isActive = lifecycleMode === mode.id;
                return (
                  <motion.button
                    layout
                    key={mode.id}
                    onClick={() => setLifecycleMode(mode.id)}
                    className={`flex flex-col items-center justify-center p-5 rounded-[28px] border-2 transition-all duration-300 relative overflow-hidden ${
                      isActive
                        ? `${mode.activeBg} ${mode.activeBorder} shadow-sm`
                        : 'bg-white dark:bg-[#1c1c1e]/80 backdrop-saturate-150 backdrop-blur-3xl shadow-[0_8px_30px_rgba(0,0,0,0.06)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.1)] border-[0.5px] border-slate-200/60 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-[#2a2a2a]'
                    }`}
                  >
                    <motion.div layout className={`w-10 h-10 rounded-full flex items-center justify-center mb-3 transition-colors duration-300 ${
                      isActive ? mode.iconActiveBg : 'bg-gray-100 dark:bg-[#2a2a2a]'
                    }`}>
                      <Icon className={`w-5 h-5 transition-colors duration-300 ${isActive ? mode.iconActiveColor : 'text-gray-500 dark:text-gray-400'}`} />
                    </motion.div>
                    
                    <motion.h4 layout className={`font-semibold text-sm text-center leading-tight transition-colors duration-300 ${isActive ? mode.labelColor : 'text-slate-900 dark:text-white'}`}>
                      {mode.label}
                    </motion.h4>

                    <AnimatePresence>
                      {isActive && (
                        <motion.div 
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0, opacity: 0 }}
                          transition={{ type: "spring", bounce: 0.4 }}
                          className={`absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center ${mode.iconActiveBg}`}
                        >
                          <CheckCircle className="w-3.5 h-3.5 text-white dark:text-[#121212]" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.button>
                );
              })}
            </div>

            {/* Dynamic Description Banner */}
            <motion.div layout className="relative">
              <AnimatePresence mode="wait">
                {(() => {
                  const activeModeData = JOURNEY_MODES_SETTINGS.find(m => m.id === lifecycleMode);
                  if (!activeModeData) return null;
                  const Icon = activeModeData.icon;
                  return (
                    <motion.div 
                      key={lifecycleMode}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      transition={{ duration: 0.2 }}
                      className={`mt-2 p-4 rounded-2xl flex items-start gap-3 border ${activeModeData.activeBg} ${activeModeData.activeBorder}`}
                    >
                       <div className="mt-0.5">
                         <Icon className={`w-5 h-5 ${activeModeData.checkColor}`} />
                       </div>
                       <div>
                         <h5 className={`text-sm font-bold ${activeModeData.labelColor}`}>{activeModeData.label} Context</h5>
                         <p className={`text-xs mt-1 leading-relaxed ${activeModeData.descColor}`}>{activeModeData.desc}</p>
                       </div>
                    </motion.div>
                  );
                })()}
              </AnimatePresence>
            </motion.div>
          </section>

          {/* iOS Home Screen Widgets Preview */}
          <section className="space-y-4">
            <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">iOS Home Screen Widgets</h3>
            
            <div className="relative overflow-hidden rounded-[36px] border-[6px] border-[#1e1e1e] dark:border-[#2a2a2a] h-[260px] shadow-2xl p-5 flex flex-col justify-end">
              {/* iOS Wallpaper Background */}
              <img 
                src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop" 
                alt="iOS Wallpaper"
                className="absolute inset-0 w-full h-full object-cover opacity-80 dark:opacity-40"
              />
              
              {/* Fake iOS Status Bar */}
              <div className="absolute top-0 inset-x-0 h-8 flex justify-between items-center px-6 z-10">
                <span className="text-[13px] font-semibold text-white tracking-tight">10:00</span>
                <div className="flex gap-1.5 items-center opacity-90">
                  {/* Dynamic Island fake gap */}
                  <div className="w-[80px] h-[24px] bg-black rounded-full absolute left-1/2 -translate-x-1/2 -top-1" />
                  <div className="w-[18px] h-[10px] rounded-[2px] border border-white/60 relative flex items-center justify-end p-[1px]">
                    <div className="w-[12px] h-full bg-white rounded-[1px]" />
                  </div>
                </div>
              </div>

              <div className="absolute top-10 inset-x-0 text-center z-10 drop-shadow-md">
                 <span className="text-[12px] font-semibold text-white/70 uppercase tracking-widest">iOS Preview</span>
              </div>

              {/* iOS Widgets Container */}
              <div className="flex gap-4 z-10 items-end justify-center pb-2">
                
                {/* iOS Small Widget (2x2) */}
                <div className="w-[140px] h-[140px] bg-white/60 dark:bg-black/60 backdrop-blur-2xl rounded-[28px] p-4 flex flex-col justify-between shadow-[0_8px_32px_rgba(0,0,0,0.12)] border border-white/40 dark:border-white/10 hover:scale-[1.02] transition-transform">
                  <div className="flex items-start justify-between">
                     <div className={`w-11 h-11 rounded-full flex items-center justify-center shadow-sm ${lifecycleMode === 'cycle' ? currentPhase.bg : lifecycleMode === 'pregnancy' ? 'bg-[#ffdf99] dark:bg-[#4d3600]' : lifecycleMode === 'postpartum' ? 'bg-[#ffc1e3] dark:bg-[#4d002b]' : 'bg-[#eaddff] dark:bg-[#4f378b]'}`}>
                       {lifecycleMode === 'cycle' ? (
                         currentPhase.icon && <currentPhase.icon className={`w-5 h-5 ${currentPhase.color}`} />
                       ) : lifecycleMode === 'pregnancy' ? (
                         <Baby className="w-5 h-5 text-[#261900] dark:text-[#ffdf99]" />
                       ) : lifecycleMode === 'postpartum' ? (
                         <Heart className="w-5 h-5 text-[#31001d] dark:text-[#ffc1e3]" />
                       ) : (
                         <Sun className="w-5 h-5 text-[#21005d] dark:text-[#eaddff]" />
                       )}
                     </div>
                     <span className="text-[10px] font-bold text-gray-500/80 dark:text-gray-400/80 uppercase">Now</span>
                  </div>
                  <div>
                    <p className={`text-[24px] font-bold tracking-tight leading-none ${lifecycleMode === 'cycle' ? currentPhase.color : lifecycleMode === 'pregnancy' ? 'text-[#261900] dark:text-[#ffdf99]' : lifecycleMode === 'postpartum' ? 'text-[#31001d] dark:text-[#ffc1e3]' : 'text-[#21005d] dark:text-[#eaddff]'}`}>
                      {lifecycleMode === 'cycle' ? `Day ${currentDay}` : lifecycleMode === 'pregnancy' ? 'Wk 18' : lifecycleMode === 'postpartum' ? 'Wk 6' : 'Irregular'}
                    </p>
                    <p className="text-[12px] font-semibold text-gray-600 dark:text-gray-300 mt-1">
                      {lifecycleMode === 'cycle' ? currentPhase.name : lifecycleMode === 'pregnancy' ? 'Pregnancy' : lifecycleMode === 'postpartum' ? 'Postpartum' : 'Perimenopause'}
                    </p>
                  </div>
                </div>

                {/* iOS Stack/Pill Widget */}
                <div className="flex-1 max-w-[160px] h-[140px] flex flex-col gap-3">
                  <div className="flex-1 bg-white/60 dark:bg-black/60 backdrop-blur-2xl rounded-[24px] p-3 flex flex-col justify-center gap-1 shadow-[0_8px_32px_rgba(0,0,0,0.12)] border border-white/40 dark:border-white/10 hover:scale-[1.02] transition-transform">
                     <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center shrink-0">
                           <Mic className="w-4 h-4 text-white" />
                        </div>
                        <span className="font-semibold text-[13px] text-gray-800 dark:text-white leading-tight">Quick<br/>Log</span>
                     </div>
                  </div>
                  <div className="flex-1 bg-white/60 dark:bg-black/60 backdrop-blur-2xl rounded-[24px] p-3 flex flex-col justify-center gap-1 shadow-[0_8px_32px_rgba(0,0,0,0.12)] border border-white/40 dark:border-white/10 hover:scale-[1.02] transition-transform">
                     <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-teal-500 flex items-center justify-center shrink-0">
                           <CheckCircle className="w-4 h-4 text-white" />
                        </div>
                        <span className="font-semibold text-[13px] text-gray-800 dark:text-white leading-tight">Daily<br/>Stack</span>
                     </div>
                  </div>
                </div>

              </div>
            </div>
          </section>

          <section className="space-y-4">
        <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Dietary Preferences</h3>
        
        <div className="space-y-3">
          {/* Premium Glass Cards for Diet */}
          <div className="grid grid-cols-2 gap-3">
            <motion.button 
              layout
              onClick={() => setDietPreference('vegetarian')}
              className={`flex flex-col items-center justify-center p-5 rounded-[28px] border-2 transition-all duration-300 relative overflow-hidden ${
                dietPreference === 'vegetarian' 
                  ? 'bg-[#e6f4ea] dark:bg-[#0d652d]/20 border-[#34a853] dark:border-[#81c995] shadow-sm' 
                  : 'bg-white dark:bg-[#1c1c1e]/80 backdrop-saturate-150 backdrop-blur-3xl shadow-[0_8px_30px_rgba(0,0,0,0.06)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.1)] border-[0.5px] border-slate-200/60 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-[#2a2a2a]'
              }`}
            >
              <motion.div layout className={`w-10 h-10 rounded-full flex items-center justify-center mb-3 transition-colors duration-300 ${
                dietPreference === 'vegetarian' ? 'bg-[#34a853] dark:bg-[#81c995]' : 'bg-gray-100 dark:bg-[#2a2a2a]'
              }`}>
                <Leaf className={`w-5 h-5 transition-colors duration-300 ${dietPreference === 'vegetarian' ? 'text-white dark:text-[#121212]' : 'text-gray-500 dark:text-gray-400'}`} />
              </motion.div>
              
              <motion.h4 layout className={`font-semibold text-sm text-center leading-tight transition-colors duration-300 ${dietPreference === 'vegetarian' ? 'text-[#0d652d] dark:text-[#81c995]' : 'text-slate-900 dark:text-white'}`}>
                Vegetarian
              </motion.h4>

              <AnimatePresence>
                {dietPreference === 'vegetarian' && (
                  <motion.div 
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ type: "spring", bounce: 0.4 }}
                    className="absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center bg-[#34a853] dark:bg-[#81c995]"
                  >
                    <CheckCircle className="w-3.5 h-3.5 text-white dark:text-[#121212]" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>

            <motion.button 
              layout
              onClick={() => setDietPreference('non-vegetarian')}
              className={`flex flex-col items-center justify-center p-5 rounded-[28px] border-2 transition-all duration-300 relative overflow-hidden ${
                dietPreference === 'non-vegetarian' 
                  ? 'bg-[#fce8e6] dark:bg-[#ea4335]/20 border-[#ea4335] dark:border-[#f28b82] shadow-sm' 
                  : 'bg-white dark:bg-[#1c1c1e]/80 backdrop-saturate-150 backdrop-blur-3xl shadow-[0_8px_30px_rgba(0,0,0,0.06)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.1)] border-[0.5px] border-slate-200/60 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-[#2a2a2a]'
              }`}
            >
              <motion.div layout className={`w-10 h-10 rounded-full flex items-center justify-center mb-3 transition-colors duration-300 ${
                dietPreference === 'non-vegetarian' ? 'bg-[#ea4335] dark:bg-[#f28b82]' : 'bg-gray-100 dark:bg-[#2a2a2a]'
              }`}>
                <Utensils className={`w-5 h-5 transition-colors duration-300 ${dietPreference === 'non-vegetarian' ? 'text-white dark:text-[#121212]' : 'text-gray-500 dark:text-gray-400'}`} />
              </motion.div>
              
              <motion.h4 layout className={`font-semibold text-sm text-center leading-tight transition-colors duration-300 ${dietPreference === 'non-vegetarian' ? 'text-[#b31412] dark:text-[#f28b82]' : 'text-slate-900 dark:text-white'}`}>
                Non-Vegetarian
              </motion.h4>

              <AnimatePresence>
                {dietPreference === 'non-vegetarian' && (
                  <motion.div 
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ type: "spring", bounce: 0.4 }}
                    className="absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center bg-[#ea4335] dark:bg-[#f28b82]"
                  >
                    <CheckCircle className="w-3.5 h-3.5 text-white dark:text-[#121212]" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          </div>

          <AnimatePresence>
            {dietPreference === 'non-vegetarian' && (
              <motion.div 
                initial={{ opacity: 0, height: 0, scale: 0.95 }}
                animate={{ opacity: 1, height: 'auto', scale: 1 }}
                exit={{ opacity: 0, height: 0, scale: 0.95 }}
                transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                className="bg-white/80 dark:bg-[#1c1c1e]/80 backdrop-saturate-150 backdrop-blur-3xl border-[0.5px] border-slate-200/60 dark:border-white/10 rounded-[32px] p-6 mt-2 shadow-[0_8px_30px_rgba(0,0,0,0.06)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.1)] overflow-hidden"
              >
                <p className="text-[13px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-4">Which days do you eat meat?</p>
                <div className="flex justify-between gap-1">
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => {
                    const isSelected = nonVegDays.includes(day);
                    return (
                      <motion.button 
                        key={day}
                        whileTap={{ scale: 0.85 }}
                        onClick={() => {
                          if (isSelected) setNonVegDays(nonVegDays.filter(d => d !== day));
                          else setNonVegDays([...nonVegDays, day]);
                        }}
                        className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-xs font-bold transition-colors duration-200 ${
                          isSelected 
                            ? 'bg-[#FF9500] dark:bg-[#FF9F0A] text-white shadow-[0_4px_12px_rgba(255,149,0,0.3)]' 
                            : 'bg-gray-100 dark:bg-[#2c2c2e] text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-[#3a3a3c]'
                        }`}
                      >
                        {day.charAt(0)}
                      </motion.button>
                    )
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>




      {/* Medication Alarms */}
      <section className="space-y-3">
        <h3 className="text-[13px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest px-4">Daily Medication</h3>
        <div className="flex flex-col gap-3">
          {meds.filter(med => !med.targetModes || med.targetModes.includes(lifecycleMode)).map((med, index) => {
            const isStrict = med.strictAlarm;
            return (
              <div key={med.id} className="relative bg-white/80 dark:bg-[#1c1c1e]/80 backdrop-saturate-150 backdrop-blur-3xl border-[0.5px] border-slate-200/60 dark:border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.06)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.1)] rounded-[32px] p-3 sm:p-5 flex items-center justify-between gap-2 sm:gap-4 transition-colors hover:bg-black/[0.02] dark:hover:bg-white/[0.02]">
                
                <div className="flex items-center gap-2.5 sm:gap-3 relative z-10 flex-1 min-w-0">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm bg-blue-500 text-white">
                    <AlarmClock className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-[15px] sm:text-[17px] font-semibold tracking-tight text-slate-900 dark:text-white truncate">
                      {med.name}
                    </h4>
                    <p className="text-[12px] sm:text-[13px] mt-0.5 truncate text-gray-500 dark:text-gray-400">
                      {isStrict ? 'Aggressive Alert' : 'Standard Alert'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 sm:gap-3 relative z-10 shrink-0">
                  <input 
                    type="time" 
                    value={med.time}
                    onChange={(e) => updateMed(med.id, { time: e.target.value })}
                    onClick={(e) => {
                      if (e.target.showPicker) e.target.showPicker();
                    }}
                    className="appearance-none bg-gray-100 dark:bg-[#2c2c2e] px-2 sm:px-3 py-1.5 rounded-[8px] text-[12px] sm:text-[14px] font-semibold focus:outline-none cursor-pointer border border-transparent hover:bg-gray-200 dark:hover:bg-[#3a3a3c] transition-colors [&::-webkit-calendar-picker-indicator]:hidden text-slate-900 dark:text-white w-[75px] sm:w-[85px] text-center"
                  />
                  <button 
                    onClick={() => handleStrictAlarmToggle(med.id, isStrict)}
                    className={`w-[45px] h-[27px] sm:w-[51px] sm:h-[31px] rounded-full transition-colors duration-300 ease-in-out relative shrink-0 ${isStrict ? 'bg-[#34C759]' : 'bg-[#E9E9EA] dark:bg-[#39393D]'}`}
                  >
                    <div className={`w-[23px] h-[23px] sm:w-[27px] sm:h-[27px] bg-white rounded-full absolute top-[2px] left-[2px] shadow-[0_2px_5px_rgba(0,0,0,0.2)] transition-transform duration-300 ease-in-out ${isStrict ? 'translate-x-[18px] sm:translate-x-[20px]' : 'translate-x-0'}`} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
    )}
      {activeCategory === 'connected' && (
        <div className="space-y-6 animate-fade-in">
          <section>
            <h3 className="text-[13px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest pl-2 mb-3">Integrations & Sync</h3>
            <div className="bg-white/80 dark:bg-[#1c1c1e]/80 backdrop-saturate-150 backdrop-blur-3xl border-[0.5px] border-slate-200/60 dark:border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.06)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.1)] rounded-[32px] overflow-hidden flex flex-col">
              
              {/* Google Drive Backup */}
              <div className="p-5 flex flex-col gap-2 border-b-[0.5px] border-slate-200/60 dark:border-white/10 transition-colors active:bg-black/[0.02] dark:active:bg-white/[0.02]">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className={`relative w-12 h-12 rounded-[14px] flex items-center justify-center shrink-0 shadow-[0_4px_12px_rgba(0,0,0,0.08)] dark:shadow-none border-[0.5px] border-white/20 ${isAutoSyncEnabled ? 'bg-gradient-to-br from-[#5E5CE6] to-[#007AFF] text-white' : 'bg-[#E5E5EA] dark:bg-[#2c2c2e] text-[#1f1f1f] dark:text-[#e3e3e3]'}`}>
                      <Cloud className="w-6 h-6" />
                      {isAutoSyncEnabled && (
                        <div className="absolute -bottom-1 -right-1 bg-white dark:bg-[#1c1c1e] rounded-full p-0.5">
                          <div className="bg-[#34C759] rounded-full p-0.5 shadow-sm">
                            <ShieldCheck className="w-2.5 h-2.5 text-white" />
                          </div>
                        </div>
                      )}
                    </div>
                    <div>
                      <h4 className="text-[17px] font-semibold tracking-tight text-[#1f1f1f] dark:text-[#e3e3e3]">Google Drive Backup</h4>
                      <p className={`text-[12px] font-semibold mt-0.5 ${isAutoSyncEnabled ? 'text-[#007AFF]' : 'text-gray-500 dark:text-gray-400'}`}>
                        {isAutoSyncEnabled ? 'Active and secured' : 'Not Connected'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {isAutoSyncEnabled && (
                      <button onClick={() => setShowRestoreModal(true)} className="w-10 h-10 rounded-[12px] flex items-center justify-center bg-[#E5E5EA] dark:bg-[#3A3A3C] text-[#1f1f1f] dark:text-white shadow-sm active:scale-95 transition-transform" aria-label="Restore Backup">
                        <Download className="w-5 h-5" />
                      </button>
                    )}
                    <button 
                      onClick={handleToggleAutoSync}
                      className={`w-[51px] h-[31px] rounded-full transition-colors duration-300 ease-in-out relative shrink-0 ${isAutoSyncEnabled ? 'bg-[#34C759]' : 'bg-[#E9E9EA] dark:bg-[#39393D]'}`}
                    >
                      <div className={`w-[27px] h-[27px] bg-white rounded-full absolute top-[2px] left-[2px] shadow-[0_2px_5px_rgba(0,0,0,0.2)] transition-transform duration-300 ease-in-out ${isAutoSyncEnabled ? 'translate-x-[20px]' : 'translate-x-0'}`} />
                    </button>
                  </div>
                </div>
                <p className="text-[13px] text-gray-500 dark:text-gray-400 leading-relaxed pl-[64px] pr-2">
                  Automatically back up your cycle data, health logs, and personalized settings to your private Google Drive.
                </p>
              </div>

              {/* Partner Sync */}
              <div className="p-5 flex flex-col gap-2 border-b-[0.5px] border-slate-200/60 dark:border-white/10 transition-colors active:bg-black/[0.02] dark:active:bg-white/[0.02]">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-[14px] flex items-center justify-center shrink-0 shadow-[0_4px_12px_rgba(0,0,0,0.08)] dark:shadow-none border-[0.5px] border-white/20 ${isPartnerSynced ? 'bg-gradient-to-br from-[#FF3B30] to-[#FF453A] text-white' : 'bg-[#E5E5EA] dark:bg-[#2c2c2e] text-[#1f1f1f] dark:text-[#e3e3e3]'}`}>
                      <Users className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-[17px] font-semibold tracking-tight text-[#1f1f1f] dark:text-[#e3e3e3]">Partner Sync</h4>
                      <p className={`text-[12px] font-semibold mt-0.5 ${isPartnerSynced ? 'text-[#FF3B30]' : 'text-gray-500 dark:text-gray-400'}`}>
                        {isPartnerSynced ? 'Shared with Alex' : 'Unlinked'}
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={handlePartnerToggle}
                    className={`w-[51px] h-[31px] rounded-full transition-colors duration-300 ease-in-out relative shrink-0 ${isPartnerSynced ? 'bg-[#34C759]' : 'bg-[#E9E9EA] dark:bg-[#39393D]'}`}
                  >
                    <div className={`w-[27px] h-[27px] bg-white rounded-full absolute top-[2px] left-[2px] shadow-[0_2px_5px_rgba(0,0,0,0.2)] transition-transform duration-300 ease-in-out ${isPartnerSynced ? 'translate-x-[20px]' : 'translate-x-0'}`} />
                  </button>
                </div>
                <p className="text-[13px] text-gray-500 dark:text-gray-400 leading-relaxed pl-[64px] pr-2">
                  Share a read-only view of your cycle phase and mood with a partner to improve communication.
                </p>
              </div>

              {/* Google Calendar Sync */}
              <div className="p-5 flex flex-col gap-2 border-b-[0.5px] border-slate-200/60 dark:border-white/10 transition-colors active:bg-black/[0.02] dark:active:bg-white/[0.02]">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-[14px] flex items-center justify-center shrink-0 shadow-[0_4px_12px_rgba(0,0,0,0.08)] dark:shadow-none border-[0.5px] border-white/20 ${isCalendarSynced ? 'bg-gradient-to-br from-[#34C759] to-[#30D158] text-white' : 'bg-[#E5E5EA] dark:bg-[#2c2c2e] text-[#1f1f1f] dark:text-[#e3e3e3]'}`}>
                      <Calendar className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-[17px] font-semibold tracking-tight text-[#1f1f1f] dark:text-[#e3e3e3]">Calendar Sync</h4>
                      <p className={`text-[12px] font-semibold mt-0.5 ${isCalendarSynced ? 'text-[#34C759]' : 'text-gray-500 dark:text-gray-400'}`}>
                        {isCalendarSynced ? 'Syncing events' : 'Not Connected'}
                      </p>
                      {calendarStatus && (
                        <p className={`text-[11px] font-semibold mt-0.5 ${calendarStatus.includes('Failed') ? 'text-[#FF3B30]' : 'text-[#34C759]'}`}>
                          {calendarStatus}
                        </p>
                      )}
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      if (isCalendarSynced) {
                        setIsCalendarSynced(false);
                        setCalendarStatus('');
                      } else {
                        handleCalendarLogin();
                      }
                    }}
                    className={`w-[51px] h-[31px] rounded-full transition-colors duration-300 ease-in-out relative shrink-0 ${isCalendarSynced ? 'bg-[#34C759]' : 'bg-[#E9E9EA] dark:bg-[#39393D]'}`}
                  >
                    <div className={`w-[27px] h-[27px] bg-white rounded-full absolute top-[2px] left-[2px] shadow-[0_2px_5px_rgba(0,0,0,0.2)] transition-transform duration-300 ease-in-out ${isCalendarSynced ? 'translate-x-[20px]' : 'translate-x-0'}`} />
                  </button>
                </div>
                <p className="text-[13px] text-gray-500 dark:text-gray-400 leading-relaxed pl-[64px] pr-2">
                  Automatically add period predictions and fertile windows to your calendar as private events.
                </p>
              </div>

              {/* App Install */}
              {isInstallable && (
                <div className="p-5 flex flex-col gap-2 transition-colors active:bg-black/[0.02] dark:active:bg-white/[0.02] bg-[#007AFF]/5 dark:bg-[#007AFF]/10">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-[14px] flex items-center justify-center shrink-0 shadow-[0_4px_12px_rgba(0,122,255,0.3)] bg-[#007AFF] text-white">
                        <Smartphone className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="text-[17px] font-semibold tracking-tight text-[#007AFF] dark:text-[#0A84FF]">Install App</h4>
                        <p className="text-[12px] font-semibold mt-0.5 text-[#007AFF]/70 dark:text-[#0A84FF]/70">
                          Recommended
                        </p>
                      </div>
                    </div>
                    <button 
                      onClick={handleInstallApp}
                      className="w-10 h-10 rounded-[12px] flex items-center justify-center shadow-[0_4px_12px_rgba(0,122,255,0.2)] bg-[#007AFF] text-white active:scale-95 transition-transform shrink-0"
                      aria-label="Install App"
                    >
                      <Download className="w-5 h-5" />
                    </button>
                  </div>
                  <p className="text-[13px] text-[#007AFF]/80 dark:text-[#0A84FF]/80 leading-relaxed pl-[64px] pr-2 font-medium">
                    Install Google Rythm on your device for quick access, offline support, and a native app experience.
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* Render Modals here */}
          {showPartnerConfig && (
            <PartnerConfigModal 
              onClose={() => setShowPartnerConfig(false)}
              onSuccess={() => setIsPartnerSynced(true)}
            />
          )}
          {showUnlockModal && (
            <div className="p-5 bg-white dark:bg-[#202124] rounded-[24px] border border-[#e8eaed] dark:border-[#3c4043] shadow-sm animate-fade-in">
              <div className="flex items-center gap-3 mb-2">
                <ShieldCheck className="w-5 h-5 text-[#1a73e8] dark:text-[#8ab4f8]" />
                <h4 className="text-sm font-bold text-[#202124] dark:text-[#e8eaed]">Secure Your Backup</h4>
              </div>
              <p className="text-xs text-[#5f6368] dark:text-[#9aa0a6] mb-5 leading-relaxed">
                Create a 4-digit PIN to lock your backup. You'll need this to restore your data on a new device.
              </p>
              <div className="space-y-4">
                <input 
                  type="password" 
                  maxLength={4}
                  inputMode="numeric"
                  value={unlockPassword}
                  onChange={e => setUnlockPassword(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="PIN"
                  className="w-full px-4 py-3 rounded-xl bg-[#f1f3f4] dark:bg-[#303134] border border-transparent focus:border-[#1a73e8] text-center tracking-[1em] focus:outline-none focus:ring-1 focus:ring-[#1a73e8] dark:text-[#e8eaed] font-mono text-xl transition-colors"
                />
                <div className="flex gap-3">
                  <button 
                    onClick={submitUnlock}
                    className="flex-1 py-3 bg-[#1a73e8] dark:bg-[#8ab4f8] text-white dark:text-[#202124] rounded-xl text-sm font-bold hover:bg-[#1557b0] dark:hover:bg-[#8ab4f8]/90 transition-colors shadow-sm"
                  >
                    Save PIN
                  </button>
                  <button 
                    onClick={() => setShowUnlockModal(false)}
                    className="flex-1 py-3 bg-[#f1f3f4] dark:bg-[#303134] text-[#1a73e8] dark:text-[#8ab4f8] rounded-xl text-sm font-bold hover:bg-[#e8eaed] dark:hover:bg-[#3c4043] transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {showRestoreModal && (
            <div className="p-5 bg-[#fef7e0] dark:bg-[#4d3a00] rounded-[24px] border border-[#fbbc04] dark:border-[#fde293] shadow-sm animate-fade-in">
              <div className="flex items-center gap-3 mb-2">
                <Download className="w-5 h-5 text-[#b06000] dark:text-[#fde293]" />
                <h4 className="text-sm font-bold text-[#b06000] dark:text-[#fde293]">Restore Your Data</h4>
              </div>
              <p className="text-xs text-[#b06000]/80 dark:text-[#fde293]/90 mb-5 leading-relaxed">
                This will overwrite the data on this device. Enter your 4-digit PIN to decrypt your backup.
              </p>
              
              {!googleAccessToken ? (
                <button onClick={handleDriveLogin} className="w-full py-3 bg-[#fbbc04] dark:bg-[#fde293] text-[#3d2e00] rounded-xl text-sm font-bold mb-2 hover:opacity-90 transition-opacity shadow-sm">
                  Step 1: Connect Google Drive
                </button>
              ) : (
                <div className="space-y-4">
                  <input 
                    type="password" 
                    maxLength={4}
                    inputMode="numeric"
                    value={restorePassword}
                    onChange={e => setRestorePassword(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    placeholder="PIN"
                    className="w-full px-4 py-3 rounded-xl bg-white dark:bg-[#202124] border border-[#fbbc04] dark:border-transparent focus:border-[#fbbc04] text-center tracking-[1em] focus:outline-none focus:ring-2 focus:ring-[#fbbc04] dark:text-white font-mono text-xl transition-colors"
                  />
                  <div className="flex gap-3">
                    <button 
                      onClick={executeRestore}
                      className="flex-1 py-3 bg-[#fbbc04] dark:bg-[#fde293] text-[#3d2e00] rounded-xl text-sm font-bold hover:opacity-90 transition-opacity shadow-sm"
                    >
                      Restore Data
                    </button>
                    <button 
                      onClick={() => { setShowRestoreModal(false); setRestoreError(''); setRestorePassword(''); }}
                      className="flex-1 py-3 bg-white/50 dark:bg-[#3d2e00] text-[#b06000] dark:text-[#fde293] rounded-xl text-sm font-bold hover:bg-white/80 dark:hover:bg-[#5c4500] transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                  {restoreError && <p className="text-xs font-bold text-red-600 dark:text-red-400 text-center">{restoreError}</p>}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {activeCategory === 'security' && (
        <div className="space-y-8 animate-fade-in">
          {/* Data Import iOS */}
          <section className="space-y-4">
            <h3 className="text-[13px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest pl-2">Data Migration</h3>
            <div className="relative overflow-hidden bg-white/80 dark:bg-[#1c1c1e]/80 backdrop-saturate-150 backdrop-blur-3xl border-[0.5px] border-slate-200/60 dark:border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.06)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.1)] rounded-[32px] p-5 sm:p-6 transition-colors duration-500 flex flex-col gap-4">
              <div className="flex items-center justify-between gap-4">
                 <div className="flex items-center gap-4">
                   <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 bg-[#007AFF]/10 text-[#007AFF]">
                     <Upload className="w-5 h-5" />
                   </div>
                   <div>
                     <h4 className="text-[17px] font-semibold tracking-tight text-[#1f1f1f] dark:text-[#e3e3e3]">Import Data</h4>
                     <p className="text-[12px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest mt-0.5">From Clue or Flo</p>
                   </div>
                 </div>
                 
                 <button 
                   onClick={() => setShowImport(true)}
                   className="px-5 py-3 rounded-[14px] text-[15px] font-semibold bg-[#007AFF] text-white active:scale-[0.98] transition-transform"
                 >
                   Import
                 </button>
              </div>
              <p className="text-[13px] text-gray-500 dark:text-gray-400 leading-relaxed pl-16 pr-2">
                Migrate your history from another app.
              </p>
            </div>
          </section>

          {/* Danger Zone iOS */}
          <section className="space-y-4">
            <h3 className="text-[13px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest pl-2">Danger Zone</h3>
            <div className="relative overflow-hidden bg-[#FF3B30]/5 dark:bg-[#FF3B30]/10 backdrop-saturate-150 backdrop-blur-3xl border-[0.5px] border-[#FF3B30]/20 rounded-[32px] p-5 sm:p-6 transition-colors duration-500 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-[0_8px_30px_rgba(255,59,48,0.05)]">
               <div className="absolute top-0 right-0 w-32 h-32 bg-[#FF3B30]/10 rounded-full blur-[40px] pointer-events-none" />
               <div className="flex items-center gap-4 relative z-10">
                 <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 bg-[#FF3B30] text-white shadow-[0_4px_12px_rgba(255,59,48,0.3)]">
                   <Trash2 className="w-5 h-5" />
                 </div>
                 <div>
                   <h4 className="text-[17px] font-semibold tracking-tight text-[#FF3B30]">Factory Reset</h4>
                   <p className="text-[12px] font-semibold text-[#FF3B30]/70 dark:text-[#FF3B30]/80 uppercase tracking-widest mt-0.5">Irreversible</p>
                 </div>
               </div>
               
               <ResetButton onReset={resetApp} />
            </div>
          </section>

          {/* Developer & Support Card */}
          <section className="space-y-4 pt-2">
            <h3 className="text-[13px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest pl-2 mb-3">Developer & Support</h3>
            <div className="bg-white/80 dark:bg-[#1c1c1e]/80 backdrop-saturate-150 backdrop-blur-3xl border-[0.5px] border-slate-200/60 dark:border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.06)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.1)] rounded-[32px] overflow-hidden flex flex-col">
              
              <div className="flex items-center justify-between px-5 py-4 border-b-[0.5px] border-slate-200/60 dark:border-white/10">
                <span className="text-[17px] text-[#1f1f1f] dark:text-[#e3e3e3]">App Version</span>
                <span className="text-[17px] text-[#8e8e93]">Rhythm Alpha v1.0</span>
              </div>
              
              <div className="flex items-center justify-between px-5 py-4 border-b-[0.5px] border-slate-200/60 dark:border-white/10">
                <span className="text-[17px] text-[#1f1f1f] dark:text-[#e3e3e3]">Built By</span>
                <span className="text-[17px] text-[#8e8e93]">Pal, Sonu</span>
              </div>

              <a href="mailto:sonupalak47@gmail.com" className="flex items-center justify-between px-5 py-4 border-b-[0.5px] border-slate-200/60 dark:border-white/10 transition-colors active:bg-black/[0.02] dark:active:bg-white/[0.02]">
                <span className="text-[17px] text-[#007AFF]">Contact Support</span>
                <ChevronRight className="w-5 h-5 text-[#c6c6c8] dark:text-[#5a5a5e]" />
              </a>

              <a href="https://linkedin.com/in/sonupal-690942141" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between px-5 py-4 transition-colors active:bg-black/[0.02] dark:active:bg-white/[0.02]">
                <span className="text-[17px] text-[#007AFF]">Connect on LinkedIn</span>
                <ChevronRight className="w-5 h-5 text-[#c6c6c8] dark:text-[#5a5a5e]" />
              </a>
            </div>
          </section>
        </div>
      )}

    </div>
  );
}

// iOS Two-tap confirmation with Slide Animation
function ResetButton({ onReset }) {
  const [confirmed, setConfirmed] = useState(false);

  return (
    <div className="relative flex justify-end shrink-0 z-10 min-h-[46px] min-w-[120px]">
      <AnimatePresence mode="wait">
        {!confirmed ? (
          <motion.button
            key="init"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.1 } }}
            onClick={() => setConfirmed(true)}
            className="px-5 py-3 rounded-[14px] text-[15px] font-semibold bg-[#FF3B30] text-white active:scale-[0.98] transition-transform w-full sm:w-auto"
          >
            Erase All Data
          </motion.button>
        ) : (
          <motion.div
            key="confirm"
            initial={{ opacity: 0, x: 20, width: 0 }}
            animate={{ opacity: 1, x: 0, width: 'auto' }}
            exit={{ opacity: 0, x: 20, width: 0, transition: { duration: 0.1 } }}
            className="flex items-center gap-2 bg-white/50 dark:bg-black/20 p-1.5 rounded-[16px] border-[0.5px] border-[#FF3B30]/20 shadow-sm overflow-hidden"
          >
            <button
              onClick={() => setConfirmed(false)}
              className="px-4 py-2.5 rounded-[12px] bg-transparent text-[#1f1f1f] dark:text-[#e3e3e3] text-[15px] font-semibold hover:bg-black/5 dark:hover:bg-white/10 transition-colors whitespace-nowrap"
            >
              Cancel
            </button>
            <button
              onClick={onReset}
              className="px-4 py-2.5 rounded-[12px] bg-[#FF3B30] text-white text-[15px] font-semibold active:scale-[0.98] transition-transform whitespace-nowrap shadow-[0_4px_12px_rgba(255,59,48,0.2)]"
            >
              Confirm
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
