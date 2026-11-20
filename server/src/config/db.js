import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

export let isPostgresConnected = false;
export let pool = null;

// In-Memory Fallback Storage (Used when DATABASE_URL is not yet configured)
export const inMemoryStore = {
  devices: [
    { id: 1, name: 'HVAC Central AC', device_type: 'HVAC', location: 'Main Floor', status: 'ONLINE', rated_power_w: 3500.00, created_at: new Date() },
    { id: 2, name: 'Living Room Refrigerator', device_type: 'REFRIGERATION', location: 'Kitchen', status: 'ONLINE', rated_power_w: 450.00, created_at: new Date() },
    { id: 3, name: 'Level 2 EV Charger', device_type: 'EV_CHARGER', location: 'Garage', status: 'ONLINE', rated_power_w: 7200.00, created_at: new Date() },
    { id: 4, name: 'Smart Lighting Grid', device_type: 'LIGHTING', location: 'All Rooms', status: 'ONLINE', rated_power_w: 320.00, created_at: new Date() },
    { id: 5, name: 'Water Heater / Geyser', device_type: 'WATER_HEATER', location: 'Utility Room', status: 'STANDBY', rated_power_w: 2000.00, created_at: new Date() },
    { id: 6, name: 'Home Office Workstations', device_type: 'IT_EQUIPMENT', location: 'Office', status: 'ONLINE', rated_power_w: 650.00, created_at: new Date() }
  ],
  readings: [],
  alerts: [
    {
      id: 1,
      device_id: 3,
      type: 'HIGH_POWER_SURGE',
      severity: 'WARNING',
      message: 'EV Charger peak draw reached 7,150W during high grid demand',
      value: 7150.00,
      threshold: 7000.00,
      status: 'ACTIVE',
      created_at: new Date(Date.now() - 15 * 60 * 1000)
    }
  ],
  tariff: {
    base_rate_per_kwh: 0.150,
    peak_rate_per_kwh: 0.280,
    currency: 'USD',
    co2_kg_per_kwh: 0.4200
  }
};

// Generate realistic seed history for inMemoryStore (last 24 hours)
function generateSeedHistory() {
  const now = Date.now();
  const intervals = 48; // every 30 minutes
  for (let i = intervals; i >= 0; i--) {
    const timestamp = new Date(now - i * 30 * 60 * 1000);
    const hour = timestamp.getHours();
    const isPeak = hour >= 17 && hour <= 21; // Peak hours: 5 PM - 9 PM

    for (const dev of inMemoryStore.devices) {
      let powerFactor = dev.status === 'ONLINE' ? (isPeak ? 0.8 : 0.45) : 0.05;
      const baseW = Number(dev.rated_power_w) * powerFactor;
      const jitter = (Math.random() - 0.5) * 0.15 * baseW;
      const powerW = Math.max(0, Math.round(baseW + jitter));
      const voltageV = Math.round((228 + Math.random() * 5) * 10) / 10;
      const currentA = powerW > 0 ? Math.round((powerW / voltageV) * 100) / 100 : 0;
      const energyKwh = Math.round((powerW * 0.5 / 1000) * 10000) / 10000; // 30-min slice

      inMemoryStore.readings.push({
        id: inMemoryStore.readings.length + 1,
        device_id: dev.id,
        timestamp,
        voltage_v: voltageV,
        current_a: currentA,
        power_w: powerW,
        energy_kwh: energyKwh,
        power_factor: 0.95,
        frequency_hz: 50.0
      });
    }
  }
}
generateSeedHistory();

export async function initDatabase() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    console.log('\x1b[33m%s\x1b[0m', '⚡ [Database]: No DATABASE_URL found in .env. Running in In-Memory / Simulated Mode.');
    console.log('\x1b[36m%s\x1b[0m', '💡 Tip: To connect to Cloud PostgreSQL (Neon/Supabase/Render), add DATABASE_URL=your_connection_string to server/.env');
    isPostgresConnected = false;
    return;
  }

  try {
    pool = new Pool({
      connectionString,
      ssl: connectionString.includes('localhost') ? false : { rejectUnauthorized: false }
    });

    const client = await pool.connect();
    isPostgresConnected = true;
    console.log('\x1b[32m%s\x1b[0m', '✅ [Database]: Successfully connected to Cloud PostgreSQL database!');

    // Initialize Schema
    await client.query(`
      CREATE TABLE IF NOT EXISTS devices (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        device_type VARCHAR(50) NOT NULL,
        location VARCHAR(100) DEFAULT 'Main Building',
        status VARCHAR(20) DEFAULT 'ONLINE',
        rated_power_w NUMERIC(10, 2) DEFAULT 1500.00,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS energy_readings (
        id BIGSERIAL PRIMARY KEY,
        device_id INT REFERENCES devices(id) ON DELETE CASCADE,
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        voltage_v NUMERIC(6, 2) NOT NULL,
        current_a NUMERIC(6, 2) NOT NULL,
        power_w NUMERIC(10, 2) NOT NULL,
        energy_kwh NUMERIC(12, 4) NOT NULL,
        power_factor NUMERIC(3, 2) DEFAULT 0.95,
        frequency_hz NUMERIC(4, 2) DEFAULT 50.00
      );

      CREATE INDEX IF NOT EXISTS idx_readings_timestamp ON energy_readings(timestamp DESC);
      CREATE INDEX IF NOT EXISTS idx_readings_device_timestamp ON energy_readings(device_id, timestamp DESC);

      CREATE TABLE IF NOT EXISTS alerts (
        id SERIAL PRIMARY KEY,
        device_id INT REFERENCES devices(id) ON DELETE SET NULL,
        type VARCHAR(50) NOT NULL,
        severity VARCHAR(20) DEFAULT 'WARNING',
        message TEXT NOT NULL,
        value NUMERIC(10, 2),
        threshold NUMERIC(10, 2),
        status VARCHAR(20) DEFAULT 'ACTIVE',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS tariff_settings (
        id SERIAL PRIMARY KEY,
        base_rate_per_kwh NUMERIC(6, 3) DEFAULT 0.150,
        peak_rate_per_kwh NUMERIC(6, 3) DEFAULT 0.250,
        currency VARCHAR(10) DEFAULT 'USD',
        co2_kg_per_kwh NUMERIC(6, 4) DEFAULT 0.4200,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Check if devices exist, if not, seed default devices
    const deviceCountRes = await client.query('SELECT COUNT(*) FROM devices');
    if (parseInt(deviceCountRes.rows[0].count, 10) === 0) {
      await client.query(`
        INSERT INTO devices (name, device_type, location, status, rated_power_w) VALUES
        ('HVAC Central AC', 'HVAC', 'Main Floor', 'ONLINE', 3500.00),
        ('Living Room Refrigerator', 'REFRIGERATION', 'Kitchen', 'ONLINE', 450.00),
        ('Level 2 EV Charger', 'EV_CHARGER', 'Garage', 'ONLINE', 7200.00),
        ('Smart Lighting Grid', 'LIGHTING', 'All Rooms', 'ONLINE', 320.00),
        ('Water Heater / Geyser', 'WATER_HEATER', 'Utility Room', 'STANDBY', 2000.00),
        ('Home Office Workstations', 'IT_EQUIPMENT', 'Office', 'ONLINE', 650.00);

        INSERT INTO tariff_settings (base_rate_per_kwh, peak_rate_per_kwh, currency, co2_kg_per_kwh) VALUES
        (0.150, 0.280, 'USD', 0.4200);
      `);
      console.log('🌱 Seeded default devices and tariff into PostgreSQL.');
    }

    client.release();
  } catch (error) {
    console.error('\x1b[31m%s\x1b[0m', '❌ [Database]: PostgreSQL connection failed. Falling back to in-memory mode.', error.message);
    isPostgresConnected = false;
  }
}

export async function query(text, params) {
  if (isPostgresConnected && pool) {
    return pool.query(text, params);
  }
  return null;
}
