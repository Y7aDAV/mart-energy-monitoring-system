import React from 'react';

export default function MetricCard({ title, value, unit, icon: Icon, changeText, trend = 'neutral', color = 'emerald', subtitle }) {
  const colorStyles = {
    emerald: {
      border: 'border-emerald-500/20 hover:border-emerald-500/40',
      bgGlow: 'bg-emerald-500/5',
      iconBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      textAccent: 'text-emerald-400'
    },
    cyan: {
      border: 'border-cyan-500/20 hover:border-cyan-500/40',
      bgGlow: 'bg-cyan-500/5',
      iconBg: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
      textAccent: 'text-cyan-400'
    },
    amber: {
      border: 'border-amber-500/20 hover:border-amber-500/40',
      bgGlow: 'bg-amber-500/5',
      iconBg: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      textAccent: 'text-amber-400'
    },
    purple: {
      border: 'border-purple-500/20 hover:border-purple-500/40',
      bgGlow: 'bg-purple-500/5',
      iconBg: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
      textAccent: 'text-purple-400'
    }
  };

  const style = colorStyles[color] || colorStyles.emerald;

  return (
    <div className={`relative overflow-hidden rounded-2xl border ${style.border} bg-slate-900/60 p-5 backdrop-blur-sm transition-all duration-300 hover:shadow-xl`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">{title}</p>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-3xl font-extrabold text-white tracking-tight">{value}</span>
            {unit && <span className="text-sm font-semibold text-slate-400">{unit}</span>}
          </div>
        </div>

        <div className={`p-3 rounded-xl border ${style.iconBg}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between text-xs text-slate-400 pt-3 border-t border-slate-800/60">
        <span>{subtitle || 'Real-time telemetry'}</span>
        {changeText && (
          <span className={`font-semibold ${style.textAccent}`}>
            {changeText}
          </span>
        )}
      </div>
    </div>
  );
}
