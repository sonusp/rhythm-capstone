import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { deriveVaultKey } from '../services/crypto';
import { calculateCurrentCycleDay, calculateCyclePhase } from '../services/cycleEngine';

// Helper to determine phase based on day
const getPhaseForDay = (day, cycleLength = 28, hasPCOS = false) => {
  if (day > cycleLength) {
    return hasPCOS ? 'PCOS' : 'LATE';
  }
  if (day >= 1 && day <= 5) return 'MENSTRUAL';
  if (day >= 6 && day <= 11) return 'FOLLICULAR';
  if (day >= 12 && day <= 16) return 'OVULATION';
  return 'LUTEAL';
};

export const useAppStore = create(
  persist(
    (set) => ({
      // Navigation & Theme
      activeTab: 'dashboard',
      setTab: (tab) => set({ activeTab: tab }),
      
      isDarkMode: false,
      toggleDarkMode: () => set((state) => ({ isDarkMode: !state.isDarkMode })),

      // Core Cycle State
      currentDay: 1,
      currentPhase: getPhaseForDay(1),
      setDay: (day) => set((state) => {
        const hasPCOS = state.userPrefs.diagnosedConditions?.includes('PCOS');
        return { 
          currentDay: day, 
          currentPhase: getPhaseForDay(day, state.userPrefs.cycleLength, hasPCOS) 
        };
      }),

      // User Preferences
      userPrefs: {
        isOnboardingComplete: false,
        hasSeenTutorial: false,
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
        wearables: 'None',
        aiTone: 'Warm & Supportive',
        archNemesis: [],
        nonVegDays: ['Wednesday', 'Friday', 'Sunday'],
        isCalendarSynced: false,
        isPartnerSynced: false,
        // App Lock
        isLockEnabled: false,
        lockPin: '',
        isBiometricEnabled: false,
        // Supplement Tracking
        supplements: [], // Array of strings e.g. ['Magnesium', 'Zinc']
        lastStackTakenDate: '', // To track if "One-Tap Stack" was hit today
        // Auto-Sync Settings
        isAutoSyncEnabled: false,
        lastSyncTimestamp: null,
        // Partner & Lifecycle Extras
        syncPin: '',
        conceptionDate: '',
        dueDate: '',
        partnerEmail: '',
        partnerName: '',
        bornDate: '',
      },
      // Transient unlock state — always starts locked on page load
      isUnlocked: false,
      setUnlocked: (val) => set({ isUnlocked: val }),
      
      // Auto-Sync Transient State
      vaultKey: null,
      syncStatus: 'idle', // 'idle' | 'syncing' | 'error' | 'locked'
      googleAccessToken: null,
      googleProfile: null,
      
      setGoogleAccessToken: (token) => set({ googleAccessToken: token }),
      setGoogleProfile: (profile) => set({ googleProfile: profile }),
      setSyncStatus: (status) => set({ syncStatus: status }),
      unlockVault: async (password) => {
        try {
          const keyObj = await deriveVaultKey(password);
          set({ vaultKey: keyObj, syncStatus: 'idle' });
          return true;
        } catch (e) {
          console.error("Failed to unlock vault", e);
          return false;
        }
      },
      lockVault: () => set({ vaultKey: null, syncStatus: 'locked' }),
      
      updatePrefs: (newPrefs) => set((state) => {
        const updatedUserPrefs = { ...state.userPrefs, ...newPrefs };
        const hasPCOS = updatedUserPrefs.diagnosedConditions?.includes('PCOS');
        return {
          userPrefs: updatedUserPrefs,
          currentPhase: getPhaseForDay(state.currentDay, updatedUserPrefs.cycleLength, hasPCOS)
        };
      }),
      completeOnboarding: () => set((state) => ({
        userPrefs: { ...state.userPrefs, isOnboardingComplete: true }
      })),
      syncCycleDay: () => set((state) => {
        const { lastPeriodDate, cycleLength, diagnosedConditions, lifecycleMode } = state.userPrefs;
        if (!lastPeriodDate) return {};
        const day = calculateCurrentCycleDay(lastPeriodDate);
        const phase = calculateCyclePhase(day, cycleLength || 28, diagnosedConditions || [], lifecycleMode || 'cycle');
        return { currentDay: day, currentPhase: phase };
      }),
      resetApp: async () => {
        // 1. Force state reset in memory so persist middleware doesn't save dirty state on unload
        set({
          userPrefs: {
            isOnboardingComplete: false,
            hasSeenTutorial: false,
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
            wearables: 'None',
            aiTone: 'Warm & Supportive',
            archNemesis: [],
            nonVegDays: ['Wednesday', 'Friday', 'Sunday'],
            isCalendarSynced: false,
            isPartnerSynced: false,
            isLockEnabled: false,
            lockPin: '',
            isBiometricEnabled: false,
            supplements: [],
            lastStackTakenDate: '',
            isAutoSyncEnabled: false,
            lastSyncTimestamp: null,
            syncPin: '',
            conceptionDate: '',
            dueDate: '',
            partnerEmail: '',
            partnerName: '',
            bornDate: '',
          },
          meds: [
            { id: 1, name: 'Birth Control', time: '09:00', taken: false, iconName: 'Pill', strictAlarm: false, targetModes: ['cycle', 'childfree'] },
            { id: 2, name: 'Prenatal Vitamin', time: '20:00', taken: false, iconName: 'Sparkles', strictAlarm: false, targetModes: ['ttc', 'pregnancy', 'postpartum'] }
          ],
          medHistory: {},
          currentDay: 1,
          activeTab: 'dashboard',
          lastLoggedTimestamp: Date.now()
        });
        
        // 2. Clear Local Storage entirely
        localStorage.removeItem('google-rhythm-storage');
        
        // 3. Delete IndexedDB (Corrected DB Name)
        try { 
          const req = indexedDB.deleteDatabase('GoogleRhythmAppDB'); 
          // Wait briefly for the deletion request to be processed before reload
          await new Promise(resolve => {
            req.onsuccess = resolve;
            req.onerror = resolve;
            setTimeout(resolve, 100); // 100ms fallback
          });
        } catch(e) {}
        
        // 4. Reload page
        setTimeout(() => {
          window.location.reload();
        }, 50);
      },

      // Medications
      meds: [
        { id: 1, name: 'Birth Control', time: '09:00', taken: false, iconName: 'Pill', strictAlarm: false, targetModes: ['cycle', 'childfree'] },
        { id: 2, name: 'Prenatal Vitamin', time: '20:00', taken: false, iconName: 'Sparkles', strictAlarm: false, targetModes: ['ttc', 'pregnancy', 'postpartum'] }
      ],
      medHistory: {},
      toggleMed: (id) => set((state) => {
        const today = new Date().toISOString().split('T')[0];
        const med = state.meds.find(m => m.id === id);
        if (!med) return state;

        const willBeTaken = !med.taken;
        const currentDayHistory = state.medHistory[today] || [];
        
        const newDayHistory = willBeTaken 
          ? (currentDayHistory.includes(id) ? currentDayHistory : [...currentDayHistory, id])
          : currentDayHistory.filter(medId => medId !== id);

        return {
          meds: state.meds.map(m => m.id === id ? { ...m, taken: willBeTaken } : m),
          medHistory: {
            ...state.medHistory,
            [today]: newDayHistory
          }
        };
      }),
      updateMed: (id, updates) => set((state) => ({
        meds: state.meds.map(med => 
          med.id === id ? { ...med, ...updates } : med
        )
      })),
      addMed: (med) => set((state) => ({
        meds: [...state.meds, { ...med, id: Date.now() }]
      })),
      removeMed: (id) => set((state) => ({
        meds: state.meds.filter(med => med.id !== id)
      })),

      // Supplement Actions
      toggleSupplement: (supplement) => set((state) => {
        const current = state.userPrefs.supplements || [];
        const exists = current.includes(supplement);
        return {
          userPrefs: {
            ...state.userPrefs,
            supplements: exists ? current.filter(s => s !== supplement) : [...current, supplement]
          }
        };
      }),
      markStackTaken: () => set((state) => {
        return {
          userPrefs: {
            ...state.userPrefs,
            lastStackTakenDate: new Date().toISOString().slice(0, 10) // YYYY-MM-DD
          }
        };
      }),
      triggerLogUpdate: () => set({ lastLoggedTimestamp: Date.now() })
    }),
    {
      name: 'google-rhythm-storage',
      partialize: (state) => ({ 
        userPrefs: state.userPrefs, 
        isDarkMode: state.isDarkMode, 
        meds: state.meds,
        medHistory: state.medHistory
      }),
    }
  )
);
