const express = require('express');
const { pool } = require('../db/connection');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get monitoring data for a site
router.get('/site/:siteId', authenticateToken, async (req, res) => {
  try {
    const { limit = 100, offset = 0 } = req.query;
    
    const result = await pool.query(
      `SELECT * FROM monitoring_data 
       WHERE site_id = $1 
       ORDER BY timestamp DESC 
       LIMIT $2 OFFSET $3`,
      [req.params.siteId, limit, offset]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Erreur récupération données:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Get latest monitoring data for a site
router.get('/site/:siteId/latest', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM monitoring_data 
       WHERE site_id = $1 
       ORDER BY timestamp DESC 
       LIMIT 1`,
      [req.params.siteId]
    );
    
    res.json(result.rows[0] || null);
  } catch (error) {
    console.error('Erreur récupération dernières données:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Insert monitoring data (called by SCADA/MQTT)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      site_id, production_kw, consumption_kw, battery_level_percent,
      battery_voltage, temperature_celsius, grid_status
    } = req.body;
    
    const result = await pool.query(
      `INSERT INTO monitoring_data 
       (site_id, production_kw, consumption_kw, battery_level_percent,
        battery_voltage, temperature_celsius, grid_status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [site_id, production_kw, consumption_kw, battery_level_percent,
       battery_voltage, temperature_celsius, grid_status]
    );
    
    // Update site last_communication
    await pool.query(
      `UPDATE sites SET last_communication = NOW() WHERE id = $1`,
      [site_id]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erreur insertion données:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Get monitoring data summary (aggregated)
router.get('/summary/:siteId', authenticateToken, async (req, res) => {
  try {
    const { period = '24h' } = req.query;
    let interval;
    
    switch (period) {
      case '1h': interval = '1 hour'; break;
      case '24h': interval = '24 hours'; break;
      case '7d': interval = '7 days'; break;
      case '30d': interval = '30 days'; break;
      default: interval = '24 hours';
    }
    
    const result = await pool.query(
      `SELECT 
        AVG(production_kw) as avg_production,
        MAX(production_kw) as max_production,
        AVG(consumption_kw) as avg_consumption,
        AVG(battery_level_percent) as avg_battery_level,
        AVG(temperature_celsius) as avg_temperature,
        COUNT(*) as data_points
       FROM monitoring_data 
       WHERE site_id = $1 AND timestamp >= NOW() - INTERVAL '${interval}'`,
      [req.params.siteId]
    );
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erreur récupération résumé:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
