import React, { useState } from 'react';
import {
  GitCompare,
  TrendingUp,
  Award,
  Layers,
  Sparkles,
  Download,
  AlertTriangle,
  ArrowUpDown,
  Filter
} from 'lucide-react';
import { ExperimentDetail, ExperimentSummaryItem } from '../types/api';
import { ExportDropdown } from '../components/ExportDropdown';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ErrorBar,
  Legend
} from 'recharts';

interface ComparePageProps {
  currentExperiment: ExperimentDetail | null;
  allExperiments: ExperimentSummaryItem[];
  onSelectExperiment: (id: string) => void;
  onNavigate: (tab: any, expId?: string) => void;
}

const METRIC_OPTIONS = [
  { id: 'goodput', name: 'Application Goodput (Mbps)', key: 'mean_goodput_mbps', stdKey: 'std_goodput_mbps', higherBetter: true, unit: 'Mbps' },
  { id: 'throughput', name: 'Total Throughput (Mbps)', key: 'mean_throughput_mbps', stdKey: 'std_throughput_mbps', higherBetter: true, unit: 'Mbps' },
  { id: 'avg_rtt', name: 'Average RTT (Latency)', key: 'mean_avg_rtt_ms', stdKey: 'std_avg_rtt_ms', higherBetter: false, unit: 'ms' },
  { id: 'p95_rtt', name: '95th% Tail RTT (Latency)', key: 'mean_p95_rtt_ms', stdKey: null, higherBetter: false, unit: 'ms' },
  { id: 'total_drops', name: 'Total Packet Drops', key: 'mean_total_drops', stdKey: null, higherBetter: false, unit: 'drops' },
  { id: 'retransmissions', name: 'Retransmissions', key: 'mean_retransmissions', stdKey: null, higherBetter: false, unit: 'pkts' },
  { id: 'utilization', name: 'Bandwidth Utilization', key: 'mean_utilization_pct', stdKey: null, higherBetter: true, unit: '%' },
  { id: 'fairness', name: "Jain's Fairness Index", key: 'mean_jain_fairness', stdKey: null, higherBetter: true, unit: '' },
];

const ALGO_COLORS: Record<string, string> = {
  reno: '#38bdf8',
  newreno: '#a855f7',
  cubic: '#06b6d4',
  bbr: '#10b981',
};

export const ComparePage: React.FC<ComparePageProps> = ({
  currentExperiment,
  allExperiments,
  onSelectExperiment,
  onNavigate,
}) => {
  const [selectedMetricId, setSelectedMetricId] = useState<string>('goodput');

  const activeMetric = METRIC_OPTIONS.find((m) => m.id === selectedMetricId) || METRIC_OPTIONS[0];

  if (!currentExperiment) {
    return (
      <div className="telemetry-card p-12 text-center space-y-4">
        <GitCompare className="w-12 h-12 text-slate-600 mx-auto" />
        <h2 className="text-base font-bold text-white">No Experiment Selected for Comparison</h2>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          Please run a new simulation in the Simulator page or select an existing experiment from the history.
        </p>
        <button
          onClick={() => onNavigate('simulator')}
          className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-mono font-medium transition"
        >
          Open Simulator &rarr;
        </button>
      </div>
    );
  }

  const summaries = currentExperiment.metrics_summary || {};

  // Build ranking items
  const tableRows = Object.entries(summaries).map(([algoId, data]) => {
    const val = (data as any)[activeMetric.key];
    const std = activeMetric.stdKey ? (data as any)[activeMetric.stdKey] : 0;
    return {
      algoId,
      name: `TCP ${algoId.toUpperCase()}`,
      color: ALGO_COLORS[algoId.toLowerCase()] || '#06b6d4',
      value: typeof val === 'number' ? val : null,
      std: typeof std === 'number' ? std : 0,
      data,
    };
  });

  // Sort rows based on higher_is_better
  tableRows.sort((a, b) => {
    if (a.value === null) return 1;
    if (b.value === null) return -1;
    return activeMetric.higherBetter ? b.value - a.value : a.value - b.value;
  });

  // Prepare Chart Data
  const chartData = tableRows
    .filter((r) => r.value !== null)
    .map((r) => ({
      name: r.algoId.toUpperCase(),
      value: r.value,
      std: r.std,
      color: r.color,
    }));

  return (
    <div className="space-y-6">
      {/* Top Controls: Experiment Selector, Metric Filter, Export Dropdown */}
      <div className="telemetry-card p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-mono text-slate-400">Study:</span>
            <select
              value={currentExperiment.id}
              onChange={(e) => onSelectExperiment(e.target.value)}
              className="bg-slate-950 border border-slate-700 text-xs text-white rounded-lg px-3 py-1.5 font-mono focus:border-cyan-500 focus:outline-none"
            >
              {allExperiments.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.title} ({e.scenario_name})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono text-slate-400">Rank By:</span>
            <select
              value={selectedMetricId}
              onChange={(e) => setSelectedMetricId(e.target.value)}
              className="bg-slate-950 border border-slate-700 text-xs text-cyan-400 font-semibold rounded-lg px-3 py-1.5 font-mono focus:border-cyan-500 focus:outline-none"
            >
              {METRIC_OPTIONS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} {m.higherBetter ? '(Higher Better)' : '(Lower Better)'}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => onNavigate('timeseries', currentExperiment.id)}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-mono transition"
          >
            Time-Series View &rarr;
          </button>
          <ExportDropdown experimentId={currentExperiment.id} />
        </div>
      </div>

      {/* Main Grid: Comparison Chart (Left) + Ranked Table (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Visual Chart with Error Bars (5 Cols) */}
        <div className="lg:col-span-5 telemetry-card p-5 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div>
              <h3 className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wide">
                {activeMetric.name}
              </h3>
              <p className="text-[11px] text-slate-400 font-mono">
                {activeMetric.higherBetter ? '▲ Higher values indicate superior performance' : '▼ Lower values indicate superior performance'}
              </p>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
              {currentExperiment.repetitions} Trial(s)
            </span>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 15, right: 15, left: -10, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} fontFamily="monospace" />
                <YAxis stroke="#64748b" fontSize={11} fontFamily="monospace" unit={activeMetric.unit === 'Mbps' ? 'M' : ''} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px', fontFamily: 'monospace' }}
                  formatter={(val: any) => [`${val} ${activeMetric.unit}`, activeMetric.name]}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Column: Ranked Comparison Table (7 Cols) */}
        <div className="lg:col-span-7 telemetry-card p-5 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <h3 className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wide">
              Ranked Algorithm Performance
            </h3>
            <span className="text-[11px] font-mono text-cyan-400">
              Ranked by {activeMetric.name}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="text-[10px] text-slate-500 uppercase bg-slate-950/60">
                <tr>
                  <th className="py-2 px-2.5">Rank</th>
                  <th className="py-2 px-2.5">Algorithm</th>
                  <th className="py-2 px-2.5 text-right">{activeMetric.name}</th>
                  <th className="py-2 px-2.5 text-right">Goodput</th>
                  <th className="py-2 px-2.5 text-right">Avg RTT</th>
                  <th className="py-2 px-2.5 text-right">Drops</th>
                  <th className="py-2 px-2.5 text-right">Fairness</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {tableRows.map((row, idx) => (
                  <tr key={row.algoId} className="hover:bg-slate-800/40 transition">
                    <td className="py-2.5 px-2.5 font-bold">
                      {idx === 0 ? (
                        <span className="inline-flex items-center space-x-1 text-amber-400">
                          <Award className="w-3.5 h-3.5" />
                          <span>#1</span>
                        </span>
                      ) : (
                        <span className="text-slate-500">#{idx + 1}</span>
                      )}
                    </td>
                    <td className="py-2.5 px-2.5">
                      <div className="flex items-center space-x-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: row.color }} />
                        <span className="font-bold text-white">{row.name}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-2.5 text-right font-bold text-cyan-400">
                      {row.value !== null ? `${row.value} ${activeMetric.unit}` : 'N/A'}
                    </td>
                    <td className="py-2.5 px-2.5 text-right text-slate-300">
                      {row.data.mean_goodput_mbps} Mbps
                    </td>
                    <td className="py-2.5 px-2.5 text-right text-slate-300">
                      {row.data.mean_avg_rtt_ms} ms
                    </td>
                    <td className="py-2.5 px-2.5 text-right text-slate-400">
                      {row.data.mean_total_drops}
                    </td>
                    <td className="py-2.5 px-2.5 text-right text-slate-400">
                      {row.data.mean_jain_fairness !== null ? row.data.mean_jain_fairness : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Automated Evidence-Based Scientific Interpretation Box */}
      <div className="telemetry-card p-6 border-cyan-800/50 bg-gradient-to-br from-slate-900 to-cyan-950/20 space-y-3">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-5 h-5 text-cyan-400" />
          <h3 className="text-sm font-bold font-mono text-cyan-300 uppercase tracking-wider">
            Automated Scientific Interpretation & Synthesis
          </h3>
        </div>

        <div className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans space-y-3 whitespace-pre-line border-t border-slate-800 pt-3">
          {currentExperiment.automated_interpretation || (
            <p className="text-slate-500 italic">No automated interpretation synthesized for this run.</p>
          )}
        </div>
      </div>
    </div>
  );
};
