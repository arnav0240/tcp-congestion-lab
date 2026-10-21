import React from 'react';
import { FileText, ExternalLink, Code2, BookOpen, Terminal, CheckCircle2 } from 'lucide-react';

export const DocumentationPage: React.FC = () => {
  const references = [
    {
      id: "RFC 5681",
      title: "TCP Congestion Control",
      authors: "M. Allman, V. Paxson, E. Blanton",
      year: "2009",
      url: "https://datatracker.ietf.org/doc/html/rfc5681",
      description: "Standardizes classic TCP congestion control: Slow Start, Congestion Avoidance, Fast Retransmit, and Fast Recovery."
    },
    {
      id: "RFC 6582",
      title: "The NewReno Modification to TCP's Fast Recovery Algorithm",
      authors: "T. Henderson, S. Floyd, A. Gurtov, Y. Nishida",
      year: "2012",
      url: "https://datatracker.ietf.org/doc/html/rfc6582",
      description: "Specifies Partial ACK handling during Fast Recovery to prevent retransmission timeouts when multiple segments drop."
    },
    {
      id: "RFC 9438",
      title: "CUBIC for Fast and Long-Distance Networks",
      authors: "L. Xu, S. Ha, I. Rhee, V. Goel, L. Eggert",
      year: "2023",
      url: "https://datatracker.ietf.org/doc/html/rfc9438",
      description: "Current IETF standards-track specification for TCP CUBIC with real-time cubic window growth function."
    },
    {
      id: "ACM Queue 2016",
      title: "BBR: Congestion-Based Congestion Control",
      authors: "N. Cardwell, Y. Cheng, C. S. Gunn, S. H. Yuchung, V. Jacobson",
      year: "2016",
      url: "https://queue.acm.org/detail.cfm?id=3022184",
      description: "Introduces model-based rate-pacing congestion control that operates at Kleinrock's optimal operating point."
    },
    {
      id: "ns-3 Manual",
      title: "ns-3 TCP Models Documentation",
      authors: "ns-3 Development Team",
      year: "2024",
      url: "https://www.nsnam.org/docs/models/html/tcp.html",
      description: "Official documentation for ns3::TcpL4Protocol, TcpLinuxReno, TcpNewReno, TcpCubic, and TcpBbr classes."
    }
  ];

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="telemetry-card p-6">
        <div className="flex items-center space-x-2.5 mb-2">
          <FileText className="w-5 h-5 text-cyan-400" />
          <h1 className="text-xl sm:text-2xl font-bold text-white">Documentation & Standards References</h1>
        </div>
        <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
          Authoritative RFC citations, official network simulator specifications, and developer documentation.
        </p>
      </div>

      {/* Authoritative RFC References */}
      <div className="telemetry-card p-6 space-y-4">
        <h2 className="text-base font-bold text-white flex items-center space-x-2">
          <BookOpen className="w-4 h-4 text-cyan-400" />
          <span>Primary Standards & Technical References</span>
        </h2>

        <div className="grid grid-cols-1 gap-3">
          {references.map((ref) => (
            <div
              key={ref.id}
              className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl hover:border-slate-700 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-xs font-bold text-cyan-400">{ref.id}</span>
                  <span className="text-[10px] text-slate-500 font-mono">({ref.year})</span>
                </div>
                <h3 className="font-semibold text-slate-200 text-xs sm:text-sm">{ref.title}</h3>
                <p className="text-[11px] text-slate-400 font-mono">{ref.authors}</p>
                <p className="text-xs text-slate-400 leading-relaxed pt-1">{ref.description}</p>
              </div>

              <a
                href={ref.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono shrink-0 transition"
              >
                <span>Read RFC</span>
                <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
              </a>
            </div>
          ))}
        </div>
      </div>

      {/* Backend API Documentation Links */}
      <div className="telemetry-card p-6 space-y-3">
        <h2 className="text-base font-bold text-white flex items-center space-x-2">
          <Terminal className="w-4 h-4 text-emerald-400" />
          <span>Interactive REST API Documentation</span>
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
          The backend runs on Python FastAPI and exposes auto-generated interactive OpenAPI/Swagger and ReDoc specifications:
        </p>

        <div className="flex flex-wrap gap-3 pt-2">
          <a
            href="http://127.0.0.1:8000/api/docs"
            target="_blank"
            rel="noreferrer"
            className="flex items-center space-x-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs font-mono text-cyan-400 transition"
          >
            <span>Swagger UI (/api/docs)</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <a
            href="http://127.0.0.1:8000/api/redoc"
            target="_blank"
            rel="noreferrer"
            className="flex items-center space-x-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs font-mono text-slate-300 transition"
          >
            <span>ReDoc UI (/api/redoc)</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <a
            href="http://127.0.0.1:8000/api/v1/health"
            target="_blank"
            rel="noreferrer"
            className="flex items-center space-x-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs font-mono text-emerald-400 transition"
          >
            <span>Health Endpoint (/api/v1/health)</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
};
