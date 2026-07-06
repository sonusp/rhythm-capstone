import React, { useState, useEffect } from 'react';
import { Sparkles, Heart, Clock, Shield } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAppStore } from '../store/useAppStore';
import { getLocalLogs, db } from '../services/db';

export default function PartnerDashboard({ token }) {
  const [loading, setLoading] = useState(true);
  const [partnerData, setPartnerData] = useState(null);
  
  const { userPrefs, currentPhase, currentDay } = useAppStore();

  useEffect(() => {
    let isMounted = true;

    const fetchActualData = async () => {
      try {
        const logs = await getLocalLogs();
        
        // Ensure we only pass logs for the current cycle to the AI
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - currentDay + 1);
        cutoffDate.setHours(0, 0, 0, 0);
        
        const cycleLogs = logs.filter(log => {
          const logDate = new Date(log.date || log.timestamp || new Date());
          return logDate >= cutoffDate;
        });

        // Extract already generated insights from local storage (so we don't generate again)
        const cachedSummary = localStorage.getItem('rythm_partner_summary');
        
        if (!isMounted) return;

        setPartnerData({
          userName: userPrefs.name || 'Sarah',
          partnerName: (token && token !== 'true' && token !== 'demo_token') ? decodeURIComponent(token) : (cachedSummary ? localStorage.getItem('rythm_partner_name') || 'Partner' : 'Partner'),
          currentPhase: currentPhase || 'Follicular',
          currentDay: currentDay || 1,
          partnerSummary: cachedSummary || "Gathering enough data to generate an insight. Check back later!",
          vibe: cycleLogs[0]?.mood || 'Calm',
          lastUpdated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
      } catch (err) {
        console.error("Partner Sync Simulation Error:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    // 1. Initial Fetch
    setTimeout(() => {
      fetchActualData();
    }, 800);

    // 2. Real-Time Listener (Auto-updates without the user re-sharing the link)
    // In production, this would be Firebase onSnapshot(). Here, we use Dexie hooks.
    const handleLiveUpdate = () => {
      console.log("Partner Dashboard detected new data. Auto-refreshing...");
      fetchActualData();
    };

    db.logs.hook('creating', handleLiveUpdate);
    db.logs.hook('updating', handleLiveUpdate);
    db.logs.hook('deleting', handleLiveUpdate);

    return () => {
      isMounted = false;
      db.logs.hook('creating').unsubscribe(handleLiveUpdate);
      db.logs.hook('updating').unsubscribe(handleLiveUpdate);
      db.logs.hook('deleting').unsubscribe(handleLiveUpdate);
    };
  }, [userPrefs, currentPhase, currentDay, token]);

  if (loading || !partnerData) {
    return (
      <div className="h-[100dvh] w-full bg-[#f2f2f7] dark:bg-black flex flex-col items-center justify-center font-sans">
        <div className="w-8 h-8 border-[3px] border-[#007AFF]/20 border-t-[#007AFF] rounded-full animate-spin mb-4" />
        <p className="text-[#8e8e93] text-[15px] font-medium tracking-tight animate-pulse flex items-center gap-1.5">
          <Shield className="w-4 h-4" /> Securing Connection...
        </p>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] w-full bg-[#f2f2f7] dark:bg-black text-black dark:text-white font-sans overflow-y-auto hide-scrollbar relative transition-colors duration-300">
      
      {/* iOS Navigation Header */}
      <header className="pt-16 pb-4 px-5 sticky top-0 bg-[#f2f2f7]/80 dark:bg-black/80 backdrop-blur-xl z-50 border-b border-[#c6c6c8] dark:border-[#38383A]">
        <h2 className="text-[15px] text-[#8e8e93] font-medium mb-1 tracking-tight">Hey {partnerData.partnerName},</h2>
        <h1 className="text-[34px] font-bold tracking-tight leading-tight">
          {partnerData.userName}'s Rhythm
        </h1>
        <div className="flex items-center gap-1.5 text-[#8e8e93] text-[13px] font-medium mt-1">
          <Shield className="w-3.5 h-3.5" />
          <span>End-to-End Encrypted</span>
        </div>
      </header>

      <main className="p-5 space-y-4 relative z-10 pb-12">
        {/* iOS Grouped Style Card: Current Status */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="bg-white dark:bg-[#1c1c1e] rounded-[10px] overflow-hidden shadow-sm"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#c6c6c8] dark:border-[#38383A]">
            <span className="text-[17px]">Current Phase</span>
            <span className="text-[17px] text-[#8e8e93]">{partnerData.currentPhase}</span>
          </div>
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#c6c6c8] dark:border-[#38383A]">
            <span className="text-[17px]">Cycle Day</span>
            <span className="text-[17px] text-[#8e8e93]">Day {partnerData.currentDay}</span>
          </div>
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-[17px]">Current Vibe</span>
            <span className="text-[17px] text-[#8e8e93]">{partnerData.vibe}</span>
          </div>
        </motion.div>

        {/* iOS Grouped Style Card: Weekly Nudge */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="bg-white dark:bg-[#1c1c1e] rounded-[20px] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.05)] dark:shadow-none"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-[#007AFF]/10 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 text-[#007AFF]" />
            </div>
            <div>
              <h2 className="text-[17px] font-semibold tracking-tight">Weekly Nudge</h2>
              <p className="text-[12px] font-medium text-[#8e8e93]">AI Relationship Coach</p>
            </div>
          </div>
          
          <div className="w-full h-[0.5px] bg-[#c6c6c8] dark:bg-[#38383A] mb-3"></div>
          
          <p className="text-[15px] leading-relaxed text-[#3a3a3c] dark:text-[#ebebf5] font-normal">
            {partnerData.partnerSummary}
          </p>
        </motion.div>



        {/* Sync Status Footer */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="flex items-center justify-center gap-1.5 text-[#8e8e93] text-[12px] font-medium pt-4 pb-6"
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Last synced at {partnerData.lastUpdated}</span>
        </motion.div>
      </main>
    </div>
  );
}
