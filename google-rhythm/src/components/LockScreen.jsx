import React, { useState, useEffect, useCallback } from 'react';
import { Fingerprint, Lock, Delete, ShieldCheck, AlertCircle } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { hashString } from '../services/crypto';

export default function LockScreen() {
  const { userPrefs, setUnlocked } = useAppStore();
  const { lockPin, isBiometricEnabled, name } = userPrefs;

  const [enteredPin, setEnteredPin] = useState('');
  const [error, setError] = useState('');
  const [isShaking, setIsShaking] = useState(false);
  const [biometricAttempted, setBiometricAttempted] = useState(false);

  const PIN_LENGTH = 4;

  // Attempt biometric auth on mount
  useEffect(() => {
    if (isBiometricEnabled && !biometricAttempted) {
      attemptBiometric();
    }
  }, [isBiometricEnabled, biometricAttempted]);

  const attemptBiometric = async () => {
    setBiometricAttempted(true);
    try {
      if (!window.PublicKeyCredential) return;

      const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      if (!available) return;

      // Retrieve the credential ID from localStorage
      const storedCredId = localStorage.getItem('google-rhythm-biometric-cred');
      if (!storedCredId) return;

      const credentialId = Uint8Array.from(atob(storedCredId), c => c.charCodeAt(0));

      const assertion = await navigator.credentials.get({
        publicKey: {
          challenge: crypto.getRandomValues(new Uint8Array(32)),
          rpId: window.location.hostname,
          allowCredentials: [{
            type: 'public-key',
            id: credentialId,
            transports: ['internal'],
          }],
          userVerification: 'required',
          timeout: 60000,
        },
      });

      if (assertion) {
        setUnlocked(true);
      }
    } catch (e) {
      console.log('Biometric auth cancelled or failed:', e.message);
      // User cancelled or not available — fall back to PIN silently
    }
  };

  const handleDigit = useCallback((digit) => {
    if (enteredPin.length >= PIN_LENGTH) return;
    
    const newPin = enteredPin + digit;
    setEnteredPin(newPin);
    setError('');

    if (newPin.length === PIN_LENGTH) {
      hashString(newPin).then(hashed => {
        if (hashed === lockPin) {
          // Correct! Unlock
          setUnlocked(true);
        } else {
          // Wrong PIN
          setIsShaking(true);
          setError('Incorrect PIN');
          setTimeout(() => {
            setEnteredPin('');
            setIsShaking(false);
          }, 600);
        }
      });
    }
  }, [enteredPin, lockPin, setUnlocked]);

  const handleDelete = useCallback(() => {
    setEnteredPin(prev => prev.slice(0, -1));
    setError('');
  }, []);

  // Keyboard support
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key >= '0' && e.key <= '9') {
        handleDigit(e.key);
      } else if (e.key === 'Backspace') {
        handleDelete();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleDigit, handleDelete]);

  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? 'Good Morning' : currentHour < 17 ? 'Good Afternoon' : 'Good Evening';

  return (
    <div className="fixed inset-0 z-[1000] flex flex-col items-center justify-between bg-gradient-to-b from-[#0a0a0a] via-[#111827] to-[#0a0a0a] select-none">
      
      {/* Top Section — Greeting */}
      <div className="flex flex-col items-center pt-20">
        <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center mb-5 border border-white/10">
          <Lock className="w-7 h-7 text-white/70" />
        </div>
        <p className="text-white/50 text-sm font-medium tracking-wide">{greeting}</p>
        <h1 className="text-white text-2xl font-bold mt-1 tracking-tight">
          {name || 'Welcome Back'}
        </h1>
      </div>

      {/* Middle — PIN Dots */}
      <div className="flex flex-col items-center gap-6">
        <div className={`flex gap-4 ${isShaking ? 'animate-shake' : ''}`}>
          {Array.from({ length: PIN_LENGTH }).map((_, i) => (
            <div
              key={i}
              className={`w-3.5 h-3.5 rounded-full transition-all duration-200 ${
                i < enteredPin.length
                  ? error ? 'bg-red-500 scale-125' : 'bg-white scale-125'
                  : 'bg-white/20'
              }`}
            />
          ))}
        </div>
        {error && (
          <div className="flex items-center gap-2 text-red-400 text-sm font-medium animate-fade-in">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}
        <p className="text-white/30 text-xs">Enter your 4-digit PIN</p>
      </div>

      {/* Bottom — Number Pad */}
      <div className="pb-12 w-full max-w-[300px] px-6">
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
            <button
              key={num}
              onClick={() => handleDigit(String(num))}
              className="w-full aspect-square rounded-full bg-white/10 hover:bg-white/20 active:bg-white/30 text-white text-2xl font-semibold transition-all duration-150 flex items-center justify-center backdrop-blur-sm active:scale-90"
            >
              {num}
            </button>
          ))}
          
          {/* Bottom row: Biometric / 0 / Delete */}
          <button
            onClick={isBiometricEnabled ? attemptBiometric : undefined}
            className={`w-full aspect-square rounded-full flex items-center justify-center transition-all duration-150 ${
              isBiometricEnabled
                ? 'bg-white/10 hover:bg-white/20 active:bg-white/30 active:scale-90'
                : 'opacity-0 cursor-default'
            }`}
          >
            {isBiometricEnabled && <Fingerprint className="w-7 h-7 text-[#8ab4f8]" />}
          </button>
          
          <button
            onClick={() => handleDigit('0')}
            className="w-full aspect-square rounded-full bg-white/10 hover:bg-white/20 active:bg-white/30 text-white text-2xl font-semibold transition-all duration-150 flex items-center justify-center backdrop-blur-sm active:scale-90"
          >
            0
          </button>

          <button
            onClick={handleDelete}
            className="w-full aspect-square rounded-full flex items-center justify-center hover:bg-white/10 active:bg-white/20 transition-all duration-150 active:scale-90"
          >
            <Delete className="w-6 h-6 text-white/60" />
          </button>
        </div>
      </div>
    </div>
  );
}
