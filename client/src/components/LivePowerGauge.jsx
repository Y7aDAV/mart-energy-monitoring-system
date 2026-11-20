import React from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, Gauge, Zap, Radio } from 'lucide-react';

export default function LivePowerGauge({ liveData, realtimeTrend }) {
  const powerKw = liveData?.total_power_kw || '0.00';
  const powerW = liveData?.total_power_w || 0;
  const avgVoltage = liveData?.average_voltage_v || '230.0';
  
  // Calculate load percentage against a typical 10 kW household service limit
  const maxCapacityKw = 10.0;
  const percentage = Math.min(100, Math.round((Number(powerKw) / maxCapacityKw) * 100));

  // Determine load color
  let loadColor = 'from-emerald-500 to-teal-400';
  let badgeColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
  let statusText = 'Normal Load';

  if (percentage > 85) {
    loadColor = 'from-rose-500 to-amber-500';
    badgeColor = 'text-rose-400 bg-rose-500/10 border-rose-500/20';
    statusText = 'Critical Peak';
  } else if (percentage > 60) {
    loadColor = 'from-amber-500 to-yellow-400';
    badgeColor = 'text-amber-400 bg-amber-500/10 border-amber-500/20';
    statusText = 'Elevated Load';
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* 1. Real-time Power Demand Gauge Box */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-sm flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-300">
              <Gauge className="w-5 h-5 text-emerald-400" />
              <h2 className="font-semibold text-sm uppercase tracking-wider text-slate-200">Current Demand</h2>
            </div>
            <span className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${badgeColor}`}>
              {statusText}
            </span>
          </div>

          {/* Main Power Number */}
          <div className="mt-8 text-center">
            <div className="inline-flex items-baseline gap-2">
              <span className="text-6xl font-black tracking-tight text-white font-mono">
                {powerKw}
              </span>
              <span className="text-xl font-bold text-slate-400">kW</span>
            </div>
            <p className="text-xs text-slate-400 mt-1 font-mono">
              ({powerW.toLocaleString()} Watts active load)
            </p>
          </div>

          {/* Progress Bar Gauge */}
          <div className="mt-8 space-y-2">
            <div className="flex justify-between text-xs font-medium text-slate-400">
              <span>Grid Load Factor</span>
              <span>{percentage}% of 10kW Capacity</span>
            </div>
            <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden p-0.5">
              <div 
                className={`h-full rounded-full bg-gradient-to-r ${loadColor} transition-all duration-700 ease-out`}
                style={{ width: `${Math.max(5, percentage)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Telemetry Secondary Grid (Voltage, Frequency, Power Factor) */}
        <div className="grid grid-cols-3 gap-2 pt-6 mt-6 border-t border-slate-800/80 text-center">
          <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800/60">
            <span className="text-[10px] text-slate-400 uppercase font-medium">Voltage</span>
            <p className="text-sm font-bold text-slate-200 font-mono mt-0.5">{avgVoltage} V</p>
          </div>
          <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800/60">
            <span className="text-[10px] text-slate-400 uppercase font-medium">Frequency</span>
            <p className="text-sm font-bold text-slate-200 font-mono mt-0.5">50.0 Hz</p>
          </div>
          <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800/60">
            <span className="text-[10px] text-slate-400 uppercase font-medium">Power Factor</span>
            <p className="text-sm font-bold text-emerald-400 font-mono mt-0.5">0.96</p>
          </div>
        </div>

      </div>

      {/* 2. Live Power Waveform (Sparkline Chart) */}
      <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-sm flex flex-col justify-between">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-teal-400" />
            <div>
              <h2 className="font-semibold text-sm uppercase tracking-wider text-slate-200">Live Telemetry Waveform</h2>
              <p className="text-xs text-slate-400">Streamed load fluctuations from IoT smart meters</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Radio className="w-3 h-3 animate-pulse" />
              Live Feed
            </span>
          </div>
        </div>

        {/* Recharts Area Chart */}
        <div className="h-64 w-full">
          {realtimeTrend && realtimeTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={realtimeTrend}>
                <defs>
                  <linearGradient id="powerGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="time" 
                  stroke="#475569" 
                  fontSize={11} 
                  tickLine={false} 
                  axisLine={{ stroke: '#334155' }} 
                />
                <YAxis 
                  stroke="#475569" 
                  fontSize={11} 
                  tickLine={false} 
                  axisLine={{ stroke: '#334155' }}
                  unit=" W"
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#090d16', 
                    borderColor: '#334155', 
                    borderRadius: '0.75rem', 
                    color: '#f8fafc',
                    fontSize: '12px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)'
                  }} 
                  formatter={(val) => [`${Number(val).toLocaleString()} W (${(val/1000).toFixed(2)} kW)`, 'Power Draw']}
                  labelFormatter={(lbl) => `Time: ${lbl}`}
                />
                <Area 
                  type="monotone" 
                  dataKey="power_w" 
                  stroke="#10b981" 
                  strokeWidth={2.5}
                  fillOpacity={1} 
                  fill="url(#powerGradient)" 
                  isAnimationActive={false} // Smooth live continuous updates
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-slate-500">
              Awaiting telemetry packets...
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
