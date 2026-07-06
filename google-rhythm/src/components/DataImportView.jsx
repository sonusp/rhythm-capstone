import React, { useState, useRef } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, X, ArrowRight, Droplets, Smile, Thermometer, Sparkles, Activity, Heart } from 'lucide-react';
import { bulkImportLogs } from '../services/db';
import { getImportMapping } from '../services/nimService';
import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

// ─── PDF EXTRACTOR ────────────────────────────────────────────────────

async function extractTextFromPDF(file) {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let text = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    text += content.items.map(item => item.str).join(' ') + '\\n';
  }
  return text;
}

// ─── CSV PARSER ───────────────────────────────────────────────────────

function parseCSVRows(text) {
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return { headers: [], rows: [] };
  
  const headers = parseCSVLine(lines[0]);
  const rows = lines.slice(1).map(line => {
    const values = parseCSVLine(line);
    const row = {};
    headers.forEach((h, i) => { row[h] = values[i] || ''; });
    return row;
  });

  return { headers, rows };
}

function parseCSVLine(line) {
  const values = [];
  let current = '';
  let inQuotes = false;
  for (const char of line) {
    if (char === '"') { inQuotes = !inQuotes; continue; }
    if (char === ',' && !inQuotes) { values.push(current.trim()); current = ''; continue; }
    current += char;
  }
  values.push(current.trim());
  return values;
}

// ─── AI COLUMN MAPPING (OpenRouter Free Tier) ─────────────────────────

async function getAIColumnMapping(headers, sampleRows) {
  const sampleData = sampleRows.map(row => {
    const obj = {};
    headers.forEach(h => { obj[h] = row[h]; });
    return obj;
  });

  return await getImportMapping(headers, sampleData);
}

// ─── APPLY AI MAPPING TO ROWS ─────────────────────────────────────────

function applyMapping(rows, mapping) {
  return rows.map(row => {
    // Date
    const rawDate = row[mapping.dateColumn] || '';
    const date = normalizeDate(rawDate);
    if (!date) return null;

    // Flow
    let flow = 'None';
    if (mapping.flowColumn && row[mapping.flowColumn]) {
      const rawFlow = row[mapping.flowColumn];
      flow = mapping.flowMapping?.[rawFlow] || normalizeFlow(rawFlow);
    }

    // Mood
    const mood = mapping.moodColumn ? (row[mapping.moodColumn] || '') : '';

    // Symptoms — extract from mapped symptom columns
    const symptoms = [];
    if (mapping.symptomColumns) {
      for (const col of mapping.symptomColumns) {
        const val = row[col];
        if (val && val !== 'None' && val !== 'No' && val !== '0' && val !== '') {
          // Format: "ColumnName (value)" or just "ColumnName"
          const label = col.charAt(0).toUpperCase() + col.slice(1);
          if (['Yes', 'Mild', 'Moderate', 'Severe', 'High', 'Low'].includes(val)) {
            symptoms.push(`${label} (${val})`);
          } else if (val.toLowerCase() !== 'none' && val.toLowerCase() !== 'no') {
            symptoms.push(`${label}: ${val}`);
          }
        }
      }
    }

    // Note
    const note = mapping.noteColumn ? (row[mapping.noteColumn] || '') : '';

    return {
      date,
      mode: 'cycle',
      mood,
      flow,
      symptoms: [...new Set(symptoms)],
      note,
      timestamp: new Date().toISOString(),
      importedFrom: 'AI-Import',
    };
  }).filter(Boolean);
}

function normalizeFlow(value) {
  if (!value) return 'None';
  const v = value.toLowerCase();
  if (v.includes('heavy') || v === '3' || v === 'high') return 'Heavy';
  if (v.includes('medium') || v === '2' || v === 'moderate') return 'Medium';
  if (v.includes('light') || v === '1' || v === 'low') return 'Light';
  if (v.includes('spot')) return 'Spotting';
  if (v === 'none' || v === 'no' || v === '0' || v === '') return 'None';
  return 'None';
}

function normalizeDate(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
  const parts = dateStr.split(/[\/\-\.]/);
  if (parts.length === 3) {
    const [a, b, c] = parts;
    if (c.length === 4) return `${c}-${b.padStart(2, '0')}-${a.padStart(2, '0')}`;
    if (a.length === 4) return `${a}-${b.padStart(2, '0')}-${c.padStart(2, '0')}`;
  }
  return null;
}

// ─── COMPONENT ────────────────────────────────────────────────────────

export default function DataImportView({ onClose }) {
  const [step, setStep] = useState('upload'); // upload | analyzing | preview | importing | done
  const [parsedLogs, setParsedLogs] = useState([]);
  const [aiMapping, setAiMapping] = useState(null);
  const [error, setError] = useState('');
  const [importCount, setImportCount] = useState(0);
  const [importProgress, setImportProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const fileInputRef = useRef(null);

  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    setError('');

    setStep('analyzing');

    try {
      let text = '';
      if (file.name.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf') {
        text = await extractTextFromPDF(file);
      } else {
        text = await file.text();
      }
      
      const { headers, rows } = parseCSVRows(text);
      if (rows.length === 0) {
        setError('No data found in this file.');
        setStep('upload');
        return;
      }

      // Send headers + 3 sample rows to AI
      const sampleRows = rows.slice(0, 3);
      const mapping = await getAIColumnMapping(headers, sampleRows);
      setAiMapping(mapping);

      // Apply the mapping to all rows
      const logs = applyMapping(rows, mapping);
      if (logs.length === 0) {
        setError('Could not identify valid health data in this file.');
        setStep('upload');
        return;
      }

      setParsedLogs(logs);
      setStep('preview');
    } catch (err) {
      console.error('Import error:', err);
      setError(err.message || 'Failed to process file.');
      setStep('upload');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleImport = async () => {
    setStep('importing');
    setImportProgress(0);

    try {
      const BATCH_SIZE = 50;
      const total = parsedLogs.length;
      let imported = 0;

      for (let i = 0; i < total; i += BATCH_SIZE) {
        const batch = parsedLogs.slice(i, i + BATCH_SIZE);
        await bulkImportLogs(batch);
        imported += batch.length;
        setImportProgress(Math.round((imported / total) * 100));
        // Small delay to let the UI update
        await new Promise(r => setTimeout(r, 50));
      }

      setImportCount(imported);
      setStep('done');
    } catch (err) {
      setError('Import failed: ' + err.message);
      setStep('preview');
    }
  };

  const flowStats = parsedLogs.reduce((acc, log) => {
    if (log.flow && log.flow !== 'None') acc.flowDays++;
    if (log.symptoms.length > 0) acc.symptomDays++;
    if (log.mood) acc.moodDays++;
    return acc;
  }, { flowDays: 0, symptomDays: 0, moodDays: 0 });

  return (
    <div className="fixed inset-0 z-[999] bg-white dark:bg-[#121212] flex flex-col animate-fade-in">
      {/* Header M3 */}
      <header className="px-6 py-4 flex justify-between items-center bg-white/80 dark:bg-[#121212]/80 backdrop-blur-xl z-[1000] sticky top-0">
        <h2 className="text-xl font-bold tracking-tight text-[#1f1f1f] dark:text-[#e3e3e3]">Migration Assistant</h2>
        {step !== 'importing' && (
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-[#f0f4f8] dark:bg-[#1e1e20] flex items-center justify-center hover:scale-105 transition-transform text-[#444746] dark:text-[#c4c7c5]">
            <X className="w-5 h-5" />
          </button>
        )}
      </header>

      <div className="flex-1 overflow-y-auto px-6 pb-40">
        
        {/* ── STEP 1: Upload iOS ─────────────────────────────── */}
        {step === 'upload' && (
          <div className="space-y-8 pt-6">
            <div className="text-center">
              <div className="relative inline-flex items-center justify-center mb-8">
                <div className="absolute inset-0 bg-[#007AFF] rounded-full blur-[40px] opacity-40 animate-[pulse_4s_ease-in-out_infinite]"></div>
                <div className="relative w-28 h-28 rounded-[36px] bg-white dark:bg-[#1c1c1e] flex items-center justify-center shadow-[0_16px_40px_rgba(0,0,0,0.1)] dark:shadow-[0_16px_40px_rgba(0,0,0,0.3)] border-[0.5px] border-slate-200/60 dark:border-white/10">
                  <Upload className="w-12 h-12 text-[#007AFF] dark:text-[#0A84FF]" />
                </div>
              </div>
              <h3 className="text-3xl font-bold tracking-tight text-[#1f1f1f] dark:text-[#e3e3e3] mb-3">
                Import History
              </h3>
              <p className="text-[16px] text-gray-500 dark:text-gray-400 max-w-[280px] mx-auto leading-relaxed">
                We'll securely organize your past cycles from any tracking app.
              </p>
            </div>

            {/* Supported Apps iOS Grouped List */}
            <div className="space-y-3">
              <p className="text-[13px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest pl-4 mb-2">Supported Formats</p>
              <div className="bg-white/80 dark:bg-[#1c1c1e]/80 backdrop-saturate-150 backdrop-blur-3xl rounded-[32px] overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.06)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.1)] border-[0.5px] border-slate-200/60 dark:border-white/10">
                {[
                  { name: 'Flo', desc: 'Settings > Export Data', icon: Droplets, bg: 'bg-gradient-to-br from-[#ff6a88] to-[#ff9a9e]', color: 'text-white' },
                  { name: 'Clue', desc: 'Menu > Account > Export my data', icon: Activity, bg: 'bg-gradient-to-br from-[#8E2DE2] to-[#4A00E0]', color: 'text-white' },
                  { name: 'Apple Health & CSV', desc: 'Any CSV or PDF export', icon: Heart, bg: 'bg-white dark:bg-black border border-gray-100 dark:border-white/10', color: 'text-[#FF2D55]' },
                ].map((app, index, arr) => (
                  <div key={app.name}>
                    <div className="flex items-center gap-4 p-5 hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition-colors cursor-pointer">
                      <div className={`w-12 h-12 rounded-[14px] ${app.bg} flex items-center justify-center shrink-0 shadow-sm`}>
                        <app.icon className={`w-6 h-6 ${app.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-[17px] font-semibold tracking-tight text-[#1f1f1f] dark:text-[#e3e3e3] truncate">{app.name}</h4>
                        <p className="text-[14px] text-gray-500 dark:text-gray-400 truncate mt-0.5">{app.desc}</p>
                      </div>
                      <ArrowRight className="w-5 h-5 text-gray-300 dark:text-gray-600" />
                    </div>
                    {index < arr.length - 1 && (
                      <div className="mx-5 border-b border-gray-200/60 dark:border-white/5"></div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-4 p-5 rounded-[24px] bg-[#ffdad6] dark:bg-[#93000a] shadow-sm animate-fade-in">
                <AlertCircle className="w-6 h-6 text-[#ba1a1a] dark:text-[#ffb4ab] shrink-0" />
                <p className="text-sm text-[#ba1a1a] dark:text-[#ffb4ab] font-bold">{error}</p>
              </div>
            )}
          </div>
        )}

        {/* ── STEP 2: Analyzing iOS ───────────────────────── */}
        {step === 'analyzing' && (
          <div className="flex flex-col items-center justify-center pt-32 space-y-8 animate-fade-in">
            <div className="relative inline-flex items-center justify-center">
              <div className="absolute inset-0 bg-[#5E5CE6] rounded-full blur-[40px] opacity-40 animate-[pulse_2s_ease-in-out_infinite]"></div>
              <div className="relative w-28 h-28 rounded-[36px] bg-white dark:bg-[#1c1c1e] flex items-center justify-center shadow-[0_16px_40px_rgba(0,0,0,0.1)] dark:shadow-[0_16px_40px_rgba(0,0,0,0.3)] border-[0.5px] border-slate-200/60 dark:border-white/10">
                <Sparkles className="w-12 h-12 text-[#5E5CE6] animate-[spin_3s_linear_infinite]" />
              </div>
            </div>
            <div className="text-center space-y-3">
              <h3 className="text-2xl font-bold tracking-tight text-[#1f1f1f] dark:text-[#e3e3e3]">Processing Data</h3>
              <p className="text-[16px] text-gray-500 dark:text-gray-400 max-w-[280px] mx-auto leading-relaxed">Securely organizing your past entries using local AI...</p>
            </div>
            <div className="w-64 h-2 bg-gray-200 dark:bg-[#2c2c2e] rounded-full overflow-hidden shadow-inner">
              <div className="h-full bg-gradient-to-r from-[#5E5CE6] to-[#0A84FF] rounded-full animate-[shimmer_1.5s_ease-in-out_infinite] w-[60%]" />
            </div>
          </div>
        )}

        {/* ── STEP 3: Preview iOS ────────────────────────────── */}
        {step === 'preview' && (
          <div className="space-y-8 pt-6 animate-fade-in">
            <div className="text-center">
              <div className="relative inline-flex items-center justify-center mb-5">
                <div className="absolute inset-0 bg-[#34C759] rounded-full blur-[40px] opacity-40"></div>
                <div className="relative w-24 h-24 rounded-[32px] bg-white dark:bg-[#1c1c1e] flex items-center justify-center shadow-[0_16px_40px_rgba(0,0,0,0.1)] dark:shadow-[0_16px_40px_rgba(0,0,0,0.3)] border-[0.5px] border-slate-200/60 dark:border-white/10">
                  <CheckCircle className="w-10 h-10 text-[#34C759]" />
                </div>
              </div>
              <h3 className="text-3xl font-bold tracking-tight text-[#1f1f1f] dark:text-[#e3e3e3] mb-2">
                History Found
              </h3>
              <p className="text-[16px] text-gray-500 dark:text-gray-400">
                Ready to import <span className="font-semibold text-[#007AFF]">{parsedLogs.length} entries</span>
              </p>
            </div>

            {/* Stats Cards iOS */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white/80 dark:bg-[#1c1c1e]/80 backdrop-saturate-150 backdrop-blur-3xl rounded-[28px] p-5 text-center shadow-[0_8px_30px_rgba(0,0,0,0.06)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.1)] border-[0.5px] border-slate-200/60 dark:border-white/10">
                <Droplets className="w-7 h-7 text-[#FF3B30] mx-auto mb-3" />
                <p className="text-3xl font-bold text-[#1f1f1f] dark:text-[#e3e3e3]">{flowStats.flowDays}</p>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-widest mt-2">Flow</p>
              </div>
              <div className="bg-white/80 dark:bg-[#1c1c1e]/80 backdrop-saturate-150 backdrop-blur-3xl rounded-[28px] p-5 text-center shadow-[0_8px_30px_rgba(0,0,0,0.06)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.1)] border-[0.5px] border-slate-200/60 dark:border-white/10">
                <Thermometer className="w-7 h-7 text-[#FF9500] mx-auto mb-3" />
                <p className="text-3xl font-bold text-[#1f1f1f] dark:text-[#e3e3e3]">{flowStats.symptomDays}</p>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-widest mt-2">Symptoms</p>
              </div>
              <div className="bg-white/80 dark:bg-[#1c1c1e]/80 backdrop-saturate-150 backdrop-blur-3xl rounded-[28px] p-5 text-center shadow-[0_8px_30px_rgba(0,0,0,0.06)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.1)] border-[0.5px] border-slate-200/60 dark:border-white/10">
                <Smile className="w-7 h-7 text-[#007AFF] mx-auto mb-3" />
                <p className="text-3xl font-bold text-[#1f1f1f] dark:text-[#e3e3e3]">{flowStats.moodDays}</p>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-widest mt-2">Moods</p>
              </div>
            </div>

            {/* Sample Preview iOS */}
            <div className="space-y-3">
              <p className="text-[13px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest pl-4 mb-2">Sample Preview</p>
              <div className="bg-white/80 dark:bg-[#1c1c1e]/80 backdrop-saturate-150 backdrop-blur-3xl rounded-[32px] overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.06)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.1)] border-[0.5px] border-slate-200/60 dark:border-white/10">
                {parsedLogs.slice(0, 4).map((log, index, arr) => (
                  <div key={index}>
                    <div className="flex items-center gap-4 p-5 hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition-colors">
                      <div className={`w-1.5 h-12 rounded-full shrink-0 shadow-inner ${
                        log.flow === 'Heavy' ? 'bg-[#FF3B30]' : 
                        log.flow === 'Medium' ? 'bg-[#FF9500]' : 
                        log.flow === 'Light' ? 'bg-[#FFCC00]' : 
                        log.flow === 'Spotting' ? 'bg-[#8E8E93]' : 'bg-[#E5E5EA] dark:bg-[#3A3A3C]'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-[17px] font-semibold text-[#1f1f1f] dark:text-[#e3e3e3]">{log.date}</p>
                          {log.flow !== 'None' && (
                            <span className={`text-[12px] font-semibold px-3 py-1 rounded-full ${
                              log.flow === 'Heavy' ? 'text-[#FF3B30] bg-[#FF3B30]/10' : 
                              log.flow === 'Medium' ? 'text-[#FF9500] bg-[#FF9500]/10' : 
                              log.flow === 'Light' ? 'text-[#FFCC00] bg-[#FFCC00]/10' : 
                              'text-[#8E8E93] bg-[#8E8E93]/10'
                            }`}>{log.flow}</span>
                          )}
                        </div>
                        <p className="text-[15px] text-gray-500 dark:text-gray-400 truncate">
                          {[log.mood, ...log.symptoms.slice(0, 2)].filter(Boolean).join(' • ') || 'No logged details'}
                        </p>
                      </div>
                    </div>
                    {index < arr.length - 1 && (
                      <div className="mx-6 border-b border-gray-200/60 dark:border-white/5"></div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-4 p-5 rounded-[24px] bg-[#FF3B30]/10 border border-[#FF3B30]/20 shadow-sm animate-fade-in">
                <AlertCircle className="w-6 h-6 text-[#FF3B30] shrink-0" />
                <p className="text-sm text-[#FF3B30] font-semibold">{error}</p>
              </div>
            )}
          </div>
        )}

        {/* ── STEP 4: Importing iOS ────────────── */}
        {step === 'importing' && (
          <div className="flex flex-col items-center justify-center pt-32 space-y-8 animate-fade-in">
            <div className="relative inline-flex items-center justify-center">
              <div className="absolute inset-0 bg-[#007AFF] rounded-full blur-[40px] opacity-40 animate-[pulse_2s_ease-in-out_infinite]"></div>
              <div className="relative w-28 h-28 rounded-[36px] bg-white dark:bg-[#1c1c1e] flex items-center justify-center shadow-[0_16px_40px_rgba(0,0,0,0.1)] dark:shadow-[0_16px_40px_rgba(0,0,0,0.3)] border-[0.5px] border-slate-200/60 dark:border-white/10">
                <Activity className="w-12 h-12 text-[#007AFF] animate-pulse" />
              </div>
            </div>
            <div className="text-center space-y-3">
              <h3 className="text-2xl font-bold tracking-tight text-[#1f1f1f] dark:text-[#e3e3e3]">Writing Data</h3>
              <p className="text-[16px] text-gray-500 dark:text-gray-400 max-w-[280px] mx-auto leading-relaxed">
                Saving {parsedLogs.length} entries securely...
              </p>
            </div>
            
            {/* Progress Bar iOS */}
            <div className="w-full max-w-[300px] space-y-3">
              <div className="w-full h-2 bg-gray-200 dark:bg-[#2c2c2e] rounded-full overflow-hidden shadow-inner">
                <div 
                  className="h-full bg-[#007AFF] rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${importProgress}%` }}
                />
              </div>
              <div className="flex justify-between text-[14px] font-semibold">
                <span className="text-gray-500 dark:text-gray-400">Progress</span>
                <span className="text-[#007AFF]">{importProgress}%</span>
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 5: Done iOS ───────────────────────────────── */}
        {step === 'done' && (
          <div className="flex flex-col items-center justify-center pt-24 space-y-8 animate-fade-in">
            <div className="relative inline-flex items-center justify-center">
              <div className="absolute inset-0 bg-[#34C759] rounded-full blur-[40px] opacity-40"></div>
              <div className="relative w-32 h-32 rounded-[40px] bg-white dark:bg-[#1c1c1e] flex items-center justify-center shadow-[0_16px_40px_rgba(0,0,0,0.1)] dark:shadow-[0_16px_40px_rgba(0,0,0,0.3)] border-[0.5px] border-slate-200/60 dark:border-white/10">
                <CheckCircle className="w-16 h-16 text-[#34C759]" />
              </div>
            </div>
            <div className="text-center space-y-3">
              <h3 className="text-4xl font-bold tracking-tight text-[#1f1f1f] dark:text-[#e3e3e3]">
                Success!
              </h3>
              <p className="text-[18px] text-gray-500 dark:text-gray-400">
                Imported <span className="font-semibold text-[#34C759]">{importCount}</span> entries
              </p>
            </div>
            <div className="bg-white/80 dark:bg-[#1c1c1e]/80 backdrop-saturate-150 backdrop-blur-3xl p-6 rounded-[32px] max-w-[320px] shadow-[0_8px_30px_rgba(0,0,0,0.06)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.1)] border-[0.5px] border-slate-200/60 dark:border-white/10">
               <p className="text-[15px] text-[#1f1f1f] dark:text-[#e3e3e3] text-center leading-relaxed font-medium">
                 Your history is now completely integrated. Google Rhythm's predictive engine will start using this data immediately.
               </p>
            </div>
          </div>
        )}
      </div>

      {/* Sticky Bottom Bar for Actions iOS */}
      {(step === 'upload' || step === 'preview' || step === 'done') && (
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-white/80 dark:bg-[#121212]/80 backdrop-saturate-150 backdrop-blur-2xl border-t border-slate-200/60 dark:border-white/10 z-20 pointer-events-none">
          
          <div className="pointer-events-auto">
            {step === 'upload' && (
              <label className="block w-full cursor-pointer group">
                <div className="w-full py-4 rounded-[14px] bg-[#007AFF] flex items-center justify-center gap-3 active:scale-[0.98] transition-transform">
                  <Upload className="w-5 h-5 text-white" />
                  <span className="text-[17px] font-semibold text-white">Select File to Upload</span>
                </div>
                <input 
                  ref={fileInputRef}
                  type="file" 
                  accept="*/*" 
                  className="hidden" 
                  onChange={handleFileSelect} 
                />
              </label>
            )}

            {step === 'preview' && (
              <div className="flex gap-4">
                <button 
                  onClick={() => { setStep('upload'); setParsedLogs([]); setAiMapping(null); setError(''); }}
                  className="flex-1 py-4 rounded-[14px] text-[17px] font-semibold bg-[#e5e5ea] dark:bg-[#2c2c2e] text-black dark:text-white active:scale-[0.98] transition-transform"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleImport}
                  className="flex-[2] py-4 rounded-[14px] text-[17px] font-semibold bg-[#007AFF] text-white active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
                >
                  Import All <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            )}

            {step === 'done' && (
              <button 
                onClick={onClose}
                className="w-full py-4 rounded-[14px] text-[17px] font-semibold bg-[#007AFF] text-white active:scale-[0.98] transition-transform"
              >
                Finish & Return
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
