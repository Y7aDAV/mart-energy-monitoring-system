# ⚡ VoltPulse — Smart Energy Cloud Monitoring System

A cloud-native, full-stack IoT telemetry and energy management platform built for modern cloud computing architectures. 
Demonstrates end-to-end telemetry ingestion, time-series data aggregation, automated anomaly detection, and interactive live dashboards.

---

## 🏛️ System Architecture

VoltPulse implements a classic **3-Tier Cloud Architecture**:

```
 [ Smart Meter IoT Fleet / Simulator ]
                  │
                  ▼ (HTTP POST /api/telemetry JSON Packets)
 ┌────────────────────────────────────────────────────────────┐
 │                  Application / Compute Tier                │
 │                 Node.js + Express REST API                 │
 │     - Telemetry Ingestion Engine & Anomaly Detection       │
 │     - Time-Series Aggregations & Tariff Billing Logic      │
 │     - Docker Containerized (Render / AWS ECS / Cloud Run)  │
 └───────────────┬────────────────────────────┬───────────────┘
                 │                            │
                 ▼                            ▼
 ┌───────────────────────────────┐    ┌─────────────────────────────────┐
 │          Data Tier            │    │       Presentation Tier         │
 │    Cloud PostgreSQL (Neon)    │    │    React 18 + Vite + Tailwind   │
 │   - devices                   │    │    Recharts Telemetry Waveforms │
 │   - energy_readings (indexed) │    │    Live Power Dial & Analytics  │
 │   - alerts & tariffs          │    │    (Vercel / Netlify CDN)       │
 └───────────────────────────────┘    └─────────────────────────────────┘
```

---

## 🚀 Key Features

* **Real-Time Telemetry Dashboard:** Live active power demand (kW & Watts), voltage fluctuations, grid frequency (50 Hz), and power factor.
* **Interactive Power Dial & Waveform:** Streaming chart reflecting real-time load oscillations from smart appliances.
* **Time-Series Analytics:** 24-hour historical aggregations with hourly energy consumption (kWh), monetary cost ($), and carbon emissions (kg CO₂).
* **Appliance Distribution:** Interactive donut breakdown of energy consumption across major categories (HVAC, EV Charger, Refrigeration, Lighting, Water Heating, IT Equipment).
* **Automated Anomaly & Surge Detection:** Real-time triggers when device wattage exceeds 115% of rated threshold, creating system alerts.
* **Built-in IoT Hardware Simulator:** In-memory or database-backed simulator that generates continuous smart meter readings every 1–5 seconds with an interactive "Inject Surge" trigger for live demos.
* **Zero Configuration Fallback:** Works straight out-of-the-box in simulated mode, and instantly switches to live Cloud PostgreSQL when `DATABASE_URL` is supplied in `.env`.

---

## 🗄️ Database Schema (PostgreSQL)

Located in `server/database/schema.sql`:

1. **`devices`**:
   * `id SERIAL PRIMARY KEY`
   * `name VARCHAR(100)`, `device_type VARCHAR(50)`, `location VARCHAR(100)`
   * `status VARCHAR(20)`, `rated_power_w NUMERIC(10, 2)`
2. **`energy_readings`** *(Time-Series Telemetry)*:
   * `id BIGSERIAL PRIMARY KEY`
   * `device_id INT REFERENCES devices(id)`
   * `timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP`
   * `voltage_v`, `current_a`, `power_w`, `energy_kwh`, `power_factor`, `frequency_hz`
   * *Indexes on `timestamp` and `(device_id, timestamp)` for rapid aggregation queries.*
3. **`alerts`**:
   * `id SERIAL PRIMARY KEY`
   * `device_id INT REFERENCES devices(id)`, `type VARCHAR(50)`, `severity VARCHAR(20)`
   * `message TEXT`, `value NUMERIC`, `threshold NUMERIC`, `status VARCHAR(20)`
4. **`tariff_settings`**:
   * `base_rate_per_kwh`, `peak_rate_per_kwh`, `currency`, `co2_kg_per_kwh`

---

## 🛠️ Quickstart (Running Locally)

### 1. Prerequisites
* [Node.js (v18+)](https://nodejs.org/) installed.

### 2. Start the Backend API Server
```bash
cd server
npm install
npm run dev
```
* Backend starts at `http://localhost:5000`
* Health check: `http://localhost:5000/api/health`

### 3. Start the Frontend Dashboard
In a second terminal window:
```bash
cd client
npm install
npm run dev
```
* Frontend starts at `http://localhost:3000`
* Open your browser to `http://localhost:3000` to view the live dashboard!

---

## ☁️ Connecting to Free Cloud PostgreSQL (Neon / Supabase)

To connect the application to a real Cloud PostgreSQL instance in 2 minutes:

1. Create a free account at **[Neon.tech](https://neon.tech)** (Serverless Cloud PostgreSQL) or **[Supabase.com](https://supabase.com)**.
2. Create a new database project named `smart-energy`.
3. Copy your connection string:
   ```text
   postgresql://username:password@ep-sample-123456.us-east-2.aws.neon.tech/smart-energy?sslmode=require
   ```
4. Paste it into `server/.env`:
   ```env
   DATABASE_URL=postgresql://username:password@ep-sample-123456.us-east-2.aws.neon.tech/smart-energy?sslmode=require
   ```
5. Restart the server (`npm run dev`). The server will automatically create all tables and seed baseline devices into your cloud database!

---

## 🐳 Docker Deployment

To launch the full 3-tier system (Frontend, Backend, and PostgreSQL) with a single command:

```bash
docker-compose up --build
```
* **Frontend:** `http://localhost:3000`
* **API:** `http://localhost:5000`
* **PostgreSQL:** Port `5432`

---

## 🌐 Deploying to the Cloud for Free

### 1. Backend on Render.com (Free)
1. Push your repository to GitHub.
2. Log into [Render.com](https://render.com) and click **New + > Web Service**.
3. Select your repository, set the root directory to `server`.
4. Build Command: `npm install`
5. Start Command: `node src/server.js`
6. Under **Environment Variables**, add `DATABASE_URL` with your Neon/Supabase cloud connection string.

### 2. Frontend on Vercel (Free)
1. Log into [Vercel.com](https://vercel.com) and click **Add New > Project**.
2. Select your repository and set the root directory to `client`.
3. Set Environment Variable: `VITE_API_URL=https://your-render-backend-url.onrender.com`
4. Click **Deploy**. Your dashboard is now live globally!

---

## 🎓 College Viva & Presentation Q&A Cheat Sheet

| Question | Strong Answer |
| :--- | :--- |
| **Why 3-Tier Architecture instead of client-to-database?** | Separating presentation, application logic, and data storage ensures security (database credentials never touch client browsers), enforces business validation (surge anomaly triggers), and allows independent horizontal scaling of API instances. |
| **Why PostgreSQL instead of MongoDB?** | Energy systems require relational integrity between devices, circuits, and tariffs, and benefit from SQL time-series aggregations (`SUM()`, `AVG()`, `GROUP BY date_trunc('hour', timestamp)`), which are faster and more consistent (ACID compliant) than document stores. |
| **How does the system simulate IoT hardware?** | The built-in simulator mimics physical smart meters (like ESP32/PZEM-004T current transducers) broadcasting telemetry packets with realistic voltage noise, power factors, and cyclic consumption patterns. |
| **How are anomalies detected?** | The backend compares incoming power draw ($P = V \times I \times \text{PF}$) against the device's rated capacity. A spike exceeding 115% creates an active alert with severity ranking. |
