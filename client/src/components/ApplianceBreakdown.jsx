import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Layers, Power, Laptop, Refrigerator, Car, Wind, Lightbulb, Flame } from 'lucide-react';

const COLORS = ['#10b981', '#06b6d4', '#8b5cf6', '#f59e0b', '#ec4899', '#64748b'];

function getDeviceIcon(type) {
  switch (type?.toUpperCase()) {
    case 'HVAC': return Wind;
    case 'REFRIGERATION': return Refrigerator;
    case 'EV_CHARGER': return Car;
    case 'LIGHTING': return Lightbulb;
    case 'WATER_HEATER': return Flame;
    case 'IT_EQUIPMENT': return Laptop;
    default: return Power;
  }
}

export default function ApplianceBreakdown({ appliances }) {
  const data = appliances && appliances.length > 0 ? appliances : [
    { name: 'HVAC Central AC', device_type: 'HVAC', kwh: 14.5, percentage: 42 },
    { name: 'Level 2 EV Charger', device_type: 'EV_CHARGER', kwh: 9.8, percentage: 28 },
    { name: 'Water Heater', device_type: 'WATER_HEATER', kwh: 4.2, percentage: 12 },
    { name: 'Refrigerator', device_type: 'REFRIGERATION', kwh: 2.5, percentage: 7 },
    { name: 'Smart Lighting', device_type: 'LIGHTING', kwh: 1.8, percentage: 5 },
    { name: 'Home Office', device_type: 'IT_EQUIPMENT', kwh: 1.5, percentage: 4 }
  ];

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-sm flex flex-col justify-between">
      
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Layers className="w-5 h-5 text-emerald-400" />
          <h2 className="font-semibold text-sm uppercase tracking-wider text-slate-200">Load Distribution</h2>
        </div>
        <p className="text-xs text-slate-400 mb-6">Energy share categorized by appliance type</p>

        {/* Donut Chart */}
        <div className="h-56 w-full relative flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={85}
                paddingAngle={4}
                dataKey="kwh"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#090d16', 
                  borderColor: '#334155', 
                  borderRadius: '0.75rem', 
                  color: '#f8fafc',
                  fontSize: '12px' 
                }} 
                formatter={(val, name, item) => [`${val} kWh (${item.payload.percentage}%)`, item.payload.name]}
              />
            </PieChart>
          </ResponsiveContainer>

          {/* Center Label in Donut */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Active</span>
            <span className="text-xl font-black text-white">{data.length} Nodes</span>
          </div>
        </div>
      </div>

      {/* Appliance List Details */}
      <div className="mt-6 space-y-2.5 max-h-56 overflow-y-auto pr-1">
        {data.map((item, idx) => {
          const Icon = getDeviceIcon(item.device_type);
          const color = COLORS[idx % COLORS.length];

          return (
            <div 
              key={idx}
              className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/40 border border-slate-800/60 text-xs hover:border-slate-700 transition"
            >
              <div className="flex items-center gap-2.5">
                <div 
                  className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${color}20`, color: color }}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-semibold text-slate-200 leading-tight">{item.name}</p>
                  <span className="text-[10px] text-slate-400">{item.device_type}</span>
                </div>
              </div>

              <div className="text-right">
                <span className="font-bold text-slate-100 font-mono">{item.kwh} kWh</span>
                <span className="block text-[10px] font-semibold text-emerald-400">
                  {item.percentage}%
                </span>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
