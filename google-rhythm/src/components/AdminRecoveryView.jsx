import React, { useState } from 'react';
import { Search, Copy, Check, ChevronLeft, ShieldCheck } from 'lucide-react';
import { db } from '../services/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { hashString } from '../services/crypto';

export default function AdminRecoveryView() {
  const [passcode, setPasscode] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const ADMIN_SECRET = import.meta.env.VITE_ADMIN_SECRET || 'rhythm-admin-secure-2026';

  const [isShaking, setIsShaking] = useState(false);

  const handleLogin = (e) => {
    e.preventDefault();
    if (passcode === ADMIN_SECRET) {
      setIsAuthenticated(true);
      setError('');
    } else {
      setError('Incorrect Passcode');
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setError('');
    setResult(null);
    setCopied(false);

    try {
      const cleanEmail = email.trim().toLowerCase();
      const hashedId = await hashString(cleanEmail);
      
      let docRef = doc(db, 'recovery_keys', hashedId);
      let docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setResult({
          hashId: hashedId,
          ...docSnap.data()
        });
      } else {
        // Fallback for legacy records
        docRef = doc(db, 'recovery_keys', cleanEmail);
        docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setResult({
            hashId: cleanEmail + ' (Legacy)',
            ...docSnap.data()
          });
        } else {
          setError('No user found for this email');
        }
      }
    } catch (err) {
      console.error(err);
      setError('Connection failed');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-[100dvh] bg-[#F2F2F7] dark:bg-black font-sans z-[9999] relative flex flex-col items-center">
        <div className={`w-full max-w-md pt-32 px-4 ${isShaking ? 'animate-shake' : ''}`}>
          <div className="flex flex-col items-center mb-8">
            <ShieldCheck className="w-16 h-16 text-[#007AFF] mb-4" strokeWidth={1.5} />
            <h1 className="text-[28px] font-semibold tracking-tight text-black dark:text-white">Admin Recovery</h1>
            <p className="text-[15px] text-[#8E8E93] mt-2 text-center">Enter your master passcode to access user recovery keys.</p>
          </div>

          <form onSubmit={handleLogin} className="w-full">
            <div className="bg-white dark:bg-[#1C1C1E] rounded-[10px] overflow-hidden mb-6">
              <input
                type="password"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="Passcode"
                className="w-full h-12 px-4 text-[17px] bg-transparent text-black dark:text-white focus:outline-none"
                autoFocus
              />
            </div>
            
            {error && <p className="text-[#FF3B30] text-[13px] text-center mb-4">{error}</p>}
            
            <button
              type="submit"
              className="w-full bg-[#007AFF] text-white text-[17px] font-semibold h-[50px] rounded-[10px] active:bg-[#005bb5] transition-colors"
            >
              Unlock
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-[#F2F2F7] dark:bg-black text-black dark:text-white font-sans z-[9999] relative">
      {/* iOS Navigation Bar */}
      <div className="pt-12 px-4 pb-2 bg-[#F2F2F7]/80 dark:bg-black/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="flex items-center justify-between mb-4">
          <button 
            onClick={() => setIsAuthenticated(false)}
            className="flex items-center text-[#007AFF] text-[17px]"
          >
            <ChevronLeft className="w-5 h-5 -ml-1" />
            Lock
          </button>
        </div>
        <h1 className="text-[34px] font-bold tracking-tight">Recovery</h1>
      </div>

      <div className="max-w-3xl mx-auto px-4 pb-12 pt-4">
        {/* iOS Search Bar */}
        <form onSubmit={handleSearch} className="mb-8">
          <div className="flex gap-3">
            <div className="flex-1 bg-[#E3E3E8] dark:bg-[#1C1C1E] rounded-[10px] h-9 flex items-center px-2">
              <Search className="w-4 h-4 text-[#8E8E93] mr-1.5" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Search by email..."
                className="w-full bg-transparent text-[17px] text-black dark:text-white placeholder-[#8E8E93] focus:outline-none"
              />
            </div>
            <button 
              type="submit"
              disabled={loading}
              className="text-[#007AFF] text-[17px] font-medium disabled:opacity-50"
            >
              {loading ? 'Searching' : 'Search'}
            </button>
          </div>
        </form>

        {error && (
          <p className="text-[#FF3B30] text-[15px] px-4 mb-6">{error}</p>
        )}

        {result && (
          <div className="animate-fade-in">
            <h2 className="text-[13px] font-semibold text-[#8E8E93] uppercase tracking-wide ml-4 mb-2">Vault Credentials</h2>
            <div className="bg-white dark:bg-[#1C1C1E] rounded-[10px] overflow-hidden mb-8">
              
              {/* Row 1: Key */}
              <div className="flex items-center justify-between py-3 pr-4 pl-4 border-b border-[#C6C6C8]/50 dark:border-[#38383A]">
                <div className="flex flex-col">
                  <span className="text-[17px]">Sync PIN</span>
                  <span className="text-[15px] text-[#8E8E93] font-mono tracking-wider mt-0.5">{result.vaultKey}</span>
                </div>
                <button
                  onClick={() => copyToClipboard(result.vaultKey)}
                  className="w-8 h-8 rounded-full bg-[#E3E3E8] dark:bg-[#2C2C2E] flex items-center justify-center active:opacity-70 transition-opacity"
                >
                  {copied ? <Check className="w-4 h-4 text-[#34C759]" /> : <Copy className="w-4 h-4 text-[#007AFF]" />}
                </button>
              </div>

              {/* Row 2: Hash ID */}
              <div className="flex flex-col py-3 px-4">
                <span className="text-[17px]">Database ID</span>
                <span className="text-[13px] text-[#8E8E93] font-mono mt-1 break-all">{result.hashId}</span>
              </div>
            </div>

            <h2 className="text-[13px] font-semibold text-[#8E8E93] uppercase tracking-wide ml-4 mb-2">Device Info</h2>
            <div className="bg-white dark:bg-[#1C1C1E] rounded-[10px] overflow-hidden">
              
              {/* Row 1: OS */}
              <div className="flex items-center justify-between py-3 px-4 border-b border-[#C6C6C8]/50 dark:border-[#38383A]">
                <span className="text-[17px]">Operating System</span>
                <span className="text-[17px] text-[#8E8E93]">{result.deviceOS || 'Unknown'}</span>
              </div>

              {/* Row 2: Browser */}
              <div className="flex items-center justify-between py-3 px-4 border-b border-[#C6C6C8]/50 dark:border-[#38383A]">
                <span className="text-[17px]">Browser</span>
                <span className="text-[17px] text-[#8E8E93]">{result.deviceBrowser || 'Unknown'}</span>
              </div>

              {/* Row 3: Last Active */}
              <div className="flex items-center justify-between py-3 px-4">
                <span className="text-[17px]">Last Active</span>
                <span className="text-[17px] text-[#8E8E93]">
                  {result.lastActive ? new Date(result.lastActive.toDate()).toLocaleDateString() : 'Never'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
