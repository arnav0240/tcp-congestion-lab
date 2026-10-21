import React from 'react';
import {
  Layers,
  ArrowRight,
  Wifi,
  Globe,
  Radio,
  Server,
  Zap,
  Gauge,
  Sliders
} from 'lucide-react';
import { ScenarioPreset } from '../types/api';

interface ScenariosPageProps {
  scenarios: ScenarioPreset[];
  onLoadScenario: (scenarioId: string) => void;
}

const SCENARIO_ICONS: Record<string, React.ReactNode> = {
  low_latency_lan: <Server className="w-5 h-5 text-cyan-400" />,
  high_bdp_lfn: <Globe className="w-5 h-5 text-blue-400" />,
  lossy_wireless: <Wifi className="w-5 h-5 text-purple-400" />,
  congested_bottleneck: <Radio className="w-5 h-5 text-amber-400" />,
  bufferbloat_study: <Gauge className="w-5 h-5 text-red-400" />,
  dynamic_bandwidth: <Zap className="w-5 h-5 text-emerald-400" />,
  custom: <Sliders className="w-5 h-5 text-slate-400" />,
};

export const ScenariosPage: React.FC<ScenariosPageProps> = ({ scenarios, onLoadScenario }) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="telemetry-card p-6">
        <div className="max-w-2xl space-y-2">
          <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded-full bg-cyan-950 border border-cyan-800 text-[11px] font-mono text-cyan-400">
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span>STANDARDIZED BENCHMARK REGIMES</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">
            Pre-Configured Network Study Scenarios
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            Select any network scenario below to automatically populate the simulator with standard parameters
            tailored to explore specific trade-offs like bufferbloat, high-BDP recovery, or wireless loss sensitivity.
          </p>
        </div>
      </div>

      {/* Grid of 7 Scenarios */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {scenarios.map((sc) => {
          const icon = SCENARIO_ICONS[sc.id] || <Layers className="w-5 h-5 text-cyan-400" />;
          return (
            <div
              key={sc.id}
              className="telemetry-card p-5 flex flex-col justify-between hover:border-cyan-700/80 transition group"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                    {icon}
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                    {sc.id}
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-white group-hover:text-cyan-300 transition">
                    {sc.name}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    {sc.description}
                  </p>
                </div>

                {/* Constraint Badges */}
                <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
                  <div>
                    <span className="text-[10px] text-slate-500 block">Bandwidth</span>
                    <span className="text-cyan-400 font-semibold">{sc.bandwidth_mbps} Mbps</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Base RTT</span>
                    <span className="text-slate-300 font-semibold">{sc.base_rtt_ms} ms</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Loss Rate</span>
                    <span className={sc.packet_loss_rate > 0 ? 'text-red-400 font-semibold' : 'text-emerald-400 font-semibold'}>
                      {(sc.packet_loss_rate * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Queue Limit</span>
                    <span className="text-amber-400 font-semibold">{sc.queue_limit_packets} pkts</span>
                  </div>
                </div>

                {/* Research Question */}
                <div className="text-[11px] text-slate-300 italic bg-cyan-950/20 border border-cyan-900/40 p-2.5 rounded-lg">
                  <span className="font-semibold text-cyan-400 not-italic block text-[10px] uppercase font-mono mb-0.5">
                    Research Objective:
                  </span>
                  "{sc.research_question}"
                </div>
              </div>

              {/* Action Button */}
              <div className="mt-4 pt-3 border-t border-slate-800/80">
                <button
                  onClick={() => onLoadScenario(sc.id)}
                  className="w-full py-2 px-3 rounded-lg bg-slate-800 hover:bg-cyan-600 text-slate-200 hover:text-white text-xs font-mono font-medium flex items-center justify-center space-x-1.5 transition"
                >
                  <span>Load into Simulator</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
