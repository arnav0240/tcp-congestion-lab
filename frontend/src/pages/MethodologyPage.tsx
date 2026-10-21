import React from 'react';
import { BookOpen, CheckCircle, HelpCircle, Layers, ShieldCheck, Activity } from 'lucide-react';

export const MethodologyPage: React.FC = () => {
  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="telemetry-card p-6">
        <div className="flex items-center space-x-2.5 mb-2">
          <BookOpen className="w-5 h-5 text-cyan-400" />
          <h1 className="text-xl sm:text-2xl font-bold text-white">Research Methodology & Mathematical Foundation</h1>
        </div>
        <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
          Detailed theoretical analysis, RFC standard definitions, equations, and simulation assumptions
          utilized in the TCP Congestion Control Research Lab.
        </p>
      </div>

      {/* Algorithm Comparison Matrix */}
      <div className="telemetry-card p-6 space-y-4">
        <h2 className="text-base font-bold text-white flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400" />
          <span>Algorithm Comparison Matrix</span>
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-950/80 text-[10px] text-slate-400 uppercase">
              <tr>
                <th className="py-2.5 px-3">Algorithm</th>
                <th className="py-2.5 px-3">Standard</th>
                <th className="py-2.5 px-3">Paradigm</th>
                <th className="py-2.5 px-3">Congestion Signal</th>
                <th className="py-2.5 px-3">Growth Function</th>
                <th className="py-2.5 px-3">BDP Scaling</th>
                <th className="py-2.5 px-3">Loss Resilience</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-300">
              <tr>
                <td className="py-2.5 px-3 font-bold text-sky-400">TCP Reno</td>
                <td className="py-2.5 px-3">RFC 5681</td>
                <td className="py-2.5 px-3">Loss-Based AIMD</td>
                <td className="py-2.5 px-3">3 DupACKs / Timeout</td>
                <td className="py-2.5 px-3">+1 MSS per RTT</td>
                <td className="py-2.5 px-3 text-red-400">Poor (slow linear probe)</td>
                <td className="py-2.5 px-3 text-red-400">Very Poor (halves on noise)</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-bold text-purple-400">TCP NewReno</td>
                <td className="py-2.5 px-3">RFC 6582</td>
                <td className="py-2.5 px-3">AIMD + Partial ACKs</td>
                <td className="py-2.5 px-3">3 DupACKs / Timeout</td>
                <td className="py-2.5 px-3">+1 MSS per RTT</td>
                <td className="py-2.5 px-3 text-red-400">Poor</td>
                <td className="py-2.5 px-3 text-amber-400">Moderate (multi-drop fast recovery)</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-bold text-cyan-400">TCP CUBIC</td>
                <td className="py-2.5 px-3">RFC 9438</td>
                <td className="py-2.5 px-3">Time-Based Cubic</td>
                <td className="py-2.5 px-3">3 DupACKs / Timeout</td>
                <td className="py-2.5 px-3">W(t) = C(t - K)³ + W_max</td>
                <td className="py-2.5 px-3 text-emerald-400">Excellent (RTT-independent)</td>
                <td className="py-2.5 px-3 text-amber-400">Moderate (β = 0.7 decrease)</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-bold text-emerald-400">TCP BBR</td>
                <td className="py-2.5 px-3">Cardwell et al.</td>
                <td className="py-2.5 px-3">Model-Based Paced</td>
                <td className="py-2.5 px-3">Max BW & Min RTT filters</td>
                <td className="py-2.5 px-3">Paced: BtlBw × PacingGain</td>
                <td className="py-2.5 px-3 text-emerald-400">Excellent (BDP target)</td>
                <td className="py-2.5 px-3 text-emerald-400">High (decouples loss from rate)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Mathematical Principles */}
      <div className="space-y-6 text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
        {/* Section 1: Bandwidth Delay Product */}
        <div className="telemetry-card p-6 space-y-3">
          <h3 className="text-sm font-bold text-cyan-400 font-mono uppercase tracking-wide">
            1. Bandwidth-Delay Product (BDP)
          </h3>
          <p>
            The Bandwidth-Delay Product defines the physical capacity of the transmission link—the maximum volume
            of unacknowledged data packets that must be in transit ("in the pipe") to completely saturate available bandwidth:
          </p>
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs text-cyan-300 my-2">
            BDP (bits) = Bottleneck Bandwidth (bps) × Base RTT (seconds)<br />
            BDP (packets) = BDP (bits) / (8 × Maximum Segment Size)
          </div>
          <p>
            When sender congestion window <code className="text-cyan-400">cwnd &lt; BDP</code>, the link is underutilized.
            When <code className="text-amber-400">cwnd &gt; BDP</code>, excess packets buffer in the router queue, inducing
            queuing delay and potentially bufferbloat.
          </p>
        </div>

        {/* Section 2: CUBIC Window Function */}
        <div className="telemetry-card p-6 space-y-3">
          <h3 className="text-sm font-bold text-cyan-400 font-mono uppercase tracking-wide">
            2. CUBIC Congestion Window Equation (RFC 9438)
          </h3>
          <p>
            CUBIC replaces linear RTT-proportional window growth with a cubic curve centered around the time <code className="text-cyan-400">K</code> when
            the window returns to its pre-loss saturation point <code className="text-cyan-400">W_max</code>:
          </p>
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs text-cyan-300 my-2">
            W_cubic(t) = C · (t - K)³ + W_max<br />
            K = [ (W_max · (1 - β_cubic)) / C ]^(1/3)
          </div>
          <p>
            Where <code className="text-slate-200">C = 0.4</code> and <code className="text-slate-200">β_cubic = 0.7</code>.
            Because elapsed real time <code className="text-cyan-400">t</code> is measured in seconds rather than RTT cycles,
            CUBIC achieves rapid probing across long-distance, high-bandwidth links.
          </p>
        </div>

        {/* Section 3: BBR State Machine & Pacing */}
        <div className="telemetry-card p-6 space-y-3">
          <h3 className="text-sm font-bold text-cyan-400 font-mono uppercase tracking-wide">
            3. TCP BBR Bottleneck Estimation & Pacing
          </h3>
          <p>
            BBR continuously measures two independent physical quantities using moving window filters:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 font-mono text-xs text-slate-300">
            <li><strong className="text-emerald-400">BtlBw:</strong> Bottleneck Bandwidth, tracked via max-filter of delivery rate over recent rounds.</li>
            <li><strong className="text-emerald-400">RTprop:</strong> Round-Trip Propagation Time, tracked via min-filter of measured RTTs over a 10s window.</li>
          </ul>
          <p className="mt-2">
            Sending rate is controlled by a rate pacer: <code className="text-emerald-400">Pacing Rate = Pacing Gain × BtlBw</code>,
            cycling through gains <code className="text-slate-200">[1.25, 0.75, 1, 1, 1, 1, 1, 1]</code> in ProbeBW to bound in-flight packets to 1 BDP.
          </p>
        </div>

        {/* Section 4: Jain's Fairness Index */}
        <div className="telemetry-card p-6 space-y-3">
          <h3 className="text-sm font-bold text-cyan-400 font-mono uppercase tracking-wide">
            4. Jain's Fairness Index
          </h3>
          <p>
            For <code className="text-slate-200">N</code> concurrent TCP flows sharing a bottleneck link with throughput allocations
            <code className="text-slate-200">x₁, x₂, ..., xₙ</code>, Jain's index quantifies bandwidth equity:
          </p>
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs text-cyan-300 my-2">
            J(x₁, x₂, ..., xₙ) = ( ∑ xᵢ )² / [ N · ∑ (xᵢ²) ]
          </div>
          <p>
            The index yields values between <code className="text-red-400">1/N</code> (worst-case monopoly) and <code className="text-emerald-400">1.0</code> (perfect equality).
          </p>
        </div>
      </div>
    </div>
  );
};
