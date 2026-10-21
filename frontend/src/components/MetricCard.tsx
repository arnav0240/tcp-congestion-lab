import React from 'react';

interface MetricCardProps {
  label: string;
  value: string | number;
  unit?: string;
  subtext?: string;
  icon?: React.ReactNode;
  colorClass?: string;
  tooltip?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  unit,
  subtext,
  icon,
  colorClass = 'text-cyan-400',
  tooltip,
}) => {
  return (
    <div className="telemetry-card p-4 flex flex-col justify-between group hover:border-slate-700 transition relative">
      <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
        <span className="font-medium tracking-wide uppercase text-[11px] font-mono">{label}</span>
        {icon && <span className="text-slate-500 group-hover:text-slate-300 transition">{icon}</span>}
      </div>

      <div className="my-1 flex items-baseline space-x-1.5">
        <span className={`text-2xl font-bold font-mono tracking-tight ${colorClass}`}>{value}</span>
        {unit && <span className="text-xs font-mono text-slate-400">{unit}</span>}
      </div>

      {subtext && (
        <div className="text-[11px] text-slate-500 font-mono mt-0.5 truncate">
          {subtext}
        </div>
      )}

      {tooltip && (
        <div className="text-[10px] text-slate-600 mt-1 italic">
          {tooltip}
        </div>
      )}
    </div>
  );
};
