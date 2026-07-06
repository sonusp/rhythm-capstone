import React, { useState } from 'react';
import { Brain, Apple, Shield, ArrowRight, Check } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import Lottie from 'lottie-react';

const TUTORIAL_STEPS = [
  {
    title: "AI Cycle Intelligence",
    desc: "Google Rhythm uses NVIDIA AI to predict your symptoms, energy levels, and fertile windows before they even happen.",
    icon: Brain,
    animClass: "animate-lottie-brain",
    color: "text-[#4285f4] dark:text-[#8ab4f8]",
    bg: "bg-[#e8f0fe] dark:bg-[#1967d2]/20",
    lottieData: null // TODO: Drop brain.json here
  },
  {
    title: "Actionable Diet & Fitness",
    desc: "Your body needs different fuel in every phase. We automatically sync your grocery lists and workouts to your current hormone levels.",
    icon: Apple,
    animClass: "animate-lottie-apple",
    color: "text-[#ea4335] dark:text-[#f28b82]",
    bg: "bg-[#fce8e6] dark:bg-[#601410]/20",
    lottieData: null // TODO: Drop apple.json here
  },
  {
    title: "100% Private & Secure",
    desc: "Your health data never touches our servers. Everything is stored directly on your phone and secured in your personal Google Drive.",
    icon: Shield,
    animClass: "animate-lottie-shield",
    color: "text-[#34a853] dark:text-[#81c995]",
    bg: "bg-[#e6f4ea] dark:bg-[#0d652d]/20",
    lottieData: null // TODO: Drop shield.json here
  }
];

export default function TutorialCarousel() {
  const { updatePrefs } = useAppStore();
  const [step, setStep] = useState(0);

  const next = () => {
    if (step < TUTORIAL_STEPS.length - 1) {
      setStep(s => s + 1);
    } else {
      updatePrefs({ hasSeenTutorial: true });
    }
  };

  const CurrentIcon = TUTORIAL_STEPS[step].icon;

  return (
    <div className="fixed inset-0 z-50 bg-white dark:bg-black flex flex-col items-center justify-center animate-fade-in p-8">
      
      {/* Visual Content Area */}
      <div className="flex-1 w-full max-w-sm flex flex-col items-center justify-center mt-12">
        <div className={`w-32 h-32 rounded-[2.5rem] flex items-center justify-center mb-10 transition-colors duration-500 shadow-sm border border-gray-100 dark:border-[#333]/50 ${TUTORIAL_STEPS[step].bg}`}>
          {TUTORIAL_STEPS[step].lottieData ? (
            <Lottie animationData={TUTORIAL_STEPS[step].lottieData} loop={true} className="w-24 h-24" />
          ) : (
            <CurrentIcon className={`w-16 h-16 ${TUTORIAL_STEPS[step].color} ${TUTORIAL_STEPS[step].animClass}`} />
          )}
        </div>
        
        <h2 className="text-[28px] leading-tight font-bold text-center text-[#202124] dark:text-white mb-4">
          {TUTORIAL_STEPS[step].title}
        </h2>
        
        <p className="text-center text-[15px] leading-relaxed text-gray-500 dark:text-gray-400">
          {TUTORIAL_STEPS[step].desc}
        </p>
      </div>

      {/* Pagination & Controls */}
      <div className="w-full max-w-sm pb-12 flex flex-col items-center gap-8">
        {/* Dots */}
        <div className="flex gap-2.5">
          {TUTORIAL_STEPS.map((_, i) => (
            <div 
              key={i} 
              className={`h-2 rounded-full transition-all duration-500 ${i === step ? 'w-8 bg-[#4285f4] dark:bg-[#8ab4f8]' : 'w-2 bg-gray-200 dark:bg-[#333]'}`}
            />
          ))}
        </div>

        {/* Button */}
        <button 
          onClick={next}
          className="w-full bg-[#4285f4] dark:bg-[#8ab4f8] text-white dark:text-[#121212] py-4 rounded-full font-bold text-[15px] shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 hover:opacity-90 transition-opacity active:scale-[0.98]"
        >
          {step === TUTORIAL_STEPS.length - 1 ? (
            <>Start Exploring <Check className="w-5 h-5" /></>
          ) : (
            <>Next <ArrowRight className="w-5 h-5" /></>
          )}
        </button>
      </div>
    </div>
  );
}
