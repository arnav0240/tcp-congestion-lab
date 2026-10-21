import React, { useState, useEffect } from 'react';
import {
  LineChart as LineChartIcon,
  Activity,
  Layers,
  Clock,
  Filter,
  RefreshCw,
  Info
} from 'lucide-react';
import {
  ExperimentDetail,
  ExperimentSummaryItem,
  TimeSeriesPoint
} from '../types/api';
import { fetchExperimentTimeSeries } from '../api/client';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar
} from 'recharts';

interface TimeSeriesPageProps {
  currentExperiment: ExperimentDetail | null;
  allExperiments: ExperimentSummaryItem[];
  onSelectExperiment: (id: string) => void;
  onNavigate: (tab: any, expId?: string) => void;
}

const ALGO_COLORS: Record<string, string> = {
  reno: '#38bdf8',
  newreno: '#a855f7',
  cubic: '#06b6d4',
  bbr: '#10b981',
};

export const TimeSeriesPage: React.FC<TimeSeriesPageProps> = ({
  currentExperiment,
  allExperiments,
  onSelectExperiment,
  onNavigate,
}) => {
  const [points, setPoints] = useState<TimeSeriesPoint[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!currentExperiment) return;
    setLoading(true);
    setError(null);
    fetchExperimentTimeSeries(currentExperiment.id)
      .then((data) => setPoints(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [currentExperiment?.id]);

  if (!currentExperiment) {
    return (
      <div className="telemetry-card p-12 text-center space-y-4">
        <LineChartIcon className="w-12 h-12 text-slate-600 mx-auto" />
        <h2 className="text-base font-bold text-white">No Experiment Selected for Time-Series Analysis</h2>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          Please run a simulation or select an experiment to visualize fine-grained telemetry.
        </p>
      </div>
    );
  }

  // Transform points for multi-line charting
  // Each point has `flows: { "0": { algorithm: "reno", throughput_mbps, goodput_mbps, cwnd, rtt_ms, ... } }`
  const formattedData = points.map((p) => {
    const row: any = {
      timestamp: p.timestamp,
      queue_packets: p.router_queue_packets,
      queue_pct: p.router_queue_pct,
      bottleneck_bw: p.bottleneck_bandwidth_mbps,
      total_throughput: p.total_throughput_mbps,
    };

    Object.entries(p.flows || {}).forEach(([fid, f]: [string, any]) => {
      const aName = (f.algorithm || 'flow').toLowerCase();
      row[`${aName}_goodput`] = f.goodput_mbps;
      row[`${aName}_cwnd`] = f.cwnd;
      row[`${aName}_rtt`] = f.rtt_ms;
      row[`${aName}_pacing`] = f.pacing_rate_mbps;
      row[`${aName}_qd`] = f.queueing_delay_ms;
      row[`${aName}_drops_q`] = f.drops_queue;
      row[`${aName}_drops_rnd`] = f.drops_random;
      row[`${aName}_retx`] = f.retransmissions;
    });

    return row;
  });

  const activeAlgos = currentExperiment.algorithms || ['reno'];

  return (
    <div className="space-y-6">
      {/* Top Header / Selector */}
      <div className="telemetry-card p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <LineChartIcon className="w-5 h-5 text-cyan-400" />
          <div>
            <h1 className="text-base font-bold text-white">Telemetry & Time-Series Observations</h1>
            <p className="text-xs text-slate-400 font-mono">
              High-resolution 100ms epoch sampling | Duration: {currentExperiment.duration_seconds}s | Samples: {points.length}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <span className="text-xs font-mono text-slate-400">Experiment:</span>
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
      </div>

      {loading && (
        <div className="telemetry-card p-12 text-center text-xs font-mono text-cyan-400 animate-pulse">
          Loading telemetry stream...
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-950/60 border border-red-800 rounded-xl text-xs text-red-300 font-mono">
          {error}
        </div>
      )}

      {!loading && points.length > 0 && (
        <div className="space-y-6">
          {/* Chart 1: Goodput & Delivery Rate over Time */}
          <div className="telemetry-card p-5 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div>
                <h3 className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wide">
                  Application Goodput vs Time (Mbps)
                </h3>
                <p className="text-[11px] text-slate-400 font-mono">
                  Unique application payload delivery rate (excluding retransmissions and overhead)
                </p>
              </div>
              <span className="text-[10px] font-mono text-slate-500">Unit: Mbps</span>
            </div>

            <div className="h-64 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={formattedData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="timestamp" stroke="#64748b" fontSize={11} fontFamily="monospace" unit="s" />
                  <YAxis stroke="#64748b" fontSize={11} fontFamily="monospace" unit="M" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px', fontFamily: 'monospace' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace', paddingTop: '8px' }} />
                  {activeAlgos.map((a) => (
                    <Line
                      key={a}
                      type="monotone"
                      dataKey={`${a.toLowerCase()}_goodput`}
                      name={`TCP ${a.toUpperCase()} Goodput`}
                      stroke={ALGO_COLORS[a.toLowerCase()] || '#06b6d4'}
                      strokeWidth={2}
                      dot={false}
                    />
                  ))}
                  <Line
                    type="stepAfter"
                    dataKey="bottleneck_bw"
                    name="Bottleneck Capacity"
                    stroke="#475569"
                    strokeDasharray="4 4"
                    strokeWidth={1.5}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Congestion Window (cwnd) & BBR Pacing Rate */}
          <div className="telemetry-card p-5 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div>
                <h3 className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wide">
                  Congestion Window (cwnd) & Pacing Evolution
                </h3>
                <p className="text-[11px] text-slate-400 font-mono">
                  Evolution of cwnd (in MSS packets) and BBR rate pacer
                </p>
              </div>
              <span className="text-[10px] font-mono text-slate-500">MSS = 1460 B</span>
            </div>

            <div className="h-64 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={formattedData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="timestamp" stroke="#64748b" fontSize={11} fontFamily="monospace" unit="s" />
                  <YAxis stroke="#64748b" fontSize={11} fontFamily="monospace" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px', fontFamily: 'monospace' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace', paddingTop: '8px' }} />
                  {activeAlgos.map((a) => (
                    <Line
                      key={a}
                      type="monotone"
                      dataKey={`${a.toLowerCase()}_cwnd`}
                      name={`TCP ${a.toUpperCase()} cwnd (pkts)`}
                      stroke={ALGO_COLORS[a.toLowerCase()] || '#06b6d4'}
                      strokeWidth={2}
                      dot={false}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 3: Measured RTT & Queueing Delay (Bufferbloat Analysis) */}
          <div className="telemetry-card p-5 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div>
                <h3 className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wide">
                  Round-Trip Time & Latency Inflation (ms)
                </h3>
                <p className="text-[11px] text-slate-400 font-mono">
                  Exposes standing queue delay vs base propagation RTT ({currentExperiment.base_rtt_ms} ms)
                </p>
              </div>
              <span className="text-[10px] font-mono text-slate-500">Unit: ms</span>
            </div>

            <div className="h-64 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={formattedData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="timestamp" stroke="#64748b" fontSize={11} fontFamily="monospace" unit="s" />
                  <YAxis stroke="#64748b" fontSize={11} fontFamily="monospace" unit="ms" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px', fontFamily: 'monospace' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace', paddingTop: '8px' }} />
                  {activeAlgos.map((a) => (
                    <Line
                      key={a}
                      type="monotone"
                      dataKey={`${a.toLowerCase()}_rtt`}
                      name={`TCP ${a.toUpperCase()} RTT`}
                      stroke={ALGO_COLORS[a.toLowerCase()] || '#06b6d4'}
                      strokeWidth={2}
                      dot={false}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 4: Router FIFO Queue Occupancy */}
          <div className="telemetry-card p-5 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div>
                <h3 className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wide">
                  Bottleneck Router Buffer Occupancy (Packets)
                </h3>
                <p className="text-[11px] text-slate-400 font-mono">
                  Current packets in DropTail router buffer (Max limit: {currentExperiment.queue_limit_packets} packets)
                </p>
              </div>
              <span className="text-[10px] font-mono text-amber-400">Buffer: {currentExperiment.queue_limit_packets} pkts</span>
            </div>

            <div className="h-56 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={formattedData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="timestamp" stroke="#64748b" fontSize={11} fontFamily="monospace" unit="s" />
                  <YAxis stroke="#64748b" fontSize={11} fontFamily="monospace" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px', fontFamily: 'monospace' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="queue_packets"
                    name="Queue Packets"
                    stroke="#f59e0b"
                    fill="rgba(245, 158, 11, 0.15)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
