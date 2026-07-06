import { useEffect, useRef } from 'react';
import { useAppStore } from '../store/useAppStore';
import { db, exportAllData } from '../services/db';
import { encryptVaultWithKey } from '../services/crypto';
import { uploadBackupToDrive } from '../services/driveService';
import { updateLastActive } from '../services/firestore';

export const useAutoSync = () => {
  const { userPrefs, vaultKey, googleAccessToken, googleProfile, setSyncStatus, updatePrefs, unlockVault } = useAppStore();
  const syncTimeoutRef = useRef(null);
  const isSyncingRef = useRef(false);
  const hasPendingSyncRef = useRef(false);

  useEffect(() => {
    // If not enabled, idle
    if (!userPrefs.isAutoSyncEnabled) {
      setSyncStatus('idle');
      return;
    }
    
    // Auto-unlock if we have a saved PIN but no key in RAM
    if (userPrefs.isAutoSyncEnabled && !vaultKey && userPrefs.syncPin) {
      unlockVault(userPrefs.syncPin);
      return; // wait for next render cycle
    }

    // If enabled but missing key
    if (userPrefs.isAutoSyncEnabled && !vaultKey) {
      setSyncStatus('locked');
      return;
    }

    // If enabled but missing Google Auth (e.g. after page reload)
    if (userPrefs.isAutoSyncEnabled && !googleAccessToken) {
      setSyncStatus('error');
      return;
    }
    
    // Unlocked and ready
    setSyncStatus('idle');

    const performSync = async () => {
      if (isSyncingRef.current) {
        hasPendingSyncRef.current = true;
        return;
      }
      
      try {
        isSyncingRef.current = true;
        setSyncStatus('syncing');
        
        // 1. Gather all data
        const data = await exportAllData();
        
        // 2. Encrypt using in-memory vault key
        const ciphertext = await encryptVaultWithKey(data, vaultKey);
        
        // 3. Upload to Google Drive (we wrap it in an object so it JSON.stringifies properly)
        await uploadBackupToDrive(googleAccessToken, { vaultData: ciphertext });
        
        // 3.5 Update Firebase lastActive tracker
        if (googleProfile?.email) {
          updateLastActive(googleProfile.email);
        }
        
        // 4. Update sync timestamp in Zustand
        updatePrefs({ lastSyncTimestamp: Date.now() });
        setSyncStatus('idle');
      } catch (error) {
        console.error("AutoSync failed:", error);
        if (error?.message?.includes("401") || error?.message?.includes("Unauthorized")) {
          setSyncStatus('error');
        } else {
          // General error
          setSyncStatus('failed'); // Keep it visible as an issue
        }
      } finally {
        isSyncingRef.current = false;
        if (hasPendingSyncRef.current) {
          hasPendingSyncRef.current = false;
          // Trigger another debounced sync if changes queued up
          triggerDebouncedSync();
        }
      }
    };

    const triggerDebouncedSync = () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
      syncTimeoutRef.current = setTimeout(() => {
        performSync();
      }, 10000); // 10-second debounce
    };

    const onChanges = () => {
      if (userPrefs.isAutoSyncEnabled && vaultKey && googleAccessToken) {
        triggerDebouncedSync();
      }
    };

    // Listen to Dexie DB changes via table hooks
    db.logs.hook('creating', onChanges);
    db.logs.hook('updating', onChanges);
    db.logs.hook('deleting', onChanges);

    // If we just enabled it, or haven't synced recently, do a baseline sync
    if (!userPrefs.lastSyncTimestamp || Date.now() - userPrefs.lastSyncTimestamp > 3600000) { // 1 hour
      triggerDebouncedSync();
    }

    return () => {
      db.logs.hook('creating').unsubscribe(onChanges);
      db.logs.hook('updating').unsubscribe(onChanges);
      db.logs.hook('deleting').unsubscribe(onChanges);
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    };
  }, [userPrefs.isAutoSyncEnabled, vaultKey, googleAccessToken, setSyncStatus, updatePrefs]);
};
