const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../db/connection');
const { authenticateToken, SECRET_KEY } = require('../middleware/auth');

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  try {
    const { username, password, email } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username et password requis' });
    }
    
    // Check if username already exists
    const existing = await pool.query(
      'SELECT id FROM profiles WHERE username = $1',
      [username]
    );
    
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Nom d\'utilisateur déjà utilisé' });
    }
    
    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);
    
    // Check if this is the first user (becomes admin)
    const userCount = await pool.query('SELECT COUNT(*) FROM profiles');
    const role = parseInt(userCount.rows[0].count) === 0 ? 'admin' : 'client';
    
    // Create user
    const result = await pool.query(
      `INSERT INTO profiles (username, email, role, password_hash)
       VALUES ($1, $2, $3, $4)
       RETURNING id, username, email, role, created_at`,
      [username, email || null, role, passwordHash]
    );
    
    const user = result.rows[0];
    
    // Generate token
    const token = jwt.sign(
      { userId: user.id, username: user.username, role: user.role },
      SECRET_KEY,
      { expiresIn: '24h' }
    );
    
    res.status(201).json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        created_at: user.created_at
      }
    });
  } catch (error) {
    console.error('[Auth] Erreur inscription:', error.message);
    res.status(500).json({ error: 'Erreur lors de l\'inscription', detail: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username et password requis' });
    }
    
    // Find user
    const result = await pool.query(
      `SELECT id, username, email, role, password_hash, failed_login_attempts, 
              account_locked_until, two_factor_enabled
       FROM profiles WHERE username = $1`,
      [username]
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Identifiants incorrects' });
    }
    
    const user = result.rows[0];
    
    // Check if account is locked
    if (user.account_locked_until && new Date(user.account_locked_until) > new Date()) {
      return res.status(423).json({
        error: 'Compte verrouillé',
        lockedUntil: user.account_locked_until
      });
    }
    
    // Verify password
    const validPassword = await bcrypt.compare(password, user.password_hash);
    
    if (!validPassword) {
      // Increment failed attempts
      const failedAttempts = (user.failed_login_attempts || 0) + 1;
      
      if (failedAttempts >= 3) {
        const lockUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
        await pool.query(
          'UPDATE profiles SET failed_login_attempts = $1, account_locked_until = $2 WHERE id = $3',
          [failedAttempts, lockUntil, user.id]
        );
        return res.status(423).json({
          error: 'Compte verrouillé après 3 tentatives échouées. Réessayez dans 30 minutes.'
        });
      } else {
        await pool.query(
          'UPDATE profiles SET failed_login_attempts = $1 WHERE id = $2',
          [failedAttempts, user.id]
        );
        return res.status(401).json({
          error: `Identifiants incorrects. Tentative ${failedAttempts}/3`
        });
      }
    }
    
    // Reset failed attempts on successful login
    await pool.query(
      'UPDATE profiles SET failed_login_attempts = 0, account_locked_until = NULL WHERE id = $1',
      [user.id]
    );
    
    // Generate token
    const token = jwt.sign(
      { userId: user.id, username: user.username, role: user.role },
      SECRET_KEY,
      { expiresIn: '24h' }
    );
    
    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('[Auth] Erreur connexion:', error.message);
    res.status(500).json({ error: 'Erreur lors de la connexion', detail: error.message });
  }
});

// Get current user
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, username, email, phone, role, theme, two_factor_enabled,
              failed_login_attempts, account_locked_until, created_at, updated_at
       FROM profiles WHERE id = $1`,
      [req.user.userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('[Auth] Erreur récupération profil:', error.message);
    res.status(500).json({ error: 'Erreur serveur', detail: error.message });
  }
});

// Update profile
router.patch('/me', authenticateToken, async (req, res) => {
  try {
    const { email, phone, theme, two_factor_enabled } = req.body;
    
    const result = await pool.query(
      `UPDATE profiles 
       SET email = COALESCE($1, email),
           phone = COALESCE($2, phone),
           theme = COALESCE($3, theme),
           two_factor_enabled = COALESCE($4, two_factor_enabled)
       WHERE id = $5
       RETURNING *`,
      [email, phone, theme, two_factor_enabled, req.user.userId]
    );
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('[Auth] Erreur mise à jour profil:', error.message);
    res.status(500).json({ error: 'Erreur serveur', detail: error.message });
  }
});

module.exports = router;
