import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import MetricCard from './components/MetricCard';
import LivePowerGauge from './components/LivePowerGauge';
import EnergyUsageChart from './components/EnergyUsageChart';
import ApplianceBreakdown from './components/ApplianceBreakdown';
import AlertBanner from './components/AlertBanner';
import DeviceManager from './components/DeviceManager';
import SimulatorControl from './components/SimulatorControl';
import { api } from './services/api';
import { Zap, DollarSign, Leaf, TrendingUp, Cpu, ShieldCheck } from 'lucide-react';

export default function App() {
  const [health, setHealth] = useState(null);
  const [summary, setSummary] = useState(null);
  const [liveData, setLiveData] = useState(null);
  const [realtimeTrend, setRealtimeTrend] = useState([]);
  const [historicalTrend, setHistoricalTrend] = useState([]);
  const [breakdown, setBreakdown] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [simulatorStatus, setSimulatorStatus] = useState(null);

  const [isDeviceModalOpen, setIsDeviceModalOpen] = useState(false);
  const [isSimModalOpen, setIsSimModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Initial and periodic fetch
  const fetchData = useCallback(async (isInitial = false) => {
    try {
      if (isInitial) setIsRefreshing(true);

      const [
        healthRes,
        summaryRes,
        liveRes,
        rtTrendRes,
        histTrendRes,
        breakdownRes,
        alertsRes,
        simRes
      ] = await Promise.allSettled([
        api.getHealth(),
        api.getSummary(),
        api.getLiveTelemetry(),
        api.getRealtimeTrend(),
        api.getHistoricalTrend(),
        api.getApplianceBreakdown(),
        api.getAlerts('ACTIVE'),
        api.getSimulatorStatus()
      ]);

      if (healthRes.status === 'fulfilled') setHealth(healthRes.value);
      if (summaryRes.status === 'fulfilled') setSummary(summaryRes.value.data);
      if (liveRes.status === 'fulfilled') setLiveData(liveRes.value);
      if (rtTrendRes.status === 'fulfilled') setRealtimeTrend(rtTrendRes.value.data);
      if (histTrendRes.status === 'fulfilled') setHistoricalTrend(histTrendRes.value.data);
      if (breakdownRes.status === 'fulfilled') setBreakdown(breakdownRes.value.data);
      if (alertsRes.status === 'fulfilled') setAlerts(alertsRes.value.data);
      if (simRes.status === 'fulfilled') setSimulatorStatus(simRes.value);

    } catch (err) {
      console.error('Error fetching dashboard telemetry:', err);
    } finally {
      if (isInitial) setIsRefreshing(false);
    }
  }, []);

  // Poll live metrics every 2.5 seconds
  useEffect(() => {
    fetchData(true);
    const interval = setInterval(() => {
      fetchData(false);
    }, 2500);

    return () => clearInterval(interval);
  }, [fetchData]);

  // Handle manual refresh
  async function handleManualRefresh() {
    setIsRefreshing(true);
    await fetchData(false);
    setTimeout(() => setIsRefreshing(false), 500);
  }

  // Handle resolving an alert
  async function handleResolveAlert(id) {
    try {
      await api.resolveAlert(id);
      setAlerts(prev => prev.filter(a => a.id !== id));
    } catch (err) {
      alert('Failed to resolve alert: ' + err.message);
    }
  }

  // Handle adding device
  async function handleAddDevice(deviceData) {
    await api.createDevice(deviceData);
    await fetchData(false);
  }

  // Handle deleting device
  async function handleDeleteDevice(id) {
    await api.deleteDevice(id);
    await fetchData(false);
  }

  // Handle toggling simulator
  async function handleToggleSimulator(active, intervalMs) {
    const res = await api.toggleSimulator(active, intervalMs);
    setSimulatorStatus(res);
  }

  // Handle surge injection
  async function handleInjectSurge() {
    // Ingest simulated high surge reading
    await api.ingestReading({
      device_id: 3, // EV Charger
      power_w: 8200,
      voltage_v: 231.5,
      power_factor: 0.98
    });
    await fetchData(false);
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-slate-950">
      
      {/* Navigation */}
      <Navbar
        health={health}
        alertCount={alerts.length}
        onOpenDeviceModal={() => setIsDeviceModalOpen(true)}
        onOpenSimModal={() => setIsSimModalOpen(true)}
        isRefreshing={isRefreshing}
        onManualRefresh={handleManualRefresh}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Active Alerts Banner */}
        <AlertBanner 
          alerts={alerts} 
          onResolveAlert={handleResolveAlert} 
        />

        {/* Top KPI Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <MetricCard
            title="Real-Time Demand"
            value={liveData?.total_power_kw || '0.00'}
            unit="kW"
            icon={Zap}
            color="emerald"
            changeText={`${liveData?.devices?.length || 0} meters online`}
            subtitle="Aggregated active load"
          />

          <MetricCard
            title="Energy Used Today"
            value={summary?.today_kwh || '0.00'}
            unit="kWh"
            icon={TrendingUp}
            color="cyan"
            changeText={`Peak: ${summary?.peak_power_kw || 0} kW`}
            subtitle="Calculated daily total"
          />

          <MetricCard
            title="Today's Cost"
            value={`$${summary?.cost_today || '0.00'}`}
            unit="USD"
            icon={DollarSign}
            color="amber"
            changeText={`Est. Mo: $${summary?.estimated_monthly_cost || 0}`}
            subtitle="Base rate: $0.15/kWh"
          />

          <MetricCard
            title="Carbon Footprint"
            value={summary?.carbon_today_kg || '0.00'}
            unit="kg CO₂"
            icon={Leaf}
            color="purple"
            changeText="Grid intensity: 0.42"
            subtitle="Equivalent avoided load"
          />
        </div>

        {/* Live Power Dial and Telemetry Waveform */}
        <LivePowerGauge 
          liveData={liveData} 
          realtimeTrend={realtimeTrend} 
        />

        {/* Analytics Section: Consumption Profile & Appliance Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <EnergyUsageChart data={historicalTrend} />
          </div>
          <div>
            <ApplianceBreakdown appliances={breakdown} />
          </div>
        </div>

        {/* Live Device Fleet Table */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold text-sm uppercase tracking-wider text-slate-200">
                Live Sub-Meter Telemetry
              </h2>
              <p className="text-xs text-slate-400">Status of connected circuit branches & smart plugs</p>
            </div>
            <button
              onClick={() => setIsDeviceModalOpen(true)}
              className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition"
            >
              Manage Fleet →
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                <tr>
                  <th className="pb-3 font-semibold">Device</th>
                  <th className="pb-3 font-semibold">Category</th>
                  <th className="pb-3 font-semibold">Location</th>
                  <th className="pb-3 font-semibold text-right">Current Load</th>
                  <th className="pb-3 font-semibold text-right">Voltage</th>
                  <th className="pb-3 font-semibold text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {(liveData?.devices || []).map((dev) => (
                  <tr key={dev.device_id} className="hover:bg-slate-800/30 transition">
                    <td className="py-3 font-medium text-slate-200">{dev.device_name}</td>
                    <td className="py-3 text-slate-400 font-mono">{dev.device_type}</td>
                    <td className="py-3 text-slate-400">{dev.location}</td>
                    <td className="py-3 text-right font-bold text-white font-mono">
                      {dev.power_w ? `${dev.power_w.toLocaleString()} W` : '0 W'}
                    </td>
                    <td className="py-3 text-right text-slate-300 font-mono">
                      {dev.voltage_v ? `${dev.voltage_v} V` : '230.0 V'}
                    </td>
                    <td className="py-3 text-center">
                      <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {dev.device_status || 'ONLINE'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/80 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>⚡ Smart Energy Monitoring Cloud System • Cloud Computing Project</p>
          <p className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>REST API + Cloud PostgreSQL + IoT Telemetry Ingestion</span>
          </p>
        </div>
      </footer>

      {/* Modals */}
      <DeviceManager
        isOpen={isDeviceModalOpen}
        onClose={() => setIsDeviceModalOpen(false)}
        devices={liveData?.devices || []}
        onAddDevice={handleAddDevice}
        onDeleteDevice={handleDeleteDevice}
      />

      <SimulatorControl
        isOpen={isSimModalOpen}
        onClose={() => setIsSimModalOpen(false)}
        simulatorStatus={simulatorStatus}
        onToggleSimulator={handleToggleSimulator}
        onInjectSurge={handleInjectSurge}
      />

    </div>
  );
}
