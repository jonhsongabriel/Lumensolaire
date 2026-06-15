const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const sitesRoutes = require('./routes/sites');
const monitoringRoutes = require('./routes/monitoring');
const usersRoutes = require('./routes/users');
const alertsRoutes = require('./routes/alerts');

const app = express();
const PORT = process.env.PORT || 9000;

// Middleware
app.use(cors());
app.use(express.json());

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

app.listen(PORT, () => {
  console.log(`LUMEN Backend API running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
