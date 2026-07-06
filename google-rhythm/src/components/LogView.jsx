import React, { useState } from 'react';
import { 
  Moon, Droplets, Zap, Activity, Coffee, Heart, 
  Wind, Sparkles, Flame, EyeOff, Frown, Utensils, Cloud, AlertCircle,
  Loader2, CheckCircle2, Footprints, Mic
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { saveLogLocally } from '../services/db';

// ─── Sub-components ──────────────────────────────────────────────────────────

function LogButton({ icon, label, isActive, onClick, colorClass, activeBg }) {
  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center gap-2 p-3 rounded-[24px] border-[0.5px] transition-all duration-300 backdrop-saturate-[1.8] backdrop-blur-[20px] ${isActive ? `${activeBg} ${colorClass} border-transparent shadow-inner scale-[0.98]` : 'bg-white/40 dark:bg-white/5 border-white/40 dark:border-white/10 text-[#444746] dark:text-[#c4c7c5] hover:bg-white/60 dark:hover:bg-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.05)] hover:-translate-y-0.5'}`}
    >
      <div className="flex items-center justify-center h-8 w-8">
        {icon}
      </div>
      <span className="text-[13px] font-medium leading-tight">{label}</span>
    </button>
  );
}

function SelectableCard({ icon, label, selected, onClick, colorClass = 'text-[#0b57d0] dark:text-[#a8c7fa]', activeBg = 'bg-[#d3e3fd] dark:bg-[#004a77]' }) {
  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center gap-3 p-4 rounded-[28px] border-[0.5px] transition-all duration-300 backdrop-saturate-[1.8] backdrop-blur-[20px] ${selected ? `${activeBg} ${colorClass} border-transparent shadow-inner scale-[0.98]` : 'bg-white/40 dark:bg-white/5 border-white/40 dark:border-white/10 text-[#444746] dark:text-[#c4c7c5] hover:bg-white/60 dark:hover:bg-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.05)] hover:-translate-y-0.5'}`}
    >
      <div className="flex items-center justify-center h-10 w-10 rounded-full bg-white/50 dark:bg-black/20">
        {React.cloneElement(icon, { className: `w-6 h-6 ${selected ? colorClass : 'text-[#444746] dark:text-[#c4c7c5]'}` })}
      </div>
      <span className="text-[13px] font-medium leading-tight text-center">{label}</span>
    </button>
  );
}

// Local storage helpers removed. Using IndexedDB via Dexie instead.

// ─── Main component ───────────────────────────────────────────────────────────

/** Save-button states: 'idle' | 'saving' | 'saved' */

export default function LogView() {
  const { userPrefs } = useAppStore();
  const lifecycleMode = userPrefs?.lifecycleMode || 'cycle';

  const [selectedFlow, setSelectedFlow]       = useState('none');
  const [selectedSecondary, setSelectedSecondary] = useState('none');
  const [selectedSleep, setSelectedSleep]     = useState('none');
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  
  // Pain Scale State
  const [painScore, setPainScore]             = useState(5);
  const [painImpacts, setPainImpacts]         = useState([]);
  const [medsHelped, setMedsHelped]           = useState('');
  const [giSymptoms, setGiSymptoms]           = useState([]);

  const [saveState, setSaveState]             = useState('idle'); // 'idle' | 'saving' | 'saved'
  const [showToast, setShowToast]             = useState(false);
  const [isListening, setIsListening]         = useState(false);

  const painRelatedSymptoms = ['cramps', 'headache', 'backache', 'pelvic_pain', 'joint_pain'];
  const hasPainSymptom = selectedSymptoms.some(s => painRelatedSymptoms.includes(s));

  const getPainColor = (score) => {
    if (score <= 3) return '#00796b'; // M3 Teal
    if (score <= 6) return '#f57c00'; // M3 Orange
    if (score <= 8) return '#d81b60'; // M3 Pink/Rose
    return '#c5221f'; // M3 Crimson
  };

  const getPainLabel = (score) => {
    if (score <= 3) return 'Mild Discomfort';
    if (score <= 6) return 'Distracting';
    if (score <= 8) return 'Severe';
    return 'Agonizing';
  };

  const handleVoiceLog = async () => {
    setIsListening(true);
    // Simulate Speech-to-Text delay
    await new Promise(r => setTimeout(r, 2000));
    
    // In a real app, we'd pass the transcript to NIM AI to map it to tags.
    // For now, let's mock NIM AI successfully parsing the user's voice into structured tags.
    setSelectedSymptoms(prev => Array.from(new Set([...prev, 'Headache', 'Bloating', 'Low Sleep'])));
    
    setIsListening(false);
    // Automatically trigger save after voice parse
    setTimeout(() => {
      handleSave();
    }, 500);
  };

  const toggleSymptom = (symp) => {
    setSelectedSymptoms(prev =>
      prev.includes(symp) ? prev.filter(s => s !== symp) : [...prev, symp]
    );
  };

  const handleSave = async () => {
    if (saveState !== 'idle') return; // prevent double-tap

    setSaveState('saving');

    const logEntry = {
      date:     new Date().toISOString().slice(0, 10), // YYYY-MM-DD
      mode:     lifecycleMode,
      flow:     selectedFlow,
      secondary: selectedSecondary,
      sleep:    selectedSleep,
      symptoms: selectedSymptoms,
      giSymptoms: giSymptoms,
      painDetails: hasPainSymptom ? {
        score: painScore,
        impacts: painImpacts,
        medsHelped: medsHelped
      } : null,
      savedAt:  new Date().toISOString(),
    };

    try {
      // 1. Save strictly locally via Dexie (Local-First Architecture)
      await saveLogLocally(logEntry);

      // 3. Show success states
      setSaveState('saved');
      setShowToast(true);

      // 4. Reset button after 2 s
      setTimeout(() => {
        setSaveState('idle');
      }, 2000);

      // 5. Hide toast after 2 s
      setTimeout(() => {
        setShowToast(false);
      }, 2000);
    } catch (err) {
      console.error("Failed to save log:", err);
      setSaveState('idle');
      alert("Error saving log locally. See console for details.");
    }

    // 6. Reset form
    setSelectedFlow('none');
    setSelectedSecondary('none');
    setSelectedSleep('none');
    setSelectedSymptoms([]);
    setPainScore(5);
    setPainImpacts([]);
    setMedsHelped('');
    setGiSymptoms([]);
  };

  // ── Button label / icon based on state ──
  const buttonContent = () => {
    if (saveState === 'saving') {
      return (
        <>
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Saving…</span>
        </>
      );
    }
    if (saveState === 'saved') {
      return (
        <>
          <CheckCircle2 className="w-5 h-5" />
          <span>Saved ✓</span>
        </>
      );
    }
    return <span>Save Log</span>;
  };

  const buttonColors =
    saveState === 'saved'
      ? 'bg-green-500 dark:bg-green-400 text-white dark:text-[#121212]'
      : 'bg-[#4285f4] dark:bg-[#8ab4f8] text-white dark:text-[#121212]';

  return (
    <div className="relative px-6 pt-4 space-y-8 animate-fade-in pb-32">
      {/* ── Header M3 ── */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[28px] font-medium tracking-tight text-[#1f1f1f] dark:text-[#e3e3e3]">Daily Log</h2>
        <span className="px-4 py-1.5 bg-[#d3e3fd] dark:bg-[#004a77] text-[#041e49] dark:text-[#c2e7ff] rounded-full text-[13px] font-bold tracking-widest uppercase shadow-sm">Today</span>
      </div>

      {/* ── Dynamic Main Tracking ── */}
      {(lifecycleMode === 'pregnancy' || lifecycleMode === 'postpartum') ? (
        <section>
          <h3 className="text-sm font-bold text-[#0b57d0] dark:text-[#a8c7fa] uppercase tracking-wider mb-4">Fetal Movement</h3>
          <div className="grid grid-cols-4 gap-3">
            <LogButton icon={<Moon />} label="None"   isActive={selectedFlow === 'none'}   onClick={() => setSelectedFlow('none')}   colorClass="text-[#444746] dark:text-[#c4c7c5]" activeBg="bg-[#e1e5e9] dark:bg-[#2a2a2a]" />
            <LogButton icon={<Footprints className="w-5 h-5 opacity-50" />} label="Light"  isActive={selectedFlow === 'light'}  onClick={() => setSelectedFlow('light')}  colorClass="text-[#ba1a1a] dark:text-[#ffb4ab]" activeBg="bg-[#ffdad6] dark:bg-[#93000a]" />
            <LogButton icon={<Footprints className="w-5 h-5 opacity-75" />} label="Active" isActive={selectedFlow === 'medium'} onClick={() => setSelectedFlow('medium')} colorClass="text-[#ba1a1a] dark:text-[#ffb4ab]" activeBg="bg-[#ffdad6] dark:bg-[#93000a]" />
            <LogButton icon={<Footprints className="w-5 h-5" />}            label="Heavy"  isActive={selectedFlow === 'heavy'}  onClick={() => setSelectedFlow('heavy')}  colorClass="text-white dark:text-[#ffdad6]" activeBg="bg-[#ba1a1a] dark:bg-[#410002]" />
          </div>
        </section>
      ) : lifecycleMode === 'perimenopause' ? (
        <section className="space-y-6">
          <div>
            <h3 className="text-sm font-bold text-[#0b57d0] dark:text-[#a8c7fa] uppercase tracking-wider mb-4">Irregular Bleeding</h3>
            <div className="grid grid-cols-4 gap-3">
              <LogButton icon={<Moon />} label="None"   isActive={selectedFlow === 'none'}   onClick={() => setSelectedFlow('none')}   colorClass="text-[#444746] dark:text-[#c4c7c5]" activeBg="bg-[#e1e5e9] dark:bg-[#2a2a2a]" />
              <LogButton icon={<Droplets className="w-5 h-5 opacity-50" />} label="Spotting"  isActive={selectedFlow === 'light'}  onClick={() => setSelectedFlow('light')}  colorClass="text-[#ba1a1a] dark:text-[#ffb4ab]" activeBg="bg-[#ffdad6] dark:bg-[#93000a]" />
              <LogButton icon={<Droplets className="w-5 h-5 opacity-75" />} label="Medium" isActive={selectedFlow === 'medium'} onClick={() => setSelectedFlow('medium')} colorClass="text-[#ba1a1a] dark:text-[#ffb4ab]" activeBg="bg-[#ffdad6] dark:bg-[#93000a]" />
              <LogButton icon={<Droplets className="w-5 h-5" />}            label="Heavy"  isActive={selectedFlow === 'heavy'}  onClick={() => setSelectedFlow('heavy')}  colorClass="text-white dark:text-[#ffdad6]" activeBg="bg-[#ba1a1a] dark:bg-[#410002]" />
            </div>
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#0b57d0] dark:text-[#a8c7fa] uppercase tracking-wider mb-4">Hot Flashes</h3>
            <div className="grid grid-cols-4 gap-3">
              <LogButton icon={<Moon />} label="None"   isActive={selectedSecondary === 'none'}   onClick={() => setSelectedSecondary('none')}   colorClass="text-[#444746] dark:text-[#c4c7c5]" activeBg="bg-[#e1e5e9] dark:bg-[#2a2a2a]" />
              <LogButton icon={<Flame className="w-5 h-5 opacity-50" />} label="Mild"  isActive={selectedSecondary === 'mild'}  onClick={() => setSelectedSecondary('mild')}  colorClass="text-[#984061] dark:text-[#ffd9e2]" activeBg="bg-[#ffd9e2] dark:bg-[#7d2949]" />
              <LogButton icon={<Flame className="w-5 h-5 opacity-75" />} label="Mod" isActive={selectedSecondary === 'medium'} onClick={() => setSelectedSecondary('medium')} colorClass="text-[#984061] dark:text-[#ffd9e2]" activeBg="bg-[#ffd9e2] dark:bg-[#7d2949]" />
              <LogButton icon={<Flame className="w-5 h-5" />}            label="Severe"  isActive={selectedSecondary === 'severe'}  onClick={() => setSelectedSecondary('severe')}  colorClass="text-white dark:text-[#ffd9e2]" activeBg="bg-[#984061] dark:bg-[#631133]" />
            </div>
          </div>
        </section>
      ) : (
        <section>
          <h3 className="text-sm font-bold text-[#0b57d0] dark:text-[#a8c7fa] uppercase tracking-wider mb-4">Bleeding &amp; Flow</h3>
          <div className="grid grid-cols-4 gap-3">
            <LogButton icon={<Moon />} label="None"   isActive={selectedFlow === 'none'}   onClick={() => setSelectedFlow('none')}   colorClass="text-[#444746] dark:text-[#c4c7c5]" activeBg="bg-[#e1e5e9] dark:bg-[#2a2a2a]" />
            <LogButton icon={<Droplets className="w-5 h-5 opacity-50" />} label="Light"  isActive={selectedFlow === 'light'}  onClick={() => setSelectedFlow('light')}  colorClass="text-[#ba1a1a] dark:text-[#ffb4ab]" activeBg="bg-[#ffdad6] dark:bg-[#93000a]" />
            <LogButton icon={<Droplets className="w-5 h-5 opacity-75" />} label="Medium" isActive={selectedFlow === 'medium'} onClick={() => setSelectedFlow('medium')} colorClass="text-[#ba1a1a] dark:text-[#ffb4ab]" activeBg="bg-[#ffdad6] dark:bg-[#93000a]" />
            <LogButton icon={<Droplets className="w-5 h-5" />}            label="Heavy"  isActive={selectedFlow === 'heavy'}  onClick={() => setSelectedFlow('heavy')}  colorClass="text-white dark:text-[#ffdad6]" activeBg="bg-[#ba1a1a] dark:bg-[#410002]" />
          </div>
        </section>
      )}

      {/* ── Sleep Quality (Unified) ── */}
      <section>
        <h3 className="text-sm font-bold text-[#0b57d0] dark:text-[#a8c7fa] uppercase tracking-wider mb-4">Sleep Quality</h3>
        <div className="grid grid-cols-4 gap-3">
          <LogButton icon={<Moon className="w-5 h-5 opacity-40" />} label="Poor"   isActive={selectedSleep === 'poor'}   onClick={() => setSelectedSleep('poor')}   colorClass="text-[#6750a4] dark:text-[#d0bcff]" activeBg="bg-[#eaddff] dark:bg-[#4f378b]" />
          <LogButton icon={<Moon className="w-5 h-5 opacity-70" />} label="Fair"   isActive={selectedSleep === 'fair'}   onClick={() => setSelectedSleep('fair')}   colorClass="text-[#6750a4] dark:text-[#d0bcff]" activeBg="bg-[#eaddff] dark:bg-[#4f378b]" />
          <LogButton icon={<Moon className="w-5 h-5" />}            label="Good"   isActive={selectedSleep === 'good'}   onClick={() => setSelectedSleep('good')}   colorClass="text-[#6750a4] dark:text-[#d0bcff]" activeBg="bg-[#eaddff] dark:bg-[#4f378b]" />
          <LogButton icon={<Sparkles className="w-5 h-5" />}        label="Great"  isActive={selectedSleep === 'great'}  onClick={() => setSelectedSleep('great')}  colorClass="text-white dark:text-[#d0bcff]" activeBg="bg-[#6750a4] dark:bg-[#381e72]" />
        </div>
      </section>



      {/* ── Dynamic Symptoms Grid ── */}
      <section>
        <h3 className="text-sm font-bold text-[#0b57d0] dark:text-[#a8c7fa] uppercase tracking-wider mb-4">Symptoms</h3>
        {(lifecycleMode === 'pregnancy' || lifecycleMode === 'postpartum') ? (
          <div className="grid grid-cols-3 gap-3">
            <SelectableCard colorClass="text-[#984061] dark:text-[#ffd9e2]" activeBg="bg-[#ffd9e2] dark:bg-[#7d2949]" icon={<AlertCircle />} label="Nausea"    selected={selectedSymptoms.includes('nausea')}    onClick={() => toggleSymptom('nausea')} />
            <SelectableCard colorClass="text-[#0b57d0] dark:text-[#a8c7fa]" activeBg="bg-[#d3e3fd] dark:bg-[#004a77]" icon={<Coffee />}      label="Fatigue"   selected={selectedSymptoms.includes('fatigue')}   onClick={() => toggleSymptom('fatigue')} />
            <SelectableCard colorClass="text-[#ba1a1a] dark:text-[#ffb4ab]" activeBg="bg-[#ffdad6] dark:bg-[#93000a]" icon={<Flame />}       label="Heartburn" selected={selectedSymptoms.includes('heartburn')} onClick={() => toggleSymptom('heartburn')} />
            <SelectableCard colorClass="text-[#006874] dark:text-[#4fd8eb]" activeBg="bg-[#97f0ff] dark:bg-[#004f58]" icon={<Cloud />}       label="Swelling"  selected={selectedSymptoms.includes('swelling')}  onClick={() => toggleSymptom('swelling')} />
            <SelectableCard colorClass="text-[#984061] dark:text-[#ffd9e2]" activeBg="bg-[#ffd9e2] dark:bg-[#7d2949]" icon={<Heart />}       label="Tender"    selected={selectedSymptoms.includes('tender')}    onClick={() => toggleSymptom('tender')} />
            <SelectableCard colorClass="text-[#146c2e] dark:text-[#6dd58c]" activeBg="bg-[#c4eed0] dark:bg-[#0f5223]" icon={<Utensils />}    label="Cravings"  selected={selectedSymptoms.includes('cravings')}  onClick={() => toggleSymptom('cravings')} />
            <SelectableCard colorClass="text-[#006a60] dark:text-[#53d7c4]" activeBg="bg-[#73f4e0] dark:bg-[#005048]" icon={<Wind />}        label="Bloating"  selected={selectedSymptoms.includes('bloating')}  onClick={() => toggleSymptom('bloating')} />
            <SelectableCard colorClass="text-[#6750a4] dark:text-[#d0bcff]" activeBg="bg-[#eaddff] dark:bg-[#4f378b]" icon={<EyeOff />}      label="Insomnia"  selected={selectedSymptoms.includes('insomnia')}  onClick={() => toggleSymptom('insomnia')} />
            <SelectableCard colorClass="text-[#6750a4] dark:text-[#d0bcff]" activeBg="bg-[#eaddff] dark:bg-[#4f378b]" icon={<Frown />}       label="Mood"      selected={selectedSymptoms.includes('mood')}      onClick={() => toggleSymptom('mood')} />
            <SelectableCard colorClass="text-[#8c5000] dark:text-[#ffb870]" activeBg="bg-[#ffdcbd] dark:bg-[#6a3c00]" icon={<Activity />}    label="Backache"  selected={selectedSymptoms.includes('backache')}  onClick={() => toggleSymptom('backache')} />
            <SelectableCard colorClass="text-[#984061] dark:text-[#ffd9e2]" activeBg="bg-[#ffd9e2] dark:bg-[#7d2949]" icon={<Zap />}         label="Pelvic Pain" selected={selectedSymptoms.includes('pelvic_pain')} onClick={() => toggleSymptom('pelvic_pain')} />
            <SelectableCard colorClass="text-[#6750a4] dark:text-[#d0bcff]" activeBg="bg-[#eaddff] dark:bg-[#4f378b]" icon={<Sparkles />}    label="Headache"  selected={selectedSymptoms.includes('headache')}  onClick={() => toggleSymptom('headache')} />
          </div>
        ) : lifecycleMode === 'perimenopause' ? (
          <div className="grid grid-cols-3 gap-3">
            <SelectableCard colorClass="text-[#ba1a1a] dark:text-[#ffb4ab]" activeBg="bg-[#ffdad6] dark:bg-[#93000a]" icon={<Flame />}       label="Night Sweats" selected={selectedSymptoms.includes('night_sweats')} onClick={() => toggleSymptom('night_sweats')} />
            <SelectableCard colorClass="text-[#6750a4] dark:text-[#d0bcff]" activeBg="bg-[#eaddff] dark:bg-[#4f378b]" icon={<EyeOff />}      label="Insomnia"     selected={selectedSymptoms.includes('insomnia')}     onClick={() => toggleSymptom('insomnia')} />
            <SelectableCard colorClass="text-[#6750a4] dark:text-[#d0bcff]" activeBg="bg-[#eaddff] dark:bg-[#4f378b]" icon={<Frown />}       label="Mood"         selected={selectedSymptoms.includes('mood')}         onClick={() => toggleSymptom('mood')} />
            <SelectableCard colorClass="text-[#444746] dark:text-[#c4c7c5]" activeBg="bg-[#e1e5e9] dark:bg-[#2a2a2a]" icon={<Cloud />}       label="Brain Fog"    selected={selectedSymptoms.includes('brain_fog')}    onClick={() => toggleSymptom('brain_fog')} />
            <SelectableCard colorClass="text-[#8c5000] dark:text-[#ffb870]" activeBg="bg-[#ffdcbd] dark:bg-[#6a3c00]" icon={<AlertCircle />} label="Dizziness"    selected={selectedSymptoms.includes('dizziness')}    onClick={() => toggleSymptom('dizziness')} />
            <SelectableCard colorClass="text-[#0b57d0] dark:text-[#a8c7fa]" activeBg="bg-[#d3e3fd] dark:bg-[#004a77]" icon={<Coffee />}      label="Fatigue"      selected={selectedSymptoms.includes('fatigue')}      onClick={() => toggleSymptom('fatigue')} />
            <SelectableCard colorClass="text-[#984061] dark:text-[#ffd9e2]" activeBg="bg-[#ffd9e2] dark:bg-[#7d2949]" icon={<Heart />}       label="Palpitations" selected={selectedSymptoms.includes('palpitations')} onClick={() => toggleSymptom('palpitations')} />
            <SelectableCard colorClass="text-[#8c5000] dark:text-[#ffb870]" activeBg="bg-[#ffdcbd] dark:bg-[#6a3c00]" icon={<Activity />}    label="Joint Pain"   selected={selectedSymptoms.includes('joint_pain')}   onClick={() => toggleSymptom('joint_pain')} />
            <SelectableCard colorClass="text-[#006a60] dark:text-[#53d7c4]" activeBg="bg-[#73f4e0] dark:bg-[#005048]" icon={<Wind />}        label="Bloating"     selected={selectedSymptoms.includes('bloating')}     onClick={() => toggleSymptom('bloating')} />
            <SelectableCard colorClass="text-[#6750a4] dark:text-[#d0bcff]" activeBg="bg-[#eaddff] dark:bg-[#4f378b]" icon={<Zap />}         label="Headache"     selected={selectedSymptoms.includes('headache')}     onClick={() => toggleSymptom('headache')} />
            <SelectableCard colorClass="text-[#006874] dark:text-[#4fd8eb]" activeBg="bg-[#97f0ff] dark:bg-[#004f58]" icon={<Droplets className="opacity-60" />} label="Dryness" selected={selectedSymptoms.includes('dryness')} onClick={() => toggleSymptom('dryness')} />
            <SelectableCard colorClass="text-[#146c2e] dark:text-[#6dd58c]" activeBg="bg-[#c4eed0] dark:bg-[#0f5223]" icon={<Utensils />}    label="Cravings"     selected={selectedSymptoms.includes('cravings')}     onClick={() => toggleSymptom('cravings')} />
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            <SelectableCard colorClass="text-[#ba1a1a] dark:text-[#ffb4ab]" activeBg="bg-[#ffdad6] dark:bg-[#93000a]" icon={<Zap />}         label="Cramps"    selected={selectedSymptoms.includes('cramps')}    onClick={() => toggleSymptom('cramps')} />
            <SelectableCard colorClass="text-[#6750a4] dark:text-[#d0bcff]" activeBg="bg-[#eaddff] dark:bg-[#4f378b]" icon={<Activity />}    label="Headache"  selected={selectedSymptoms.includes('headache')}  onClick={() => toggleSymptom('headache')} />
            <SelectableCard colorClass="text-[#0b57d0] dark:text-[#a8c7fa]" activeBg="bg-[#d3e3fd] dark:bg-[#004a77]" icon={<Coffee />}      label="Fatigue"   selected={selectedSymptoms.includes('fatigue')}   onClick={() => toggleSymptom('fatigue')} />
            <SelectableCard colorClass="text-[#984061] dark:text-[#ffd9e2]" activeBg="bg-[#ffd9e2] dark:bg-[#7d2949]" icon={<Heart />}       label="Tender"    selected={selectedSymptoms.includes('tender')}    onClick={() => toggleSymptom('tender')} />
            <SelectableCard colorClass="text-[#006a60] dark:text-[#53d7c4]" activeBg="bg-[#73f4e0] dark:bg-[#005048]" icon={<Wind />}        label="Bloating"  selected={selectedSymptoms.includes('bloating')}  onClick={() => toggleSymptom('bloating')} />
            <SelectableCard colorClass="text-[#6750a4] dark:text-[#d0bcff]" activeBg="bg-[#eaddff] dark:bg-[#4f378b]" icon={<Sparkles />}    label="Acne"      selected={selectedSymptoms.includes('acne')}      onClick={() => toggleSymptom('acne')} />
            <SelectableCard colorClass="text-[#8c5000] dark:text-[#ffb870]" activeBg="bg-[#ffdcbd] dark:bg-[#6a3c00]" icon={<Flame />}       label="Backache"  selected={selectedSymptoms.includes('backache')}  onClick={() => toggleSymptom('backache')} />
            <SelectableCard colorClass="text-[#444746] dark:text-[#c4c7c5]" activeBg="bg-[#e1e5e9] dark:bg-[#2a2a2a]" icon={<EyeOff />}      label="Insomnia"  selected={selectedSymptoms.includes('insomnia')}  onClick={() => toggleSymptom('insomnia')} />
            <SelectableCard colorClass="text-[#984061] dark:text-[#ffd9e2]" activeBg="bg-[#ffd9e2] dark:bg-[#7d2949]" icon={<Frown />}       label="Mood"      selected={selectedSymptoms.includes('mood')}      onClick={() => toggleSymptom('mood')} />
            <SelectableCard colorClass="text-[#146c2e] dark:text-[#6dd58c]" activeBg="bg-[#c4eed0] dark:bg-[#0f5223]" icon={<Utensils />}    label="Cravings"  selected={selectedSymptoms.includes('cravings')}  onClick={() => toggleSymptom('cravings')} />
            <SelectableCard colorClass="text-[#006874] dark:text-[#4fd8eb]" activeBg="bg-[#97f0ff] dark:bg-[#004f58]" icon={<Cloud />}       label="Brain Fog" selected={selectedSymptoms.includes('brain_fog')} onClick={() => toggleSymptom('brain_fog')} />
            <SelectableCard colorClass="text-[#ba1a1a] dark:text-[#ffb4ab]" activeBg="bg-[#ffdad6] dark:bg-[#93000a]" icon={<AlertCircle />} label="Dizziness" selected={selectedSymptoms.includes('dizziness')} onClick={() => toggleSymptom('dizziness')} />
          </div>
        )}
      </section>

      {/* ── Gut-Cycle GI Tracker ── */}
      <section>
        <h3 className="text-sm font-bold text-[#0b57d0] dark:text-[#a8c7fa] uppercase tracking-wider mb-4">Digestion & Gut (GI)</h3>
        <div className="grid grid-cols-4 gap-3">
          <SelectableCard colorClass="text-[#006a60] dark:text-[#53d7c4]" activeBg="bg-[#73f4e0] dark:bg-[#005048]" icon={<Wind />} label="Bloated" selected={giSymptoms.includes('bloating')} onClick={() => setGiSymptoms(prev => prev.includes('bloating') ? prev.filter(s => s !== 'bloating') : [...prev, 'bloating'])} />
          <SelectableCard colorClass="text-[#8c5000] dark:text-[#ffb870]" activeBg="bg-[#ffdcbd] dark:bg-[#6a3c00]" icon={<Cloud />} label="Constipated" selected={giSymptoms.includes('constipation')} onClick={() => setGiSymptoms(prev => prev.includes('constipation') ? prev.filter(s => s !== 'constipation') : [...prev, 'constipation'])} />
          <SelectableCard colorClass="text-[#006874] dark:text-[#4fd8eb]" activeBg="bg-[#97f0ff] dark:bg-[#004f58]" icon={<Droplets />} label="Diarrhea" selected={giSymptoms.includes('diarrhea')} onClick={() => setGiSymptoms(prev => prev.includes('diarrhea') ? prev.filter(s => s !== 'diarrhea') : [...prev, 'diarrhea'])} />
          <SelectableCard colorClass="text-[#ba1a1a] dark:text-[#ffb4ab]" activeBg="bg-[#ffdad6] dark:bg-[#93000a]" icon={<AlertCircle />} label="Nauseous" selected={giSymptoms.includes('nausea')} onClick={() => setGiSymptoms(prev => prev.includes('nausea') ? prev.filter(s => s !== 'nausea') : [...prev, 'nausea'])} />
        </div>
      </section>

      {/* ── Enhanced Pain Scale ── */}
      {hasPainSymptom && (
        <section className="animate-in slide-in-from-top-4 fade-in duration-300">
          <div className="bg-white/60 dark:bg-[#1A1C1E]/60 backdrop-saturate-[1.8] backdrop-blur-[50px] border-[0.5px] border-white/40 dark:border-white/10 rounded-[32px] p-6 shadow-[0_8px_32px_rgba(0,0,0,0.15)] space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-white/50 dark:bg-black/20 shadow-inner">
                <Activity className="w-5 h-5" style={{ color: getPainColor(painScore) }} />
              </div>
              <h3 className="font-medium text-[18px] text-[#1f1f1f] dark:text-[#e3e3e3]">Pain Severity</h3>
            </div>
            
            {/* Slider */}
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <span className="text-[44px] font-medium leading-none tracking-tighter" style={{ color: getPainColor(painScore) }}>{painScore}</span>
                <span className="text-[13px] font-bold uppercase tracking-widest" style={{ color: getPainColor(painScore) }}>
                  {getPainLabel(painScore)}
                </span>
              </div>
              <input 
                type="range" 
                min="1" 
                max="10" 
                value={painScore} 
                onChange={(e) => setPainScore(parseInt(e.target.value))}
                className="w-full h-4 rounded-full appearance-none cursor-pointer shadow-inner"
                style={{ background: `linear-gradient(to right, #00796b 0%, #f57c00 50%, #ba1a1a 100%)` }}
              />
              <div className="flex justify-between text-[11px] font-bold text-[#444746] dark:text-[#c4c7c5] uppercase tracking-widest">
                <span>1 (Mild)</span>
                <span>10 (Agonizing)</span>
              </div>
            </div>

            <hr className="border-gray-200 dark:border-white/5" />

            {/* Impacts */}
            <div>
              <h4 className="text-[11px] font-bold text-[#0b57d0] dark:text-[#a8c7fa] uppercase tracking-widest mb-3">Functional Impact</h4>
              <div className="flex flex-wrap gap-2">
                {['Stayed in bed', 'Missed work/school', 'Caused nausea', 'Required Rx meds', 'Went to ER'].map(impact => (
                  <button 
                    key={impact}
                    onClick={() => setPainImpacts(prev => prev.includes(impact) ? prev.filter(i => i !== impact) : [...prev, impact])}
                    className={`px-5 py-2.5 rounded-[16px] text-[13px] font-bold transition-all duration-300 backdrop-blur-md ${painImpacts.includes(impact) ? 'bg-[#ffdad6]/90 dark:bg-[#93000a]/90 text-[#ba1a1a] dark:text-[#ffb4ab] border-[0.5px] border-transparent shadow-sm scale-105' : 'bg-white/40 dark:bg-white/5 text-[#444746] dark:text-[#c4c7c5] border-[0.5px] border-white/40 dark:border-white/10 hover:bg-white/60 dark:hover:bg-white/10 shadow-[0_4px_16px_rgba(0,0,0,0.02)]'}`}
                  >
                    {impact}
                  </button>
                ))}
              </div>
            </div>

            {/* Medication efficacy */}
            {painScore >= 5 && (
              <div className="animate-fade-in pt-4 border-t border-gray-200 dark:border-white/5">
                <h4 className="text-[11px] font-bold text-[#0b57d0] dark:text-[#a8c7fa] uppercase tracking-widest mb-3">Did painkillers help?</h4>
                <div className="flex gap-2 bg-white dark:bg-[#2a2a2a] p-1 rounded-full border border-gray-200 dark:border-white/10 shadow-inner">
                  {['Fully Relieved', 'Barely Helped', 'No Effect'].map(effect => (
                    <button 
                      key={effect}
                      onClick={() => setMedsHelped(effect)}
                      className={`flex-1 py-2 rounded-full text-[13px] font-bold transition-colors ${medsHelped === effect ? 'bg-[#0b57d0] dark:bg-[#a8c7fa] text-white dark:text-[#062e6f] shadow-sm' : 'text-[#444746] dark:text-[#c4c7c5] hover:bg-gray-50 dark:hover:bg-[#333]'}`}
                    >
                      {effect}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── Sticky Bottom Save Bar (Glass) ── */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-white/60 dark:bg-[#121212]/60 backdrop-blur-[20px] backdrop-saturate-[1.8] border-t border-white/20 dark:border-white/5 z-20 pointer-events-none pb-24">
        <div className="pointer-events-auto max-w-2xl mx-auto">
          <button
            onClick={handleSave}
            disabled={saveState !== 'idle'}
            className={`w-full flex items-center justify-center gap-3 font-semibold text-[17px] py-4 rounded-[16px] border-[0.5px] transition-all duration-300 disabled:cursor-not-allowed ${
              saveState === 'saved'
                ? 'bg-[#34C759]/90 dark:bg-[#30D158]/80 border-white/20 text-white shadow-[0_8px_24px_rgba(52,199,89,0.25)] scale-[0.98]'
                : 'bg-[#007AFF]/90 dark:bg-[#0A84FF]/80 border-white/20 text-white hover:scale-[1.02] shadow-[0_8px_24px_rgba(0,122,255,0.25)]'
            }`}
          >
            {buttonContent()}
          </button>
        </div>
      </div>

      {/* ── Toast Notification ── */}
      <div
        className={`fixed bottom-40 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-5 py-3 rounded-full bg-[#146c2e] text-white text-[14px] font-bold shadow-lg pointer-events-none transition-opacity duration-500 ${showToast ? 'opacity-100' : 'opacity-0'}`}
        aria-live="polite"
      >
        <CheckCircle2 className="w-5 h-5" />
        Log Saved Successfully
      </div>
    </div>
  );
}
