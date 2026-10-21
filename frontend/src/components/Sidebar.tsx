import React from 'react';
import {
  LayoutDashboard,
  Sliders,
  GitCompare,
  LineChart,
  History,
  Layers,
  BookOpen,
  FileText
} from 'lucide-react';

export type NavTab = 
  | 'dashboard'
  | 'simulator'
  | 'compare'
  | 'timeseries'
  | 'history'
  | 'scenarios'
  | 'methodology'
  | 'docs';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  experimentCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onSelectTab, experimentCount = 0 }) => {
  const navItems = [
    { id: 'dashboard' as NavTab, label: 'Dashboard', icon: LayoutDashboard, badge: null },
    { id: 'simulator' as NavTab, label: 'Simulator', icon: Sliders, badge: 'Live' },
    { id: 'compare' as NavTab, label: 'Compare Algorithms', icon: GitCompare, badge: null },
    { id: 'timeseries' as NavTab, label: 'Time-Series Analysis', icon: LineChart, badge: null },
    { id: 'history' as NavTab, label: 'Experiment History', icon: History, badge: experimentCount > 0 ? String(experimentCount) : null },
    { id: 'scenarios' as NavTab, label: 'Network Scenarios', icon: Layers, badge: '7' },
    { id: 'methodology' as NavTab, label: 'Methodology', icon: BookOpen, badge: null },
    { id: 'docs' as NavTab, label: 'Documentation & RFCs', icon: FileText, badge: null },
  ];

  return (
    <aside className="w-64 border-r border-slate-800 bg-slate-950/70 backdrop-blur-sm flex flex-col justify-between shrink-0 select-none">
      <div className="py-4">
        <div className="px-5 mb-3 text-[11px] font-mono font-semibold tracking-wider text-slate-500 uppercase">
          Navigation
        </div>
        <nav className="space-y-1 px-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-[0_0_12px_rgba(6,182,212,0.12)]'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ${
                      isActive
                        ? 'bg-cyan-500/20 text-cyan-300'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Algorithms Legend in Bottom of Sidebar */}
      <div className="p-4 m-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
        <div className="text-[11px] font-mono font-semibold text-slate-400 mb-2 uppercase tracking-wide">
          Evaluated Algorithms
        </div>
        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-400" />
              <span className="text-slate-300">TCP Reno</span>
            </span>
            <span className="text-[10px] font-mono text-slate-500">RFC 5681</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
              <span className="text-slate-300">TCP NewReno</span>
            </span>
            <span className="text-[10px] font-mono text-slate-500">RFC 6582</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-500" />
              <span className="text-slate-300">TCP CUBIC</span>
            </span>
            <span className="text-[10px] font-mono text-slate-500">RFC 9438</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="text-slate-300">TCP BBR</span>
            </span>
            <span className="text-[10px] font-mono text-slate-500">Cardwell</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
