import React, { useState, useEffect, useRef } from 'react';
import { FileText, Download, X, Loader2, Stethoscope, AlertCircle } from 'lucide-react';
import { generateClinicalReport } from '../services/nimService';
import { getLocalLogs } from '../services/db';
import { useAppStore } from '../store/useAppStore';

export default function DoctorReportModal({ onClose }) {
  const { userPrefs } = useAppStore();
  const [report, setReport] = useState(null);
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const reportRef = useRef(null);

  useEffect(() => {
    async function fetchReport() {
      try {
        // 1. Fetch all logs
        const allLogs = await getLocalLogs();
        setLogs(allLogs);

        if (allLogs.length === 0) {
          throw new Error("You don't have enough logged data to generate a clinical report yet. Please log some symptoms first.");
        }

        // 2. Condense logs to reduce context window
        // Only take the last 90 logs
        const recentLogs = allLogs.slice(0, 90).map(log => ({
          date: log.date,
          flow: log.flow,
          symptoms: log.symptoms,
          giSymptoms: log.giSymptoms,
          pain: log.painDetails ? `${log.painDetails.score}/10` : 'None',
          painImpacts: log.painDetails?.impacts || [],
          meds: log.painDetails?.medsHelped || 'None',
          mood: log.mood
        }));

        // 3. Generate on-screen report via NIM (existing flow)
        const generatedReport = await generateClinicalReport(recentLogs, userPrefs);
        setReport(generatedReport);
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }

    fetchReport();
  }, [userPrefs]);

  // Auto-trigger print when report is ready
  useEffect(() => {
    if (report && !isLoading && !error) {
      setTimeout(() => {
        window.print();
        onClose(); // Hide the headless component
      }, 500);
    }
  }, [report, isLoading, error, onClose]);

  // Handle errors
  useEffect(() => {
    if (error) {
      alert(error);
      onClose();
    }
  }, [error, onClose]);

  if (!report) return null;

  const recentLogsExtract = logs.slice(0, 15);
  const startDate = logs.length > 0 ? new Date(logs[logs.length-1].date).toLocaleDateString() : 'N/A';
  const endDate = logs.length > 0 ? new Date(logs[0].date).toLocaleDateString() : 'N/A';
  const lifecycleMap = { cycle: 'Menstrual Cycle', pregnancy: 'Pregnancy', perimenopause: 'Perimenopause', postpartum: 'Postpartum' };
  const phaseDisplay = lifecycleMap[userPrefs?.lifecycleMode] || 'Menstrual Cycle';

  return (
    <div className="hidden print:block print:w-full print:static print:bg-white print:z-[9999] print:opacity-100">
      <style>
        {`
          @media print {
            body * { visibility: hidden; }
            .print-container, .print-container * { visibility: visible; }
            .print-container { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 0; box-shadow: none !important; border: none !important; }
            * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            @page { size: portrait; margin: 15mm; }
          }
        `}
      </style>
      <div className="print-container bg-white text-black font-sans w-full max-w-[850px] mx-auto text-[13px] leading-relaxed">
        
        {/* Letterhead Header */}
        <div className="border-b-[3px] border-[#1a73e8] pb-4 mb-6 flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-black tracking-tighter text-[#1a73e8] m-0 leading-none">Google Rhythm</h1>
            <p className="text-[12px] font-bold text-gray-500 uppercase tracking-widest mt-1">Confidential Medical Report</p>
          </div>
          <div className="text-right">
            <p className="font-bold text-gray-800 m-0">Generated: {new Date().toLocaleDateString()}</p>
            <p className="text-gray-500 m-0">For Healthcare Provider Use Only</p>
          </div>
        </div>

        {/* Demographics Box */}
        <div className="flex gap-6 bg-[#f8f9fa] border border-[#e8eaed] rounded-lg p-5 mb-8 shadow-sm">
          <div className="flex-1">
            <p className="text-[10px] uppercase text-gray-500 font-bold tracking-wider m-0">Patient Name</p>
            <p className="text-[16px] font-bold text-gray-900 m-0 mt-0.5">{userPrefs?.name || 'Anonymous Patient'}</p>
          </div>
          <div className="flex-1">
            <p className="text-[10px] uppercase text-gray-500 font-bold tracking-wider m-0">Lifecycle Phase</p>
            <p className="text-[15px] font-bold text-gray-900 m-0 mt-0.5">{phaseDisplay}</p>
          </div>
          <div className="flex-1">
            <p className="text-[10px] uppercase text-gray-500 font-bold tracking-wider m-0">Reporting Period</p>
            <p className="text-[14px] font-bold text-gray-900 m-0 mt-0.5">{startDate} — {endDate}</p>
          </div>
          <div className="flex-1">
            <p className="text-[10px] uppercase text-gray-500 font-bold tracking-wider m-0">Total Logs</p>
            <p className="text-[15px] font-bold text-[#1a73e8] m-0 mt-0.5">{logs.length} entries</p>
          </div>
        </div>

        {/* Clinical Narrative */}
        <div className="mb-8">
          <div className="flex items-center gap-2 border-b border-gray-300 pb-1 mb-3">
            <div className="w-1.5 h-4 bg-[#1a73e8]"></div>
            <h2 className="text-[15px] font-black uppercase tracking-wide text-gray-900 m-0">Clinical Narrative Summary</h2>
          </div>
          <div className="text-gray-800 leading-[1.7] text-[14px] text-justify">
            {report.overview}
          </div>
        </div>

        {/* Two-Column Layout for Findings and Discussion */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          
          {/* Key Findings */}
          <div>
            <div className="flex items-center gap-2 border-b border-gray-300 pb-1 mb-3">
              <div className="w-1.5 h-4 bg-teal-600"></div>
              <h2 className="text-[15px] font-black uppercase tracking-wide text-gray-900 m-0">Key Recurring Patterns</h2>
            </div>
            <ul className="space-y-2 m-0 pl-0 list-none">
              {report.key_patterns?.map((pattern, idx) => (
                <li key={idx} className="flex items-start gap-2 text-gray-800 text-[13px] leading-snug">
                  <span className="text-teal-600 font-bold shrink-0 mt-0.5">•</span>
                  <span>{pattern}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Action Plan */}
          <div>
            <div className="flex items-center gap-2 border-b border-gray-300 pb-1 mb-3">
              <div className="w-1.5 h-4 bg-indigo-600"></div>
              <h2 className="text-[15px] font-black uppercase tracking-wide text-gray-900 m-0">Recommended Discussion Points</h2>
            </div>
            <ul className="space-y-2 m-0 pl-0 list-none">
              {report.discussion_points?.map((pt, idx) => (
                <li key={idx} className="flex items-start gap-2 text-gray-800 text-[13px] leading-snug">
                  <span className="text-indigo-600 font-bold shrink-0 mt-0.5">→</span>
                  <span className="font-medium">{pt}</span>
                </li>
              ))}
            </ul>
          </div>

        </div>

        {/* Pain & Impact Box */}
        <div className="mb-8 bg-[#fff5f5] border border-[#fecaca] p-4 rounded text-[#7f1d1d]">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <h3 className="font-bold text-[14px] uppercase tracking-wide m-0">Pain & Functional Impact Alert</h3>
          </div>
          <p className="m-0 text-[13px] leading-relaxed font-medium">
            {report.pain_analysis}
          </p>
        </div>

        {/* Data Extract Table */}
        <div className="mb-8">
          <div className="flex items-center gap-2 border-b border-gray-300 pb-1 mb-3">
            <div className="w-1.5 h-4 bg-gray-600"></div>
            <h2 className="text-[15px] font-black uppercase tracking-wide text-gray-900 m-0">Recent Telemetry Extract (Last 15 Entries)</h2>
          </div>
          <table className="w-full text-left border-collapse border border-gray-300 text-[11px]">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 p-2 font-bold w-[12%]">Date</th>
                <th className="border border-gray-300 p-2 font-bold w-[15%]">Flow / Output</th>
                <th className="border border-gray-300 p-2 font-bold w-[45%]">Symptoms Logged</th>
                <th className="border border-gray-300 p-2 font-bold">Pain Score</th>
                <th className="border border-gray-300 p-2 font-bold">Mood</th>
              </tr>
            </thead>
            <tbody>
              {recentLogsExtract.map((log, idx) => (
                <tr key={idx} className="even:bg-gray-50">
                  <td className="border border-gray-300 p-2 whitespace-nowrap">{new Date(log.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</td>
                  <td className="border border-gray-300 p-2 capitalize">{log.flow || 'None'}</td>
                  <td className="border border-gray-300 p-2">
                    {[...(log.symptoms || []), ...(log.giSymptoms || [])].join(', ') || 'None reported'}
                  </td>
                  <td className="border border-gray-300 p-2">{log.painDetails ? `${log.painDetails.score}/10` : '—'}</td>
                  <td className="border border-gray-300 p-2 capitalize">{log.mood || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-[10px] text-gray-500 mt-1 italic">
            * Table displays a truncated subset of {logs.length} total logs. For full raw data export, use CSV format.
          </p>
        </div>

        {/* Footer */}
        <div className="border-t-[2px] border-gray-200 pt-3 mt-12 flex justify-between text-[10px] text-gray-500 font-medium">
          <div>
            <p className="m-0 font-bold text-gray-600">Google Rhythm — Health Intelligence Platform</p>
            <p className="m-0 mt-0.5">Disclaimer: This document is AI-generated from self-reported data and is not a clinical diagnosis.</p>
          </div>
          <div className="text-right">
            <p className="m-0 text-gray-400">Page 1 of 1</p>
          </div>
        </div>

      </div>
    </div>
  );
}
