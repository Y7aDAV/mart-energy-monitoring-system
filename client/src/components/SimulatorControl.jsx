import React, { useState } from 'react';
import { X, Play, Pause, Zap, Flame, Radio, FastForward, CheckCircle2 } from 'lucide-react';

export default function SimulatorControl({ isOpen, onClose, simulatorStatus, onToggleSimulator, onInjectSurge }) {
  const [speed, setSpeed] = useState(simulatorStatus?.interval_ms || 3000);
  const [injectSuccess, setInjectSuccess] = useState(false);

  if (!isOpen) return null;

  const isActive = simulatorStatus?.active;

  async function handleToggle() {
    await onToggleSimulator(!isActive, speed);
  }

  async function handleSpeedChange(newInterval) {
    setSpeed(newInterval);
    if (isActive) {
      await onToggleSimulator(true, newInterval);
    }
  }

  async function handleSurge() {
    setInjectSuccess(true);
    await onInjectSurge();
    setTimeout(() => setInjectSuccess(false), 2500);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="relative w-full max-w-lg rounded-2xl border border-teal-500/30 bg-slate-900 p-6 shadow-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-teal-400 animate-pulse" />
            <h2 className="text-lg font-bold text-white">IoT Smart Meter Telemetry Simulator</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-400 mt-3">
          Simulates real-time telemetry packets (Voltage, Current, Active Power, Power Factor) streaming from physical microcontrollers (e.g. ESP32 / Arduino / CT Current Sensors) into your Cloud API.
        </p>

        {/* State Banner */}
        <div className={`mt-5 p-4 rounded-xl border flex items-center justify-between ${
          isActive 
            ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300' 
            : 'bg-amber-950/40 border-amber-500/30 text-amber-300'
        }`}>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider block">Simulator State</span>
            <span className="text-base font-extrabold text-white">
              {isActive ? 'Active & Streaming Telemetry' : 'Paused'}
            </span>
          </div>

          <button
            onClick={handleToggle}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-xs transition ${
              isActive 
                ? 'bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 border border-rose-500/30' 
                : 'bg-emerald-500 text-slate-950 hover:bg-emerald-400'
            }`}
          >
            {isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            <span>{isActive ? 'Pause Feed' : 'Start Feed'}</span>
          </button>
        </div>

        {/* Broadcast Speed Selection */}
        <div className="mt-5">
          <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-2">
            Packet Ingestion Interval
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: '1s (Fast Demo)', value: 1000 },
              { label: '3s (Default)', value: 3000 },
              { label: '5s (Relaxed)', value: 5000 }
            ].map(option => (
              <button
                key={option.value}
                onClick={() => handleSpeedChange(option.value)}
                className={`py-2 px-3 rounded-lg text-xs font-semibold border transition ${
                  speed === option.value
                    ? 'bg-teal-500/20 border-teal-500 text-teal-300'
                    : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Anomaly / Surge Injection Button */}
        <div className="mt-6 pt-5 border-t border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <div>
              <span className="text-xs font-bold text-white block">Simulate Power Surge Anomaly</span>
              <span className="text-[11px] text-slate-400">Injects an immediate 7.5kW load to trigger cloud anomaly alerts</span>
            </div>
          </div>

          <button
            onClick={handleSurge}
            disabled={injectSuccess}
            className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-bold text-xs transition border ${
              injectSuccess 
                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300' 
                : 'bg-rose-500/10 hover:bg-rose-500/20 border-rose-500/30 text-rose-300'
            }`}
          >
            {injectSuccess ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Zap className="w-4 h-4 text-rose-400" />}
            <span>{injectSuccess ? 'Surge Injected! Check Alerts on Dashboard' : '⚡ Inject Anomaly Surge Now'}</span>
          </button>
        </div>

      </div>
    </div>
  );
}
