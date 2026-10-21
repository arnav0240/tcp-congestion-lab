import React, { useState, useEffect } from 'react';
import {
  Sliders,
  Play,
  RotateCcw,
  Check,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  Sparkles,
  Info
} from 'lucide-react';
import {
  ScenarioPreset,
  ExperimentCreateParams,
  ExperimentDetail,
  BandwidthChangePoint
} from '../types/api';
import { TopologyVisualizer } from '../components/TopologyVisualizer';
import { createExperiment } from '../api/client';

interface SimulatorPageProps {
  scenarios: ScenarioPreset[];
  initialScenarioId?: string;
  onExperimentComplete: (exp: ExperimentDetail) => void;
  onNavigate: (tab: any, expId?: string) => void;
}

export const SimulatorPage: React.FC<SimulatorPageProps> = ({
  scenarios,
  initialScenarioId,
  onExperimentComplete,
  onNavigate,
}) => {
  // Form State
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>(initialScenarioId || 'lossy_wireless');
  const [title, setTitle] = useState<string>('Lossy Wireless Network Experiment');
  const [bandwidthMbps, setBandwidthMbps] = useState<number>(25.0);
  const [baseRttMs, setBaseRttMs] = useState<number>(45.0);
  const [jitterMs, setJitterMs] = useState<number>(5.0);
  const [packetLossRate, setPacketLossRate] = useState<number>(0.025); // 2.5%
  const [queueLimitPackets, setQueueLimitPackets] = useState<number>(50);
  const [durationSeconds, setDurationSeconds] = useState<number>(15.0);
  const [flowCount, setFlowCount] = useState<number>(1);
  const [bgTrafficRatio, setBgTrafficRatio] = useState<number>(0.0);
  const [seed, setSeed] = useState<number>(42);
  const [repetitions, setRepetitions] = useState<number>(2);

  // Selected Algorithms to evaluate
  const [selectedAlgos, setSelectedAlgos] = useState<string[]>(['reno', 'newreno', 'cubic', 'bbr']);

  // Dynamic Bandwidth schedule
  const [dynamicBwEnabled, setDynamicBwEnabled] = useState<boolean>(false);
  const [bwSchedule, setBwSchedule] = useState<BandwidthChangePoint[]>([
    { time: 6.0, bandwidth_mbps: 10.0 },
    { time: 12.0, bandwidth_mbps: 40.0 },
  ]);

  // Execution state
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [completedExp, setCompletedExp] = useState<ExperimentDetail | null>(null);

  // Load preset parameters when scenario changes
  const handleSelectScenario = (scenarioId: string) => {
    setSelectedScenarioId(scenarioId);
    const preset = scenarios.find((s) => s.id === scenarioId);
    if (preset) {
      setTitle(`${preset.name} Study`);
      setBandwidthMbps(preset.bandwidth_mbps);
      setBaseRttMs(preset.base_rtt_ms);
      setJitterMs(preset.jitter_ms);
      setPacketLossRate(preset.packet_loss_rate);
      setQueueLimitPackets(preset.queue_limit_packets);
      setDurationSeconds(preset.duration_seconds);
      setFlowCount(preset.flow_count);
      setBgTrafficRatio(preset.background_traffic_ratio);
      if (preset.bandwidth_schedule && preset.bandwidth_schedule.length > 0) {
        setDynamicBwEnabled(true);
        setBwSchedule(preset.bandwidth_schedule);
      } else {
        setDynamicBwEnabled(false);
      }
    }
  };

  useEffect(() => {
    if (initialScenarioId) {
      handleSelectScenario(initialScenarioId);
    }
  }, [initialScenarioId]);

  const toggleAlgo = (algoId: string) => {
    if (selectedAlgos.includes(algoId)) {
      if (selectedAlgos.length === 1) return; // Keep at least one
      setSelectedAlgos(selectedAlgos.filter((a) => a !== algoId));
    } else {
      setSelectedAlgos([...selectedAlgos, algoId]);
    }
  };

  const handleRun = async () => {
    setErrorMsg(null);
    setIsRunning(true);
    setCompletedExp(null);

    const payload: ExperimentCreateParams = {
      title,
      scenario_id: selectedScenarioId,
      algorithms: selectedAlgos,
      bandwidth_mbps: bandwidthMbps,
      base_rtt_ms: baseRttMs,
      jitter_ms: jitterMs,
      packet_loss_rate: packetLossRate,
      queue_limit_packets: queueLimitPackets,
      duration_seconds: durationSeconds,
      flow_count: flowCount,
      background_traffic_ratio: bgTrafficRatio,
      seed,
      repetitions,
      bandwidth_schedule: dynamicBwEnabled ? bwSchedule : undefined,
    };

    try {
      const exp = await createExperiment(payload);
      setCompletedExp(exp);
      onExperimentComplete(exp);
    } catch (err: any) {
      setErrorMsg(err.message || 'Simulation execution failed');
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center space-x-2">
            <Sliders className="w-5 h-5 text-cyan-400" />
            <span>Interactive Network Simulator</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure bottleneck constraints, select algorithms, and trigger reproducible trials.
          </p>
        </div>

        {/* Preset Selector Dropdown */}
        <div className="flex items-center space-x-2">
          <span className="text-xs font-mono text-slate-400 hidden sm:inline">Scenario Preset:</span>
          <select
            value={selectedScenarioId}
            onChange={(e) => handleSelectScenario(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-xs text-slate-200 rounded-lg px-3 py-2 font-mono focus:border-cyan-500 focus:outline-none"
          >
            {scenarios.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main 3-Part Layout: Parameters (Left) + Center/Right: Topology & Run Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Config Panel (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="telemetry-card p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wide">
                Path & Link Parameters
              </span>
              <button
                type="button"
                onClick={() => handleSelectScenario(selectedScenarioId)}
                className="text-[10px] font-mono text-slate-500 hover:text-slate-300 flex items-center space-x-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset to Preset</span>
              </button>
            </div>

            {/* Experiment Title */}
            <div>
              <label className="text-[11px] font-mono text-slate-400 block mb-1">Experiment Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-mono focus:border-cyan-500 focus:outline-none"
              />
            </div>

            {/* Bandwidth Slider & Input */}
            <div>
              <div className="flex justify-between text-xs font-mono mb-1">
                <span className="text-slate-300">Bottleneck Bandwidth</span>
                <span className="text-cyan-400 font-bold">{bandwidthMbps} Mbps</span>
              </div>
              <input
                type="range"
                min="1"
                max="500"
                step="1"
                value={bandwidthMbps}
                onChange={(e) => setBandwidthMbps(parseFloat(e.target.value))}
                className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-600 font-mono mt-0.5">
                <span>1 Mbps</span>
                <span>250 Mbps</span>
                <span>500 Mbps</span>
              </div>
            </div>

            {/* Base RTT */}
            <div>
              <div className="flex justify-between text-xs font-mono mb-1">
                <span className="text-slate-300">Base RTT (Round-Trip Delay)</span>
                <span className="text-cyan-400 font-bold">{baseRttMs} ms</span>
              </div>
              <input
                type="range"
                min="1"
                max="300"
                step="1"
                value={baseRttMs}
                onChange={(e) => setBaseRttMs(parseFloat(e.target.value))}
                className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-600 font-mono mt-0.5">
                <span>1 ms (LAN)</span>
                <span>100 ms</span>
                <span>300 ms (Satellite/LFN)</span>
              </div>
            </div>

            {/* Random Loss Rate */}
            <div>
              <div className="flex justify-between text-xs font-mono mb-1">
                <span className="text-slate-300">Random Packet Loss (Channel Noise)</span>
                <span className={packetLossRate > 0 ? 'text-red-400 font-bold' : 'text-emerald-400 font-bold'}>
                  {(packetLossRate * 100).toFixed(1)}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="0.08"
                step="0.005"
                value={packetLossRate}
                onChange={(e) => setPacketLossRate(parseFloat(e.target.value))}
                className="w-full accent-red-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-600 font-mono mt-0.5">
                <span>0.0% (Clean)</span>
                <span>4.0%</span>
                <span>8.0% (Severe Wireless)</span>
              </div>
            </div>

            {/* Queue Limit (Bufferbloat study) */}
            <div>
              <div className="flex justify-between text-xs font-mono mb-1">
                <span className="text-slate-300">Router Buffer Capacity</span>
                <span className="text-amber-400 font-bold">{queueLimitPackets} packets</span>
              </div>
              <input
                type="range"
                min="10"
                max="1000"
                step="10"
                value={queueLimitPackets}
                onChange={(e) => setQueueLimitPackets(parseInt(e.target.value))}
                className="w-full accent-amber-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-600 font-mono mt-0.5">
                <span>10 pkts (Shallow)</span>
                <span>500 pkts</span>
                <span>1000 pkts (Deep Bufferbloat)</span>
              </div>
            </div>

            {/* Secondary Controls: Duration, Flows, Repetitions */}
            <div className="grid grid-cols-3 gap-3 pt-2 border-t border-slate-800 text-xs font-mono">
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Duration</label>
                <select
                  value={durationSeconds}
                  onChange={(e) => setDurationSeconds(parseFloat(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-300"
                >
                  <option value={10.0}>10s</option>
                  <option value={15.0}>15s</option>
                  <option value={20.0}>20s</option>
                  <option value={30.0}>30s</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Flows / Algo</label>
                <select
                  value={flowCount}
                  onChange={(e) => setFlowCount(parseInt(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-300"
                >
                  <option value={1}>1 flow</option>
                  <option value={2}>2 flows</option>
                  <option value={4}>4 flows</option>
                  <option value={8}>8 flows</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Repetitions</label>
                <select
                  value={repetitions}
                  onChange={(e) => setRepetitions(parseInt(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-300"
                >
                  <option value={1}>1 trial</option>
                  <option value={2}>2 trials</option>
                  <option value={3}>3 trials</option>
                  <option value={5}>5 trials</option>
                </select>
              </div>
            </div>

            {/* Competing Background Traffic */}
            <div>
              <div className="flex justify-between text-xs font-mono mb-1">
                <span className="text-slate-300">Competing Cross Traffic</span>
                <span className="text-slate-400 font-bold">{(bgTrafficRatio * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="0.6"
                step="0.05"
                value={bgTrafficRatio}
                onChange={(e) => setBgTrafficRatio(parseFloat(e.target.value))}
                className="w-full accent-slate-400 h-1 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Right Column: Live Topology & Algorithm Selection & Controls (7 Cols) */}
        <div className="lg:col-span-7 space-y-4 flex flex-col justify-between">
          {/* Live Topology View */}
          <TopologyVisualizer
            bandwidthMbps={bandwidthMbps}
            baseRttMs={baseRttMs}
            jitterMs={jitterMs}
            packetLossRate={packetLossRate}
            queueLimitPackets={queueLimitPackets}
            flowCount={flowCount}
            backgroundTrafficRatio={bgTrafficRatio}
            isRunning={isRunning}
          />

          {/* Algorithm Selection Cards */}
          <div className="telemetry-card p-5 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wide">
                Select Comparison Algorithms
              </span>
              <span className="text-[10px] font-mono text-slate-500">
                {selectedAlgos.length} of 4 selected
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* Reno */}
              <button
                type="button"
                onClick={() => toggleAlgo('reno')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  selectedAlgos.includes('reno')
                    ? 'bg-sky-950/40 border-sky-500/80 shadow-[0_0_12px_rgba(56,189,248,0.15)]'
                    : 'bg-slate-950 border-slate-800 opacity-50 hover:opacity-80'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-400" />
                  {selectedAlgos.includes('reno') && <Check className="w-3.5 h-3.5 text-sky-400" />}
                </div>
                <div className="font-bold text-xs text-white">TCP Reno</div>
                <div className="text-[10px] font-mono text-slate-400 mt-0.5">RFC 5681</div>
                <div className="text-[9px] text-slate-500 mt-1">Loss-Based AIMD</div>
              </button>

              {/* NewReno */}
              <button
                type="button"
                onClick={() => toggleAlgo('newreno')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  selectedAlgos.includes('newreno')
                    ? 'bg-purple-950/40 border-purple-500/80 shadow-[0_0_12px_rgba(168,85,247,0.15)]'
                    : 'bg-slate-950 border-slate-800 opacity-50 hover:opacity-80'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                  {selectedAlgos.includes('newreno') && <Check className="w-3.5 h-3.5 text-purple-400" />}
                </div>
                <div className="font-bold text-xs text-white">TCP NewReno</div>
                <div className="text-[10px] font-mono text-slate-400 mt-0.5">RFC 6582</div>
                <div className="text-[9px] text-slate-500 mt-1">Partial ACKs</div>
              </button>

              {/* CUBIC */}
              <button
                type="button"
                onClick={() => toggleAlgo('cubic')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  selectedAlgos.includes('cubic')
                    ? 'bg-cyan-950/40 border-cyan-500/80 shadow-[0_0_12px_rgba(6,182,212,0.15)]'
                    : 'bg-slate-950 border-slate-800 opacity-50 hover:opacity-80'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-500" />
                  {selectedAlgos.includes('cubic') && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                </div>
                <div className="font-bold text-xs text-white">TCP CUBIC</div>
                <div className="text-[10px] font-mono text-slate-400 mt-0.5">RFC 9438</div>
                <div className="text-[9px] text-slate-500 mt-1">Cubic Window Function</div>
              </button>

              {/* BBR */}
              <button
                type="button"
                onClick={() => toggleAlgo('bbr')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  selectedAlgos.includes('bbr')
                    ? 'bg-emerald-950/40 border-emerald-500/80 shadow-[0_0_12px_rgba(16,185,129,0.15)]'
                    : 'bg-slate-950 border-slate-800 opacity-50 hover:opacity-80'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  {selectedAlgos.includes('bbr') && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                </div>
                <div className="font-bold text-xs text-white">TCP BBR</div>
                <div className="text-[10px] font-mono text-slate-400 mt-0.5">Cardwell et al.</div>
                <div className="text-[9px] text-slate-500 mt-1">Model-Based Pacing</div>
              </button>
            </div>
          </div>

          {/* Error Message if any */}
          {errorMsg && (
            <div className="p-3 bg-red-950/60 border border-red-800/80 rounded-xl text-xs text-red-300 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Primary Action Button */}
          <div className="pt-2">
            <button
              onClick={handleRun}
              disabled={isRunning || selectedAlgos.length === 0}
              className={`w-full py-3.5 rounded-xl font-bold font-mono text-sm tracking-wide flex items-center justify-center space-x-2 shadow-xl transition-all ${
                isRunning
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white shadow-cyan-500/25'
              }`}
            >
              {isRunning ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>SIMULATING NETWORK EPISODES ({repetitions} TRIALS)...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>RUN EXPERIMENT ({selectedAlgos.length} ALGORITHMS)</span>
                </>
              )}
            </button>
          </div>

          {/* Quick Success Toast / Banner with Action links */}
          {completedExp && (
            <div className="p-4 bg-emerald-950/50 border border-emerald-800/80 rounded-xl text-xs flex items-center justify-between animate-fadeIn">
              <div className="flex items-center space-x-2 text-emerald-300">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Simulation completed successfully! Results recorded.</span>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => onNavigate('compare', completedExp.id)}
                  className="px-3 py-1 bg-emerald-800 hover:bg-emerald-700 text-white rounded font-mono text-xs font-semibold transition"
                >
                  View Comparison &rarr;
                </button>
                <button
                  onClick={() => onNavigate('timeseries', completedExp.id)}
                  className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-mono text-xs transition"
                >
                  Time-Series
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
