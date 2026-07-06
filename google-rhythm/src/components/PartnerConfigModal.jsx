import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Share2, MessageSquare, CheckCircle, Shield, Link as LinkIcon } from 'lucide-react';

export default function PartnerConfigModal({ onClose, onSuccess }) {
  const [step, setStep] = useState(1);
  const [partnerName, setPartnerName] = useState('');
  const [partnerEmail, setPartnerEmail] = useState('');
  
  const [perms, setPerms] = useState({
    phase: true, // Recommended
    mood: true,
    nudge: true,
    symptoms: false
  });

  const [copied, setCopied] = useState(false);
  
  // Use window.location.origin to get the base URL, fallback if not available
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : "https://google-rhythm.vercel.app";
  const magicLink = `${baseUrl}/?partner=${encodeURIComponent(partnerName || 'Alex')}`;

  const handleNext = () => {
    if (step === 1 && (!partnerName || !partnerEmail)) return;
    setStep(step + 1);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(`View my Rythm dashboard: ${magicLink}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const finishSetup = () => {
    localStorage.setItem('rythm_partner_name', partnerName);
    localStorage.setItem('rythm_partner_email', partnerEmail);
    onSuccess();
    onClose();
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: '100%' }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: '100%' }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="fixed inset-0 z-50 flex flex-col bg-[#f2f2f7] dark:bg-black overflow-y-auto"
    >
      <header className="sticky top-0 bg-[#f2f2f7]/80 dark:bg-black/80 backdrop-blur-xl z-10 px-4 py-4 flex items-center justify-between border-b border-[#c6c6c8] dark:border-[#38383A]">
        <button onClick={onClose} className="text-[#007AFF] text-[17px] font-normal">Cancel</button>
        <h2 className="text-[17px] font-semibold">Partner Sync</h2>
        {step < 3 ? (
          <button 
            onClick={handleNext}
            disabled={step === 1 && (!partnerName || !partnerEmail)}
            className="text-[#007AFF] text-[17px] font-semibold disabled:opacity-50"
          >
            Next
          </button>
        ) : (
          <button onClick={finishSetup} className="text-[#007AFF] text-[17px] font-semibold">Done</button>
        )}
      </header>

      <main className="flex-1 p-5 max-w-lg mx-auto w-full">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
              <div className="text-center mt-6 mb-8">
                <div className="w-16 h-16 bg-[#007AFF]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-8 h-8 text-[#007AFF]" />
                </div>
                <h1 className="text-[28px] font-bold tracking-tight mb-2">Partner Details</h1>
                <p className="text-[15px] text-[#8e8e93]">Who would you like to securely share your rhythm with?</p>
              </div>

              <div className="bg-white dark:bg-[#1c1c1e] rounded-[10px] overflow-hidden shadow-sm">
                <div className="flex items-center px-4 py-3 border-b border-[#c6c6c8] dark:border-[#38383A]">
                  <span className="w-20 text-[17px]">Name</span>
                  <input 
                    type="text" 
                    value={partnerName}
                    onChange={e => setPartnerName(e.target.value)}
                    placeholder="e.g., Alex" 
                    className="flex-1 bg-transparent outline-none text-[17px] placeholder:text-[#c7c7cc]" 
                  />
                </div>
                <div className="flex items-center px-4 py-3">
                  <span className="w-20 text-[17px]">Email</span>
                  <input 
                    type="email" 
                    value={partnerEmail}
                    onChange={e => setPartnerEmail(e.target.value)}
                    placeholder="partner@example.com" 
                    className="flex-1 bg-transparent outline-none text-[17px] placeholder:text-[#c7c7cc]" 
                  />
                </div>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
              <div className="text-center mt-6 mb-8">
                <h1 className="text-[28px] font-bold tracking-tight mb-2">Permissions</h1>
                <p className="text-[15px] text-[#8e8e93]">Choose exactly what {partnerName || 'your partner'} can see. You can revoke this anytime.</p>
              </div>

              <div className="bg-white dark:bg-[#1c1c1e] rounded-[10px] overflow-hidden shadow-sm">
                <ToggleRow label="Cycle Phase & Readiness" desc="Recommended" checked={perms.phase} onChange={() => setPerms({...perms, phase: !perms.phase})} hasBorder />
                <ToggleRow label="Daily Moods & Energy" desc="Shared instantly" checked={perms.mood} onChange={() => setPerms({...perms, mood: !perms.mood})} hasBorder />
                <ToggleRow label="AI Partner Digest" desc="The Weekly Nudge" checked={perms.nudge} onChange={() => setPerms({...perms, nudge: !perms.nudge})} hasBorder />
                <ToggleRow label="Specific Symptoms" desc="Optional" checked={perms.symptoms} onChange={() => setPerms({...perms, symptoms: !perms.symptoms})} />
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
              <div className="text-center mt-6 mb-8">
                <div className="w-20 h-20 bg-[#34C759]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-10 h-10 text-[#34C759]" />
                </div>
                <h1 className="text-[28px] font-bold tracking-tight mb-2">Secure Link Ready</h1>
                <p className="text-[15px] text-[#8e8e93]">Send this one-time secure link to {partnerName}. It will expire in 24 hours.</p>
              </div>

              <div className="bg-white dark:bg-[#1c1c1e] rounded-[10px] p-4 flex items-center gap-3 shadow-sm">
                <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center shrink-0">
                  <LinkIcon className="w-5 h-5 text-blue-500" />
                </div>
                <div className="flex-1 truncate">
                  <p className="text-[15px] font-semibold truncate">{magicLink}</p>
                </div>
              </div>

              <div className="flex flex-col gap-3 mt-6">
                <button onClick={handleCopy} className="w-full bg-[#007AFF] text-white rounded-[14px] py-3.5 font-semibold text-[17px] flex items-center justify-center gap-2">
                  {copied ? <CheckCircle className="w-5 h-5" /> : <Share2 className="w-5 h-5" />}
                  {copied ? 'Copied to Clipboard' : 'Copy Secure Link'}
                </button>
                <button onClick={() => window.location.href = `sms:?&body=${encodeURIComponent("View my secure Rythm dashboard: " + magicLink)}`} className="w-full bg-white dark:bg-[#1c1c1e] text-[#007AFF] rounded-[14px] py-3.5 font-semibold text-[17px] flex items-center justify-center gap-2 shadow-sm">
                  <MessageSquare className="w-5 h-5" />
                  Send via iMessage
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </motion.div>
  );
}

function ToggleRow({ label, desc, checked, onChange, hasBorder }) {
  return (
    <div className={`flex items-center justify-between px-4 py-3 ${hasBorder ? 'border-b border-[#c6c6c8] dark:border-[#38383A]' : ''}`}>
      <div>
        <p className="text-[17px]">{label}</p>
        <p className="text-[13px] text-[#8e8e93] mt-0.5">{desc}</p>
      </div>
      <button 
        onClick={onChange}
        className={`w-[51px] h-[31px] rounded-full transition-colors duration-300 ease-in-out relative shrink-0 ${checked ? 'bg-[#34C759]' : 'bg-[#E9E9EA] dark:bg-[#39393D]'}`}
      >
        <div className={`w-[27px] h-[27px] bg-white rounded-full absolute top-[2px] left-[2px] shadow-[0_2px_5px_rgba(0,0,0,0.2)] transition-transform duration-300 ease-in-out ${checked ? 'translate-x-[20px]' : 'translate-x-0'}`} />
      </button>
    </div>
  );
}
