import React from 'react';
import {
  Activity,
  Play,
  Layers,
  Clock,
  ArrowRight,
  TrendingUp,
  Server,
  Zap,
  CheckCircle,
  Database,
  BarChart3,
  Cpu
} from 'lucide-react';
import { ExperimentSummaryItem, ExperimentDetail, SystemHealth } from '../types/api';
import { MetricCard } from '../components/MetricCard';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface DashboardPageProps {
  health: SystemHealth | null;
  experiments: ExperimentSummaryItem[];
  latestExperiment: ExperimentDetail | null;
  onNavigate: (tab: any, expId?: string) => void;
}

const ALGO_COLORS: Record<string, string> = {
  reno: '#38bdf8',
  newreno: '#a855f7',
  cubic: '#06b6d4',
  bbr: '#10b981',
};

export const DashboardPage: React.FC<DashboardPageProps> = ({
  health,
  experiments,
  latestExperiment,
  onNavigate,
}) => {
  // Compute chart data from latest experiment if available
  const latestChartData = latestExperiment?.metrics_summary
    ? Object.entries(latestExperiment.metrics_summary).map(([algoId, data]) => ({
        algorithm: algoId.toUpperCase(),
        goodput: data.mean_goodput_mbps,
        color: ALGO_COLORS[algoId.toLowerCase()] || '#06b6d4',
      }))
    : [];

  return (
    <div className="space-y-6">
      {/* Top Banner / Hero */}
      <div className="telemetry-card p-6 bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950/40 border-slate-800">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded-full bg-cyan-950 border border-cyan-800 text-[11px] font-mono text-cyan-400">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              <span>ACADEMIC RESEARCH & BENCHMARKING LAB</span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-white">
              Performance Analysis of TCP Congestion Control
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
              An empirical research platform evaluating TCP Reno, NewReno, CUBIC, and BBR across
              varying bandwidths, delays, buffer limits, and channel packet loss.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => onNavigate('simulator')}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-medium text-xs shadow-lg shadow-cyan-500/20 transition"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Run New Experiment</span>
            </button>
            <button
              onClick={() => onNavigate('scenarios')}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium text-xs transition"
            >
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>Browse 7 Presets</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Counter Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          label="Total Experiments"
          value={experiments.length}
          subtext="Persisted in SQLite"
          icon={<Database className="w-4 h-4 text-cyan-400" />}
        />
        <MetricCard
          label="Active Engine"
          value={health?.engine?.active_mode === 'ns3' ? 'NS-3' : 'Discrete-Event'}
          subtext={health?.engine?.active_mode === 'ns3' ? 'Native C++ Simulation' : 'Deterministic Model'}
          icon={<Cpu className="w-4 h-4 text-emerald-400" />}
          colorClass={health?.engine?.active_mode === 'ns3' ? 'text-emerald-400' : 'text-cyan-400'}
        />
        <MetricCard
          label="Evaluated Models"
          value="4"
          subtext="Reno, NewReno, CUBIC, BBR"
          icon={<Activity className="w-4 h-4 text-purple-400" />}
          colorClass="text-purple-400"
        />
        <MetricCard
          label="Network Regimes"
          value="7"
          subtext="LAN, LFN, Wireless, Bloat..."
          icon={<Layers className="w-4 h-4 text-amber-400" />}
          colorClass="text-amber-400"
        />
      </div>

      {/* Recent Experiment Snapshot & Quick Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Latest Experiment Details */}
        <div className="lg:col-span-2 telemetry-card p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <BarChart3 className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                  Most Recent Experiment Result
                </h3>
              </div>
              {latestExperiment && (
                <button
                  onClick={() => onNavigate('compare', latestExperiment.id)}
                  className="text-xs text-cyan-400 hover:text-cyan-300 font-mono flex items-center space-x-1 transition"
                >
                  <span>Full Comparison</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {latestExperiment ? (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h4 className="font-semibold text-white text-base">{latestExperiment.title}</h4>
                    <p className="text-xs text-slate-400 font-mono">
                      Scenario: {latestExperiment.scenario_name} | Bottleneck: {latestExperiment.bandwidth_mbps} Mbps | RTT: {latestExperiment.base_rtt_ms} ms
                    </p>
                  </div>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800 text-cyan-300">
                    Mode: {latestExperiment.execution_mode}
                  </span>
                </div>

                {/* Quick Delivery Rate Chart */}
                <div className="h-44 w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={latestChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <XAxis dataKey="algorithm" stroke="#64748b" fontSize={11} fontFamily="monospace" />
                      <YAxis stroke="#64748b" fontSize={11} fontFamily="monospace" unit="M" />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px', fontFamily: 'monospace' }}
                        formatter={(val: any) => [`${val} Mbps`, 'Goodput']}
                      />
                      <Bar dataKey="goodput" radius={[4, 4, 0, 0]}>
                        {latestChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Automated Synthesis Preview */}
                {latestExperiment.automated_interpretation && (
                  <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-lg text-xs text-slate-300 space-y-1">
                    <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-wide block">
                      Automated Scientific Insight
                    </span>
                    <p className="line-clamp-2 text-slate-400">
                      {latestExperiment.automated_interpretation}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-12 text-center text-slate-500 text-xs">
                No experiments stored yet. Click "Run New Experiment" to launch the first simulation!
              </div>
            )}
          </div>

          {latestExperiment && (
            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs font-mono">
              <span className="text-slate-500">ID: {latestExperiment.id.slice(0, 8)}...</span>
              <div className="flex space-x-3">
                <button
                  onClick={() => onNavigate('timeseries', latestExperiment.id)}
                  className="text-cyan-400 hover:underline"
                >
                  View Time-Series &rarr;
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right: Quick Research Insights */}
        <div className="telemetry-card p-5 space-y-4">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-800">
            <Zap className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-300">
              Key Evaluation Criteria
            </h3>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl space-y-1">
              <div className="font-semibold text-sky-400">1. Goodput vs Random Loss</div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Notice how BBR retains ~90% throughput on 2.5% loss while Reno and CUBIC slash rates by over 70%.
              </p>
            </div>

            <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl space-y-1">
              <div className="font-semibold text-amber-400">2. Bufferbloat & Latency</div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                In deep 500-packet buffers, Reno inflates RTT from 30ms to 400ms+, while BBR keeps queue empty.
              </p>
            </div>

            <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl space-y-1">
              <div className="font-semibold text-purple-400">3. High-BDP Pipe Scalability</div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                On high bandwidth-delay links, CUBIC scales window as a cubic function of time, avoiding Reno's linear growth penalty.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Experiments Table */}
      <div className="telemetry-card p-5">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-300">
              Recent Experiment History
            </h3>
          </div>
          <button
            onClick={() => onNavigate('history')}
            className="text-xs text-cyan-400 hover:text-cyan-300 font-mono"
          >
            View All ({experiments.length}) &rarr;
          </button>
        </div>

        {experiments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="text-[11px] text-slate-500 uppercase bg-slate-950/50">
                <tr>
                  <th className="py-2 px-3">Title</th>
                  <th className="py-2 px-3">Scenario</th>
                  <th className="py-2 px-3">Bandwidth</th>
                  <th className="py-2 px-3">Base RTT</th>
                  <th className="py-2 px-3">Loss Rate</th>
                  <th className="py-2 px-3">Repetitions</th>
                  <th className="py-2 px-3">Status</th>
                  <th className="py-2 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {experiments.slice(0, 5).map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-2.5 px-3 font-semibold text-white">{exp.title}</td>
                    <td className="py-2.5 px-3 text-slate-300">{exp.scenario_name}</td>
                    <td className="py-2.5 px-3 text-cyan-400">{exp.bandwidth_mbps} Mbps</td>
                    <td className="py-2.5 px-3 text-slate-300">{exp.base_rtt_ms} ms</td>
                    <td className="py-2.5 px-3 text-slate-300">{(exp.packet_loss_rate * 100).toFixed(1)}%</td>
                    <td className="py-2.5 px-3 text-slate-400">{exp.repetitions}x</td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800">
                        {exp.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right space-x-2">
                      <button
                        onClick={() => onNavigate('compare', exp.id)}
                        className="text-cyan-400 hover:text-cyan-300"
                      >
                        Compare
                      </button>
                      <button
                        onClick={() => onNavigate('timeseries', exp.id)}
                        className="text-slate-400 hover:text-slate-200"
                      >
                        Telemetry
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-8 text-center text-slate-500 text-xs">
            No history recorded yet.
          </div>
        )}
      </div>
    </div>
  );
};
