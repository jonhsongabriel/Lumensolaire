const express = require('express');
const { pool } = require('../db/connection');
const { authenticateToken, requireRole, loadUserRole } = require('../middleware/auth');

const router = express.Router();

// Get all sites (role-based: client sees only own sites)
router.get('/', authenticateToken, loadUserRole, async (req, res) => {
  try {
    let query;
    let params = [];

    if (req.userRole === 'client') {
      query = `SELECT * FROM sites WHERE client_id = $1 ORDER BY name`;
      params = [req.user.userId];
    } else {
      query = `SELECT * FROM sites ORDER BY name`;
    }

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('[Sites] Erreur récupération sites:', error.message);
    res.status(500).json({ error: 'Erreur serveur', detail: error.message });
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
    console.error('[Sites] Erreur récupération site:', error.message);
    res.status(500).json({ error: 'Erreur serveur', detail: error.message });
  }
});

// Create site / project (with full details)
router.post('/', authenticateToken, requireRole(['admin', 'engineer']), async (req, res) => {
  try {
    const {
      name, location, latitude, longitude, system_type, capacity_kw,
      serial_number, password, scada_enabled, scada_protocol,
      wifi_ssid, wifi_password, wifi_ip,
      monitor_type, monitor_model, monitor_serial,
      equipment_list, mqtt_topic_prefix, photo_url, description, client_id
    } = req.body;
    
    const result = await pool.query(
      `INSERT INTO sites (
        name, location, latitude, longitude, status, system_type, capacity_kw,
        serial_number, password, scada_enabled, scada_protocol,
        wifi_ssid, wifi_password, wifi_ip,
        monitor_type, monitor_model, monitor_serial,
        equipment_list, mqtt_topic_prefix, photo_url, description, client_id
      ) VALUES ($1, $2, $3, $4, 'offline', $5, $6, $7, $8, $9, $10,
                $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
       RETURNING *`,
      [
        name, location, latitude || 0, longitude || 0, system_type || 'hybrid',
        capacity_kw, serial_number, password, scada_enabled || false, scada_protocol || 'modbus',
        wifi_ssid, wifi_password, wifi_ip,
        monitor_type, monitor_model, monitor_serial,
        JSON.stringify(equipment_list || []), mqtt_topic_prefix || 'centrale', photo_url, description, client_id
      ]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('[Sites] Erreur création site:', error.message);
    res.status(500).json({ error: 'Erreur lors de la création du site', detail: error.message });
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
    console.error('[Sites] Erreur mise à jour site:', error.message);
    res.status(500).json({ error: 'Erreur serveur', detail: error.message });
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
    console.error('[Sites] Erreur mise à jour statut SCADA:', error.message);
    res.status(500).json({ error: 'Erreur serveur', detail: error.message });
  }
});

// Verify SCADA credentials
router.post('/scada/verify', authenticateToken, async (req, res) => {
  try {
    const { serial_number, password } = req.body;
    
    if (!serial_number || !password) {
      return res.status(400).json({ error: 'SN et PSW requis' });
    }
    
    // Verify credentials
    const result = await pool.query(
      `SELECT * FROM sites WHERE serial_number = $1 AND password = $2`,
      [serial_number, password]
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'SN ou PSW incorrect' });
    }
    
    const site = result.rows[0];
    
    // Update connection status to connected on successful verification
    await pool.query(
      `UPDATE sites 
       SET scada_connection_status = 'connected',
           scada_last_connected = NOW(),
           last_communication = NOW(),
           status = 'operational'
       WHERE id = $1`,
      [site.id]
    );
    
    res.json({
      ...site,
      scada_connection_status: 'connected',
      scada_last_connected: new Date().toISOString(),
      message: 'Appareil relié avec succès'
    });
  } catch (error) {
    console.error('[Sites] Erreur vérification SCADA:', error.message);
    res.status(500).json({ error: 'Erreur serveur', detail: error.message });
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
    console.error('[Sites] Erreur récupération sites SCADA:', error.message);
    res.status(500).json({ error: 'Erreur serveur', detail: error.message });
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
    console.error('[Sites] Erreur mise à jour config SCADA:', error.message);
    res.status(500).json({ error: 'Erreur serveur', detail: error.message });
  }
});

module.exports = router;
