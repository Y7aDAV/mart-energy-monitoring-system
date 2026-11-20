import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { BarChart3, Calendar, DollarSign, Leaf } from 'lucide-react';

export default function EnergyUsageChart({ data }) {
  const [metricMode, setMetricMode] = useState('kwh'); // 'kwh' | 'cost' | 'carbon'

  const formattedData = data && data.length > 0 ? data : [
    { time: '00:00', kwh: 1.2, cost: 0.18, carbon_kg: 0.50 },
    { time: '04:00', kwh: 0.9, cost: 0.14, carbon_kg: 0.38 },
    { time: '08:00', kwh: 2.8, cost: 0.42, carbon_kg: 1.18 },
    { time: '12:00', kwh: 3.4, cost: 0.51, carbon_kg: 1.43 },
    { time: '16:00', kwh: 4.1, cost: 0.62, carbon_kg: 1.72 },
    { time: '20:00', kwh: 5.6, cost: 0.84, carbon_kg: 2.35 },
    { time: '23:00', kwh: 2.1, cost: 0.32, carbon_kg: 0.88 }
  ];

  const totalKwh = formattedData.reduce((acc, curr) => acc + (Number(curr.kwh) || 0), 0).toFixed(1);
  const totalCost = formattedData.reduce((acc, curr) => acc + (Number(curr.cost) || 0), 0).toFixed(2);
  const totalCarbon = formattedData.reduce((acc, curr) => acc + (Number(curr.carbon_kg) || 0), 0).toFixed(1);

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-sm">
      
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-emerald-400" />
            <h2 className="font-semibold text-sm uppercase tracking-wider text-slate-200">Consumption Profile</h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">24-hour time-series energy aggregation</p>
        </div>

        {/* View toggles */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-950/80 rounded-xl border border-slate-800 self-start sm:self-auto">
          <button
            onClick={() => setMetricMode('kwh')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              metricMode === 'kwh'
                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Energy (kWh)
          </button>
          <button
            onClick={() => setMetricMode('cost')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              metricMode === 'cost'
                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Cost ($)
          </button>
          <button
            onClick={() => setMetricMode('carbon')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              metricMode === 'carbon'
                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            CO₂ (kg)
          </button>
        </div>
      </div>

      {/* Summary Pills */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="px-4 py-3 rounded-xl bg-slate-950/40 border border-slate-800/80">
          <span className="text-xs text-slate-400">Total Consumption</span>
          <p className="text-lg font-bold text-white font-mono mt-0.5">{totalKwh} kWh</p>
        </div>
        <div className="px-4 py-3 rounded-xl bg-slate-950/40 border border-slate-800/80">
          <span className="text-xs text-slate-400">Estimated Cost</span>
          <p className="text-lg font-bold text-amber-400 font-mono mt-0.5">${totalCost}</p>
        </div>
        <div className="px-4 py-3 rounded-xl bg-slate-950/40 border border-slate-800/80">
          <span className="text-xs text-slate-400">Emissions</span>
          <p className="text-lg font-bold text-teal-400 font-mono mt-0.5">{totalCarbon} kg</p>
        </div>
      </div>

      {/* Chart */}
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={formattedData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis 
              dataKey="time" 
              stroke="#64748b" 
              fontSize={11} 
              tickLine={false} 
              axisLine={{ stroke: '#334155' }} 
            />
            <YAxis 
              stroke="#64748b" 
              fontSize={11} 
              tickLine={false} 
              axisLine={{ stroke: '#334155' }}
              unit={metricMode === 'kwh' ? ' kWh' : metricMode === 'cost' ? ' $' : ' kg'}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#090d16', 
                borderColor: '#334155', 
                borderRadius: '0.75rem', 
                color: '#f8fafc',
                fontSize: '12px' 
              }} 
              formatter={(value) => [
                metricMode === 'cost' ? `$${Number(value).toFixed(2)}` : `${Number(value).toFixed(2)} ${metricMode === 'kwh' ? 'kWh' : 'kg CO₂'}`,
                metricMode.toUpperCase()
              ]}
            />
            <Bar 
              dataKey={metricMode === 'kwh' ? 'kwh' : metricMode === 'cost' ? 'cost' : 'carbon_kg'} 
              fill={metricMode === 'kwh' ? '#10b981' : metricMode === 'cost' ? '#f59e0b' : '#14b8a6'} 
              radius={[6, 6, 0, 0]} 
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

    </div>
  );
}
