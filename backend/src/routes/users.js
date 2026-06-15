const express = require('express');
const bcrypt = require('bcryptjs');
const { pool } = require('../db/connection');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Get all users (admin only)
router.get('/', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, username, email, phone, role, theme, two_factor_enabled,
              failed_login_attempts, account_locked_until, created_at, updated_at
       FROM profiles ORDER BY created_at DESC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Erreur récupération utilisateurs:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Get user by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, username, email, phone, role, theme, two_factor_enabled,
              created_at, updated_at
       FROM profiles WHERE id = $1`,
      [req.params.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erreur récupération utilisateur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Update user role (admin only)
router.patch('/:id/role', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { role } = req.body;
    
    const result = await pool.query(
      `UPDATE profiles SET role = $1 WHERE id = $2 RETURNING *`,
      [role, req.params.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erreur mise à jour rôle:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Delete user (admin only)
router.delete('/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const result = await pool.query(
      `DELETE FROM profiles WHERE id = $1 RETURNING id`,
      [req.params.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }
    
    res.json({ message: 'Utilisateur supprimé' });
  } catch (error) {
    console.error('Erreur suppression utilisateur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
