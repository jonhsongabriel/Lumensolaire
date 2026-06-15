const express = require('express');
const { pool } = require('../db/connection');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get all alerts
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { site_id, status, severity } = req.query;
    let query = `SELECT a.*, s.name as site_name 
                 FROM alerts a 
                 JOIN sites s ON a.site_id = s.id`;
    const params = [];
    const conditions = [];

    if (site_id) {
      params.push(site_id);
      conditions.push(`a.site_id = $${params.length}`);
    }
    if (status) {
      params.push(status);
      conditions.push(`a.status = $${params.length}`);
    }
    if (severity) {
      params.push(severity);
      conditions.push(`a.severity = $${params.length}`);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY a.created_at DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Erreur récupération alertes:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Create alert
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { site_id, severity, title, message, threshold_value, actual_value } = req.body;
    
    const result = await pool.query(
      `INSERT INTO alerts (site_id, severity, title, message, threshold_value, actual_value)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [site_id, severity || 'info', title, message, threshold_value, actual_value]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erreur création alerte:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Acknowledge alert
router.patch('/:id/acknowledge', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE alerts 
       SET status = 'acknowledged', acknowledged_by = $1, acknowledged_at = NOW()
       WHERE id = $2 RETURNING *`,
      [req.user.userId, req.params.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Alerte non trouvée' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erreur acquittement alerte:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Resolve alert
router.patch('/:id/resolve', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE alerts 
       SET status = 'resolved', resolved_at = NOW()
       WHERE id = $1 RETURNING *`,
      [req.params.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Alerte non trouvée' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erreur résolution alerte:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
