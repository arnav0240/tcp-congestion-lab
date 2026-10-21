import React from 'react';
import { X, BookOpen, CheckCircle, HelpCircle, AlertTriangle } from 'lucide-react';

interface GlossaryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GlossaryModal: React.FC<GlossaryModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const vivaTopics = [
    {
      q: "Throughput vs Goodput: Why the distinction?",
      a: "Throughput counts all bits traversing the interface, including protocol headers and duplicate retransmitted segments. Goodput measures strictly unique application-layer payload bits delivered without retransmissions. Under high random loss, throughput can look active while goodput collapses."
    },
    {
      q: "Why does Reno suffer from Bufferbloat?",
      a: "Reno and CUBIC are loss-based: they only reduce cwnd when packets are dropped. When paired with large FIFO drop-tail buffers, they keep inflating cwnd until the router buffer is 100% full. This creates hundreds of milliseconds of artificial queueing delay."
    },
    {
      q: "How does BBR avoid Bufferbloat?",
      a: "BBR is model-based: it estimates maximum Bottleneck Bandwidth (BtlBw) and minimum physical Round-Trip Time (RTprop). It controls pacing rate and bounds in-flight packets to 1–2 BDP, keeping queues nearly empty and latency minimal."
    },
    {
      q: "How does NewReno differ from Reno during Fast Recovery?",
      a: "Classic Reno exits Fast Recovery on any new ACK, which leads to timeouts if multiple packets were lost in a single window. NewReno detects 'Partial ACKs' (acknowledging some data below the recover pointer), retransmits the next missing segment immediately, and remains in Fast Recovery."
    },
    {
      q: "Why is CUBIC preferred over Reno on Long Fat Networks (LFNs)?",
      a: "Reno's linear additive increase (+1 MSS per RTT) takes minutes to recover on high-BDP links (e.g. 100 Mbps across 100 ms RTT requires ~8500 packets in flight). CUBIC's cubic window growth function W(t) scales with real time rather than RTT."
    },
    {
      q: "What does Jain's Fairness Index indicate?",
      a: "J = (sum x_i)^2 / (N * sum x_i^2). For N flows, 1.0 represents perfectly equal sharing of the bottleneck link, while 1/N represents absolute monopoly by one flow."
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <BookOpen className="w-5 h-5 text-indigo-400" />
            <div>
              <h2 className="text-base font-bold text-white">Computer Networks Mini-Project Viva Q&A</h2>
              <p className="text-xs text-slate-400">Core theoretical concepts, mathematical models, and exam questions</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-4 text-xs">
          {vivaTopics.map((item, idx) => (
            <div key={idx} className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-2">
              <div className="flex items-start space-x-2 text-indigo-300 font-semibold text-sm">
                <HelpCircle className="w-4 h-4 shrink-0 mt-0.5 text-indigo-400" />
                <span>{item.q}</span>
              </div>
              <p className="text-slate-300 leading-relaxed pl-6 text-xs">
                {item.a}
              </p>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-slate-800 bg-slate-950/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium text-xs transition"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};
