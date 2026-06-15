const express = require('express');
const cors = require('cors');
const http = require('http');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const sitesRoutes = require('./routes/sites');
const monitoringRoutes = require('./routes/monitoring');
const usersRoutes = require('./routes/users');
const alertsRoutes = require('./routes/alerts');
const { startMqttClient } = require('./mqtt/client');
const { checkDatabase } = require('./db/check');
const { initSchemaIfNeeded } = require('./db/init-on-startup');
const { createWebSocketServer } = require('../websocket/broadcast');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 9000;

async function startServer() {
  console.log("🚀 START SERVER...");

  const dbOk = await checkDatabase();
  console.log("DB OK =", dbOk);

  const schemaOk = await initSchemaIfNeeded();
  console.log("SCHEMA OK =", schemaOk);

  if (!dbOk || !schemaOk) {
    console.log("❌ STOPPING SERVER");
    process.exit(1);
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log("🔥 SERVER RUNNING ON", PORT);
  });
}

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost', 'http://localhost:80'],
  credentials: true,
}));
app.use(express.json());

// Request logging in development
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
  });
}

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/lumen/auth', authRoutes);
app.use('/api/lumen/sites', sitesRoutes);
app.use('/api/lumen/monitoring', monitoringRoutes);
app.use('/api/lumen/users', usersRoutes);
app.use('/api/lumen/alerts', alertsRoutes);

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Erreur serveur interne' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route non trouvée' });
});

async function startServer() {
  // Check database before starting
  const dbOk = await checkDatabase();
  if (!dbOk) {
    console.error('\nLe serveur ne peut pas démarrer sans connexion à la base de données.');
    console.error('Corrigez la configuration et redémarrez.\n');
    process.exit(1);
  }

  // Auto-initialize schema if needed
  const schemaOk = await initSchemaIfNeeded();
  if (!schemaOk) {
    console.error('\nLe serveur ne peut pas démarrer sans un schéma valide.');
    console.error('Vérifiez les permissions PostgreSQL et redémarrez.\n');
    process.exit(1);
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log('');
    console.log('=========================================');
    console.log(`LUMEN Backend API démarré sur le port ${PORT}`);
    console.log(`Environnement: ${process.env.NODE_ENV || 'development'}`);
    console.log(`API: http://localhost:${PORT}/api/lumen`);
    console.log(`Health: http://localhost:${PORT}/health`);
    console.log(`WebSocket: ws://localhost:${PORT}/ws`);
    console.log('=========================================');

    // Start WebSocket broadcast server
    createWebSocketServer(server);

    // Start MQTT client for SCADA/ESP32 data
    startMqttClient();
  });
}

startServer();

