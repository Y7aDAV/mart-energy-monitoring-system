import React, { useState } from 'react';
import { X, Plus, Trash2, Cpu, Check, AlertCircle } from 'lucide-react';

export default function DeviceManager({ isOpen, onClose, devices, onAddDevice, onDeleteDevice }) {
  const [name, setName] = useState('');
  const [deviceType, setDeviceType] = useState('HVAC');
  const [location, setLocation] = useState('Main Floor');
  const [ratedPower, setRatedPower] = useState('2000');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      await onAddDevice({
        name: name.trim(),
        device_type: deviceType,
        location: location.trim(),
        rated_power_w: Number(ratedPower)
      });
      setName('');
      setRatedPower('2000');
    } catch (err) {
      alert('Error adding device: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-bold text-white">Smart Meter & Device Fleet</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Add Device Form */}
        <form onSubmit={handleSubmit} className="mt-4 p-4 rounded-xl bg-slate-950/60 border border-slate-800">
          <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-3">
            Register New Smart Plug / Meter
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-slate-400 mb-1">Appliance Name</label>
              <input
                type="text"
                placeholder="e.g. Solar Inverter, Heat Pump"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Device Type</label>
              <select
                value={deviceType}
                onChange={(e) => setDeviceType(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 focus:outline-none focus:border-emerald-500"
              >
                <option value="HVAC">HVAC / Air Conditioning</option>
                <option value="REFRIGERATION">Refrigeration</option>
                <option value="EV_CHARGER">EV Charger</option>
                <option value="LIGHTING">Lighting Grid</option>
                <option value="WATER_HEATER">Water Heater</option>
                <option value="IT_EQUIPMENT">IT / Server Equipment</option>
                <option value="SOLAR">Solar Inverter</option>
                <option value="GENERAL">General Appliance</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Location</label>
              <input
                type="text"
                placeholder="e.g. Kitchen, Garage, Rooftop"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Rated Power (Watts)</label>
              <input
                type="number"
                placeholder="e.g. 2500"
                value={ratedPower}
                onChange={(e) => setRatedPower(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="mt-3 flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition"
            >
              <Plus className="w-4 h-4" />
              <span>{isSubmitting ? 'Registering...' : 'Add Device'}</span>
            </button>
          </div>
        </form>

        {/* Device List */}
        <div className="mt-5 max-h-64 overflow-y-auto space-y-2 pr-1">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
            Connected Devices ({devices.length})
          </h3>

          {devices.map((device) => (
            <div
              key={device.id || device.device_id}
              className="flex items-center justify-between p-3 rounded-xl bg-slate-950/40 border border-slate-800 text-xs"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-100">{device.name || device.device_name}</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-800 text-slate-300 font-medium">
                    {device.device_type}
                  </span>
                </div>
                <div className="text-slate-400 mt-0.5 text-[11px]">
                  <span>{device.location}</span> • <span>Rated: {device.rated_power_w}W</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {device.status || device.device_status || 'ONLINE'}
                </span>

                <button
                  onClick={() => onDeleteDevice(device.id || device.device_id)}
                  title="Remove device"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
