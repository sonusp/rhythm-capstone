import { Droplets, Zap, Heart, Moon, AlertCircle, Activity } from 'lucide-react';

export const PHASES = {
  MENSTRUAL: { 
    id: 'MENSTRUAL',
    name: 'Menstrual', 
    color: 'text-red-500 dark:text-red-400', 
    bg: 'bg-red-50 dark:bg-red-900/20', 
    hexLight: '#ea4335', hexDark: '#f28b82', 
    message: 'Low energy expected', icon: Droplets 
  },
  FOLLICULAR: { 
    id: 'FOLLICULAR',
    name: 'Follicular', 
    color: 'text-blue-500 dark:text-[#8ab4f8]', 
    bg: 'bg-blue-50 dark:bg-blue-900/20', 
    hexLight: '#4285f4', hexDark: '#8ab4f8', 
    message: 'Energy levels rising', icon: Zap 
  },
  OVULATION: { 
    id: 'OVULATION',
    name: 'Ovulation', 
    color: 'text-amber-500 dark:text-[#fde293]', 
    bg: 'bg-amber-50 dark:bg-amber-900/20', 
    hexLight: '#fbbc04', hexDark: '#fde293', 
    message: 'Peak fertility window', icon: Heart 
  },
  LUTEAL: { 
    id: 'LUTEAL',
    name: 'Luteal', 
    color: 'text-green-500 dark:text-[#81c995]', 
    bg: 'bg-green-50 dark:bg-green-900/20', 
    hexLight: '#34a853', hexDark: '#81c995', 
    message: 'PMS symptoms may occur', icon: Moon 
  },
  LATE: { 
    id: 'LATE',
    name: 'Late', 
    color: 'text-rose-500 dark:text-rose-400', 
    bg: 'bg-rose-50 dark:bg-rose-900/20', 
    hexLight: '#f43f5e', hexDark: '#fb7185', 
    message: 'Period is late. Log symptoms.', icon: AlertCircle 
  },
  PCOS: {
    id: 'PCOS',
    name: 'Pattern Tracking',
    color: 'text-purple-500 dark:text-purple-400',
    bg: 'bg-purple-50 dark:bg-purple-900/20',
    hexLight: '#a855f7', hexDark: '#c084fc',
    message: 'Calendar paused. AI is monitoring.', icon: Activity
  }
};

export const CYCLE_LENGTH = 28;
