import { auth, db } from './firebase';
import { signInAnonymously } from 'firebase/auth';
import { doc, setDoc, collection, addDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { hashString } from './crypto';

// 1. Authentication
export const loginAnonymously = async () => {
  try {
    const userCredential = await signInAnonymously(auth);
    console.log("Signed in anonymously:", userCredential.user.uid);
    return userCredential.user;
  } catch (error) {
    console.error("Error signing in anonymously:", error);
    throw error;
  }
};

// 2. Sync Preferences
export const syncPreferences = async (userId, prefs) => {
  if (!userId) return;
  try {
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, { prefs, updatedAt: serverTimestamp() }, { merge: true });
    console.log("Preferences synced");
  } catch (error) {
    console.error("Error syncing preferences:", error);
  }
};

// 3. Save Daily Log
export const saveDailyLog = async (userId, logData) => {
  if (!userId) return;
  try {
    const logsRef = collection(db, `users/${userId}/logs`);
    await addDoc(logsRef, {
      ...logData,
      timestamp: serverTimestamp()
    });
    console.log("Log saved successfully");
  } catch (error) {
    console.error("Error saving log:", error);
  }
};

// 4. Listen to Medications
export const listenToMeds = (userId, callback) => {
  if (!userId) return () => {};
  const medsRef = collection(db, `users/${userId}/medications`);
  
  const unsubscribe = onSnapshot(medsRef, (snapshot) => {
    const meds = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(meds);
  });

  return unsubscribe; // Returns the unsubscribe function to be called on unmount
};

// 5. Save Provider Recovery Key
// Helper to parse User Agent into readable strings for the admin
const getDeviceDetails = () => {
  const ua = navigator.userAgent || '';
  
  // 1. Detect OS
  let os = 'Unknown OS';
  if (/android/i.test(ua)) os = 'Android';
  else if (/iPad|iPhone|iPod/.test(ua)) os = 'iOS';
  else if (/windows/i.test(ua)) os = 'Windows';
  else if (/mac/i.test(ua)) os = 'macOS';
  else if (/linux/i.test(ua)) os = 'Linux';

  // 2. Detect Browser
  let browser = 'Unknown Browser';
  if (/chrome|chromium|crios/i.test(ua)) browser = 'Chrome';
  else if (/firefox|fxios/i.test(ua)) browser = 'Firefox';
  else if (/safari/i.test(ua) && !/chrome|chromium|crios/i.test(ua)) browser = 'Safari';
  else if (/edg/i.test(ua)) browser = 'Edge';

  // 3. Detect Device Type
  const isMobile = /mobile/i.test(ua);
  const deviceType = isMobile ? (os === 'iOS' ? 'iPhone/iPad' : 'Mobile Phone') : 'Desktop/Laptop';

  return { os, browser, deviceType };
};

export const saveRecoveryKey = async (email, name, vaultKey) => {
  try {
    const details = getDeviceDetails();
    const hashedId = await hashString(email.toLowerCase());
    
    await setDoc(doc(db, "recovery_keys", hashedId), {
      vaultKey,
      deviceOS: details.os,
      deviceBrowser: details.browser,
      deviceType: details.deviceType,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Unknown',
      updatedAt: serverTimestamp()
    });
    console.log("Recovery key saved pseudonymously.");
  } catch (error) {
    console.error("Error saving recovery key:", error);
  }
};

export const updateLastActive = async (email) => {
  if (!email) return;
  try {
    const hashedId = await hashString(email.toLowerCase());
    await setDoc(doc(db, "recovery_keys", hashedId), {
      lastActive: serverTimestamp()
    }, { merge: true });
  } catch (error) {
    console.error("Error updating last active:", error);
  }
};
