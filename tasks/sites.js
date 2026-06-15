const express = require('express');
const { pool } = require('../db/connection');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Get all sites
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, location, latitude, longitude, status, system_type,
              capacity_kw, installation_date, last_communication,
              serial_number, scada_enabled, scada_protocol, scada_connection_status,
              scada_last_connected, created_at, updated_at
       FROM sites ORDER BY name`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Erreur récupération sites:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Get site by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM sites WHERE id = $1`,
      [req.params.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Site non trouvé' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erreur récupération site:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Create site (with SCADA support)
router.post('/', authenticateToken, requireRole(['admin', 'engineer']), async (req, res) => {
  try {
    const {
      name, location, latitude, longitude, system_type, capacity_kw,
      serial_number, password, scada_enabled, scada_protocol
    } = req.body;
    
    const result = await pool.query(
      `INSERT INTO sites (name, location, latitude, longitude, status, system_type,
                         capacity_kw, serial_number, password, scada_enabled, scada_protocol)
       VALUES ($1, $2, $3, $4, 'offline', $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [name, location, latitude || 0, longitude || 0, system_type || 'hybrid',
       capacity_kw, serial_number, password, scada_enabled || false, scada_protocol || 'modbus']
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erreur création site:', error);
    res.status(500).json({ error: 'Erreur lors de la création du site' });
  }
});

// Update site
router.patch('/:id', authenticateToken, requireRole(['admin', 'engineer']), async (req, res) => {
  try {
    const { name, location, latitude, longitude, status, system_type, capacity_kw } = req.body;
    
    const result = await pool.query(
      `UPDATE sites 
       SET name = COALESCE($1, name),
           location = COALESCE($2, location),
           latitude = COALESCE($3, latitude),
           longitude = COALESCE($4, longitude),
           status = COALESCE($5, status),
           system_type = COALESCE($6, system_type),
           capacity_kw = COALESCE($7, capacity_kw)
       WHERE id = $8
       RETURNING *`,
      [name, location, latitude, longitude, status, system_type, capacity_kw, req.params.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Site non trouvé' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erreur mise à jour site:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Update SCADA connection status
router.patch('/:id/scada/status', authenticateToken, async (req, res) => {
  try {
    const { status } = req.body;
    const updates = { scada_connection_status: status };
    
    if (status === 'connected') {
      updates.scada_last_connected = new Date().toISOString();
      updates.last_communication = new Date().toISOString();
      updates.status = 'operational';
    } else if (status === 'error') {
      updates.status = 'alert';
    } else if (status === 'disconnected') {
      updates.status = 'offline';
    }
    
    const result = await pool.query(
      `UPDATE sites 
       SET scada_connection_status = $1,
           scada_last_connected = COALESCE($2, scada_last_connected),
           last_communication = COALESCE($3, last_communication),
           status = COALESCE($4, status)
       WHERE id = $5
       RETURNING *`,
      [updates.scada_connection_status, updates.scada_last_connected,
       updates.last_communication, updates.status, req.params.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Site non trouvé' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erreur mise à jour statut SCADA:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Verify SCADA credentials
router.post('/scada/verify', authenticateToken, async (req, res) => {
  try {
    const { serial_number, password } = req.body;
    
    const result = await pool.query(
      `SELECT * FROM sites WHERE serial_number = $1 AND password = $2`,
      [serial_number, password]
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'SN ou PSW incorrect' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erreur vérification SCADA:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Get SCADA-enabled sites
router.get('/scada/enabled', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM sites WHERE scada_enabled = true ORDER BY name`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Erreur récupération sites SCADA:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Update SCADA config
router.patch('/:id/scada/config', authenticateToken, requireRole(['admin', 'engineer']), async (req, res) => {
  try {
    const { config } = req.body;
    
    const result = await pool.query(
      `UPDATE sites SET scada_config = $1 WHERE id = $2 RETURNING *`,
      [JSON.stringify(config), req.params.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Site non trouvé' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erreur mise à jour config SCADA:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
