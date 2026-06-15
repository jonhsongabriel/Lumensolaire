const jwt = require('jsonwebtoken');
const { pool } = require('../db/connection');

const SECRET_KEY = process.env.SECRET_KEY || 'change_me_before_site_test';

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token manquant' });
  }

  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Token invalide' });
    }
    req.user = decoded;
    next();
  });
}

async function loadUserRole(req, res, next) {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ error: 'Utilisateur non authentifié' });
    }
    const result = await pool.query(
      'SELECT role FROM profiles WHERE id = $1',
      [req.user.userId]
    );
    if (result.rows.length > 0) {
      req.userRole = result.rows[0].role;
    }
    next();
  } catch (error) {
    console.error('Erreur chargement rôle:', error);
    next();
  }
}

function requireRole(roles) {
  return async (req, res, next) => {
    try {
      const result = await pool.query(
        'SELECT role FROM profiles WHERE id = $1',
        [req.user.userId]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Utilisateur non trouvé' });
      }
      
      if (!roles.includes(result.rows[0].role)) {
        return res.status(403).json({ error: 'Accès non autorisé' });
      }
      
      next();
    } catch (error) {
      console.error('Erreur vérification rôle:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  };
}

module.exports = { authenticateToken, requireRole, loadUserRole, SECRET_KEY };
