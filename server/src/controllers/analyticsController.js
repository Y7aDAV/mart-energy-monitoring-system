import { query, isPostgresConnected, inMemoryStore } from '../config/db.js';

// GET /api/analytics/summary - KPI Cards
export async function getSummary(req, res) {
  try {
    const tariff = isPostgresConnected 
      ? (await query('SELECT * FROM tariff_settings LIMIT 1')).rows[0] || { base_rate_per_kwh: 0.15, co2_kg_per_kwh: 0.42 }
      : inMemoryStore.tariff;

    const baseRate = Number(tariff.base_rate_per_kwh) || 0.15;
    const co2Factor = Number(tariff.co2_kg_per_kwh) || 0.42;

    if (isPostgresConnected) {
      // Aggregate today's readings
      const todayQuery = `
        SELECT 
          COALESCE(SUM(energy_kwh), 0) as today_kwh,
          COALESCE(MAX(power_w), 0) as peak_power_w,
          COALESCE(AVG(power_w), 0) as avg_power_w
        FROM energy_readings
        WHERE timestamp >= CURRENT_DATE;
      `;
      const result = await query(todayQuery);
      const row = result.rows[0];
      const todayKwh = Number(row.today_kwh);
      const peakPowerKw = (Number(row.peak_power_w) / 1000).toFixed(2);
      const costToday = (todayKwh * baseRate).toFixed(2);
      const carbonTodayKg = (todayKwh * co2Factor).toFixed(2);
      const estimatedMonthlyCost = (todayKwh * 30 * baseRate).toFixed(2);

      return res.json({
        success: true,
        data: {
          today_kwh: todayKwh.toFixed(2),
          peak_power_kw: peakPowerKw,
          cost_today: costToday,
          estimated_monthly_cost: estimatedMonthlyCost,
          carbon_today_kg: carbonTodayKg,
          currency: tariff.currency || 'USD'
        }
      });
    }

    // In-Memory Calculation
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayReadings = inMemoryStore.readings.filter(r => new Date(r.timestamp) >= today);
    const todayKwh = todayReadings.reduce((sum, r) => sum + (Number(r.energy_kwh) || 0), 0);
    const peakPowerW = todayReadings.reduce((max, r) => Math.max(max, Number(r.power_w) || 0), 0);

    const costToday = (todayKwh * baseRate).toFixed(2);
    const carbonTodayKg = (todayKwh * co2Factor).toFixed(2);
    const estimatedMonthlyCost = (todayKwh * 30 * baseRate).toFixed(2);

    return res.json({
      success: true,
      data: {
        today_kwh: todayKwh.toFixed(2),
        peak_power_kw: (peakPowerW / 1000).toFixed(2),
        cost_today: costToday,
        estimated_monthly_cost: estimatedMonthlyCost,
        carbon_today_kg: carbonTodayKg,
        currency: tariff.currency || 'USD'
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

// GET /api/analytics/realtime - Rolling power wave (last 15 readings)
export async function getRealtimeTrend(req, res) {
  try {
    if (isPostgresConnected) {
      const q = `
        SELECT 
          date_trunc('minute', timestamp) as time_slot,
          SUM(power_w) as total_power_w,
          AVG(voltage_v) as avg_voltage_v
        FROM energy_readings
        WHERE timestamp >= NOW() - INTERVAL '30 minutes'
        GROUP BY time_slot
        ORDER BY time_slot ASC
        LIMIT 30;
      `;
      const result = await query(q);
      const points = result.rows.map(r => ({
        time: new Date(r.time_slot).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        power_w: Math.round(Number(r.total_power_w)),
        power_kw: (Number(r.total_power_w) / 1000).toFixed(2),
        voltage: Number(r.avg_voltage_v).toFixed(1)
      }));
      return res.json({ success: true, data: points });
    }

    // In-memory: Group latest readings by time
    const readings = inMemoryStore.readings.slice(-60);
    // group by timestamp string
    const timeMap = new Map();
    for (const r of readings) {
      const timeKey = new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      if (!timeMap.has(timeKey)) {
        timeMap.set(timeKey, { time: timeKey, power_w: 0, count: 0, voltageSum: 0 });
      }
      const entry = timeMap.get(timeKey);
      entry.power_w += Number(r.power_w);
      entry.voltageSum += Number(r.voltage_v);
      entry.count += 1;
    }

    const points = Array.from(timeMap.values()).map(e => ({
      time: e.time,
      power_w: Math.round(e.power_w),
      power_kw: (e.power_w / 1000).toFixed(2),
      voltage: (e.voltageSum / (e.count || 1)).toFixed(1)
    }));

    return res.json({ success: true, data: points.slice(-20) });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

// GET /api/analytics/historical - Hourly usage and cost
export async function getHistoricalTrend(req, res) {
  try {
    if (isPostgresConnected) {
      const q = `
        SELECT 
          date_trunc('hour', timestamp) as hour_bucket,
          COALESCE(SUM(energy_kwh), 0) as kwh,
          COALESCE(AVG(power_w), 0) as avg_power_w
        FROM energy_readings
        WHERE timestamp >= NOW() - INTERVAL '24 hours'
        GROUP BY hour_bucket
        ORDER BY hour_bucket ASC;
      `;
      const result = await query(q);
      const data = result.rows.map(r => {
        const kwh = Number(r.kwh);
        return {
          time: new Date(r.hour_bucket).toLocaleTimeString([], { hour: '2-digit', minute: '00' }),
          kwh: Number(kwh.toFixed(2)),
          cost: Number((kwh * 0.15).toFixed(2)),
          carbon_kg: Number((kwh * 0.42).toFixed(2))
        };
      });
      return res.json({ success: true, data });
    }

    // In-memory hourly bucket calculation
    const hourMap = new Map();
    const now = Date.now();
    for (let h = 23; h >= 0; h--) {
      const d = new Date(now - h * 60 * 60 * 1000);
      const key = d.toLocaleTimeString([], { hour: '2-digit', minute: '00' });
      hourMap.set(key, { time: key, kwh: 0 });
    }

    for (const r of inMemoryStore.readings) {
      const d = new Date(r.timestamp);
      const key = d.toLocaleTimeString([], { hour: '2-digit', minute: '00' });
      if (hourMap.has(key)) {
        hourMap.get(key).kwh += Number(r.energy_kwh) || 0;
      }
    }

    const data = Array.from(hourMap.values()).map(h => ({
      time: h.time,
      kwh: Number(h.kwh.toFixed(2)),
      cost: Number((h.kwh * 0.15).toFixed(2)),
      carbon_kg: Number((h.kwh * 0.42).toFixed(2))
    }));

    return res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

// GET /api/analytics/breakdown - Consumption by appliance
export async function getApplianceBreakdown(req, res) {
  try {
    if (isPostgresConnected) {
      const q = `
        SELECT 
          d.device_type,
          d.name,
          COALESCE(SUM(r.energy_kwh), 0) as total_kwh,
          COALESCE(AVG(r.power_w), 0) as avg_power_w
        FROM devices d
        LEFT JOIN energy_readings r ON d.id = r.device_id
        GROUP BY d.device_type, d.name
        ORDER BY total_kwh DESC;
      `;
      const result = await query(q);
      const totalKwh = result.rows.reduce((sum, r) => sum + Number(r.total_kwh), 0) || 1;
      const data = result.rows.map(r => ({
        name: r.name,
        device_type: r.device_type,
        kwh: Number(Number(r.total_kwh).toFixed(2)),
        percentage: Math.round((Number(r.total_kwh) / totalKwh) * 100)
      }));
      return res.json({ success: true, data });
    }

    // In-memory breakdown
    const map = new Map();
    for (const d of inMemoryStore.devices) {
      map.set(d.id, { name: d.name, type: d.device_type, kwh: 0 });
    }

    for (const r of inMemoryStore.readings) {
      if (map.has(r.device_id)) {
        map.get(r.device_id).kwh += Number(r.energy_kwh) || 0;
      }
    }

    const items = Array.from(map.values());
    const totalKwh = items.reduce((sum, i) => sum + i.kwh, 0) || 1;

    const data = items.map(i => ({
      name: i.name,
      device_type: i.type,
      kwh: Number(i.kwh.toFixed(2)),
      percentage: Math.max(1, Math.round((i.kwh / totalKwh) * 100))
    }));

    return res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}
