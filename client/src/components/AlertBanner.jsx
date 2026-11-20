import React from 'react';
import { AlertTriangle, CheckCircle, Info, ShieldAlert, X } from 'lucide-react';

export default function AlertBanner({ alerts, onResolveAlert }) {
  if (!alerts || alerts.length === 0) return null;

  return (
    <div className="space-y-2 mb-6">
      {alerts.slice(0, 3).map((alert) => {
        const isCritical = alert.severity === 'CRITICAL';
        const isWarning = alert.severity === 'WARNING';

        return (
          <div
            key={alert.id}
            className={`flex items-center justify-between p-4 rounded-xl border backdrop-blur-sm transition-all ${
              isCritical
                ? 'bg-rose-950/40 border-rose-600/40 text-rose-200'
                : isWarning
                ? 'bg-amber-950/40 border-amber-600/40 text-amber-200'
                : 'bg-cyan-950/40 border-cyan-600/40 text-cyan-200'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${
                isCritical ? 'bg-rose-500/20 text-rose-400' : isWarning ? 'bg-amber-500/20 text-amber-400' : 'bg-cyan-500/20 text-cyan-400'
              }`}>
                {isCritical ? <ShieldAlert className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider">
                    {alert.type.replace(/_/g, ' ')}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-900/60 font-mono">
                    {new Date(alert.created_at).toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-sm font-medium mt-0.5 text-slate-100">{alert.message}</p>
              </div>
            </div>

            {alert.status === 'ACTIVE' && (
              <button
                onClick={() => onResolveAlert(alert.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-xs font-semibold border border-slate-700/60 transition"
              >
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                <span>Resolve</span>
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
