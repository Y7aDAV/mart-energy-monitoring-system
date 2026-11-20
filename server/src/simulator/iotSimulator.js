import { isPostgresConnected, inMemoryStore, query } from '../config/db.js';

let simulationInterval = null;
let isSimulationActive = true; // Enabled by default to stream live data
let intervalMs = 3000; // Emit every 3 seconds

// Realistic profiles per device type
const profiles = {
  HVAC: { min: 1800, max: 3400, surgeChance: 0.05 },
  REFRIGERATION: { min: 110, max: 420, surgeChance: 0.02 },
  EV_CHARGER: { min: 5800, max: 7300, surgeChance: 0.08 },
  LIGHTING: { min: 80, max: 320, surgeChance: 0.01 },
  WATER_HEATER: { min: 1500, max: 2100, surgeChance: 0.03 },
  IT_EQUIPMENT: { min: 300, max: 620, surgeChance: 0.02 },
  GENERAL: { min: 100, max: 1200, surgeChance: 0.04 }
};

export function getSimulatorStatus() {
  return {
    active: isSimulationActive,
    interval_ms: intervalMs,
    mode: isPostgresConnected ? 'postgresql' : 'in_memory'
  };
}

export function setSimulatorActive(active, newInterval = 3000) {
  isSimulationActive = active;
  intervalMs = newInterval;

  if (simulationInterval) {
    clearInterval(simulationInterval);
    simulationInterval = null;
  }

  if (isSimulationActive) {
    startSimulationLoop();
  }

  return getSimulatorStatus();
}

async function emitTick() {
  try {
    const timestamp = new Date();
    let devices = [];

    if (isPostgresConnected) {
      const res = await query('SELECT * FROM devices WHERE status != $1', ['OFFLINE']);
      devices = res.rows;
    } else {
      devices = inMemoryStore.devices.filter(d => d.status !== 'OFFLINE');
    }

    if (!devices || devices.length === 0) return;

    for (const dev of devices) {
      const profile = profiles[dev.device_type] || profiles.GENERAL;
      let powerW = Math.round(profile.min + Math.random() * (profile.max - profile.min));

      // Occasional surge to demonstrate alerts
      if (Math.random() < profile.surgeChance) {
        powerW = Math.round(Number(dev.rated_power_w) * (1.18 + Math.random() * 0.15));
      }

      // 230V grid with slight noise
      const voltageV = Math.round((228 + Math.random() * 5) * 10) / 10;
      const currentA = Math.round((powerW / voltageV) * 100) / 100;
      const powerFactor = Math.round((0.92 + Math.random() * 0.07) * 100) / 100;
      const frequencyHz = Math.round((49.9 + Math.random() * 0.2) * 10) / 10;
      // Energy in kWh for this 3-sec interval
      const energyKwh = Math.round(((powerW * (intervalMs / 1000) / 3600) / 1000) * 100000) / 100000;

      if (isPostgresConnected) {
        // Insert reading
        await query(
          `INSERT INTO energy_readings (device_id, timestamp, voltage_v, current_a, power_w, energy_kwh, power_factor, frequency_hz)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [dev.id, timestamp, voltageV, currentA, powerW, energyKwh, powerFactor, frequencyHz]
        );

        // Check surge alert
        if (powerW > Number(dev.rated_power_w) * 1.15) {
          await query(
            `INSERT INTO alerts (device_id, type, severity, message, value, threshold, status)
             VALUES ($1, $2, $3, $4, $5, $6, 'ACTIVE')`,
            [
              dev.id,
              'HIGH_POWER_SURGE',
              'WARNING',
              `Surge alert: ${powerW}W exceeded rated limit of ${dev.rated_power_w}W on ${dev.name}`,
              powerW,
              dev.rated_power_w
            ]
          );
        }
      } else {
        // In-memory reading
        inMemoryStore.readings.push({
          id: inMemoryStore.readings.length + 1,
          device_id: dev.id,
          timestamp,
          voltage_v: voltageV,
          current_a: currentA,
          power_w: powerW,
          energy_kwh: energyKwh,
          power_factor: powerFactor,
          frequency_hz: frequencyHz
        });

        // Surge alert check
        if (powerW > Number(dev.rated_power_w) * 1.15) {
          inMemoryStore.alerts.unshift({
            id: inMemoryStore.alerts.length + 1,
            device_id: dev.id,
            type: 'HIGH_POWER_SURGE',
            severity: 'WARNING',
            message: `Surge alert: ${powerW}W exceeded rated limit of ${dev.rated_power_w}W on ${dev.name}`,
            value: powerW,
            threshold: dev.rated_power_w,
            status: 'ACTIVE',
            created_at: timestamp
          });
        }
      }
    }

    // Clean up old readings if in-memory
    if (!isPostgresConnected && inMemoryStore.readings.length > 2500) {
      inMemoryStore.readings.splice(0, inMemoryStore.readings.length - 2000);
    }
  } catch (err) {
    console.error('Simulator tick error:', err.message);
  }
}

export function startSimulationLoop() {
  if (simulationInterval) clearInterval(simulationInterval);
  simulationInterval = setInterval(emitTick, intervalMs);
  console.log(`📡 [IoT Simulator]: Running. Broadcasting smart meter readings every ${intervalMs / 1000}s`);
}

// Standalone execution support: node src/simulator/iotSimulator.js
if (process.argv[1]?.endsWith('iotSimulator.js')) {
  console.log('Starting standalone Smart Energy IoT Meter Simulator...');
  startSimulationLoop();
}
