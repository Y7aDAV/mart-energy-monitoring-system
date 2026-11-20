-- Seed Devices
INSERT INTO devices (name, device_type, location, status, rated_power_w) VALUES
('HVAC Central AC', 'HVAC', 'Main Floor', 'ONLINE', 3500.00),
('Living Room Refrigerator', 'REFRIGERATION', 'Kitchen', 'ONLINE', 450.00),
('Level 2 EV Charger', 'EV_CHARGER', 'Garage', 'ONLINE', 7200.00),
('Smart Lighting Grid', 'LIGHTING', 'All Rooms', 'ONLINE', 320.00),
('Water Heater / Geyser', 'WATER_HEATER', 'Utility Room', 'STANDBY', 2000.00),
('Home Office Workstations', 'IT_EQUIPMENT', 'Office', 'ONLINE', 650.00);

-- Seed Tariff
INSERT INTO tariff_settings (base_rate_per_kwh, peak_rate_per_kwh, currency, co2_kg_per_kwh) VALUES
(0.150, 0.280, 'USD', 0.4200);

-- Seed Sample Alert
INSERT INTO alerts (device_id, type, severity, message, value, threshold, status) VALUES
(3, 'HIGH_POWER_SURGE', 'WARNING', 'EV Charger peak draw exceeded 7000W threshold during peak tariff window', 7150.00, 7000.00, 'ACTIVE');
