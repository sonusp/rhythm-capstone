import React, { useState } from 'react';
import { 
  ArrowLeft, User, Activity, Brain, Shield, Heart,
  Baby, Droplets, Leaf, Dumbbell, Zap, CloudRain, Moon, Meh, Wind, ScanFace,
  ChevronRight, Edit2, CheckCircle, Pill
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

const DIET_OPTIONS = [
  { id: 'vegetarian', label: 'Vegetarian', icon: Leaf, color: 'text-green-600 dark:text-green-400' },
  { id: 'vegan', label: 'Vegan', icon: SparklesIcon, color: 'text-emerald-600 dark:text-emerald-400' },
  { id: 'non-vegetarian', label: 'Non-Veg', icon: Dumbbell, color: 'text-orange-500 dark:text-orange-400' },
  { id: 'pescatarian', label: 'Pescatarian', icon: Droplets, color: 'text-blue-500 dark:text-blue-400' },
];

const CONDITIONS = ['PCOS', 'Endometriosis', 'PMDD', 'Thyroid Disorder', 'Fibroids'];
const SYMPTOMS = ['Cramps', 'Bloating', 'Acne', 'Fatigue', 'Mood Swings', 'Breast Tenderness', 'Headaches', 'Nausea'];
const SUPPLEMENTS = ['Magnesium', 'Zinc', 'Vitamin D', 'Iron', 'Vitamin C', 'B12', 'Inositol', 'Folic Acid', 'Prenatal Vitamin', 'Fish Oil', 'Calcium', 'Probiotics'];

function SparklesIcon(props) {
  return <Zap {...props} />; // Fallback since Sparkles isn't imported above directly for diet
}

export default function ProfileView({ onClose }) {
  const { userPrefs, updatePrefs } = useAppStore();
  
  // Local state for inline editing
  const [editingField, setEditingField] = useState(null);
  const [tempValue, setTempValue] = useState('');

  const handleEdit = (field, value) => {
    setEditingField(field);
    setTempValue(value);
  };

  const handleSave = (field) => {
    updatePrefs({ [field]: tempValue });
    setEditingField(null);
  };

  const handleToggleArray = (field, item) => {
    const current = userPrefs[field] || [];
    if (current.includes(item)) {
      updatePrefs({ [field]: current.filter(i => i !== item) });
    } else {
      updatePrefs({ [field]: [...current, item] });
    }
  };

  return (
    <div className="absolute inset-0 z-50 bg-[#f8f9fa] dark:bg-black overflow-y-auto animate-in slide-in-from-right-4 duration-300">
      
      {/* Header */}
      <div className="sticky top-0 bg-[#f8f9fa]/90 dark:bg-black/90 backdrop-blur-md z-10 px-4 py-3 flex items-center gap-4">
        <button onClick={onClose} className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
          <ArrowLeft className="w-6 h-6 text-[#202124] dark:text-[#e3e3e3]" />
        </button>
        <h2 className="text-[22px] font-normal text-[#202124] dark:text-white">Health Profile</h2>
      </div>

      <div className="px-4 py-4 space-y-6 pb-24">
        
        {/* Profile Header Card */}
        <div className="flex flex-col items-center text-center space-y-4 mb-6">
          <div className="relative">
            <div className="w-24 h-24 bg-[#4285f4] text-white rounded-full flex items-center justify-center text-4xl font-normal shadow-sm ring-4 ring-white dark:ring-black">
              {userPrefs.name ? userPrefs.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="absolute bottom-0 right-0 p-1.5 bg-white dark:bg-[#1e1e1e] rounded-full shadow-sm border border-gray-100 dark:border-[#333]">
              <Shield className="w-4 h-4 text-[#34a853]" />
            </div>
          </div>
          <div>
            <h1 className="text-[28px] font-normal text-[#202124] dark:text-white mb-1 leading-none">{userPrefs.name || 'User'}</h1>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 px-3 py-1 bg-black/5 dark:bg-white/5 rounded-full inline-block mt-2">
              {userPrefs.lifecycleMode.charAt(0).toUpperCase() + userPrefs.lifecycleMode.slice(1)} Mode Active
            </p>
          </div>
        </div>

        {/* Section 1: Personal Info */}
        <section className="bg-[#f8fafd] dark:bg-[#1e1e20] rounded-[24px] overflow-hidden">
          <div className="px-6 py-5 flex items-center gap-3">
            <User className="w-6 h-6 text-[#4285f4]" />
            <h3 className="text-lg font-normal text-[#202124] dark:text-[#e3e3e3]">Personal info</h3>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-[#333]">
            <EditableRow label="Name" field="name" value={userPrefs.name} isEditing={editingField === 'name'} tempValue={tempValue} setTempValue={setTempValue} onEdit={handleEdit} onSave={handleSave} />
            <EditableRow type="date" label="Date of Birth" field="dob" value={userPrefs.dob} isEditing={editingField === 'dob'} tempValue={tempValue} setTempValue={setTempValue} onEdit={handleEdit} onSave={handleSave} />
            <EditableRow type="number" label="Height (cm)" field="height" value={userPrefs.height} isEditing={editingField === 'height'} tempValue={tempValue} setTempValue={setTempValue} onEdit={handleEdit} onSave={handleSave} />
            <EditableRow type="number" label="Weight (kg)" field="weight" value={userPrefs.weight} isEditing={editingField === 'weight'} tempValue={tempValue} setTempValue={setTempValue} onEdit={handleEdit} onSave={handleSave} />
          </div>
        </section>

        {/* Section 2: Cycle Baseline */}
        <section className="bg-[#f8fafd] dark:bg-[#1e1e20] rounded-[24px] overflow-hidden">
          <div className="px-6 py-5 flex items-center gap-3">
            <Activity className="w-6 h-6 text-[#ea4335]" />
            <h3 className="text-lg font-normal text-[#202124] dark:text-[#e3e3e3]">Cycle baseline</h3>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-[#333]">
            <EditableRow type="number" label="Cycle Length (Days)" field="cycleLength" value={userPrefs.cycleLength} isEditing={editingField === 'cycleLength'} tempValue={tempValue} setTempValue={setTempValue} onEdit={handleEdit} onSave={handleSave} />
            <EditableRow type="date" label="Last Period Date" field="lastPeriodDate" value={userPrefs.lastPeriodDate} isEditing={editingField === 'lastPeriodDate'} tempValue={tempValue} setTempValue={setTempValue} onEdit={handleEdit} onSave={handleSave} />
            <EditableRow label="Contraceptive" field="contraceptive" value={userPrefs.contraceptive} isEditing={editingField === 'contraceptive'} tempValue={tempValue} setTempValue={setTempValue} onEdit={handleEdit} onSave={handleSave} options={['None', 'The Pill', 'IUD (Hormonal)', 'IUD (Copper)', 'Implant', 'Ring', 'Patch', 'Injection']} />
          </div>
        </section>

        {/* Section 3: Medical Profile */}
        <section className="bg-[#f8fafd] dark:bg-[#1e1e20] rounded-[24px] overflow-hidden">
          <div className="px-6 py-5 flex items-center gap-3">
            <Heart className="w-6 h-6 text-[#fbbc04]" />
            <h3 className="text-lg font-normal text-[#202124] dark:text-[#e3e3e3]">Medical profile</h3>
          </div>
          <div className="px-6 pb-6 pt-2 space-y-6">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Diagnosed conditions</p>
              <div className="flex flex-wrap gap-2">
                {userPrefs.diagnosedConditions?.length > 0 ? (
                  userPrefs.diagnosedConditions.map(c => (
                    <span key={c} className="px-4 py-2 bg-[#f8f9fa] dark:bg-[#2a2a2a] border border-gray-200 dark:border-[#444] text-[#202124] dark:text-[#e3e3e3] rounded-lg text-sm font-medium flex items-center gap-2 cursor-pointer transition-colors hover:bg-gray-100" onClick={() => handleToggleArray('diagnosedConditions', c)}>
                      {c} <span className="text-gray-400">✕</span>
                    </span>
                  ))
                ) : null}
                <AddChipDropdown 
                  options={CONDITIONS.filter(c => !userPrefs.diagnosedConditions?.includes(c))} 
                  onSelect={(val) => handleToggleArray('diagnosedConditions', val)} 
                />
              </div>
            </div>
            
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Suspected conditions (AI Tracking)</p>
              <div className="flex flex-wrap gap-2">
                {userPrefs.suspectedConditions?.length > 0 ? (
                  userPrefs.suspectedConditions.map(c => (
                    <span key={c} className="px-4 py-2 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 text-amber-800 dark:text-amber-400 rounded-lg text-sm font-medium flex items-center gap-2 cursor-pointer transition-colors hover:bg-amber-100" onClick={() => handleToggleArray('suspectedConditions', c)}>
                      {c} <span className="text-amber-600/50">✕</span>
                    </span>
                  ))
                ) : null}
                <AddChipDropdown 
                  options={CONDITIONS.filter(c => !userPrefs.suspectedConditions?.includes(c))} 
                  onSelect={(val) => handleToggleArray('suspectedConditions', val)} 
                  placeholder="+ Add Suspected"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Section 3.5: Daily Supplement Stack */}
        <section className="bg-[#f8fafd] dark:bg-[#1e1e20] rounded-[24px] overflow-hidden">
          <div className="px-6 py-5 flex items-center gap-3">
            <Pill className="w-6 h-6 text-teal-500" />
            <h3 className="text-lg font-normal text-[#202124] dark:text-[#e3e3e3]">Supplement Stack</h3>
          </div>
          <div className="px-6 pb-6 pt-2 space-y-6">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Your Active Stack</p>
              <div className="flex flex-wrap gap-2">
                {userPrefs.supplements?.length > 0 ? (
                  userPrefs.supplements.map(s => (
                    <span key={s} className="px-4 py-2 bg-teal-50 dark:bg-teal-900/10 border border-teal-200 dark:border-teal-900/30 text-teal-700 dark:text-teal-400 rounded-lg text-sm font-medium flex items-center gap-2 cursor-pointer transition-colors hover:bg-teal-100" onClick={() => handleToggleArray('supplements', s)}>
                      {s} <span className="text-teal-600/50">✕</span>
                    </span>
                  ))
                ) : (
                  <p className="text-xs text-gray-400 italic">No supplements added yet.</p>
                )}
                <AddChipDropdown 
                  options={SUPPLEMENTS.filter(s => !userPrefs.supplements?.includes(s))} 
                  onSelect={(val) => handleToggleArray('supplements', val)} 
                  placeholder="+ Add Supplement"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Section 4: AI & Lifestyle */}
        <section className="bg-[#f8fafd] dark:bg-[#1e1e20] rounded-[24px] overflow-hidden">
          <div className="px-6 py-5 flex items-center gap-3">
            <Brain className="w-6 h-6 text-[#34a853]" />
            <h3 className="text-lg font-normal text-[#202124] dark:text-[#e3e3e3]">AI & Lifestyle</h3>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-[#333]">
            <EditableRow label="AI Personality" field="aiTone" value={userPrefs.aiTone} isEditing={editingField === 'aiTone'} tempValue={tempValue} setTempValue={setTempValue} onEdit={handleEdit} onSave={handleSave} options={['Warm & Supportive', 'Clinical & Direct', 'Science & Data Heavy']} />
            <EditableRow label="Activity Level" field="activityLevel" value={userPrefs.activityLevel} isEditing={editingField === 'activityLevel'} tempValue={tempValue} setTempValue={setTempValue} onEdit={handleEdit} onSave={handleSave} options={['Sedentary', 'Moderate', 'Very Active']} />
          </div>
          <div className="px-6 pb-6 pt-4">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Arch nemesis symptoms</p>
            <div className="flex flex-wrap gap-2">
              {userPrefs.archNemesis?.length > 0 ? (
                userPrefs.archNemesis.map(a => (
                  <span key={a} className="px-4 py-2 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 text-red-700 dark:text-red-400 rounded-lg text-sm font-medium flex items-center gap-2 cursor-pointer transition-colors hover:bg-red-100" onClick={() => handleToggleArray('archNemesis', a)}>
                    {a} <span className="text-red-400/50">✕</span>
                  </span>
                ))
              ) : null}
              {userPrefs.archNemesis?.length < 3 && (
                <AddChipDropdown 
                  options={SYMPTOMS.filter(s => !userPrefs.archNemesis?.includes(s))} 
                  onSelect={(val) => handleToggleArray('archNemesis', val)} 
                  placeholder="+ Add Symptom (Max 3)"
                />
              )}
            </div>
          </div>
        </section>

        {/* Privacy Note */}
        <div className="flex items-start gap-4 px-2 mt-8">
          <Shield className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
          <p className="text-[13px] text-gray-500 dark:text-gray-400 leading-relaxed">
            Your personal info is private and secure. All health profile data shown here is stored locally on your device and is never uploaded to the cloud without your explicit consent via Google Drive Backup.
          </p>
        </div>

      </div>
    </div>
  );
}

function EditableRow({ label, field, value, type = "text", isEditing, tempValue, setTempValue, onEdit, onSave, options }) {
  return (
    <div className="flex items-center justify-between px-5 py-4">
      <div className="flex-1 pr-4">
        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{label}</p>
        {isEditing ? (
          options ? (
            <select 
              value={tempValue}
              onChange={(e) => setTempValue(e.target.value)}
              className="mt-1 w-full bg-transparent border-b-2 border-[#4285f4] focus:outline-none text-[#202124] dark:text-[#e3e3e3] text-sm font-medium pb-1"
            >
              <option value="" disabled>Select option</option>
              {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          ) : (
            <input 
              type={type}
              value={tempValue}
              onChange={(e) => setTempValue(e.target.value)}
              className="mt-1 w-full bg-transparent border-b-2 border-[#4285f4] focus:outline-none text-[#202124] dark:text-[#e3e3e3] text-sm font-medium pb-1"
              autoFocus
            />
          )
        ) : (
          <p className="text-sm font-semibold text-[#202124] dark:text-[#e3e3e3] mt-0.5 break-words">{value || 'Not set'}</p>
        )}
      </div>
      
      <div className="shrink-0">
        {isEditing ? (
          <button onClick={() => onSave(field)} className="ml-2 p-1.5 bg-[#e8f0fe] dark:bg-[#1967d2]/30 text-[#1967d2] dark:text-[#8ab4f8] rounded-full">
            <CheckCircle className="w-4 h-4" />
          </button>
        ) : (
          <button onClick={() => onEdit(field, value)} className="ml-2 p-1.5 hover:bg-gray-100 dark:hover:bg-[#2a2a2a] text-gray-400 rounded-full transition-colors">
            <Edit2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

function AddChipDropdown({ options, onSelect, placeholder = "+ Add Condition" }) {
  if (options.length === 0) return null;
  return (
    <select 
      className="px-4 py-2 bg-white dark:bg-[#1e1e1e] border border-dashed border-gray-300 dark:border-[#555] text-gray-500 dark:text-gray-400 rounded-lg text-sm font-medium focus:outline-none cursor-pointer appearance-none hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition-colors text-center"
      value=""
      onChange={(e) => {
        if (e.target.value) onSelect(e.target.value);
      }}
    >
      <option value="" disabled>{placeholder}</option>
      {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
    </select>
  );
}
