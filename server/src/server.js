import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDatabase, isPostgresConnected } from './config/db.js';
import deviceRoutes from './routes/deviceRoutes.js';
import telemetryRoutes from './routes/telemetryRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import alertRoutes from './routes/alertRoutes.js';
import { startSimulationLoop, getSimulatorStatus, setSimulatorActive } from './simulator/iotSimulator.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: '*', // Allow all origins for easy cloud/local testing
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']
}));
app.use(express.json());

// API Routes
app.use('/api/devices', deviceRoutes);
app.use('/api/telemetry', telemetryRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/alerts', alertRoutes);

// Simulator Control Endpoints
app.get('/api/simulator/status', (req, res) => {
  res.json({ success: true, ...getSimulatorStatus() });
});

app.post('/api/simulator/toggle', (req, res) => {
  const { active, interval_ms } = req.body;
  const current = getSimulatorStatus();
  const nextActive = active !== undefined ? Boolean(active) : !current.active;
  const nextInterval = interval_ms ? Number(interval_ms) : current.interval_ms;
  const status = setSimulatorActive(nextActive, nextInterval);
  res.json({ success: true, message: `Simulator is now ${status.active ? 'RUNNING' : 'PAUSED'}`, ...status });
});

// Health Check Endpoint (Essential for cloud deployment / Render / AWS)
app.get('/api/health', (req, res) => {
  res.json({
    status: 'HEALTHY',
    service: 'Smart Energy Monitoring Cloud Backend',
    database: isPostgresConnected ? 'Cloud PostgreSQL' : 'Simulated / In-Memory Store',
    timestamp: new Date(),
    uptime: process.uptime()
  });
});

// Root welcome
app.get('/', (req, res) => {
  res.json({
    message: '⚡ Smart Energy Monitoring Cloud API is running.',
    documentation: {
      devices: '/api/devices',
      telemetry: '/api/telemetry/live',
      analytics: '/api/analytics/summary',
      alerts: '/api/alerts',
      simulator: '/api/simulator/status'
    }
  });
});

// Start Server
async function startServer() {
  await initDatabase();
  
  // Start the automated IoT Meter background stream
  startSimulationLoop();

  app.listen(PORT, () => {
    console.log(`\n======================================================`);
    console.log(`⚡ Smart Energy Monitoring System - API Server`);
    console.log(`🌐 Server running at: http://localhost:${PORT}`);
    console.log(`📊 Health Check:      http://localhost:${PORT}/api/health`);
    console.log(`======================================================\n`);
  });
}

startServer();
