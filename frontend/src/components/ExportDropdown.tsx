import React, { useState } from 'react';
import { Download, FileJson, FileSpreadsheet, FileText, ChevronDown } from 'lucide-react';
import { getExportUrl } from '../api/client';

interface ExportDropdownProps {
  experimentId: string;
}

export const ExportDropdown: React.FC<ExportDropdownProps> = ({ experimentId }) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative inline-block text-left">
      <button
        onClick={() => setOpen(!open)}
        className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-mono transition"
      >
        <Download className="w-3.5 h-3.5 text-cyan-400" />
        <span>Export Data</span>
        <ChevronDown className="w-3 h-3 text-slate-400" />
      </button>

      {open && (
        <div
          className="origin-top-right absolute right-0 mt-2 w-56 rounded-xl shadow-2xl bg-slate-900 border border-slate-800 py-1.5 z-50 text-xs"
          onClick={() => setOpen(false)}
        >
          <a
            href={getExportUrl(experimentId, 'json')}
            download
            className="flex items-center space-x-2.5 px-3.5 py-2 text-slate-300 hover:bg-slate-800 hover:text-white transition"
          >
            <FileJson className="w-4 h-4 text-amber-400" />
            <div>
              <div className="font-medium">JSON (Complete Trace)</div>
              <div className="text-[10px] text-slate-500">Config, runs, and telemetry</div>
            </div>
          </a>

          <a
            href={getExportUrl(experimentId, 'csv_metrics')}
            download
            className="flex items-center space-x-2.5 px-3.5 py-2 text-slate-300 hover:bg-slate-800 hover:text-white transition"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <div>
              <div className="font-medium">CSV (Metrics Summary)</div>
              <div className="text-[10px] text-slate-500">Algorithm comparison table</div>
            </div>
          </a>

          <a
            href={getExportUrl(experimentId, 'csv_timeseries')}
            download
            className="flex items-center space-x-2.5 px-3.5 py-2 text-slate-300 hover:bg-slate-800 hover:text-white transition"
          >
            <FileSpreadsheet className="w-4 h-4 text-cyan-400" />
            <div>
              <div className="font-medium">CSV (Time-Series)</div>
              <div className="text-[10px] text-slate-500">Per-epoch observations</div>
            </div>
          </a>

          <a
            href={getExportUrl(experimentId, 'markdown')}
            download
            className="flex items-center space-x-2.5 px-3.5 py-2 text-slate-300 hover:bg-slate-800 hover:text-white transition border-t border-slate-800"
          >
            <FileText className="w-4 h-4 text-blue-400" />
            <div>
              <div className="font-medium">Markdown Report</div>
              <div className="text-[10px] text-slate-500">Formatted research report</div>
            </div>
          </a>
        </div>
      )}
    </div>
  );
};
