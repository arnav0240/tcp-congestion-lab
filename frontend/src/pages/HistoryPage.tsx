import React, { useState } from 'react';
import {
  History,
  Search,
  Trash2,
  RotateCw,
  ExternalLink,
  LineChart,
  FileText,
  AlertTriangle,
  Check
} from 'lucide-react';
import { ExperimentSummaryItem } from '../types/api';
import { ExportDropdown } from '../components/ExportDropdown';

interface HistoryPageProps {
  experiments: ExperimentSummaryItem[];
  onSelectExperiment: (id: string) => void;
  onRerunExperiment: (id: string) => void;
  onDeleteExperiment: (id: string) => void;
  onNavigate: (tab: any, expId?: string) => void;
}

export const HistoryPage: React.FC<HistoryPageProps> = ({
  experiments,
  onSelectExperiment,
  onRerunExperiment,
  onDeleteExperiment,
  onNavigate,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [scenarioFilter, setScenarioFilter] = useState('all');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const filtered = experiments.filter((e) => {
    const matchesSearch =
      e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.scenario_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesScenario = scenarioFilter === 'all' || e.scenario_id === scenarioFilter;
    return matchesSearch && matchesScenario;
  });

  const uniqueScenarios = Array.from(new Set(experiments.map((e) => e.scenario_id)));

  return (
    <div className="space-y-6">
      {/* Header & Search Bar */}
      <div className="telemetry-card p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-2.5">
            <History className="w-5 h-5 text-cyan-400" />
            <div>
              <h1 className="text-base font-bold text-white">Experiment Records & Archive</h1>
              <p className="text-xs text-slate-400 font-mono">
                Persistent local database records ({experiments.length} total)
              </p>
            </div>
          </div>

          {/* Search Inputs */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search experiments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-700 text-xs text-white rounded-lg font-mono focus:border-cyan-500 focus:outline-none w-56"
              />
            </div>

            <select
              value={scenarioFilter}
              onChange={(e) => setScenarioFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-950 border border-slate-700 text-xs text-slate-300 rounded-lg font-mono focus:border-cyan-500 focus:outline-none"
            >
              <option value="all">All Scenarios</option>
              {uniqueScenarios.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Experiments Table */}
      <div className="telemetry-card overflow-hidden">
        {filtered.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="text-[10px] text-slate-500 uppercase bg-slate-950/70 border-b border-slate-800">
                <tr>
                  <th className="py-3 px-3">Date / ID</th>
                  <th className="py-3 px-3">Experiment Title</th>
                  <th className="py-3 px-3">Scenario</th>
                  <th className="py-3 px-3">Constraints</th>
                  <th className="py-3 px-3">Algorithms</th>
                  <th className="py-3 px-3">Repetitions</th>
                  <th className="py-3 px-3">Mode</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filtered.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-3 text-slate-500 whitespace-nowrap">
                      <div>{new Date(exp.created_at).toLocaleDateString()}</div>
                      <div className="text-[10px] text-slate-600 font-mono">{exp.id.slice(0, 8)}</div>
                    </td>
                    <td className="py-3 px-3 font-semibold text-white">
                      {exp.title}
                    </td>
                    <td className="py-3 px-3 text-slate-300">
                      {exp.scenario_name}
                    </td>
                    <td className="py-3 px-3 text-slate-400">
                      <div><span className="text-cyan-400">{exp.bandwidth_mbps} Mbps</span>, {exp.base_rtt_ms} ms</div>
                      <div className="text-[10px] text-slate-500">Loss: {(exp.packet_loss_rate * 100).toFixed(1)}%, Queue: {exp.queue_limit_packets}</div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex flex-wrap gap-1">
                        {exp.algorithms.map((a) => (
                          <span key={a} className="px-1.5 py-0.2 rounded text-[10px] bg-slate-800 text-slate-300 uppercase">
                            {a}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-slate-300">
                      {exp.repetitions}x
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-800">
                        {exp.execution_mode}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right whitespace-nowrap space-x-2">
                      <button
                        onClick={() => {
                          onSelectExperiment(exp.id);
                          onNavigate('compare', exp.id);
                        }}
                        title="View Comparison"
                        className="px-2.5 py-1 rounded bg-cyan-950 border border-cyan-800 text-cyan-400 hover:bg-cyan-900 transition text-[11px]"
                      >
                        Compare
                      </button>
                      <button
                        onClick={() => {
                          onSelectExperiment(exp.id);
                          onNavigate('timeseries', exp.id);
                        }}
                        title="View Telemetry Time-Series"
                        className="px-2.5 py-1 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 transition text-[11px]"
                      >
                        Telemetry
                      </button>
                      <button
                        onClick={() => onRerunExperiment(exp.id)}
                        title="Rerun with same parameters"
                        className="p-1 rounded text-slate-400 hover:text-cyan-400 transition"
                      >
                        <RotateCw className="w-3.5 h-3.5" />
                      </button>
                      <ExportDropdown experimentId={exp.id} />
                      <button
                        onClick={() => setDeleteConfirmId(exp.id)}
                        title="Delete Experiment"
                        className="p-1 rounded text-slate-500 hover:text-red-400 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-xs font-mono text-slate-500">
            No matching experiment records found.
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center space-x-3 text-red-400">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="font-bold text-white text-sm">Delete Experiment?</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Are you sure you want to delete experiment <code className="text-slate-300 font-mono font-bold">{deleteConfirmId.slice(0, 8)}...</code>? This will permanently remove its recorded metrics and telemetry points.
            </p>
            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono transition"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onDeleteExperiment(deleteConfirmId);
                  setDeleteConfirmId(null);
                }}
                className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-mono font-bold transition"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
