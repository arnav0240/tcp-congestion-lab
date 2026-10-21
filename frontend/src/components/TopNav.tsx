import React, { useState } from 'react';
import { Activity, Cpu, ShieldCheck, HelpCircle, Terminal, RefreshCw } from 'lucide-react';
import { SystemHealth } from '../types/api';

interface TopNavProps {
  health: SystemHealth | null;
  onRefreshHealth: () => void;
  onOpenViva: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({ health, onRefreshHealth, onOpenViva }) => {
  const [showEngineInfo, setShowEngineInfo] = useState(false);

  const isHealthy = health?.status === 'healthy';
  const isNs3 = health?.engine?.active_mode === 'ns3';

  return (
    <header className="h-16 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-40">
      {/* Brand & Subtitle */}
      <div className="flex items-center space-x-3">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-cyan-600 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-500/20">
          <Activity className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <span className="font-mono font-bold text-base tracking-wider text-white">TCP RESEARCH LAB</span>
            <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
              v1.0 Academic
            </span>
          </div>
          <p className="text-xs text-slate-400 hidden sm:block">
            Performance Analysis of TCP Congestion Control under Varying Network Conditions
          </p>
        </div>
      </div>

      {/* Center / Right Badges */}
      <div className="flex items-center space-x-3">
        {/* Simulation Engine Mode Badge */}
        <div className="relative">
          <button
            onClick={() => setShowEngineInfo(!showEngineInfo)}
            className={`flex items-center space-x-2 text-xs font-mono px-3 py-1.5 rounded-lg border transition-all ${
              isNs3
                ? 'bg-emerald-950/60 border-emerald-700/80 text-emerald-300 hover:bg-emerald-900/60'
                : 'bg-cyan-950/60 border-cyan-700/80 text-cyan-300 hover:bg-cyan-900/60'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span className="hidden md:inline font-semibold">ENGINE:</span>
            <span>{isNs3 ? 'Native NS-3' : 'Educational Discrete-Event'}</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-1" />
          </button>

          {/* Engine Info Dropdown */}
          {showEngineInfo && (
            <div className="absolute right-0 mt-2 w-80 bg-slate-900 border border-slate-700 rounded-xl p-4 shadow-2xl z-50 text-xs">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
                <span className="font-semibold text-slate-200">Simulation Engine Status</span>
                <span className="font-mono text-[10px] text-cyan-400">
                  {isNs3 ? 'ns-3 Native' : 'Python Model'}
                </span>
              </div>
              <p className="text-slate-300 mb-2 leading-relaxed">
                {health?.engine?.message ||
                  'Bundled deterministic Discrete-Event simulator with RFC 5681 (Reno), RFC 6582 (NewReno), RFC 9438 (CUBIC), and BBR model-based pacing.'}
              </p>
              <div className="bg-slate-950 p-2 rounded border border-slate-800 font-mono text-[11px] text-slate-400 space-y-1">
                <div>Active Mode: <span className="text-cyan-400">{health?.engine?.active_mode || 'educational_sim'}</span></div>
                <div>NS-3 Host Binary: <span className="text-amber-400">{health?.engine?.ns3_available ? 'Detected' : 'Not installed'}</span></div>
                <div>Reproducibility: <span className="text-emerald-400">Matched Seed Deterministic</span></div>
              </div>
              <button
                onClick={() => setShowEngineInfo(false)}
                className="mt-3 w-full py-1 text-center bg-slate-800 hover:bg-slate-700 rounded text-slate-300 transition"
              >
                Close
              </button>
            </div>
          )}
        </div>

        {/* Backend Health LED */}
        <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300">
          <span className={`w-2 h-2 rounded-full ${isHealthy ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]' : 'bg-red-500'}`} />
          <span className="hidden sm:inline">{isHealthy ? 'API ONLINE' : 'DISCONNECTED'}</span>
          <button
            onClick={onRefreshHealth}
            title="Refresh API Health"
            className="text-slate-500 hover:text-slate-300 ml-1 p-0.5 rounded transition"
          >
            <RefreshCw className="w-3 h-3" />
          </button>
        </div>

        {/* Viva Defense Cheatsheet Launcher Button */}
        <button
          onClick={onOpenViva}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-indigo-950/70 border border-indigo-700/80 text-indigo-300 hover:bg-indigo-900 text-xs font-medium transition"
        >
          <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
          <span className="hidden sm:inline">Viva Q&A</span>
        </button>
      </div>
    </header>
  );
};
