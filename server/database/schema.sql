-- ==========================================================
-- Smart Energy Monitoring System - Database Schema (PostgreSQL)
-- ==========================================================

-- 1. Devices Table
CREATE TABLE IF NOT EXISTS devices (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    device_type VARCHAR(50) NOT NULL,
    location VARCHAR(100) DEFAULT 'Main Building',
    status VARCHAR(20) DEFAULT 'ONLINE',
    rated_power_w NUMERIC(10, 2) DEFAULT 1500.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Energy Readings Table (Time-Series Telemetry)
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

-- Index for fast time-series queries
CREATE INDEX IF NOT EXISTS idx_readings_timestamp ON energy_readings(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_readings_device_timestamp ON energy_readings(device_id, timestamp DESC);

-- 3. System Alerts Table
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

-- 4. Tariff & Carbon Settings
CREATE TABLE IF NOT EXISTS tariff_settings (
    id SERIAL PRIMARY KEY,
    base_rate_per_kwh NUMERIC(6, 3) DEFAULT 0.150,
    peak_rate_per_kwh NUMERIC(6, 3) DEFAULT 0.250,
    currency VARCHAR(10) DEFAULT 'USD',
    co2_kg_per_kwh NUMERIC(6, 4) DEFAULT 0.4200,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
