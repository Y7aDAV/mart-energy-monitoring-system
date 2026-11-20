const API_BASE = import.meta.env.VITE_API_URL || '';

async function handleResponse(res) {
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `Request failed with status ${res.status}`);
  }
  return res.json();
}

export const api = {
  // System Health
  async getHealth() {
    return handleResponse(await fetch(`${API_BASE}/api/health`));
  },

  // Live Telemetry
  async getLiveTelemetry() {
    return handleResponse(await fetch(`${API_BASE}/api/telemetry/live`));
  },

  // Ingest Reading
  async ingestReading(payload) {
    return handleResponse(await fetch(`${API_BASE}/api/telemetry`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }));
  },

  // Analytics
  async getSummary() {
    return handleResponse(await fetch(`${API_BASE}/api/analytics/summary`));
  },

  async getRealtimeTrend() {
    return handleResponse(await fetch(`${API_BASE}/api/analytics/realtime`));
  },

  async getHistoricalTrend() {
    return handleResponse(await fetch(`${API_BASE}/api/analytics/historical`));
  },

  async getApplianceBreakdown() {
    return handleResponse(await fetch(`${API_BASE}/api/analytics/breakdown`));
  },

  // Alerts
  async getAlerts(status = '') {
    const url = status ? `${API_BASE}/api/alerts?status=${status}` : `${API_BASE}/api/alerts`;
    return handleResponse(await fetch(url));
  },

  async resolveAlert(id) {
    return handleResponse(await fetch(`${API_BASE}/api/alerts/${id}/resolve`, {
      method: 'POST'
    }));
  },

  // Devices
  async getDevices() {
    return handleResponse(await fetch(`${API_BASE}/api/devices`));
  },

  async createDevice(device) {
    return handleResponse(await fetch(`${API_BASE}/api/devices`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(device)
    }));
  },

  async deleteDevice(id) {
    return handleResponse(await fetch(`${API_BASE}/api/devices/${id}`, {
      method: 'DELETE'
    }));
  },

  // Simulator
  async getSimulatorStatus() {
    return handleResponse(await fetch(`${API_BASE}/api/simulator/status`));
  },

  async toggleSimulator(active, interval_ms) {
    return handleResponse(await fetch(`${API_BASE}/api/simulator/toggle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active, interval_ms })
    }));
  }
};
