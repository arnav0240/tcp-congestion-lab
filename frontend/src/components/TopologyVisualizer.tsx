import React from 'react';
import { Server, Router, Network, ArrowRight, AlertTriangle, ShieldAlert } from 'lucide-react';

interface TopologyProps {
  bandwidthMbps: number;
  baseRttMs: number;
  jitterMs: number;
  packetLossRate: number;
  queueLimitPackets: number;
  flowCount: number;
  backgroundTrafficRatio: number;
  isRunning?: boolean;
}

export const TopologyVisualizer: React.FC<TopologyProps> = ({
  bandwidthMbps,
  baseRttMs,
  jitterMs,
  packetLossRate,
  queueLimitPackets,
  flowCount,
  backgroundTrafficRatio,
  isRunning = false,
}) => {
  const lossPct = (packetLossRate * 100).toFixed(1);
  const bgPct = (backgroundTrafficRatio * 100).toFixed(0);

  return (
    <div className="telemetry-card p-5 relative overflow-hidden">
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 noc-grid opacity-30 pointer-events-none" />

      <div className="flex items-center justify-between mb-4 relative z-10">
        <div className="flex items-center space-x-2">
          <Network className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs font-mono uppercase tracking-wider text-slate-300 font-semibold">
            Network Topology & Bottleneck Path
          </h3>
        </div>
        {isRunning && (
          <span className="flex items-center space-x-1.5 text-[11px] font-mono text-emerald-400 bg-emerald-950/70 border border-emerald-800 px-2 py-0.5 rounded-full animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>TRANSMITTING PACKETS</span>
          </span>
        )}
      </div>

      {/* Topology Diagram */}
      <div className="relative z-10 py-6 px-2 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Node 1: TCP Senders */}
        <div className="flex flex-col items-center p-3.5 bg-slate-950/90 border border-slate-800 rounded-xl w-36 text-center shadow-lg">
          <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center mb-2">
            <Server className="w-5 h-5 text-blue-400" />
          </div>
          <div className="text-xs font-bold text-slate-200">TCP Sender(s)</div>
          <div className="text-[11px] font-mono text-cyan-400 mt-0.5">
            {flowCount} {flowCount > 1 ? 'Flows' : 'Flow'}
          </div>
          <div className="text-[10px] text-slate-500 mt-1 font-mono">10.1.1.0/24</div>
        </div>

        {/* Link 1: Access Link */}
        <div className="flex flex-col items-center justify-center px-1">
          <div className="h-0.5 w-12 bg-slate-700 relative">
            {isRunning && (
              <div className="absolute top-[-3px] left-0 w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#06b6d4] animate-ping" />
            )}
          </div>
          <span className="text-[10px] font-mono text-slate-500 mt-1">1 Gbps</span>
        </div>

        {/* Node 2: Ingress Router */}
        <div className="flex flex-col items-center p-3 bg-slate-950/90 border border-slate-800 rounded-xl w-28 text-center shadow-lg">
          <div className="w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center mb-1.5">
            <Router className="w-4 h-4 text-slate-300" />
          </div>
          <div className="text-xs font-medium text-slate-300">Router R1</div>
          <div className="text-[10px] font-mono text-slate-500">Ingress</div>
        </div>

        {/* Bottleneck Link Card */}
        <div className="flex-1 max-w-xs p-3.5 bg-cyan-950/20 border border-cyan-800/60 rounded-xl relative">
          <div className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-wider mb-2 flex items-center justify-between">
            <span>Bottleneck Link</span>
            <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-900/60 text-cyan-300">DropTail</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            <div>
              <span className="text-[10px] text-slate-500 block">Bandwidth (C)</span>
              <span className="text-white font-bold">{bandwidthMbps} Mbps</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block">Base RTT (D)</span>
              <span className="text-white font-bold">{baseRttMs} ms {jitterMs > 0 && `(±${jitterMs})`}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block">Queue Capacity</span>
              <span className="text-amber-400 font-semibold">{queueLimitPackets} pkts</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block">Random Loss (P)</span>
              <span className={packetLossRate > 0 ? "text-red-400 font-semibold" : "text-emerald-400"}>
                {lossPct}%
              </span>
            </div>
          </div>

          {backgroundTrafficRatio > 0 && (
            <div className="mt-2 pt-1.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-amber-400">
              <span className="flex items-center space-x-1">
                <AlertTriangle className="w-3 h-3" />
                <span>Cross Traffic:</span>
              </span>
              <span>{bgPct}% load</span>
            </div>
          )}
        </div>

        {/* Node 3: Egress Router */}
        <div className="flex flex-col items-center p-3 bg-slate-950/90 border border-slate-800 rounded-xl w-28 text-center shadow-lg">
          <div className="w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center mb-1.5">
            <Router className="w-4 h-4 text-slate-300" />
          </div>
          <div className="text-xs font-medium text-slate-300">Router R2</div>
          <div className="text-[10px] font-mono text-slate-500">Egress</div>
        </div>

        {/* Link 2: Access Link */}
        <div className="flex flex-col items-center justify-center px-1">
          <div className="h-0.5 w-12 bg-slate-700" />
          <span className="text-[10px] font-mono text-slate-500 mt-1">1 Gbps</span>
        </div>

        {/* Node 4: TCP Receiver */}
        <div className="flex flex-col items-center p-3.5 bg-slate-950/90 border border-slate-800 rounded-xl w-36 text-center shadow-lg">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mb-2">
            <Server className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="text-xs font-bold text-slate-200">TCP Receiver</div>
          <div className="text-[11px] font-mono text-emerald-400 mt-0.5">Port 8080</div>
          <div className="text-[10px] text-slate-500 mt-1 font-mono">10.1.3.0/24</div>
        </div>
      </div>
    </div>
  );
};
