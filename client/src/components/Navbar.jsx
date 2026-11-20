import React, { useState, useEffect } from 'react';
import { Zap, Database, Server, RefreshCw, Cpu, Bell, PlusCircle } from 'lucide-react';

export default function Navbar({ health, alertCount, onOpenDeviceModal, onOpenSimModal, isRefreshing, onManualRefresh }) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const isPostgres = health?.database?.toLowerCase().includes('postgresql');

  return (
    <header className="sticky top-0 z-30 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Zap className="w-6 h-6 text-slate-950 fill-current" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg text-white tracking-tight">VoltPulse</span>
              <span className="text-xs px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Cloud v1.0
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">Smart Energy Monitoring & Telemetry Architecture</p>
          </div>
        </div>

        {/* Center: Live Architecture Status */}
        <div className="hidden md:flex items-center gap-2">
          {/* Database indicator */}
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium ${
            isPostgres 
              ? 'bg-emerald-950/40 border-emerald-600/30 text-emerald-300' 
              : 'bg-cyan-950/40 border-cyan-600/30 text-cyan-300'
          }`}>
            <Database className="w-3.5 h-3.5" />
            <span>DB: {health?.database || 'Cloud PostgreSQL'}</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          </div>

          {/* Time display */}
          <div className="px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900/60 text-xs text-slate-300 font-mono">
            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Refresh button */}
          <button
            onClick={onManualRefresh}
            title="Refresh Live Metrics"
            className="p-2 rounded-lg border border-slate-800 bg-slate-900/60 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
          </button>

          {/* Simulator Controls */}
          <button
            onClick={onOpenSimModal}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-teal-500/30 bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 text-xs font-semibold transition"
          >
            <Cpu className="w-4 h-4" />
            <span className="hidden sm:inline">IoT Simulator</span>
          </button>

          {/* Add Device */}
          <button
            onClick={onOpenDeviceModal}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition shadow-sm"
          >
            <PlusCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Add Device</span>
          </button>
        </div>

      </div>
    </header>
  );
}
