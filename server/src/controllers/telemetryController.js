import { query, isPostgresConnected, inMemoryStore } from '../config/db.js';

// POST /api/telemetry - Ingest data from smart meter / IoT node
export async function ingestTelemetry(req, res) {
  try {
    const { device_id, voltage_v, current_a, power_w, energy_kwh, power_factor, frequency_hz } = req.body;

    if (!device_id || power_w === undefined) {
      return res.status(400).json({ success: false, message: 'device_id and power_w are required' });
    }

    const voltage = Number(voltage_v) || 230.0;
    const current = Number(current_a) || (power_w / voltage);
    const power = Number(power_w);
    const energy = Number(energy_kwh) || (power * (5 / 3600) / 1000); // 5 sec slice if not specified
    const pf = Number(power_factor) || 0.95;
    const freq = Number(frequency_hz) || 50.0;
    const timestamp = new Date();

    // Check for high power surge or abnormal consumption
    let triggeredAlert = null;
    let deviceRatedPower = 3000;

    if (isPostgresConnected) {
      const devRes = await query('SELECT rated_power_w, name FROM devices WHERE id = $1', [device_id]);
      if (devRes.rows.length > 0) {
        deviceRatedPower = Number(devRes.rows[0].rated_power_w);
      }

      // If power exceeds 115% of rated power
      if (power > deviceRatedPower * 1.15) {
        const alertRes = await query(
          `INSERT INTO alerts (device_id, type, severity, message, value, threshold, status)
           VALUES ($1, $2, $3, $4, $5, $6, 'ACTIVE') RETURNING *`,
          [
            device_id,
            'HIGH_POWER_SURGE',
            'WARNING',
            `Power surge detected: ${power}W on device #${device_id} (Limit: ${deviceRatedPower}W)`,
            power,
            deviceRatedPower
          ]
        );
        triggeredAlert = alertRes.rows[0];
      }

      // Insert reading
      const readingRes = await query(
        `INSERT INTO energy_readings (device_id, timestamp, voltage_v, current_a, power_w, energy_kwh, power_factor, frequency_hz)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
        [device_id, timestamp, voltage, current, power, energy, pf, freq]
      );

      return res.status(201).json({
        success: true,
        data: readingRes.rows[0],
        alert: triggeredAlert
      });
    }

    // In-memory fallback
    const dev = inMemoryStore.devices.find(d => d.id === Number(device_id));
    if (dev) {
      deviceRatedPower = Number(dev.rated_power_w);
    }

    if (power > deviceRatedPower * 1.15) {
      triggeredAlert = {
        id: inMemoryStore.alerts.length + 1,
        device_id: Number(device_id),
        type: 'HIGH_POWER_SURGE',
        severity: 'WARNING',
        message: `Power surge detected: ${power}W on ${dev ? dev.name : 'Device ' + device_id} (Limit: ${deviceRatedPower}W)`,
        value: power,
        threshold: deviceRatedPower,
        status: 'ACTIVE',
        created_at: timestamp
      };
      inMemoryStore.alerts.unshift(triggeredAlert);
    }

    const newReading = {
      id: inMemoryStore.readings.length + 1,
      device_id: Number(device_id),
      timestamp,
      voltage_v: voltage,
      current_a: current,
      power_w: power,
      energy_kwh: energy,
      power_factor: pf,
      frequency_hz: freq
    };

    inMemoryStore.readings.push(newReading);

    // Keep in-memory readings to max 3000 items to avoid memory buildup
    if (inMemoryStore.readings.length > 3000) {
      inMemoryStore.readings.splice(0, inMemoryStore.readings.length - 2500);
    }

    return res.status(201).json({
      success: true,
      data: newReading,
      alert: triggeredAlert
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

// GET /api/telemetry/live - Get current power demand and latest reading per device
export async function getLiveTelemetry(req, res) {
  try {
    if (isPostgresConnected) {
      // Get the latest reading for each device
      const queryText = `
        SELECT DISTINCT ON (d.id) 
          d.id as device_id,
          d.name as device_name,
          d.device_type,
          d.location,
          d.status as device_status,
          d.rated_power_w,
          r.power_w,
          r.voltage_v,
          r.current_a,
          r.power_factor,
          r.timestamp
        FROM devices d
        LEFT JOIN energy_readings r ON d.id = r.device_id
        ORDER BY d.id, r.timestamp DESC NULLS LAST;
      `;
      const result = await query(queryText);
      const devices = result.rows;

      const totalPowerW = devices.reduce((sum, d) => sum + (Number(d.power_w) || 0), 0);
      const avgVoltage = devices.length > 0 ? (devices.reduce((sum, d) => sum + (Number(d.voltage_v) || 230), 0) / devices.length).toFixed(1) : 230;

      return res.json({
        success: true,
        source: 'postgresql',
        timestamp: new Date(),
        total_power_kw: (totalPowerW / 1000).toFixed(3),
        total_power_w: Math.round(totalPowerW),
        average_voltage_v: avgVoltage,
        devices
      });
    }

    // In-memory fallback
    const devices = inMemoryStore.devices.map(d => {
      const devReadings = inMemoryStore.readings.filter(r => r.device_id === d.id);
      const latest = devReadings.length > 0 ? devReadings[devReadings.length - 1] : null;
      return {
        device_id: d.id,
        device_name: d.name,
        device_type: d.device_type,
        location: d.location,
        device_status: d.status,
        rated_power_w: d.rated_power_w,
        power_w: latest ? latest.power_w : 0,
        voltage_v: latest ? latest.voltage_v : 230.0,
        current_a: latest ? latest.current_a : 0,
        power_factor: latest ? latest.power_factor : 0.95,
        timestamp: latest ? latest.timestamp : new Date()
      };
    });

    const totalPowerW = devices.reduce((sum, d) => sum + (Number(d.power_w) || 0), 0);
    const avgVoltage = devices.length > 0 ? (devices.reduce((sum, d) => sum + (Number(d.voltage_v) || 230), 0) / devices.length).toFixed(1) : 230;

    return res.json({
      success: true,
      source: 'in_memory',
      timestamp: new Date(),
      total_power_kw: (totalPowerW / 1000).toFixed(3),
      total_power_w: Math.round(totalPowerW),
      average_voltage_v: avgVoltage,
      devices
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}
